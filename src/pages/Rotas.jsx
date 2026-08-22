import usePersistedTab from '../hooks/usePersistedTab';
import useCan from '../hooks/useCan';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Map, FileText, Search, PlusCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

// --- SUBCOMPONENTES ---
import TabelaRotas from '../components/rotas/TabelaRotas';
import ModalNovaRota from '../components/rotas/ModalNovaRota';
import ModalFinalizarRota from '../components/rotas/ModalFinalizarRota';

// --- COMPONENTE PRINCIPAL (ORQUESTRADOR) ---
export default function Rotas() {
    const [abaAtiva, setAbaAtiva] = usePersistedTab('geral', 'rotas');
    const location = useLocation();
    const { user, can } = useAuth();

    const queryClient = useQueryClient();
    const { data: veiculos = [] } = useQuery({ queryKey: ['veiculos'], queryFn: async () => (await api.get('/veiculos/')).data });
    const { data: colaboradores = [] } = useQuery({ queryKey: ['colaboradores'], queryFn: async () => (await api.get('/colaboradores/')).data });
    const { data: rotas = [] } = useQuery({ queryKey: ['rotas'], queryFn: async () => (await api.get('/rotas/')).data });

    // FILTROS
    const [busca, setBusca] = useState('');
    const [dataFiltro, setDataFiltro] = useState('');

    // ESTADOS DA MODAL (CRIAÇÃO/EDIÇÃO)
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    // FORMULÁRIO
    const [form, setForm] = useState({
        data_inicio: '',
        previsao_retorno: '',
        data_retorno: '',
        origem: '',
        km_inicial: '',
        veiculo_id: '',
        colaborador_id: ''
    });

    // ESTADOS ESPECÍFICOS PARA DESTINOS MÚLTIPLOS
    const [paradasIntermediarias, setParadasIntermediarias] = useState([]);
    const [destinoFinal, setDestinoFinal] = useState('');

    // ESTADOS DO MODAL DE FINALIZAÇÃO
    const [modalFinalizar, setModalFinalizar] = useState(null);
    const [rotaSelecionada, setRotaSelecionada] = useState(null);
    const [paradasRota, setParadasRota] = useState([]);
    const [dadosFinalizacao, setDadosFinalizacao] = useState({
        km_final: '',
        data_retorno: '',
        status_atendimento: 'Completo',
        ultimo_destino_atendido: '',
        retorno_realizado: 'Base Planejada',
        local_retorno_alternativo: ''
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('search')) setBusca(params.get('search'));
    }, [location]);


    function normalizeText(text) {
        if (!text) return "";
        return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    const rotasFiltradas = rotas.filter(r => {
        const termo = normalizeText(busca);

        const matchTexto =
            normalizeText(r.id).includes(termo) ||
            normalizeText(r.colaborador?.nome).includes(termo) ||
            normalizeText(r.veiculo?.identificacao).includes(termo) ||
            normalizeText(r.origem).includes(termo) ||
            normalizeText(r.destino).includes(termo);

        const matchData = !dataFiltro || r.data_inicio.startsWith(dataFiltro);

        return matchTexto && matchData;
    });

    // --- FUNÇÕES DE CONTROLE DE PARADAS ---
    function adicionarParada() {
        setParadasIntermediarias([...paradasIntermediarias, '']);
    }

    function removerParada(index) {
        const novaLista = [...paradasIntermediarias];
        novaLista.splice(index, 1);
        setParadasIntermediarias(novaLista);
    }

    function atualizarParada(index, valor) {
        const novaLista = [...paradasIntermediarias];
        novaLista[index] = valor;
        setParadasIntermediarias(novaLista);
    }

    // --- FUNÇÕES DA MODAL PRINCIPAL ---
    function abrirModal(rota = null) {
        if (rota) {
            // MODO EDIÇÃO
            setEditandoId(rota.id);

            // Separa os destinos (Ex: "Centro ➝ Bairro A ➝ Base")
            const partesDestino = rota.destino.split('➝').map(s => s.trim());
            const final = partesDestino.pop(); // O último é o final
            const intermediarios = partesDestino; // O resto são paradas

            setForm({
                data_inicio: rota.data_inicio.slice(0, 16),
                previsao_retorno: rota.previsao_retorno ? rota.previsao_retorno.slice(0, 16) : '',
                data_retorno: rota.data_retorno ? rota.data_retorno.slice(0, 16) : '',
                origem: rota.origem,
                km_inicial: rota.km_inicial,
                veiculo_id: rota.veiculo_id,
                colaborador_id: rota.colaborador_id
            });
            setDestinoFinal(final || '');
            setParadasIntermediarias(intermediarios);
        } else {
            // MODO CRIAÇÃO
            setEditandoId(null);
            limparForm();
            preencherHoje();
        }
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditandoId(null);
        limparForm();
    }

    function limparForm() {
        setForm({ data_inicio: '', previsao_retorno: '', data_retorno: '', origem: '', km_inicial: '', veiculo_id: '', colaborador_id: '' });
        setDestinoFinal('');
        setParadasIntermediarias([]);
    }

    // --- BOTÃO HOJE ---
    function preencherHoje() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);

        const isoNow = localDate.toISOString().slice(0, 16);
        const iso18h = isoNow.slice(0, 11) + '18:00';

        setForm(prev => ({
            ...prev,
            data_inicio: isoNow,
            previsao_retorno: iso18h
        }));
    }

    function handleVeiculoChangeManual(e) {
        const vId = e.target.value;
        const v = veiculos.find(x => x.id === parseInt(vId));
        setForm({ ...form, veiculo_id: vId, km_inicial: v ? (v.km_atual ?? 0) : '' });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.veiculo_id || !form.colaborador_id || !form.origem || !destinoFinal) {
            return toast.error("Preencha Veículo, Colaborador, Origem e o Destino Final.");
        }

        // Monta a string única de destinos
        const todosDestinos = [...paradasIntermediarias, destinoFinal].filter(d => d.trim() !== '');
        const stringDestino = todosDestinos.join(' ➝ ');

        const payload = {
            origem: form.origem,
            destino: stringDestino,
            data_inicio: form.data_inicio ? new Date(form.data_inicio).toISOString() : new Date().toISOString(),
            previsao_retorno: form.previsao_retorno ? new Date(form.previsao_retorno).toISOString() : null,
            data_retorno: null,
            km_inicial: parseFloat(form.km_inicial) || 0,
            km_final: null,
            veiculo_id: parseInt(form.veiculo_id),
            colaborador_id: parseInt(form.colaborador_id)
        };

        try {
            if (editandoId) {
                if (form.data_retorno) payload.data_retorno = new Date(form.data_retorno).toISOString();
                await api.put(`/rotas/${editandoId}`, payload);
            } else {
                await api.post('/rotas/', payload);
            }

            fecharModal();
            queryClient.invalidateQueries({ queryKey: ['rotas'] }); queryClient.invalidateQueries({ queryKey: ['dashboardFrota'] });
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail || "Erro ao salvar.";
            toast.error("Erro: " + msg);
        }
    }

    // --- LÓGICA DE FINALIZAÇÃO ---
    function abrirModalFinalizar(rota) {
        setModalFinalizar(rota.id);
        setRotaSelecionada(rota);
        const destinos = rota.destino.split('➝').map(s => s.trim());
        setParadasRota(destinos);

        setDadosFinalizacao({
            km_final: '',
            data_retorno: new Date().toISOString().slice(0, 16),
            status_atendimento: 'Completo',
            ultimo_destino_atendido: '',
            retorno_realizado: 'Base Planejada',
            local_retorno_alternativo: ''
        });
    }

    async function confirmarFinalizacao() {
        if (!dadosFinalizacao.km_final || !dadosFinalizacao.data_retorno) return toast.error("Preencha KM e Data.");
        if (parseFloat(dadosFinalizacao.km_final) <= rotaSelecionada.km_inicial) return toast("KM Final deve ser maior que o Inicial.");

        try {
            let obsMontada = "";
            if (dadosFinalizacao.status_atendimento === 'Parcial') obsMontada += `[PARCIAL] Última parada: ${dadosFinalizacao.ultimo_destino_atendido}. `;
            else obsMontada += `[COMPLETO] Todos atendidos. `;

            if (dadosFinalizacao.retorno_realizado === 'Outro') obsMontada += `Retorno: ${dadosFinalizacao.local_retorno_alternativo}.`;
            else obsMontada += `Retorno base.`;

            await api.put(`/rotas/${modalFinalizar}/finalizar`, null, {
                params: {
                    km_final: dadosFinalizacao.km_final,
                    data_retorno: dadosFinalizacao.data_retorno,
                    obs: obsMontada
                }
            });

            toast.success("Rota Finalizada!");
            setModalFinalizar(null);
            setRotaSelecionada(null);
            queryClient.invalidateQueries({ queryKey: ['rotas'] }); queryClient.invalidateQueries({ queryKey: ['dashboardFrota'] });
        } catch (error) { toast.error("Erro: " + error.response?.data?.detail); }
    }

    async function handleDelete(id) {
        if (window.confirm("Excluir?")) { await api.delete(`/rotas/${id}`); queryClient.invalidateQueries({ queryKey: ['rotas'] }); queryClient.invalidateQueries({ queryKey: ['dashboardFrota'] }); }
    }

    function exportarPDF() {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text("Relatório Detalhado de Rotas - Loop.Frotas", 14, 10);

        const tableRows = rotasFiltradas.map(r => {
            const partes = r.destino.split('➝');
            const ultimo = partes.pop();
            const intermediarios = partes.join('\n• ');

            return [
                r.id,
                r.status,
                `${new Date(r.data_inicio).toLocaleDateString()}\n${new Date(r.data_inicio).toLocaleTimeString()}`,
                r.origem,
                intermediarios ? `• ${intermediarios}` : '-',
                ultimo || '-',
                r.veiculo?.identificacao || '-',
                r.colaborador?.nome,
                r.km_final ? (r.km_final - r.km_inicial) + ' km' : '-'
            ];
        });

        autoTable(doc, {
            head: [["ID", "Status", "Saída", "Origem", "Destinos Intermediários", "Destino Final", "Veículo", "Colaborador", "Total"]],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 },
            columnStyles: {
                4: { cellWidth: 50, overflow: 'linebreak' },
                5: { cellWidth: 40, overflow: 'linebreak' },
                6: { cellWidth: 40, overflow: 'linebreak' }
            }
        });
        doc.save("rotas_detalhado.pdf");
    }

    const stopsParaSelecao = dadosFinalizacao.status_atendimento === 'Parcial' && paradasRota.length > 1
        ? paradasRota.slice(0, -1)
        : paradasRota;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>Controle de Rotas</h1>
                <div className="filter-bar" style={{ marginBottom: 0, gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                    <div className="input-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', background: '#2d3748', padding: '5px 10px', borderRadius: '5px' }}>
                        <Search size={18} style={{ color: '#a0aec0', marginRight: '5px' }} />
                        <input
                            placeholder="Buscar (Placa, ID...)"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'white', outline: 'none', width: '180px', marginRight: '10px' }}
                        />
                        <input
                            type="date"
                            value={dataFiltro}
                            onChange={e => setDataFiltro(e.target.value)}
                            style={{ border: 'none', background: '#4a5568', color: 'white', padding: '2px 5px', borderRadius: '3px', fontSize: '0.8rem' }}
                        />
                    </div>
                    {can('relatorios.baixar') && ( <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px' }}>
                        <FileText size={18} style={{ marginRight: 5 }} /> PDF
                    </button> )}

                    {can('rotas.criar') && (
                        <button onClick={() => abrirModal(null)} className="btn-add" style={{ backgroundColor: '#8B5CF6', color: '#fff', height: '40px' }}>
                            <PlusCircle size={18} style={{ marginRight: 5 }} /> Nova Viagem
                        </button>
                    )}
                </div>
            </div>

            <TabelaRotas 
                rotasFiltradas={rotasFiltradas} 
                can={can} 
                abrirModalFinalizar={abrirModalFinalizar} 
                abrirModal={abrirModal} 
                handleDelete={handleDelete} 
            />

            {modalAberto && (
                <ModalNovaRota 
                    editandoId={editandoId}
                    fecharModal={fecharModal}
                    handleSubmit={handleSubmit}
                    handleVeiculoChangeManual={handleVeiculoChangeManual}
                    preencherHoje={preencherHoje}
                    adicionarParada={adicionarParada}
                    removerParada={removerParada}
                    atualizarParada={atualizarParada}
                    form={form}
                    setForm={setForm}
                    veiculos={veiculos}
                    colaboradores={colaboradores}
                    paradasIntermediarias={paradasIntermediarias}
                    destinoFinal={destinoFinal}
                    setDestinoFinal={setDestinoFinal}
                    can={can}
                    user={user}
                />
            )}

            <ModalFinalizarRota 
                modalFinalizar={modalFinalizar}
                setModalFinalizar={setModalFinalizar}
                rotaSelecionada={rotaSelecionada}
                dadosFinalizacao={dadosFinalizacao}
                setDadosFinalizacao={setDadosFinalizacao}
                stopsParaSelecao={stopsParaSelecao}
                confirmarFinalizacao={confirmarFinalizacao}
            />
        </div>
    );
}
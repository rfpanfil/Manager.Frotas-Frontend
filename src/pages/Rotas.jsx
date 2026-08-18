// Arquivo: frontend/src/pages/Rotas.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Map, CheckCircle, Trash2, Edit, FileText, Search, AlertTriangle, Clock, PlusCircle, X, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocation } from 'react-router-dom';

// --- COMPONENTE DE AUTOCOMPLETAR (NOMINATIM / OPENSTREETMAP) ---
// --- COMPONENTE DE AUTOCOMPLETAR INTELIGENTE ---
function AddressInput({ value, onChange, placeholder, required = false }) {
    const [sugestoes, setSugestoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrandoLista, setMostrandoLista] = useState(false);
    const wrapperRef = useRef(null);

    // Fecha a lista se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setMostrandoLista(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (value.length > 4 && mostrandoLista) {
                setLoading(true);
                try {
                    // addressdetails=1 Traz os campos separados (rua, bairro, cidade...)
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${value}&addressdetails=1&limit=5&countrycodes=br`);
                    const data = await response.json();
                    setSugestoes(data);
                } catch (error) {
                    console.error("Erro ao buscar endereço", error);
                } finally {
                    setLoading(false);
                }
            }
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [value, mostrandoLista]);

    // --- A MÁGICA ACONTECE AQUI ---
    function formatarEnderecoLimpo(item) {
        const adr = item.address;

        // 1. Tenta pegar o nome da rua (pode vir com chaves diferentes)
        const rua = adr.road || adr.pedestrian || adr.street || item.name || '';

        // 2. Tenta pegar o número que a API retornou OU o que o usuário digitou
        let numero = adr.house_number || '';
        if (!numero) {
            // Se a API não achou número, procura números no que o usuário digitou (ex: "Rua X 556")
            const numeroDigitado = value.match(/\b\d+\b/);
            if (numeroDigitado) numero = numeroDigitado[0];
        }

        // 3. Pega bairro e cidade
        const bairro = adr.suburb || adr.neighbourhood || adr.residential || '';
        const cidade = adr.city || adr.town || adr.municipality || adr.village || '';
        const estado = adr.state_code || adr.state || ''; // state_code costuma ser "PR", "SP"

        // 4. Monta a string curta e bonita
        // Ex: "Rua Luiz Gasparin, 556, Maracanã - Colombo/PR"
        let resultado = rua;
        if (numero) resultado += `, ${numero}`;
        if (bairro) resultado += `, ${bairro}`;
        if (cidade) resultado += ` - ${cidade}`;
        if (estado) resultado += `/${estado}`; // Tenta usar a sigla se disponível, senão nome completo

        // Se por acaso a API falhar em separar, usa o display_name mas corta o excesso
        if (resultado.length < 5) {
            return item.display_name.split(', Região')[0];
        }

        return resultado;
    }

    function selecionarEndereco(item) {
        const enderecoFormatado = formatarEnderecoLimpo(item);
        onChange(enderecoFormatado);
        setMostrandoLista(false);
        setSugestoes([]);
    }

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setMostrandoLista(true);
                    }}
                    onFocus={() => value.length > 2 && setMostrandoLista(true)}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                    style={{ width: '100%', paddingRight: loading ? '30px' : '10px' }}
                />
                {loading && (
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                        <Loader2 className="spin" size={16} color="#00d68f" />
                    </div>
                )}
            </div>

            {mostrandoLista && sugestoes.length > 0 && (
                <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#1a202c', border: '1px solid #4a5568', zIndex: 1500,
                    listStyle: 'none', padding: 0, margin: 0,
                    borderRadius: '0 0 5px 5px', boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                    maxHeight: '200px', overflowY: 'auto'
                }}>
                    {sugestoes.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => selecionarEndereco(item)}
                            style={{
                                padding: '10px', borderBottom: '1px solid #2d3748', cursor: 'pointer',
                                fontSize: '0.85rem', color: '#e2e8f0', transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#2d3748'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                <MapPin size={12} color="#00d68f" />
                                {/* Mostra título em destaque */}
                                <strong>{item.address.road || item.name}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginLeft: 17 }}>
                                {/* Mostra detalhes secundários na lista (Bairro, Cidade) */}
                                {[
                                    item.address.suburb,
                                    item.address.city || item.address.town,
                                    item.address.state
                                ].filter(Boolean).join(' - ')}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function Rotas() {
    const location = useLocation();
    const { user, can } = useAuth();

    const [rotas, setRotas] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);

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
        carregarDados();
    }, [location]);

    async function carregarDados() {
        try {
            const [resRotas, resV, resC] = await Promise.all([
                api.get('/rotas/'),
                api.get('/veiculos/'),
                api.get('/colaboradores/')
            ]);
            setRotas(resRotas.data);
            setVeiculos(resV.data);
            setColaboradores(resC.data);
        } catch (error) { alert("Erro ao carregar dados."); }
    }

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
            // Pré-define data de hoje
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
            return alert("Preencha Veículo, Colaborador, Origem e o Destino Final.");
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
            carregarDados();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail || "Erro ao salvar.";
            alert("Erro: " + msg);
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
        if (!dadosFinalizacao.km_final || !dadosFinalizacao.data_retorno) return alert("Preencha KM e Data.");
        if (parseFloat(dadosFinalizacao.km_final) <= rotaSelecionada.km_inicial) return alert("KM Final deve ser maior que o Inicial.");

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



            alert("Rota Finalizada!");
            setModalFinalizar(null);
            setRotaSelecionada(null);
            carregarDados();
        } catch (error) { alert("Erro: " + error.response?.data?.detail); }
    }

    async function handleDelete(id) {
        if (window.confirm("Excluir?")) { await api.delete(`/rotas/${id}`); carregarDados(); }
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1><Map style={{ marginRight: '10px' }} /> Controle de Rotas</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
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
                    <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px' }}>
                        <FileText size={18} style={{ marginRight: 5 }} /> PDF
                    </button>

                    {/* NOVO BOTÃO QUE ABRE A MODAL */}
                    {can('rotas.criar') && (
                        <button onClick={() => abrirModal(null)} className="btn-add" style={{ backgroundColor: '#00d68f', color: '#000', height: '40px' }}>
                            <PlusCircle size={18} style={{ marginRight: 5 }} /> Nova Viagem
                        </button>
                    )}
                </div>
            </div>

            {/* TABELA DE ROTAS */}
            <div className="table-container">
                <table>
                    <thead><tr><th>ID</th><th>Status</th><th>Saída</th><th>Origem / Destino</th><th>Veículo</th><th>KM Saída</th><th>Retorno</th><th>Ações</th></tr></thead>
                    <tbody>
                        {rotasFiltradas.map((r) => (
                            <tr key={r.id} style={{ opacity: r.status === 'Finalizada' ? 0.6 : 1 }}>
                                <td>#{r.id}</td>
                                <td><span className={`status-badge ${r.status === 'Em Andamento' ? 'status-open' : 'status-closed'}`}>{r.status}</span></td>

                                {/* Coluna Saída (Data) */}
                                <td>{new Date(r.data_inicio).toLocaleString('pt-BR')}</td>

                                {/* Origem/Destino */}
                                <td style={{ maxWidth: '300px', fontSize: '0.85rem', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                    <strong style={{ color: '#fff' }}>{r.origem}</strong>
                                    <div style={{ color: '#a0aec0' }}>➝ {r.destino}</div>
                                </td>

                                {/* CORREÇÃO: Removido o "Total KM" daqui para não duplicar */}
                                <td style={{ whiteSpace: 'normal', minWidth: '150px' }}>
                                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{r.veiculo?.identificacao}</strong>
                                </td>

                                <td>{r.km_inicial}</td>

                                {/* O Total KM fica apenas aqui agora */}
                                <td style={{ whiteSpace: 'normal', minWidth: '140px' }}>
                                    {r.status === 'Finalizada' ? (
                                        <div>
                                            <div>{r.data_retorno ? new Date(r.data_retorno).toLocaleString() : '-'}</div>
                                            <strong style={{ color: '#00d68f', fontSize: '0.8rem' }}>
                                                Total: {r.km_final - r.km_inicial} km
                                            </strong>
                                        </div>
                                    ) : '-'}
                                </td>

                                <td>
                                    {r.status !== 'Finalizada' && can('rotas.criar') && (
                                        <button className="btn-finish" onClick={() => abrirModalFinalizar(r)} title="Finalizar Viagem"><CheckCircle size={18} /></button>
                                    )}
                                    {can('rotas.criar') && (
                                        <button onClick={() => abrirModal(r)} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }} title="Editar"><Edit size={18} /></button>
                                    )}
                                    {can('rotas.excluir') && (
                                        <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }} title="Excluir"><Trash2 size={18} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- NOVA MODAL DE CRIAÇÃO/EDIÇÃO DE ROTA --- */}
            {modalAberto && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="form-card" style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: '#1a202c', border: '1px solid #4a5568', padding: '30px' }}>
                        <button onClick={fecharModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>

                        <h3 style={{ marginTop: 0, marginBottom: '25px', color: editandoId ? '#3182ce' : '#00d68f', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Map /> {editandoId ? 'Editar Viagem' : 'Nova Viagem Manual'}
                        </h3>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* MUDANÇA 1: Colaborador ANTES do Veículo */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label>Colaborador Responsável</label>
                                    <select value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })} required>
                                        <option value="">Selecione...</option>
                                        {/* --- VISÃO GLOBAL DINÂMICA: Mostra todos ou apenas o próprio usuário --- */}
                                        {(can('rotas.visao_global') ? colaboradores : colaboradores.filter(c => c.usuario_id === user?.id)).map(m => (
                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Veículo</label>
                                    <select value={form.veiculo_id} onChange={handleVeiculoChangeManual} required>
                                        <option value="">Selecione...</option>
                                        {veiculos.map(v => (
                                            <option key={v.id} value={v.id}>{v.identificacao || v.modelo} (KM: {v.km_atual ?? 0})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* LINHA 2: Saída, KM e Previsão */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <label style={{ marginBottom: 0 }}>Saída</label>
                                        <button type="button" onClick={preencherHoje} title="Preencher com Data e Hora atuais"
                                            style={{
                                                background: 'rgba(0, 214, 143, 0.15)', border: '1px solid #00d68f', color: '#00d68f',
                                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '5px',
                                                display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s'
                                            }}>
                                            <Clock size={12} /> AGORA
                                        </button>
                                    </div>
                                    <input type="datetime-local" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>KM Saída</label>
                                    <input type="number" value={form.km_inicial} onChange={e => setForm({ ...form, km_inicial: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>Prev. Chegada</label>
                                    <input type="datetime-local" value={form.previsao_retorno} onChange={e => setForm({ ...form, previsao_retorno: e.target.value })} />
                                </div>
                            </div>

                            <hr style={{ borderColor: '#4a5568', margin: '10px 0' }} />

                            {/* SEÇÃO DE ITINERÁRIO COM AUTOCOMPLETE */}
                            <h4 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Itinerário (Digite para buscar endereços)</h4>

                            {/* Origem */}
                            <div className="input-group">
                                <label style={{ color: '#fff' }}><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Origem</label>
                                <AddressInput
                                    value={form.origem}
                                    onChange={val => setForm({ ...form, origem: val })}
                                    placeholder="Ex: Base Central, Rua X..."
                                    required
                                />
                            </div>

                            {/* Paradas Intermediárias */}
                            {paradasIntermediarias.map((parada, index) => (
                                <div key={index} className="input-group" style={{ marginLeft: '20px', borderLeft: '2px solid #4a5568', paddingLeft: '10px' }}>
                                    <label style={{ color: '#a0aec0', display: 'flex', justifyContent: 'space-between' }}>
                                        <span><ArrowRight size={14} style={{ verticalAlign: 'middle' }} /> Parada Intermediária {index + 1}</span>
                                        <button type="button" onClick={() => removerParada(index)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.8rem' }}>Remover</button>
                                    </label>
                                    <AddressInput
                                        value={parada}
                                        onChange={val => atualizarParada(index, val)}
                                        placeholder="Ex: Cliente A, Entrega X..."
                                    />
                                </div>
                            ))}

                            <button type="button" onClick={adicionarParada} style={{ background: 'rgba(49, 130, 206, 0.1)', border: '1px dashed #3182ce', color: '#63b3ed', padding: '8px', borderRadius: '5px', cursor: 'pointer', textAlign: 'center', width: 'fit-content', marginLeft: '20px' }}>
                                + Adicionar Novo Destino/Parada
                            </button>

                            {/* Destino Final */}
                            <div className="input-group">
                                <label style={{ color: '#00d68f', fontWeight: 'bold' }}><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Destino Final (ou Retorno)</label>
                                <AddressInput
                                    value={destinoFinal}
                                    onChange={val => setDestinoFinal(val)}
                                    placeholder="Ex: Rua Y, ou Retorno Base..."
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #4a5568', paddingTop: '15px' }}>
                                <button type="button" onClick={fecharModal} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white' }}>Cancelar</button>
                                <button type="submit" className="btn-add" style={{ backgroundColor: editandoId ? '#3182ce' : '#00d68f', color: editandoId ? 'white' : 'black' }}>
                                    {editandoId ? 'Salvar Alterações' : 'Iniciar Viagem'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE FINALIZAÇÃO (MANTIDA IGUAL) */}
            {modalFinalizar && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div className="form-card" style={{ width: '500px', background: '#1a202c', border: '1px solid #444', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle color="#f6ad55" /> Finalizar Rota #{modalFinalizar}</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="input-group">
                                <label>KM Final (Painel)</label>
                                <input type="number" onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, km_final: e.target.value })} autoFocus />
                            </div>
                            <div className="input-group">
                                <label>Data Chegada</label>
                                <input type="datetime-local" value={dadosFinalizacao.data_retorno} onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, data_retorno: e.target.value })} />
                            </div>
                        </div>

                        <hr style={{ borderColor: '#444', margin: '20px 0' }} />

                        <div className="input-group">
                            <label>Status do Atendimento</label>
                            <select value={dadosFinalizacao.status_atendimento} onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, status_atendimento: e.target.value })}>
                                <option value="Completo">✅ Todos os destinos foram atendidos</option>
                                <option value="Parcial">⚠️ Parcial (Houve imprevisto)</option>
                            </select>
                        </div>

                        {dadosFinalizacao.status_atendimento === 'Parcial' && (
                            <div className="input-group" style={{ border: '1px solid #f6ad55', padding: '10px', borderRadius: '5px' }}>
                                <label style={{ color: '#f6ad55' }}>Qual foi o ÚLTIMO local atendido?</label>
                                <select onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, ultimo_destino_atendido: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {stopsParaSelecao.map((p, i) => <option key={i} value={p}>{p}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="input-group">
                            <label>Local de Retorno</label>
                            <select value={dadosFinalizacao.retorno_realizado} onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, retorno_realizado: e.target.value })}>
                                <option value="Base Planejada">🏠 Voltou para a Base/Destino Final Planejado</option>
                                <option value="Outro">📍 Parou em outro lugar (Casa, Oficina...)</option>
                            </select>
                        </div>

                        {dadosFinalizacao.retorno_realizado === 'Outro' && (
                            <div className="input-group">
                                <label>Onde parou?</label>
                                <input placeholder="Ex: Oficina Mecânica" onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, local_retorno_alternativo: e.target.value })} />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={confirmarFinalizacao} className="btn-add" style={{ flex: 1, backgroundColor: '#00d68f', color: '#000', padding: '10px' }}>Confirmar Encerramento</button>
                            <button onClick={() => setModalFinalizar(null)} className="btn-add" style={{ flex: 1, backgroundColor: '#e53e3e', color: 'white', padding: '10px' }}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
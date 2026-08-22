import usePersistedTab from '../hooks/usePersistedTab';
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// --- SUBCOMPONENTES EXTRAÍDOS ---
import LeitorQRCode from '../components/gastos/LeitorQRCode';
import TabelaGastos from '../components/gastos/TabelaGastos';
import ModalGastoForm from '../components/gastos/ModalGastoForm';
import ModalDetalhesGasto from '../components/gastos/ModalDetalhesGasto';
import ModalGerenciarTipos from '../components/gastos/ModalGerenciarTipos';
import GastosHeaderFiltros from '../components/gastos/GastosHeaderFiltros';

// --- UTILITÁRIOS EXTRAÍDOS ---
import { exportarPdfGastos } from '../utils/pdfGastos';
import { validarEPrepararGasto } from '../utils/gastosHelpers';

export default function Gastos() {
    const [abaAtiva, setAbaAtiva] = usePersistedTab('geral', 'gastos');
    const { user, can } = useAuth();

    const queryClient = useQueryClient();

    const { data: veiculos = [] } = useQuery({ queryKey: ['veiculos'], queryFn: async () => (await api.get('/veiculos/')).data });
    const { data: solicitantes = [] } = useQuery({ queryKey: ['solicitantes'], queryFn: async () => (await api.get('/colaboradores/solicitantes')).data });
    const { data: tiposGastoData = [] } = useQuery({ queryKey: ['tiposGasto'], queryFn: async () => (await api.get('/opcoes/tipos-gasto')).data });
    const { data: tiposCombustivelData = [] } = useQuery({ queryKey: ['tiposCombustivel'], queryFn: async () => (await api.get('/opcoes/tipos-combustivel')).data });
    const { data: tiposManutencaoData = [] } = useQuery({ queryKey: ['tiposManutencao'], queryFn: async () => (await api.get('/opcoes/tipos-manutencao')).data });
    const { data: statusManutencaoData = [] } = useQuery({ queryKey: ['statusManutencao'], queryFn: async () => (await api.get('/opcoes/status-manutencao')).data });
    const { data: bases = [] } = useQuery({ queryKey: ['bases'], queryFn: async () => (await api.get('/bases/')).data });

    // Allow local overrides of types for optimistic UI if needed, but here we just map them directly
    const tiposGasto = tiposGastoData;
    const tiposCombustivel = tiposCombustivelData;
    const tiposManutencao = tiposManutencaoData;
    const statusManutencao = statusManutencaoData;

    const opcoesBases = bases.map(b => ({ value: b.id, label: b.nome }));
    const opcoesVeiculos = veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo || 'Veículo'}`.toUpperCase() }));
    
    let listaSolicitantes = solicitantes;
    if (!can('gastos.visao_global')) {
        listaSolicitantes = listaSolicitantes.filter(m => {
            if (m.usuario_id && (m.usuario_id == user.id)) return true;
            if (m.nome && user?.nome && (m.nome.toLowerCase().trim() === user.nome.toLowerCase().trim())) return true;
            return false;
        });
    }
    const opcoesSolicitantes = listaSolicitantes.map(m => ({ value: m.id, label: m.nome }));

    // --- FILTROS E ESTADOS DE UI ---
    const [busca, setBusca] = useState('');
    const [dataFiltro, setDataFiltro] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [lendoQR, setLendoQR] = useState(false);
    const [processandoNota, setProcessandoNota] = useState(false);
    const [gastoDetalhe, setGastoDetalhe] = useState(null);
    const [menuAcaoAberto, setMenuAcaoAberto] = useState(null);

    // --- NOVO FILTRO DE DATA (Gerenciado pelo Header) ---
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '', label: 'Últimos 30 dias' });
    const [usarFiltroPeriodo, setUsarFiltroPeriodo] = useState(true);

    // --- CONTROLE DE PAGINAÇÃO E FILTROS ---
    const [limite, setLimite] = useState(100);
    const [temMais, setTemMais] = useState(false);
    const [tipoFiltro, setTipoFiltro] = useState('');

    // --- GERENCIAMENTO DE TIPOS DE GASTO ---
    const [modalTiposAberto, setModalTiposAberto] = useState(false);
    const [novoTipo, setNovoTipo] = useState('');
    const [editandoTipoId, setEditandoTipoId] = useState(null);
    const [editandoTipoNome, setEditandoTipoNome] = useState('');

    const [linkQrProtegido, setLinkQrProtegido] = useState('');

    // --- FORMULÁRIO ---
    const initialForm = {
        data: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        tipo_gasto: '',
        valor: '',
        descricao: '',
        veiculo_id: null,
        rota_id: '',
        colaborador_id: null,
        centro_custo_id: '',
        combustivel: '',
        litros: '',
        preco_litro: '',
        tipo_manutencao: '',
        status_manutencao: '',
        dot: '',
        proxima_troca_km: '',
        km_registro: ''
    };

    const [form, setForm] = useState(initialForm);
    const [arquivos, setArquivos] = useState([]);
    const [anexosExistentes, setAnexosExistentes] = useState([]);

    // --- CÁLCULO AUTOMÁTICO DE COMBUSTÍVEL ---
    useEffect(() => {
        if (form.tipo_gasto === 'Combustível') {
            const l = parseFloat(String(form.litros).replace(',', '.'));
            const p = parseFloat(String(form.preco_litro).replace(',', '.'));
            if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
                setForm(prev => ({ ...prev, valor: (l * p).toFixed(2).replace('.', ',') }));
            }
        }
    }, [form.litros, form.preco_litro, form.tipo_gasto]);

    // --- EFEITOS E CARGAS ---
    useEffect(() => {
        const hoje = new Date();
        const inicio = new Date();
        inicio.setDate(hoje.getDate() - 30);
        setPeriodo({
            inicio: inicio.toISOString().split('T')[0],
            fim: hoje.toISOString().split('T')[0],
            label: "Últimos 30 dias"
        });
    }, []);

    const { data: gastos = [] } = useQuery({
        queryKey: ['gastos', limite, periodo.inicio, periodo.fim],
        queryFn: async () => {
            if (!usarFiltroPeriodo) return [];
            const params = { skip: 0, limit: limite };
            if (periodo.inicio) params.data_inicio = periodo.inicio;
            if (periodo.fim) params.data_fim = periodo.fim;
            const res = await api.get('/gastos/', { params });
            setTemMais(res.data.length === limite);
            return res.data;
        },
        enabled: usarFiltroPeriodo
    });

    const { data: rotasDoDia = [] } = useQuery({
        queryKey: ['rotasDoDia', form.data],
        queryFn: async () => {
            if (!form.data) return [];
            const response = await api.get(`/rotas/por-data/${form.data.split('T')[0]}`);
            return response.data;
        },
        enabled: modalAberto && !!form.data
    });

    useEffect(() => {
        if (!modalAberto || editandoId || form.colaborador_id) return;
        
        // Sem visão global: auto-seleciona a única opção disponível (comportamento original)
        if (!can('gastos.visao_global') && opcoesSolicitantes.length === 1) {
            setForm(prev => ({ ...prev, colaborador_id: opcoesSolicitantes[0] }));
            return;
        }
        
        // Com visão global: tenta achar o colaborador vinculado ao usuário logado
        if (can('gastos.visao_global') && user && opcoesSolicitantes.length > 0) {
            const meuColab = solicitantes.find(m => m.usuario_id && m.usuario_id == user.id);
            if (meuColab) {
                const opcao = opcoesSolicitantes.find(o => o.value === meuColab.id);
                if (opcao) setForm(prev => ({ ...prev, colaborador_id: opcao }));
            }
        }
    }, [opcoesSolicitantes, modalAberto, user, form.colaborador_id, can, editandoId, solicitantes]);


    function handleMudarLimite(novoLimite) {
        const lim = parseInt(novoLimite);
        setLimite(lim);
        if (lim === 999999) {
            setPeriodo({ inicio: '', fim: '', label: 'Desde o Início' });
            setUsarFiltroPeriodo(true);
        }
    }

    function carregarMais() {
        setLimite(prev => prev + 500);
    }



    async function handleSalvarNovoTipo() {
        if (!novoTipo.trim()) return;
        try {
            const res = await api.post('/opcoes/tipos-gasto', { nome: novoTipo });
            queryClient.invalidateQueries({ queryKey: ['tiposGasto'] });
            setNovoTipo('');
        } catch (e) { toast.error("Erro ao criar tipo de gasto."); }
    }

    async function handleSalvarEdicaoTipo(id) {
        if (!editandoTipoNome.trim()) return;
        try {
            await api.put(`/opcoes/tipos-gasto/${id}`, { nome: editandoTipoNome });
            queryClient.invalidateQueries({ queryKey: ['tiposGasto'] });
            setEditandoTipoId(null);
            queryClient.invalidateQueries({ queryKey: ['gastos'] }); queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiro'] }); queryClient.invalidateQueries({ queryKey: ['homeMetrics'] });
        } catch (e) { toast.error(e.response?.data?.detail || "Erro ao editar tipo de gasto."); }
    }

    async function handleExcluirTipo(id) {
        if (!confirm("Tem certeza que deseja excluir? Isso só será possível se não houver gastos atrelados a ele.")) return;
        try {
            await api.delete(`/opcoes/tipos-gasto/${id}`);
            queryClient.invalidateQueries({ queryKey: ['tiposGasto'] });
        } catch (e) { toast(e.response?.data?.detail || "Não foi possível excluir. O tipo pode estar em uso."); }
    }

    async function handleSelectChange(e, endpoint, stateUpdater, fieldName) {
        const valor = e.target.value;
        if (valor === 'ADD_NEW') {
            const novoNome = prompt(`Novo item para ${fieldName}:`);
            if (novoNome) {
                try {
                    const res = await api.post(endpoint, { nome: novoNome });
                    if (stateUpdater) {
                        stateUpdater(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
                    } else if (fieldName === 'tipo_gasto') {
                        queryClient.invalidateQueries({ queryKey: ['tiposGasto'] });
                    } else if (fieldName === 'combustivel') {
                        queryClient.invalidateQueries({ queryKey: ['tiposCombustivel'] });
                    } else if (fieldName === 'tipo_manutencao') {
                        queryClient.invalidateQueries({ queryKey: ['tiposManutencao'] });
                    } else if (fieldName === 'status_manutencao') {
                        queryClient.invalidateQueries({ queryKey: ['statusManutencao'] });
                    }
                    setForm(prev => ({ ...prev, [fieldName]: novoNome }));
                } catch (e) { toast.error("Erro ao criar item."); }
            }
        } else {
            setForm(prev => ({ ...prev, [fieldName]: valor }));
        }
    }

    function handleRotaChange(e) {
        const rId = e.target.value;
        if (!rId) {
            setForm(prev => ({ ...prev, rota_id: '', veiculo_id: null }));
            if (can('gastos.visao_global')) setForm(prev => ({ ...prev, colaborador_id: null }));
            return;
        }

        const rotaSelecionada = rotasDoDia.find(r => r.id === parseInt(rId));
        if (rotaSelecionada) {
            const veiculoObj = opcoesVeiculos.find(v => v.value === rotaSelecionada.veiculo_id);
            const solicitanteObj = opcoesSolicitantes.find(m => m.value === rotaSelecionada.colaborador_id);
            setForm(prev => ({
                ...prev,
                rota_id: rId,
                veiculo_id: veiculoObj || null,
                colaborador_id: !can('gastos.visao_global') ? prev.colaborador_id : (solicitanteObj || null)
            }));
        }
    }

    function handleKmChange(e) {
        const valor = e.target.value.replace(/[^0-9.]/g, '');
        setForm(prev => ({ ...prev, km_registro: valor }));
    }

    async function handleQrScan(urlLida) {
        setLendoQR(false);
        setLinkQrProtegido(urlLida);
        setProcessandoNota(true);

        try {
            const res = await api.post('/gastos/extrair-dados-nota', { url: urlLida });
            const dadosNota = res.data;

            setForm(prev => ({
                ...prev,
                valor: dadosNota.valor > 0 ? dadosNota.valor : prev.valor,
                data: dadosNota.data ? dadosNota.data : prev.data,
                tipo_gasto: dadosNota.combustivel_detectado ? 'Combustível' : prev.tipo_gasto,
                combustivel: dadosNota.combustivel_detectado || prev.combustivel,
                litros: dadosNota.litros > 0 ? dadosNota.litros : prev.litros,
                preco_litro: dadosNota.preco_litro > 0 ? dadosNota.preco_litro : prev.preco_litro,
                descricao: (prev.descricao ? prev.descricao + ' | ' : '') +
                    (dadosNota.local ? `Local: ${dadosNota.local}` : '')
            }));

            let msg = "QR Code lido!";
            if (dadosNota.valor > 0) msg += ` Valor R$ ${dadosNota.valor} encontrado.`;
            if (dadosNota.litros > 0) msg += `\nIdentificado: ${dadosNota.litros} Litros.`;
            toast(msg);
        } catch (error) {
            toast("Link copiado, mas não foi possível extrair os dados automaticamente.");
        } finally {
            setProcessandoNota(false);
        }
    }

    async function handleDownload(id) {
        try {
            const response = await api.get(`/gastos/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `comprovantes_gasto_${id}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { toast.error("Erro ao baixar arquivos."); }
    }

    async function handleDeleteAnexo(nomeArquivo) {
        if (!confirm(`Deseja excluir permanentemente o arquivo "${nomeArquivo}"?`)) return;
        try {
            await api.delete(`/gastos/${editandoId}/arquivo`, { params: { nome_arquivo: nomeArquivo } });
            setAnexosExistentes(prev => prev.filter(nome => nome !== nomeArquivo));
        } catch (error) { toast.error("Erro ao excluir arquivo."); }
    }

    function verificarSeTemAnexos(comprovanteString) {
        if (!comprovanteString) return false;
        try {
            const lista = JSON.parse(comprovanteString);
            return Array.isArray(lista) && lista.length > 0;
        } catch (e) { return !!comprovanteString; }
    }

    function extrairNomesArquivos(comprovanteString) {
        if (!comprovanteString) return [];
        try {
            const lista = JSON.parse(comprovanteString);
            if (Array.isArray(lista)) return lista.map(caminho => caminho.split(/[\\/]/).pop());
            return [comprovanteString.split(/[\\/]/).pop()];
        } catch (e) { return []; }
    }

    function abrirModal(gasto = null) {
        if (gasto) {
            setEditandoId(gasto.id);
            const veiculoSel = opcoesVeiculos.find(v => v.value === gasto.veiculo_id);
            const solicitanteSel = opcoesSolicitantes.find(m => m.value === gasto.colaborador_id);
            let desc = gasto.descricao || '';
            let link = '';
            if (desc.startsWith('http')) {
                const partes = desc.split(' | ');
                link = partes[0];
                desc = partes.slice(1).join(' | ');
            }

            let dataAjustada = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            if (gasto.data) dataAjustada = gasto.data.slice(0, 16);

            setForm({
                data: dataAjustada,
                tipo_gasto: gasto.tipo_gasto || '',
                valor: gasto.valor,
                descricao: desc,
                veiculo_id: veiculoSel || null,
                rota_id: gasto.rota_id || '',
                colaborador_id: solicitanteSel || null,
                centro_custo_id: gasto.centro_custo_id || '',
                combustivel: gasto.combustivel || '',
                litros: gasto.litros || '',
                preco_litro: gasto.preco_litro || '',
                tipo_manutencao: gasto.tipo_manutencao || '',
                status_manutencao: gasto.status_manutencao || '',
                km_registro: gasto.km_registro ? String(gasto.km_registro) : '',
                dot: gasto.dot || '',
                proxima_troca_km: gasto.proxima_troca_km ? String(gasto.proxima_troca_km) : ''
            });
            setLinkQrProtegido(link);
            setAnexosExistentes(extrairNomesArquivos(gasto.comprovante));
        } else {
            setEditandoId(null);
            setForm(initialForm);
            setLinkQrProtegido('');
            setAnexosExistentes([]);
        }
        setArquivos([]);
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditandoId(null);
        setForm(initialForm);
        setLinkQrProtegido('');
        setArquivos([]);
        setAnexosExistentes([]);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // DELEGAÇÃO DA VALIDAÇÃO E PREPARAÇÃO PARA O HELPER
        const { isValid, error, formData } = validarEPrepararGasto(form, anexosExistentes, arquivos, veiculos, linkQrProtegido);
        if (!isValid) return toast.error(error);

        try {
            if (editandoId) await api.put(`/gastos/${editandoId}`, formData);
            else await api.post('/gastos/', formData);

            toast.success(editandoId ? 'Atualizado!' : 'Lançado!');
            fecharModal();
            queryClient.invalidateQueries({ queryKey: ['gastos'] }); queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiro'] }); queryClient.invalidateQueries({ queryKey: ['homeMetrics'] });
        } catch (error) { toast.error("Erro ao salvar."); }
    }

    async function handleDelete(id) {
        if (!confirm("Excluir este lançamento?")) return;
        try { await api.delete(`/gastos/${id}`); queryClient.invalidateQueries({ queryKey: ['gastos'] }); queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiro'] }); queryClient.invalidateQueries({ queryKey: ['homeMetrics'] }); } catch (error) { toast.error("Erro."); }
    }

    const normalizeStr = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const termoBusca = normalizeStr(busca);

    const gastosFiltrados = gastos.filter((g) => {
        const nomeSolicitante = g.colaborador ? g.colaborador.nome : (g.descricao?.match(/Solicitante:\s*([^)|]+)/)?.[1]?.trim() || '');
        const matchBusca =
            normalizeStr(g.descricao).includes(termoBusca) ||
            normalizeStr(g.tipo_gasto || g.tipo).includes(termoBusca) ||
            normalizeStr(g.veiculo?.placa).includes(termoBusca) ||
            normalizeStr(nomeSolicitante).includes(termoBusca) ||
            normalizeStr(String(g.valor)).includes(termoBusca);
        let matchData = true;
        if (dataFiltro) matchData = (g.data ? g.data.split('T')[0] : '') === dataFiltro;
        const matchTipo = tipoFiltro ? (g.tipo_gasto || g.tipo) === tipoFiltro : true;
        return matchBusca && matchData && matchTipo;
    });

    function handleExportarPDF() {
        exportarPdfGastos({ gastosFiltrados });
    }

    return (
        <div style={{ minHeight: '80vh', paddingBottom: '150px' }}>
            {lendoQR && <LeitorQRCode onScanSuccess={handleQrScan} onClose={() => setLendoQR(false)} />}

            {processandoNota && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column' }}>
                    <div className="spin" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #8B5CF6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '15px' }}>Consultando Sefaz...</p>
                </div>
            )}

            <GastosHeaderFiltros 
                busca={busca} setBusca={setBusca}
                tipoFiltro={tipoFiltro} setTipoFiltro={setTipoFiltro} tiposGasto={tiposGasto}
                limite={limite} handleMudarLimite={handleMudarLimite}
                periodo={periodo} setPeriodo={setPeriodo}
                usarFiltroPeriodo={usarFiltroPeriodo} setUsarFiltroPeriodo={setUsarFiltroPeriodo}
                exportarPDF={handleExportarPDF} 
                can={can} 
                abrirModal={abrirModal} 
                setModalTiposAberto={setModalTiposAberto}
            />

            <TabelaGastos 
                gastosFiltrados={gastosFiltrados}
                menuAcaoAberto={menuAcaoAberto}
                setMenuAcaoAberto={setMenuAcaoAberto}
                setGastoDetalhe={setGastoDetalhe}
                abrirModal={abrirModal}
                handleDelete={handleDelete}
                can={can}
                handleDownload={handleDownload}
                verificarSeTemAnexos={verificarSeTemAnexos}
            />

            {temMais && (
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
                    <button onClick={carregarMais} style={{ background: '#2d3748', border: '1px solid #8B5CF6', color: '#8B5CF6', padding: '10px 30px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.2s' }}>
                        Mostrar mais 500 resultados
                    </button>
                </div>
            )}

            {modalAberto && (
                <ModalGastoForm 
                    editandoId={editandoId}
                    fecharModal={fecharModal}
                    handleSubmit={handleSubmit}
                    form={form}
                    setForm={setForm}
                    tiposGasto={tiposGasto}
                    tiposCombustivel={tiposCombustivel}
                    opcoesVeiculos={opcoesVeiculos}
                    opcoesSolicitantes={opcoesSolicitantes}
                    opcoesBases={opcoesBases}
                    tiposManutencao={tiposManutencao}
                    statusManutencao={statusManutencao}
                    rotasDoDia={rotasDoDia}
                    can={can}
                    user={user}
                    handleSelectChange={handleSelectChange}
                    handleKmChange={handleKmChange}
                    handleRotaChange={handleRotaChange}
                    setLendoQR={setLendoQR}
                    linkQrProtegido={linkQrProtegido}
                    setLinkQrProtegido={setLinkQrProtegido}
                    anexosExistentes={anexosExistentes}
                    handleDeleteAnexo={handleDeleteAnexo}
                    arquivos={arquivos}
                    setArquivos={setArquivos}
                />
            )}

            <ModalDetalhesGasto 
                gastoDetalhe={gastoDetalhe}
                setGastoDetalhe={setGastoDetalhe}
            />

            <ModalGerenciarTipos 
                modalTiposAberto={modalTiposAberto}
                setModalTiposAberto={setModalTiposAberto}
                tiposGasto={tiposGasto}
                novoTipo={novoTipo}
                setNovoTipo={setNovoTipo}
                editandoTipoId={editandoTipoId}
                setEditandoTipoId={setEditandoTipoId}
                editandoTipoNome={editandoTipoNome}
                setEditandoTipoNome={setEditandoTipoNome}
                handleSalvarNovoTipo={handleSalvarNovoTipo}
                handleSalvarEdicaoTipo={handleSalvarEdicaoTipo}
                handleExcluirTipo={handleExcluirTipo}
            />
        </div>
    );
}
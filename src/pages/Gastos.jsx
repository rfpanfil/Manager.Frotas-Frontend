import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, PlusCircle, FileText, Search, Filter, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

// --- SUBCOMPONENTES EXTRAÍDOS ---
import LeitorQRCode from '../components/gastos/LeitorQRCode';
import TabelaGastos from '../components/gastos/TabelaGastos';
import ModalGastoForm from '../components/gastos/ModalGastoForm';
import ModalDetalhesGasto from '../components/gastos/ModalDetalhesGasto';
import ModalGerenciarTipos from '../components/gastos/ModalGerenciarTipos';

export default function Gastos() {
    const { user, can } = useAuth();

    // --- DADOS DO BACKEND ---
    const [gastos, setGastos] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [rotasDoDia, setRotasDoDia] = useState([]);
    const [solicitantes, setSolicitantes] = useState([]);

    // --- DADOS PROCESSADOS PARA SELECTS ---
    const [opcoesVeiculos, setOpcoesVeiculos] = useState([]);
    const [opcoesSolicitantes, setOpcoesSolicitantes] = useState([]);

    // --- LISTAS AUXILIARES ---
    const [tiposGasto, setTiposGasto] = useState([]);
    const [tiposCombustivel, setTiposCombustivel] = useState([]);
    const [tiposManutencao, setTiposManutencao] = useState([]);
    const [statusManutencao, setStatusManutencao] = useState([]);

    // --- FILTROS E ESTADOS DE UI ---
    const [busca, setBusca] = useState('');
    const [dataFiltro, setDataFiltro] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [lendoQR, setLendoQR] = useState(false);
    const [processandoNota, setProcessandoNota] = useState(false);
    const [gastoDetalhe, setGastoDetalhe] = useState(null);
    const [menuAcaoAberto, setMenuAcaoAberto] = useState(null);

    // --- NOVO FILTRO DE DATA ---
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '', label: 'Últimos 30 dias' });
    const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);
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
    const [opcoesBases, setOpcoesBases] = useState([]);

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
        selecionarPeriodo('30d');
        carregarAuxiliares();
    }, []);

    useEffect(() => {
        if (usarFiltroPeriodo) carregarGastos(0, limite);
    }, [usarFiltroPeriodo, periodo.inicio, periodo.fim]);

    useEffect(() => {
        if (modalAberto) carregarRotasDoDia(form.data);
    }, [form.data, modalAberto]);

    useEffect(() => {
        if (!can('gastos.visao_global') && opcoesSolicitantes.length === 1 && modalAberto) {
            if (!form.colaborador_id) setForm(prev => ({ ...prev, colaborador_id: opcoesSolicitantes[0] }));
        }
    }, [opcoesSolicitantes, modalAberto, user, form.colaborador_id, can]);

    // --- LÓGICA DE DATAS ---
    function selecionarPeriodo(tipo) {
        if (tipo === 'tudo') {
            setPeriodo({ inicio: '', fim: '', label: 'Desde o Início' });
            setUsarFiltroPeriodo(true);
            setMenuPeriodoAberto(false);
            return;
        }

        const hoje = new Date();
        let inicio = new Date();
        let fim = new Date();
        let label = "";

        if (tipo === 'hoje') label = "Hoje";
        else if (tipo === '7d') { inicio.setDate(hoje.getDate() - 7); label = "Últimos 7 dias"; }
        else if (tipo === '30d') { inicio.setDate(hoje.getDate() - 30); label = "Últimos 30 dias"; }
        else if (tipo === '90d') { inicio.setDate(hoje.getDate() - 90); label = "Últimos 3 meses"; }
        else if (tipo === '12m') { inicio.setFullYear(hoje.getFullYear() - 1); label = "Últimos 12 meses"; }
        else if (tipo === 'mes_atual') {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            label = "Este Mês";
        }

        setPeriodo({
            inicio: inicio.toISOString().split('T')[0],
            fim: fim.toISOString().split('T')[0],
            label: label
        });
        setUsarFiltroPeriodo(true);
        setMenuPeriodoAberto(false);
    }

    async function carregarGastos(overrideSkip = 0, overrideLimite = null) {
        const limiteReal = overrideLimite !== null ? overrideLimite : limite;
        const params = { skip: overrideSkip, limit: limiteReal };
        if (periodo.inicio) params.data_inicio = periodo.inicio;
        if (periodo.fim) params.data_fim = periodo.fim;

        try {
            const res = await api.get('/gastos/', { params });
            if (overrideSkip === 0) setGastos(res.data);
            else setGastos(prev => [...prev, ...res.data]);
            setTemMais(res.data.length === limiteReal);
        } catch (error) { console.error("Erro ao listar gastos", error); }
    }

    function handleMudarLimite(novoLimite) {
        const lim = parseInt(novoLimite);
        setLimite(lim);
        if (lim === 999999) selecionarPeriodo('tudo');
        else carregarGastos(0, lim);
    }

    function carregarMais() {
        carregarGastos(gastos.length, 500);
    }

    async function carregarAuxiliares() {
        try {
            const [resV, resM, resTg, resTc, resTm, resSm, resBases] = await Promise.all([
                api.get('/veiculos/'),
                api.get('/colaboradores/solicitantes'),
                api.get('/opcoes/tipos-gasto'),
                api.get('/opcoes/tipos-combustivel'),
                api.get('/opcoes/tipos-manutencao'),
                api.get('/opcoes/status-manutencao'),
                api.get('/bases/')
            ]);

            setOpcoesBases(resBases.data.map(b => ({ value: b.id, label: b.nome })));
            setVeiculos(resV.data);
            setOpcoesVeiculos(resV.data.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo || 'Veículo'}`.toUpperCase() })));
            setSolicitantes(resM.data);

            let listaSolicitantes = resM.data;
            if (!can('gastos.visao_global')) {
                listaSolicitantes = listaSolicitantes.filter(m => {
                    if (m.usuario_id && (m.usuario_id == user.id)) return true;
                    if (m.nome && user.nome && (m.nome.toLowerCase().trim() === user.nome.toLowerCase().trim())) return true;
                    return false;
                });
            }
            setOpcoesSolicitantes(listaSolicitantes.map(m => ({ value: m.id, label: m.nome })));

            setTiposGasto(resTg.data);
            setTiposCombustivel(resTc.data);
            setTiposManutencao(resTm.data);
            setStatusManutencao(resSm.data);
        } catch (error) { console.error("Erro carregamento auxiliares", error); }
    }

    async function carregarRotasDoDia(dataString) {
        if (!dataString) return;
        try {
            const response = await api.get(`/rotas/por-data/${dataString.split('T')[0]}`);
            setRotasDoDia(response.data);
        } catch (error) { setRotasDoDia([]); }
    }

    async function handleSalvarNovoTipo() {
        if (!novoTipo.trim()) return;
        try {
            const res = await api.post('/opcoes/tipos-gasto', { nome: novoTipo });
            setTiposGasto([...tiposGasto, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
            setNovoTipo('');
        } catch (e) { toast.error("Erro ao criar tipo de gasto."); }
    }

    async function handleSalvarEdicaoTipo(id) {
        if (!editandoTipoNome.trim()) return;
        try {
            await api.put(`/opcoes/tipos-gasto/${id}`, { nome: editandoTipoNome });
            setTiposGasto(tiposGasto.map(t => t.id === id ? { ...t, nome: editandoTipoNome } : t));
            setEditandoTipoId(null);
            carregarGastos();
        } catch (e) { toast.error(e.response?.data?.detail || "Erro ao editar tipo de gasto."); }
    }

    async function handleExcluirTipo(id) {
        if (!confirm("Tem certeza que deseja excluir? Isso só será possível se não houver gastos atrelados a ele.")) return;
        try {
            await api.delete(`/opcoes/tipos-gasto/${id}`);
            setTiposGasto(tiposGasto.filter(t => t.id !== id));
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
                        setTiposGasto(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
                    } else if (fieldName === 'combustivel') {
                        setTiposCombustivel(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
                    } else if (fieldName === 'tipo_manutencao') {
                        setTiposManutencao(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
                    } else if (fieldName === 'status_manutencao') {
                        setStatusManutencao(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
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

        if (form.tipo_gasto === 'Combustível' && form.veiculo_id) {
            const veiculoSelecionado = veiculos.find(v => v.id == form.veiculo_id.value);
            const kmDigitado = parseFloat(form.km_registro);
            if (veiculoSelecionado && kmDigitado <= veiculoSelecionado.km_atual) {
                return toast.error(`ERRO DE ODÔMETRO!\nO KM informado (${kmDigitado}) é menor/igual ao KM atual.`);
            }
        }

        if (form.tipo_gasto === 'Combustível') {
            if (!form.veiculo_id) return toast.error("Obrigatório selecionar Veículo.");
            if (!form.colaborador_id) return toast.error("Obrigatório selecionar Solicitante.");
            if (!form.km_registro) return toast.error("Obrigatório informar KM.");
            if (anexosExistentes.length === 0 && arquivos.length === 0) return toast("FOTO DO ODÔMETRO OBRIGATÓRIA.");
        } else {
            const tiposFrota = ['Borracharia', 'Combustível', 'Estacionamento', 'Lava Car', 'Manutenção', 'Mão de obra', 'Multa', 'Pedágio', 'Revisão', 'Seguro veículos'];
            if (tiposFrota.includes(form.tipo_gasto)) {
                if (!form.veiculo_id) return toast.error("Selecione veículo.");
            } else {
                if (!form.centro_custo_id) return toast.error("Selecione Centro de Custo.");
            }
        }

        const formData = new FormData();
        formData.append('data', form.data);
        formData.append('tipo_gasto', form.tipo_gasto);
        formData.append('valor', String(form.valor).replace(',', '.'));
        if (form.centro_custo_id) formData.append('centro_custo_id', form.centro_custo_id);

        let descricaoFinal = form.descricao || '';
        if (linkQrProtegido) descricaoFinal = `${linkQrProtegido} | ${descricaoFinal}`;
        if (descricaoFinal) formData.append('descricao', descricaoFinal);

        if (form.veiculo_id) formData.append('veiculo_id', form.veiculo_id.value);
        if (form.colaborador_id) formData.append('colaborador_id', form.colaborador_id.value);
        if (form.rota_id) formData.append('rota_id', form.rota_id);

        if (form.km_registro) {
            const kmLimpo = String(form.km_registro).replaceAll('.', '').replace(',', '.');
            formData.append('km_registro', kmLimpo);
        }

        if (form.tipo_gasto === 'Combustível' && form.combustivel) {
            formData.append('combustivel', form.combustivel);
            if (form.litros) formData.append('litros', String(form.litros).replace(',', '.'));
            if (form.preco_litro) formData.append('preco_litro', String(form.preco_litro).replace(',', '.'));
        }

        if (form.tipo_gasto === 'Manutenção') {
            if (form.tipo_manutencao) formData.append('tipo_manutencao', form.tipo_manutencao);
            if (form.status_manutencao) formData.append('status_manutencao', form.status_manutencao);
            if (form.dot) formData.append('dot', form.dot);
            if (form.proxima_troca_km) {
                const proxKmLimpo = String(form.proxima_troca_km).replaceAll('.', '').replace(',', '.');
                formData.append('proxima_troca_km', proxKmLimpo);
            }
        }

        if (arquivos && arquivos.length > 0) {
            for (let i = 0; i < arquivos.length; i++) formData.append('arquivos', arquivos[i]);
        }

        try {
            if (editandoId) await api.put(`/gastos/${editandoId}`, formData);
            else await api.post('/gastos/', formData);

            toast.success(editandoId ? 'Atualizado!' : 'Lançado!');
            fecharModal();
            carregarGastos();
        } catch (error) { toast.error("Erro ao salvar."); }
    }

    async function handleDelete(id) {
        if (!confirm("Excluir este lançamento?")) return;
        try { await api.delete(`/gastos/${id}`); carregarGastos(); } catch (error) { toast.error("Erro."); }
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

    function exportarPDF() {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text("Relatório de Gastos - Loop.Frotas", 14, 10);
        autoTable(doc, {
            head: [["Data", "Base", "Tipo", "Veículo", "Solicitante", "KM", "Valor"]],
            body: gastosFiltrados.map(g => [
                new Date(g.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                g.centro_custo?.nome || g.veiculo?.base || 'Geral',
                g.tipo_gasto || g.tipo,
                g.veiculo ? g.veiculo.placa : '-',
                g.colaborador ? g.colaborador.nome : '-',
                g.km_registro ? `${g.km_registro} km` : '-',
                `R$ ${parseFloat(g.valor).toFixed(2)}`
            ]),
            startY: 20,
            styles: { fontSize: 8 }
        });
        doc.save("gastos.pdf");
    }

    return (
        <div style={{ minHeight: '80vh', paddingBottom: '150px' }}>
            {lendoQR && <LeitorQRCode onScanSuccess={handleQrScan} onClose={() => setLendoQR(false)} />}

            {processandoNota && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column' }}>
                    <div className="spin" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #00d68f', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '15px' }}>Consultando Sefaz...</p>
                </div>
            )}

            <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1><Wallet style={{ marginRight: '10px' }} /> Gastos</h1>

                <div className="header-actions">
                    <div className="search-box" style={{ display: 'flex', alignItems: 'center', background: '#2d3748', borderRadius: '5px', padding: '0 10px' }}>
                        <Search size={18} color="#a0aec0" />
                        <input
                            placeholder="Buscar gasto..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', outline: 'none', width: '100%' }}
                        />
                    </div>

                    <select
                        value={tipoFiltro}
                        onChange={e => setTipoFiltro(e.target.value)}
                        style={{ background: '#2d3748', color: 'white', border: '1px solid #444', padding: '0 10px', borderRadius: '5px', outline: 'none', cursor: 'pointer', height: '40px' }}
                    >
                        <option value="">Todos os Tipos</option>
                        {tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </select>

                    <select
                        value={limite}
                        onChange={e => handleMudarLimite(e.target.value)}
                        style={{ background: '#2d3748', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '5px', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="100">100 Lançamentos</option>
                        <option value="500">500 Lançamentos</option>
                        <option value="1000">1000 Lançamentos</option>
                        <option value="2000">2000 Lançamentos</option>
                        <option value="999999">Mostrar Tudo</option>
                    </select>

                    <div style={{ position: 'relative', zIndex: 9999 }}>
                        <button onClick={() => setMenuPeriodoAberto(!menuPeriodoAberto)} style={{ background: usarFiltroPeriodo ? '#1a202c' : '#2d3748', color: 'white', border: usarFiltroPeriodo ? '1px solid #00d68f' : '1px solid #444', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, minWidth: '160px', justifyContent: 'space-between' }}>
                            {usarFiltroPeriodo ? periodo.label : "Selecionar..."} <Filter size={16} />
                        </button>

                        {menuPeriodoAberto && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setMenuPeriodoAberto(false)} />
                        )}

                        {menuPeriodoAberto && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', padding: '10px', zIndex: 9999, width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <button onClick={() => selecionarPeriodo('7d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 7 dias</button>
                                    <button onClick={() => selecionarPeriodo('30d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 30 dias</button>
                                    <button onClick={() => selecionarPeriodo('mes_atual')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Este Mês</button>
                                    <button onClick={() => selecionarPeriodo('90d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 3 meses</button>
                                    <button onClick={() => selecionarPeriodo('12m')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 12 meses</button>
                                    <button onClick={() => selecionarPeriodo('tudo')} style={{ background: 'transparent', border: 'none', color: '#00d68f', textAlign: 'left', padding: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Desde o Início</button>
                                    <hr style={{ borderColor: '#444', margin: '5px 0' }} />
                                    <div style={{ fontSize: '0.8rem', color: '#00d68f', marginBottom: '5px' }}>Personalizado:</div>
                                    <input type="date" value={periodo.inicio} onChange={e => { setPeriodo({ ...periodo, inicio: e.target.value }); setUsarFiltroPeriodo(false); }} style={{ width: '100%', marginBottom: '5px', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }} />
                                    <input type="date" value={periodo.fim} onChange={e => { setPeriodo({ ...periodo, fim: e.target.value }); setUsarFiltroPeriodo(false); }} style={{ width: '100%', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }} />
                                    <button onClick={() => { if (periodo.inicio && periodo.fim) { setPeriodo({ ...periodo, label: 'Personalizado' }); setUsarFiltroPeriodo(true); setMenuPeriodoAberto(false); } else { toast.error("Selecione a data inicial e final."); } }} style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#00d68f', color: 'black', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        Aplicar Filtro
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px', marginRight: '8px' }}>
                        <FileText size={18} style={{ marginRight: 5 }} /> PDF
                    </button>

                    {can('gastos.tipos.gerenciar') && (
                        <button onClick={() => setModalTiposAberto(true)} className="btn-add" style={{ backgroundColor: '#4a5568', color: 'white', height: '40px', marginRight: '8px' }} title="Gerenciar Tipos de Gasto">
                            <Settings size={18} />
                        </button>
                    )}

                    {can('gastos.criar') && (
                        <button onClick={() => abrirModal()} className="btn-add" style={{ backgroundColor: '#00d68f', color: 'black', height: '40px' }}>
                            <PlusCircle size={18} style={{ marginRight: 5 }} /> Novo Gasto
                        </button>
                    )}
                </div>
            </div>

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
                    <button onClick={carregarMais} style={{ background: '#2d3748', border: '1px solid #00d68f', color: '#00d68f', padding: '10px 30px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.2s' }}>
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
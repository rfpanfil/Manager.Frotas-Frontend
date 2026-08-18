// Arquivo: frontend/src/pages/Gastos.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, PlusCircle, Edit, Trash2, FileText, X, Search, Paperclip, Files, CheckCircle, Calendar, QrCode, Filter, Eye, Download, MoreVertical, Settings, Check, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Html5QrcodeScanner } from "html5-qrcode";
import Select from 'react-select';

// --- ESTILOS DO REACT-SELECT (Dark Mode) ---
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: state.isDisabled ? '#2d3748' : '#1a1e29', // Cinza se desabilitado
        borderColor: state.isFocused ? '#00d68f' : '#444',
        color: 'white',
        minHeight: '42px',
        opacity: state.isDisabled ? 0.7 : 1,
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none',
        '&:hover': {
            borderColor: '#00d68f'
        }
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#00d68f' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#4a5568' }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#e53e3e', color: 'white' } })
};

// --- COMPONENTE INTERNO: LEITOR DE QR CODE ---
function LeitorQRCode({ onScanSuccess, onClose }) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Ignora erros de leitura contínua
            }
        );

        return () => {
            try { scanner.clear(); } catch (e) { /* ignore */ }
        };
    }, [onScanSuccess]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 2000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ background: 'white', padding: '10px', borderRadius: '10px', width: '90%', maxWidth: '400px' }}>
                <div id="reader" style={{ width: '100%' }}></div>
            </div>
            <button
                onClick={onClose}
                style={{ marginTop: '20px', padding: '10px 30px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem' }}
            >
                Cancelar / Fechar Câmera
            </button>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
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
    const [tipoFiltro, setTipoFiltro] = useState(''); // NOVO FILTRO DROPDOWN

    // --- GERENCIAMENTO DE TIPOS DE GASTO ---
    const [modalTiposAberto, setModalTiposAberto] = useState(false);
    const [novoTipo, setNovoTipo] = useState('');
    const [editandoTipoId, setEditandoTipoId] = useState(null);
    const [editandoTipoNome, setEditandoTipoNome] = useState('');

    async function handleSalvarNovoTipo() {
        if (!novoTipo.trim()) return;
        try {
            const res = await api.post('/opcoes/tipos-gasto', { nome: novoTipo });
            setTiposGasto([...tiposGasto, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
            setNovoTipo('');
        } catch (e) { alert("Erro ao criar tipo de gasto."); }
    }

    async function handleSalvarEdicaoTipo(id) {
        if (!editandoTipoNome.trim()) return;
        try {
            await api.put(`/opcoes/tipos-gasto/${id}`, { nome: editandoTipoNome });
            setTiposGasto(tiposGasto.map(t => t.id === id ? { ...t, nome: editandoTipoNome } : t));
            setEditandoTipoId(null);
            carregarGastos(); // Recarrega os gastos para exibir o novo nome na tabela
        } catch (e) { alert(e.response?.data?.detail || "Erro ao editar tipo de gasto."); }
    }

    async function handleExcluirTipo(id) {
        if (!confirm("Tem certeza que deseja excluir? Isso só será possível se não houver gastos atrelados a ele.")) return;
        try {
            await api.delete(`/opcoes/tipos-gasto/${id}`);
            setTiposGasto(tiposGasto.filter(t => t.id !== id));
        } catch (e) { alert(e.response?.data?.detail || "Não foi possível excluir. O tipo pode estar em uso."); }
    }

    //Proteção do link QRCODE
    const [linkQrProtegido, setLinkQrProtegido] = useState('');

    const [opcoesBases, setOpcoesBases] = useState([]);

    // --- FORMULÁRIO ---
    // Nota: veiculo_id e colaborador_id agora guardam objetos {value, label} para o React-Select
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
        km_registro: '' // Novo campo para input visual (string com pontos)
    };

    const [form, setForm] = useState(initialForm);
    const [arquivos, setArquivos] = useState([]);
    const [anexosExistentes, setAnexosExistentes] = useState([]);

    // --- CÁLCULO AUTOMÁTICO DE COMBUSTÍVEL ---
    useEffect(() => {
        if (form.tipo_gasto === 'Combustível') {
            const l = parseFloat(String(form.litros).replace(',', '.'));
            const p = parseFloat(String(form.preco_litro).replace(',', '.'));

            // Se os dois campos foram preenchidos com números válidos, calcula e atualiza o "Valor"
            if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
                setForm(prev => ({ ...prev, valor: (l * p).toFixed(2).replace('.', ',') }));
            }
        }
    }, [form.litros, form.preco_litro, form.tipo_gasto]);

    // --- EFEITOS E CARGAS ---

    // 1. Ao abrir, define o período padrão (isso vai disparar o carregarGastos)
    useEffect(() => {
        selecionarPeriodo('30d');
        carregarAuxiliares(); // Carrega veículos, motoristas, etc.
    }, []);

    // 2. Sempre que o período mudar E o filtro estiver ativo, recarrega a lista
    useEffect(() => {
        if (usarFiltroPeriodo) {
            carregarGastos(0, limite);
        }
    }, [usarFiltroPeriodo, periodo.inicio, periodo.fim]); // Agora escuta o botão "Aplicar"

    // 3. Recarrega rotas no modal
    useEffect(() => {
        if (modalAberto) carregarRotasDoDia(form.data);
    }, [form.data, modalAberto]);

    // 4. EFEITO MÁGICO: AUTO-SELECIONAR O SOLICITANTE
    useEffect(() => {
        // Se a lista tiver apenas 1 opção (ex: usuário sem Visão Global)
        if (!can('gastos.visao_global') && opcoesSolicitantes.length === 1 && modalAberto) {
            if (!form.colaborador_id) {
                setForm(prev => ({ ...prev, colaborador_id: opcoesSolicitantes[0] }));
            }
        }
    }, [opcoesSolicitantes, modalAberto, user, form.colaborador_id]);


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

        if (tipo === 'hoje') {
            label = "Hoje";
        } else if (tipo === '7d') {
            inicio.setDate(hoje.getDate() - 7);
            label = "Últimos 7 dias";
        } else if (tipo === '30d') {
            inicio.setDate(hoje.getDate() - 30);
            label = "Últimos 30 dias";
        } else if (tipo === '90d') {
            inicio.setDate(hoje.getDate() - 90);
            label = "Últimos 3 meses";
        } else if (tipo === '12m') {
            inicio.setFullYear(hoje.getFullYear() - 1);
            label = "Últimos 12 meses";
        } else if (tipo === 'mes_atual') {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            label = "Este Mês";
        }

        setPeriodo({
            inicio: inicio.toISOString().split('T')[0],
            fim: fim.toISOString().split('T')[0],
            label: label
        });
        setUsarFiltroPeriodo(true); // Garante que vai buscar
        setMenuPeriodoAberto(false);
    }

    // Busca e carrega os gastos, suportando adição de página
    // --- FUNÇÕES DE CARREGAMENTO E PAGINAÇÃO ---
    async function carregarGastos(overrideSkip = 0, overrideLimite = null) {
        // Pega o limite passado ou usa o limite atual do estado com segurança
        const limiteReal = overrideLimite !== null ? overrideLimite : limite;

        // Constrói os parâmetros dinamicamente (só manda data se não for "Desde o início")
        const params = {
            skip: overrideSkip,
            limit: limiteReal
        };
        if (periodo.inicio) params.data_inicio = periodo.inicio;
        if (periodo.fim) params.data_fim = periodo.fim;

        try {
            const res = await api.get('/gastos/', { params });

            // Se for pesquisa nova (skip 0), substitui a tela. Se for "mostrar mais", soma na lista.
            if (overrideSkip === 0) {
                setGastos(res.data);
            } else {
                setGastos(prev => [...prev, ...res.data]);
            }

            // Se o backend mandou a quantidade exata que pedimos, é muito provável que haja mais registros na próxima página
            setTemMais(res.data.length === limiteReal);

        } catch (error) { console.error("Erro ao listar gastos", error); }
    }

    function handleMudarLimite(novoLimite) {
        const lim = parseInt(novoLimite);
        setLimite(lim);

        if (lim === 999999) {
            selecionarPeriodo('tudo');
        } else {
            carregarGastos(0, lim);
        }
    }

    function carregarMais() {
        carregarGastos(gastos.length, 500); // Puxa os próximos 500 a partir da quantidade atual
    }

    // Busca dados auxiliares (Veículos, Motoristas, Opções) uma única vez
    async function carregarAuxiliares() {
        try {
            const [resV, resM, resTg, resTc, resTm, resSm, resBases] = await Promise.all([
                api.get('/veiculos/'),
                api.get('/colaboradores/solicitantes'),
                api.get('/opcoes/tipos-gasto'),
                api.get('/opcoes/tipos-combustivel'),
                api.get('/opcoes/tipos-manutencao'),
                api.get('/opcoes/status-manutencao'),
                api.get('/bases/') // <--- NOVO
            ]);

            // Processa Bases
            setOpcoesBases(resBases.data.map(b => ({ value: b.id, label: b.nome })));

            // 1. Veículos: Todo mundo vê tudo
            setVeiculos(resV.data);
            const optsVeiculos = resV.data.map(v => ({
                value: v.id,
                label: `${v.placa} - ${v.modelo || 'Veículo'}`.toUpperCase()
            }));
            setOpcoesVeiculos(optsVeiculos);

            // 2. Solicitantes (Antigos Motoristas)
            setSolicitantes(resM.data); // CORREÇÃO: Usando resM.data (antes estava resS)
            let listaSolicitantes = resM.data;

            // Filtra a lista para mostrar apenas o logado se ele NÃO tiver Visão Global
            if (!can('gastos.visao_global')) {
                listaSolicitantes = listaSolicitantes.filter(m => {
                    if (m.usuario_id && (m.usuario_id == user.id)) return true;
                    if (m.nome && user.nome && (m.nome.toLowerCase().trim() === user.nome.toLowerCase().trim())) return true;
                    return false;
                });
            }

            // Mapeia para o formato do Select
            const optsSolicitantes = listaSolicitantes.map(m => ({
                value: m.id,
                label: m.nome
            }));
            setOpcoesSolicitantes(optsSolicitantes); // Salva na nova variável

            // 3. Outros selects
            setTiposGasto(resTg.data);
            setTiposCombustivel(resTc.data);
            setTiposManutencao(resTm.data);
            setStatusManutencao(resSm.data);

        } catch (error) { console.error("Erro carregamento auxiliares", error); }
    }

    async function carregarRotasDoDia(dataString) {
        if (!dataString) return;
        try {
            const data = dataString.split('T')[0];
            const response = await api.get(`/rotas/por-data/${data}`);
            setRotasDoDia(response.data);
        } catch (error) { setRotasDoDia([]); }
    }

    // --- HANDLERS GENÉRICOS ---

    // Função para criar novo item em selects simples (Tipo Gasto, Combustível, etc)
    async function handleSelectChange(e, endpoint, stateUpdater, fieldName) {
        const valor = e.target.value;
        if (valor === 'ADD_NEW') {
            const novoNome = prompt(`Novo item para ${fieldName}:`);
            if (novoNome) {
                try {
                    const res = await api.post(endpoint, { nome: novoNome });
                    stateUpdater(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
                    setForm(prev => ({ ...prev, [fieldName]: novoNome }));
                } catch (e) { alert("Erro ao criar item."); }
            }
        } else {
            setForm(prev => ({ ...prev, [fieldName]: valor }));
        }
    }

    // Ao selecionar uma Rota, preenche automaticamente Veículo e Colaborador
    function handleRotaChange(e) {
        const rId = e.target.value;
        if (!rId) {
            setForm(prev => ({ ...prev, rota_id: '', veiculo_id: null }));
            if (can('gastos.visao_global')) {
                setForm(prev => ({ ...prev, colaborador_id: null }));
            }
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

    // Função auxiliar para o campo de KM (Adicione esta nova função)
    function handleKmChange(e) {
        // Permite digitar apenas números e ponto
        const valor = e.target.value.replace(/[^0-9.]/g, '');
        setForm(prev => ({ ...prev, km_registro: valor }));
    }

    // --- QR CODE ---
    async function handleQrScan(urlLida) {
        setLendoQR(false);
        // MUDANÇA 1: Salva no estado protegido visualmente
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
                // MUDANÇA 2: Não concatena mais a URL na descrição aqui. 
                // A URL fica salva no 'linkQrProtegido' e será unida apenas no Salvar.
                descricao: (prev.descricao ? prev.descricao + ' | ' : '') +
                    (dadosNota.local ? `Local: ${dadosNota.local}` : '')
            }));

            let msg = "QR Code lido!";
            if (dadosNota.valor > 0) msg += ` Valor R$ ${dadosNota.valor} encontrado.`;
            if (dadosNota.litros > 0) msg += `\nIdentificado: ${dadosNota.litros} Litros de ${dadosNota.combustivel_detectado || 'Combustível'}.`;
            else msg += " Valor não identificado automaticamente (site da fazenda pode ter bloqueio).";

            alert(msg);

        } catch (error) {
            console.error("Erro ao processar nota:", error);
            alert("Link copiado, mas não foi possível extrair os dados automaticamente.");
        } finally {
            setProcessandoNota(false);
        }
    }

    // --- MANIPULAÇÃO DE ARQUIVOS E DOWNLOADS ---
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
        } catch (error) {
            alert("Erro ao baixar arquivos (Pasta vazia ou inexistente).");
        }
    }

    async function handleDeleteAnexo(nomeArquivo) {
        if (!confirm(`Deseja excluir permanentemente o arquivo "${nomeArquivo}"?`)) return;
        try {
            await api.delete(`/gastos/${editandoId}/arquivo`, { params: { nome_arquivo: nomeArquivo } });
            setAnexosExistentes(prev => prev.filter(nome => nome !== nomeArquivo));
        } catch (error) {
            alert("Erro ao excluir arquivo.");
        }
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

    // --- CONTROLE DO MODAL ---
    function abrirModal(gasto = null) {
        if (gasto) {
            setEditandoId(gasto.id);

            // Mapeia os IDs para os objetos que o React-Select entende
            const veiculoSel = opcoesVeiculos.find(v => v.value === gasto.veiculo_id);
            const solicitanteSel = opcoesSolicitantes.find(m => m.value === gasto.colaborador_id);

            // --- INÍCIO DA MUDANÇA (EDIÇÃO) ---
            // Tenta separar o link da descrição se já existir salvo
            let desc = gasto.descricao || '';
            let link = '';
            // Se começar com http, assumimos que a primeira parte é link
            if (desc.startsWith('http')) {
                const partes = desc.split(' | ');
                link = partes[0];
                desc = partes.slice(1).join(' | ');
            }
            // --- FIM DA MUDANÇA ---

            // --- CORREÇÃO DO FUSO HORÁRIO NA EDIÇÃO ---
            let dataAjustada = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            if (gasto.data) {
                // Apenas pega a data do banco e corta os segundos, sem deixar o Javascript tentar converter fuso
                dataAjustada = gasto.data.slice(0, 16);
            }

            setForm({
                data: dataAjustada,
                tipo_gasto: gasto.tipo_gasto || '',
                valor: gasto.valor,
                descricao: desc,
                veiculo_id: veiculoSel || null,     // Objeto ou null
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
            setLinkQrProtegido(link); // <--- Joga o link para o campo protegido
            setAnexosExistentes(extrairNomesArquivos(gasto.comprovante));
        } else {
            setEditandoId(null);
            setForm(initialForm);
            setLinkQrProtegido(''); // <--- IMPORTANTE: Limpa o link ao criar novo
            // O useEffect de Auto-Select vai cuidar de preencher o motorista se necessário
            setAnexosExistentes([]);
        }
        setArquivos([]);
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditandoId(null);
        setForm(initialForm);
        setLinkQrProtegido(''); // <--- Adicionado para limpar o estado protegido
        setArquivos([]);
        setAnexosExistentes([]);
    }

    // --- SUBMIT DO FORMULÁRIO (COM VALIDAÇÕES) ---
    async function handleSubmit(e) {
        e.preventDefault();

        // --- TRAVA DE KM NO FRONTEND ---
        if (form.tipo_gasto === 'Combustível' && form.veiculo_id) {
            const veiculoSelecionado = veiculos.find(v => v.id == form.veiculo_id);
            const kmDigitado = parseFloat(form.km_registro);

            if (veiculoSelecionado && kmDigitado <= veiculoSelecionado.km_atual) {
                alert(`ERRO DE ODÔMETRO!\n\nO KM informado (${kmDigitado}) é menor ou igual ao KM atual do veículo (${veiculoSelecionado.km_atual}).\n\nPor favor, verifique se digitou corretamente.`);
                return; // Para tudo e não envia nada
            }
        }

        // 1. VALIDAÇÕES RÍGIDAS PARA COMBUSTÍVEL
        if (form.tipo_gasto === 'Combustível') {
            if (!form.veiculo_id) return alert("Obrigatório selecionar o Veículo.");
            if (!form.colaborador_id) return alert("Obrigatório selecionar o Colaborador/Solicitante.");
            if (!form.km_registro) return alert("Obrigatório informar o KM Atual.");

            // Verifica se tem foto (novo ou antigo)
            const temAnexos = (anexosExistentes.length > 0) || (arquivos.length > 0);
            if (!temAnexos) return alert("FOTO DO ODÔMETRO É OBRIGATÓRIA.");
        } else {
            // Só exige veículo SE o tipo de gasto estiver na lista de frota
            const tiposFrota = [
                'Borracharia', 'Combustível', 'Estacionamento', 'Lava Car',
                'Manutenção', 'Mão de obra', 'Multa', 'Pedágio',
                'Revisão', 'Seguro veículos'
            ];

            if (tiposFrota.includes(form.tipo_gasto)) {
                if (!form.veiculo_id) return alert("Para este tipo de gasto, selecione um veículo.");
            } else {
                // Se NÃO for frota (ex: Alimentação), exige Base/Centro de Custo
                if (!form.centro_custo_id) return alert("Selecione o Centro de Custo / Base.");
            }
        }

        const formData = new FormData();
        formData.append('data', form.data);
        formData.append('tipo_gasto', form.tipo_gasto);
        formData.append('valor', String(form.valor).replace(',', '.')); // Backend precisa de ponto
        if (form.centro_custo_id) formData.append('centro_custo_id', form.centro_custo_id);


        // --- INÍCIO DA MUDANÇA ---
        // Aqui juntamos o Link Protegido com o texto do usuário antes de enviar
        let descricaoFinal = form.descricao || '';
        if (linkQrProtegido) {
            // Formato final: "https://sefaz... | Obs: Almoço"
            descricaoFinal = `${linkQrProtegido} | ${descricaoFinal}`;
        }

        if (descricaoFinal) formData.append('descricao', descricaoFinal);
        // --- FIM DA MUDANÇA ---

        // Extrai o ID do objeto Select (value)
        if (form.veiculo_id) formData.append('veiculo_id', form.veiculo_id.value);
        if (form.colaborador_id) formData.append('colaborador_id', form.colaborador_id.value);
        if (form.rota_id) formData.append('rota_id', form.rota_id);

        // Limpa o KM (remove pontos) antes de enviar
        if (form.km_registro) {
            const kmLimpo = String(form.km_registro).replaceAll('.', '').replace(',', '.');
            formData.append('km_registro', kmLimpo);
        }

        if (form.tipo_gasto === 'Combustível' && form.combustivel) {
            formData.append('combustivel', form.combustivel);
            if (form.litros) formData.append('litros', String(form.litros).replace(',', '.'));
            if (form.preco_litro) formData.append('preco_litro', String(form.preco_litro).replace(',', '.'));
        }

        // CORREÇÃO AQUI: Bloco Manutenção agora envia DOT e Próxima Troca
        if (form.tipo_gasto === 'Manutenção') {
            if (form.tipo_manutencao) formData.append('tipo_manutencao', form.tipo_manutencao);
            if (form.status_manutencao) formData.append('status_manutencao', form.status_manutencao);

            // Envia campos de pneu se existirem
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
            if (editandoId) {
                await api.put(`/gastos/${editandoId}`, formData);
            } else {
                await api.post('/gastos/', formData);
            }

            alert(editandoId ? 'Atualizado!' : 'Lançado!');
            fecharModal();
            if (typeof carregarGastos === 'function') carregarGastos();

        } catch (error) {
            const msg = error.response?.data?.detail || "Erro ao salvar.";
            alert(msg);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Excluir este lançamento?")) return;
        try { await api.delete(`/gastos/${id}`); carregarGastos(); } catch (error) { alert("Erro."); }
    }

    // Função para remover acentos e deixar em minúsculo para busca perfeita
    const normalizeStr = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const termoBusca = normalizeStr(busca);

    const gastosFiltrados = gastos.filter((g) => {
        // Tenta capturar o nome do solicitante oficial, ou o que está escrito nas observações antigas
        const nomeSolicitante = g.colaborador ? g.colaborador.nome : (g.descricao?.match(/Solicitante:\s*([^)|]+)/)?.[1]?.trim() || '');

        const matchBusca =
            normalizeStr(g.descricao).includes(termoBusca) ||
            normalizeStr(g.tipo_gasto || g.tipo).includes(termoBusca) ||
            normalizeStr(g.veiculo?.placa).includes(termoBusca) ||
            normalizeStr(nomeSolicitante).includes(termoBusca) || // NOVO: Busca pelo Solicitante
            normalizeStr(String(g.valor)).includes(termoBusca);

        let matchData = true;
        if (dataFiltro) {
            const dataGasto = g.data ? g.data.split('T')[0] : '';
            matchData = dataGasto === dataFiltro;
        }

        const matchTipo = tipoFiltro ? (g.tipo_gasto || g.tipo) === tipoFiltro : true;

        return matchBusca && matchData && matchTipo;
    });

    function exportarPDF() {
        // ... (código do pdf)
        doc.save("gastos.pdf");
    }

    return (
        // MUDANÇA: Força a página a ter pelo menos 80% da altura da tela e um respiro no fundo
        // Isso impede que o dropdown de Período seja cortado quando a tabela estiver vazia
        <div style={{ minHeight: '80vh', paddingBottom: '150px' }}>
            {/* SE O LEITOR ESTIVER ATIVO, MOSTRA APENAS ELE (OVERLAY) */}
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

                    {/* --- NOVO SELETOR DE TIPO --- */}
                    <select
                        value={tipoFiltro}
                        onChange={e => setTipoFiltro(e.target.value)}
                        style={{ background: '#2d3748', color: 'white', border: '1px solid #444', padding: '0 10px', borderRadius: '5px', outline: 'none', cursor: 'pointer', height: '40px' }}
                    >
                        <option value="">Todos os Tipos</option>
                        {tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </select>

                    {/* --- SELETOR DE LIMITE --- */}
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

                    {/* --- SELETOR DE PERÍODO NOVO --- */}
                    <div style={{ position: 'relative', zIndex: 9999 }}> {/* <-- Z-INDEX AQUI */}
                        <button onClick={() => setMenuPeriodoAberto(!menuPeriodoAberto)} style={{ background: usarFiltroPeriodo ? '#1a202c' : '#2d3748', color: 'white', border: usarFiltroPeriodo ? '1px solid #00d68f' : '1px solid #444', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, minWidth: '160px', justifyContent: 'space-between' }}>
                            {usarFiltroPeriodo ? periodo.label : "Selecionar..."} <Filter size={16} />
                        </button>

                        {/* Overlay invisível para fechar o menu de data ao clicar fora */}
                        {menuPeriodoAberto && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setMenuPeriodoAberto(false)} />
                        )}

                        {menuPeriodoAberto && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', padding: '10px', zIndex: 9999, width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}> {/* <-- Z-INDEX AQUI */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <button onClick={() => selecionarPeriodo('7d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 7 dias</button>
                                    <button onClick={() => selecionarPeriodo('30d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 30 dias</button>
                                    <button onClick={() => selecionarPeriodo('mes_atual')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Este Mês</button>
                                    <button onClick={() => selecionarPeriodo('90d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 3 meses</button>
                                    <button onClick={() => selecionarPeriodo('12m')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 12 meses</button>
                                    <button onClick={() => selecionarPeriodo('tudo')} style={{ background: 'transparent', border: 'none', color: '#00d68f', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s', fontWeight: 'bold' }}>Desde o Início</button>

                                    <hr style={{ borderColor: '#444', margin: '5px 0' }} />

                                    <div style={{ fontSize: '0.8rem', color: '#00d68f', marginBottom: '5px' }}>Personalizado:</div>

                                    <input type="date" value={periodo.inicio} onChange={e => { setPeriodo({ ...periodo, inicio: e.target.value }); setUsarFiltroPeriodo(false); }} style={{ width: '100%', marginBottom: '5px', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }} />
                                    <input type="date" value={periodo.fim} onChange={e => { setPeriodo({ ...periodo, fim: e.target.value }); setUsarFiltroPeriodo(false); }} style={{ width: '100%', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }} />

                                    <button
                                        onClick={() => {
                                            if (periodo.inicio && periodo.fim) {
                                                setPeriodo({ ...periodo, label: 'Personalizado' });
                                                setUsarFiltroPeriodo(true);
                                                setMenuPeriodoAberto(false);
                                            } else {
                                                alert("Selecione a data inicial e final.");
                                            }
                                        }}
                                        style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#00d68f', color: 'black', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
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

                    {/* SUBSTITUA A CONDIÇÃO !isReadOnly POR can('gastos.criar') */}
                    {can('gastos.criar') && (
                        <button onClick={() => abrirModal()} className="btn-add" style={{ backgroundColor: '#00d68f', color: 'black', height: '40px' }}>
                            <PlusCircle size={18} style={{ marginRight: 5 }} /> Novo Gasto
                        </button>
                    )}
                </div>
            </div>

            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr>
                            <th style={{ whiteSpace: 'nowrap' }}>Data</th>
                            <th>Base (C. Custo)</th>
                            <th>Tipo</th>
                            <th>Veículo</th>
                            <th>Solicitante</th>
                            <th>KM</th>
                            <th>Valor</th>
                            <th>Detalhes</th>
                            <th>Anexos</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gastosFiltrados.map((g) => (
                            <tr key={g.id}>
                                {/* 1. Data */}
                                <td>{new Date(g.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>

                                {/* 2. Base (C. Custo) */}
                                <td><span style={{ color: '#a0aec0' }}>🏢 {g.centro_custo?.nome || g.veiculo?.base || 'Geral'}</span></td>

                                {/* 3. Tipo */}
                                <td><span style={{ color: '#f6ad55', fontWeight: 'bold' }}>{g.tipo_gasto || g.tipo}</span></td>

                                {/* 4. Veículo */}
                                <td>
                                    {g.veiculo ? (
                                        <span style={{ fontWeight: 'bold', color: '#cbd5e0' }}>🚛 {g.veiculo.placa}</span>
                                    ) : (
                                        <span style={{ color: '#718096' }}>-</span>
                                    )}
                                </td>

                                {/* 5. Solicitante Inteligente */}
                                <td style={{ color: '#63b3ed', fontWeight: 'bold' }}>
                                    {g.colaborador ? (
                                        g.colaborador.nome
                                    ) : (
                                        g.descricao?.includes('Solicitante:')
                                            ? g.descricao.match(/Solicitante:\s*([^)|]+)/)?.[1]?.trim() || '-'
                                            : '-'
                                    )}
                                </td>

                                {/* 6. KM */}
                                <td>{g.km_registro ? `${g.km_registro} km` : '-'}</td>

                                {/* 7. Valor */}
                                <td style={{ color: '#00d68f', fontWeight: 'bold' }}>R$ {parseFloat(g.valor).toFixed(2)}</td>

                                {/* 8. Detalhes da Nota */}
                                <td style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                                    {g.combustivel && <div style={{ marginBottom: '2px', color: '#63b3ed' }}>⛽ {g.combustivel}</div>}
                                    {g.tipo_manutencao && <div style={{ marginBottom: '2px', color: '#f6ad55' }}>🔧 {g.tipo_manutencao} ({g.status_manutencao})</div>}
                                    {!g.combustivel && !g.tipo_manutencao && <strong style={{ display: 'block', color: '#e2e8f0', marginBottom: '2px' }}>{g.tipo_gasto || g.tipo}</strong>}

                                    {g.descricao && (
                                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={g.descricao}>
                                            {g.descricao}
                                        </div>
                                    )}
                                </td>

                                {/* 9. Anexos */}
                                <td style={{ textAlign: 'center' }}>
                                    {verificarSeTemAnexos(g.comprovante) ? (
                                        <button onClick={() => handleDownload(g.id)} style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer', padding: '5px' }} title="Baixar anexos">
                                            <Download size={20} />
                                        </button>
                                    ) : (
                                        <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>-</span>
                                    )}
                                </td>

                                {/* 10. Ações */}
                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap', position: 'relative' }}>
                                    <button onClick={() => setMenuAcaoAberto(menuAcaoAberto === g.id ? null : g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: '5px' }} title="Ações">
                                        <MoreVertical size={20} />
                                    </button>

                                    {/* Overlay invisível: Cobre a tela toda e fecha o menu ao clicar fora */}
                                    {menuAcaoAberto === g.id && (
                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} onClick={() => setMenuAcaoAberto(null)} />
                                    )}

                                    {menuAcaoAberto === g.id && (
                                        <div style={{ position: 'absolute', right: '35px', top: '50%', transform: 'translateY(-50%)', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', display: 'flex', gap: '8px', padding: '8px', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.4)' }}>
                                            <button onClick={() => { setGastoDetalhe(g); setMenuAcaoAberto(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00d68f', display: 'flex', alignItems: 'center' }} title="Ver Detalhes">
                                                <Eye size={18} />
                                            </button>
                                            {can('gastos.editar') && (
                                                <button onClick={() => { abrirModal(g); setMenuAcaoAberto(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3182ce', display: 'flex', alignItems: 'center' }} title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                            )}
                                            {can('gastos.excluir') && (
                                                <button onClick={() => { handleDelete(g.id); setMenuAcaoAberto(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', display: 'flex', alignItems: 'center' }} title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* BOTÃO CARREGAR MAIS RESULTADOS */}
            {temMais && (
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
                    <button
                        onClick={carregarMais}
                        style={{ background: '#2d3748', border: '1px solid #00d68f', color: '#00d68f', padding: '10px 30px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.2s' }}
                    >
                        Mostrar mais 500 resultados
                    </button>
                </div>
            )}

            {modalAberto && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '10px' }}>
                    <div className="modal-card" style={{
                        position: 'relative',
                        width: '95%',
                        maxWidth: '800px',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        background: '#1a202c',
                        border: '1px solid #4a5568',
                        padding: '15px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <button onClick={fecharModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>

                        <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#f6ad55', fontSize: '1.5rem' }}>{editandoId ? 'Editar Gasto' : 'Novo Gasto'}</h3>

                        <form onSubmit={handleSubmit} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                            flex: 1
                        }}>

                            {/* Botão para Ler QR Code */}
                            <div style={{ background: 'rgba(0, 214, 143, 0.1)', border: '1px dashed #00d68f', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#00d68f', fontSize: '0.9rem' }}>Tem Nota Fiscal (NFC-e)?</span>
                                <button
                                    type="button"
                                    onClick={() => setLendoQR(true)}
                                    style={{ background: '#00d68f', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}
                                >
                                    <QrCode size={18} /> Ler QR Code
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                <div className="input-group"><label>Data</label><input type="datetime-local" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required /></div>

                                <div className="input-group">
                                    <label>Tipo de Gasto</label>
                                    <select value={form.tipo_gasto} onChange={(e) => handleSelectChange(e, '/opcoes/tipos-gasto', setTiposGasto, 'tipo_gasto')} required>
                                        <option value="">Selecione...</option>
                                        {tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#f6ad55' }}>+ Novo...</option>
                                    </select>
                                </div>

                                <div className="input-group"><label>Valor (R$)</label><input type="text" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required placeholder="0,00" /></div>
                            </div>

                            {/* --- CAMPOS DINÂMICOS PARA COMBUSTÍVEL --- */}
                            {form.tipo_gasto === 'Combustível' && (
                                <div style={{ background: 'rgba(246, 173, 85, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid #f6ad55', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                                    {/* BALÃO INFORMATIVO NOVO */}
                                    <div style={{ background: 'rgba(56, 178, 172, 0.15)', border: '1px solid #319795', color: '#81E6D9', padding: '10px', borderRadius: '5px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Info size={20} style={{ flexShrink: 0 }} />
                                        Insira os valores de Litros e Preço Litro (R$) para calcular automaticamente o Valor (R$) da nota.
                                    </div>

                                    <div style={{ color: '#f6ad55', fontWeight: 'bold', fontSize: '0.9rem' }}>DADOS DE ABASTECIMENTO (Obrigatório)</div>

                                    <div className="input-group">
                                        <label style={{ color: '#f6ad55' }}>Combustível</label>
                                        <select value={form.combustivel} onChange={(e) => handleSelectChange(e, '/opcoes/tipos-combustivel', setTiposCombustivel, 'combustivel')} required>
                                            <option value="">Selecione...</option>
                                            {tiposCombustivel.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                            <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#f6ad55' }}>+ Novo...</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="input-group">
                                            <label style={{ color: '#f6ad55' }}>Litros</label>
                                            <input type="text" value={form.litros} onChange={e => setForm({ ...form, litros: e.target.value })} placeholder="Ex: 50,5" required style={{ border: '1px solid #f6ad55' }} />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ color: '#f6ad55' }}>Preço Litro (R$)</label>
                                            <input type="text" value={form.preco_litro} onChange={e => setForm({ ...form, preco_litro: e.target.value })} placeholder="Ex: 5,89" required style={{ border: '1px solid #f6ad55' }} />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: '#f6ad55' }}>KM Atual (Odômetro)</label>
                                        <input
                                            type="text"
                                            value={form.km_registro}
                                            onChange={handleKmChange}
                                            placeholder="Ex: 123.456"
                                            required
                                            style={{ fontSize: '1.1rem', fontWeight: 'bold', background: '#1a202c', border: '1px solid #f6ad55' }}
                                        />
                                        <small style={{ color: '#a0aec0' }}>Use ponto para separar milhar (Ex: 150.000 ou 150000)</small>
                                    </div>
                                </div>
                            )}

                            {/* --- SELEÇÃO DE VEÍCULO E MOTORISTA (COM BUSCA) --- */}
                            {[
                                'Borracharia',
                                'Combustível',
                                'Estacionamento',
                                'Lava Car',
                                'Manutenção',
                                'Mão de obra',
                                'Multa',
                                'Pedágio',
                                'Revisão',
                                'Seguro veículos'
                            ].includes(form.tipo_gasto) ? (
                                /* SE FOR FROTA: MOSTRA VEÍCULO E SOLICITANTE */
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <div className="input-group">
                                        <label>Veículo <span style={{ color: 'red' }}>*</span></label>
                                        <Select
                                            value={form.veiculo_id}
                                            onChange={opt => setForm({ ...form, veiculo_id: opt })}
                                            options={opcoesVeiculos}
                                            placeholder="Pesquisar veículo..."
                                            styles={customSelectStyles}
                                            isClearable
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Solicitante / Colaborador <span style={{ color: 'red' }}>*</span></label>
                                        <Select
                                            value={form.colaborador_id}
                                            onChange={opt => setForm({ ...form, colaborador_id: opt })}
                                            options={opcoesSolicitantes}
                                            placeholder="Pesquisar solicitante..."
                                            styles={customSelectStyles}
                                            isClearable
                                            isDisabled={!can('gastos.visao_global')}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* SE FOR OUTRO GASTO: MOSTRA CENTRO DE CUSTO */
                                <div className="input-group">
                                    <label>Centro de Custo / Base <span style={{ color: 'red' }}>*</span></label>
                                    <Select
                                        value={opcoesBases.find(b => b.value === form.centro_custo_id)}
                                        onChange={opt => setForm({ ...form, centro_custo_id: opt ? opt.value : null })}
                                        options={opcoesBases}
                                        placeholder="Selecione o local..."
                                        styles={customSelectStyles}
                                        isClearable
                                    />
                                </div>
                            )}

                            {form.tipo_gasto === 'Manutenção' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#2d3748', padding: '15px', borderRadius: '5px', border: '1px dashed #e53e3e' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="input-group">
                                            <label style={{ color: '#e53e3e' }}>Tipo Manutenção</label>
                                            <select value={form.tipo_manutencao} onChange={(e) => handleSelectChange(e, '/opcoes/tipos-manutencao', setTiposManutencao, 'tipo_manutencao')} required>
                                                <option value="">Selecione...</option>
                                                {tiposManutencao.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                                <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#e53e3e' }}>+ Novo...</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label style={{ color: '#e53e3e' }}>Status</label>
                                            <select value={form.status_manutencao} onChange={(e) => handleSelectChange(e, '/opcoes/status-manutencao', setStatusManutencao, 'status_manutencao')} required>
                                                <option value="">Selecione...</option>
                                                {statusManutencao.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                                <option value="ADD_NEW">+ Novo...</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* --- CAMPOS ESPECÍFICOS PARA TROCA DE PNEU --- */}
                                    {form.tipo_manutencao === 'Troca de pneu' && (
                                        <div style={{ background: 'rgba(229, 62, 62, 0.1)', padding: '10px', borderRadius: '5px', border: '1px solid #e53e3e', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: '#e53e3e', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>DADOS DOS PNEUS (Obrigatório)</div>
                                            </div>

                                            <div className="input-group">
                                                <label style={{ color: '#e53e3e' }}>KM da Troca</label>
                                                <input
                                                    type="number"
                                                    value={form.km_registro}
                                                    onChange={e => {
                                                        const km = e.target.value;
                                                        setForm(prev => ({
                                                            ...prev,
                                                            km_registro: km,
                                                            // Calcula automaticamente +40.000 se o usuário digitar
                                                            proxima_troca_km: km ? String(parseInt(km) + 40000) : ''
                                                        }))
                                                    }}
                                                    required
                                                    placeholder="Ex: 50000"
                                                />
                                            </div>

                                            <div className="input-group">
                                                <label style={{ color: '#e53e3e' }}>DOT</label>
                                                <input
                                                    value={form.dot}
                                                    onChange={e => setForm({ ...form, dot: e.target.value })}
                                                    placeholder="Ex: 3524"
                                                    required
                                                />
                                            </div>

                                            <div className="input-group">
                                                <label style={{ color: '#e53e3e' }}>Próxima Troca (40k)</label>
                                                <input
                                                    type="number"
                                                    value={form.proxima_troca_km}
                                                    onChange={e => setForm({ ...form, proxima_troca_km: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="input-group"><label>Vincular Rota (Opcional)</label><select value={form.rota_id} onChange={handleRotaChange}><option value="">-- Avulso --</option>{rotasDoDia.map(r => <option key={r.id} value={r.id}>#{r.id} | {r.motorista?.nome || 'S/ Mot'} - {r.veiculo?.identificacao || 'S/ Veic'}</option>)}</select></div>

                            {/* --- INÍCIO DA MUDANÇA JSX --- */}
                            {/* Só aparece se tiver um link capturado */}
                            {linkQrProtegido && (
                                <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(0, 214, 143, 0.1)', borderRadius: '5px', border: '1px solid #00d68f' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <label style={{ color: '#00d68f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}>
                                            <QrCode size={14} /> Link da Nota (Protegido)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setLinkQrProtegido('')}
                                            style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                                        >
                                            Remover Link
                                        </button>
                                    </div>
                                    <input
                                        value={linkQrProtegido}
                                        readOnly // O usuário vê, mas não toca
                                        style={{
                                            width: '100%',
                                            background: '#1a202c',
                                            border: '1px solid #2d3748',
                                            color: '#a0aec0',
                                            fontStyle: 'italic',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label>Descrição / Observação</label>
                                <input
                                    // Placeholder dinâmico para orientar o usuário
                                    placeholder={linkQrProtegido ? "Adicione observações extras aqui..." : "Detalhes..."}
                                    value={form.descricao}
                                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                                />
                            </div>

                            {/* LISTA DE ANEXOS EXISTENTES */}
                            {anexosExistentes.length > 0 && (
                                <div style={{ background: '#2d3748', padding: '10px', borderRadius: '5px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Arquivos salvos:</label>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '5px 0' }}>
                                        {anexosExistentes.map((nome, i) => (
                                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #444' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#63b3ed', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</span>
                                                <button type="button" onClick={() => handleDeleteAnexo(nome)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="input-group" style={{ border: '1px dashed #4a5568', padding: '10px', borderRadius: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#a0aec0' }}>
                                    <Paperclip size={16} />
                                    {form.tipo_gasto === 'Combustível' ?
                                        <span style={{ color: '#f6ad55', fontWeight: 'bold' }}>FOTO DO ODÔMETRO + COMPROVANTE</span> :
                                        "Anexar Comprovantes (Pode selecionar vários)"
                                    }
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={e => setArquivos(Array.from(e.target.files || []))}
                                    style={{ marginTop: '10px', width: '100%' }}
                                />
                                {arquivos.length > 0 && <small style={{ color: '#00d68f' }}>{arquivos.length} novo(s) arquivo(s) selecionado(s)</small>}
                            </div>

                            {/* RODAPÉ DO MODAL */}
                            <div className="modal-footer">
                                <button type="button" onClick={fecharModal} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white' }}>Cancelar</button>
                                <button type="submit" className="btn-add" style={{ backgroundColor: '#f6ad55', color: '#000' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE DETALHES RÁPIDOS --- */}
            {gastoDetalhe && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050, padding: '10px' }}>
                    <div className="modal-card" style={{ width: '90%', maxWidth: '600px', background: '#1a202c', border: '1px solid #4a5568', padding: '20px', borderRadius: '8px', position: 'relative' }}>
                        <button onClick={() => setGastoDetalhe(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                        <h3 style={{ marginTop: 0, color: '#00d68f', borderBottom: '1px solid #2d3748', paddingBottom: '10px', marginBottom: '15px' }}>Detalhes do Lançamento</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                            <div><strong style={{ color: '#a0aec0' }}>Tipo:</strong> {gastoDetalhe.tipo_gasto || gastoDetalhe.tipo}</div>
                            <div><strong style={{ color: '#a0aec0' }}>Valor:</strong> R$ {parseFloat(gastoDetalhe.valor).toFixed(2)}</div>

                            <div><strong style={{ color: '#a0aec0' }}>Data Registrada da Despesa:</strong> {new Date(gastoDetalhe.data).toLocaleString('pt-BR', { timeZone: 'UTC' })}</div>
                            <div><strong style={{ color: '#a0aec0' }}>Base/Centro Custo:</strong> {gastoDetalhe.centro_custo?.nome || gastoDetalhe.veiculo?.base || 'Geral'}</div>

                            <div><strong style={{ color: '#a0aec0' }}>Veículo:</strong> {gastoDetalhe.veiculo ? gastoDetalhe.veiculo.placa : '-'}</div>
                            <div><strong style={{ color: '#a0aec0' }}>Colaborador/Solicitante:</strong> {gastoDetalhe.colaborador ? gastoDetalhe.colaborador.nome : '-'}</div>

                            {gastoDetalhe.combustivel && <div><strong style={{ color: '#a0aec0' }}>Combustível:</strong> {gastoDetalhe.combustivel} ({gastoDetalhe.litros} L)</div>}
                            {gastoDetalhe.km_registro && <div><strong style={{ color: '#a0aec0' }}>KM Odômetro:</strong> {gastoDetalhe.km_registro} km</div>}

                            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#a0aec0' }}>Descrição:</strong> {gastoDetalhe.descricao || 'Nenhuma'}</div>

                            {/* AUDITORIA */}
                            <div style={{ gridColumn: '1 / -1', background: '#2d3748', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
                                <div style={{ marginBottom: '5px', color: '#f6ad55', fontWeight: 'bold' }}>Dados da Criação (Auditoria):</div>
                                <div><strong style={{ color: '#a0aec0' }}>Lançado no sistema em:</strong> {gastoDetalhe.criado_em ? new Date(gastoDetalhe.criado_em).toLocaleString('pt-BR') : 'Dado antigo (Não registrado)'}</div>
                                <div><strong style={{ color: '#a0aec0' }}>Por usuário:</strong> {gastoDetalhe.criado_por ? gastoDetalhe.criado_por.nome : 'Sistema / Legado'}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button onClick={() => setGastoDetalhe(null)} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE GERENCIAMENTO DE TIPOS DE GASTO --- */}
            {modalTiposAberto && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '15px' }}>
                    <div className="modal-card" style={{ width: '100%', maxWidth: '600px', background: '#1a202c', border: '1px solid #4a5568', padding: '25px', borderRadius: '10px', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <button onClick={() => setModalTiposAberto(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                        <h3 style={{ marginTop: 0, color: '#00d68f', borderBottom: '1px solid #2d3748', paddingBottom: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={20} /> Tipos de Gasto
                        </h3>

                        {/* Adicionar Novo */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input
                                value={novoTipo}
                                onChange={e => setNovoTipo(e.target.value)}
                                placeholder="Criar novo tipo (Ex: Hospedagem)"
                                style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', boxSizing: 'border-box' }}
                            />
                            <button onClick={handleSalvarNovoTipo} style={{ background: '#00d68f', color: 'black', border: 'none', padding: '0 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>Adicionar</button>
                        </div>

                        {/* Lista Existente (AGORA EM DIVS/FLEXBOX PARA NÃO QUEBRAR O LAYOUT) */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', overflowX: 'hidden' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {tiposGasto.map(t => {
                                    const isEditing = editandoTipoId === t.id;
                                    return (
                                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', padding: '12px 5px', gap: '15px' }}>

                                            {/* ESQUERDA: Texto / Input */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {isEditing ? (
                                                    <input
                                                        value={editandoTipoNome}
                                                        onChange={e => setEditandoTipoNome(e.target.value)}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #00d68f', background: '#1a202c', color: 'white', boxSizing: 'border-box' }}
                                                    />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                        <span style={{ fontWeight: '500', wordBreak: 'break-word', color: 'white', fontSize: '0.95rem' }}>{t.nome}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* DIREITA: Botões de Ação Totalmente Livres */}
                                            <div style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => handleSalvarEdicaoTipo(t.id)} style={{ background: '#00d68f', border: 'none', color: 'black', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}><Check size={16} /></button>
                                                        <button onClick={() => setEditandoTipoId(null)} style={{ background: '#e53e3e', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setEditandoTipoId(t.id); setEditandoTipoNome(t.nome); }} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }} title="Editar"><Edit size={18} /></button>
                                                        <button onClick={() => handleExcluirTipo(t.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }} title="Excluir"><Trash2 size={18} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
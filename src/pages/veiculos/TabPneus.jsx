// Arquivo: frontend/src/pages/veiculos/TabPneus.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    Truck, Activity, Wrench, Layers, X, Save, FileText, Plus,
    ArrowDownCircle, Trash2, Edit, AlertCircle, CheckCircle, Search, Disc, Settings
} from 'lucide-react';
import Select from 'react-select';

// Estilos padronizados para o React-Select
const customSelectStyles = {
    control: (base, state) => ({ ...base, backgroundColor: '#2d3748', borderColor: '#444', color: 'white', minHeight: '38px', boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none', '&:hover': { borderColor: '#00d68f' } }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#00d68f' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' })
};

const inputStyle = { width: '100%', padding: '8px', background: '#2d3748', border: '1px solid #4a5568', color: 'white', borderRadius: 4, marginTop: '5px', boxSizing: 'border-box' };

// --- DESENHO DO CARRO (VISTO DE CIMA) ---
const SvgCarro = () => (
    <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 95, height: 210, zIndex: 1, pointerEvents: 'none' }}>
        <svg viewBox="0 0 100 220" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 5px 10px rgba(0,0,0,0.5))' }}>
            {/* Retrovisores */}
            <path d="M 12 80 L 2 82 L 2 95 L 15 92 Z" fill="#1a202c" />
            <path d="M 88 80 L 98 82 L 98 95 L 85 92 Z" fill="#1a202c" />

            {/* Corpo do Carro (Aerodinâmico) */}
            <rect x="12" y="10" width="76" height="200" rx="22" fill="#313b4d" stroke="#1a202c" strokeWidth="2" />

            {/* Capô Frontal */}
            <path d="M 14 55 Q 50 40 86 55 L 84 25 Q 50 5 16 25 Z" fill="#3b4456" />

            {/* Para-brisa Dianteiro (Curvado) */}
            <path d="M 22 75 Q 50 60 78 75 L 72 105 Q 50 100 28 105 Z" fill="#11151c" stroke="#1a202c" strokeWidth="2" />

            {/* Teto do Carro */}
            <rect x="28" y="105" width="44" height="45" fill="#4a5568" />

            {/* Para-brisa Traseiro */}
            <path d="M 28 150 Q 50 155 72 150 L 78 175 Q 50 185 22 175 Z" fill="#11151c" stroke="#1a202c" strokeWidth="2" />

            {/* Faróis Dianteiros */}
            <rect x="20" y="12" width="14" height="6" rx="3" fill="#f6e05e" opacity="0.9" />
            <rect x="66" y="12" width="14" height="6" rx="3" fill="#f6e05e" opacity="0.9" />

            {/* Lanternas Traseiras */}
            <rect x="20" y="202" width="16" height="5" rx="2" fill="#e53e3e" opacity="0.9" />
            <rect x="64" y="202" width="16" height="5" rx="2" fill="#e53e3e" opacity="0.9" />

            {/* Vidros Laterais Escuros */}
            <path d="M 20 80 Q 24 110 24 140 L 28 140 L 28 80 Z" fill="#11151c" />
            <path d="M 80 80 Q 76 110 76 140 L 72 140 L 72 80 Z" fill="#11151c" />
        </svg>
    </div>
);

export default function TabPneus() {
    const { can } = useAuth();
    const [pneus, setPneus] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [resumo, setResumo] = useState({ estoque: 0, em_uso: 0, manutencao: 0, sucata: 0, cpk_medio: 0 });

    // Tabela Expansível
    const [expandedVeiculo, setExpandedVeiculo] = useState(null);
    const [buscaVeiculo, setBuscaVeiculo] = useState('');
    const [filtroStatusVeiculo, setFiltroStatusVeiculo] = useState(''); // RECUPERADO

    // Modais
    const [modalMontagem, setModalMontagem] = useState(false);
    const [modalListaStatus, setModalListaStatus] = useState(null);
    const [buscaModalStatus, setBuscaModalStatus] = useState('');
    const [modalExpresso, setModalExpresso] = useState(false);
    const [modalHistorico, setModalHistorico] = useState(null);
    const [historicoData, setHistoricoData] = useState([]);

    // Novo Estado de Edição de Pneu
    const [modalEdicao, setModalEdicao] = useState(false);
    const [pneuEditando, setPneuEditando] = useState({});

    // Estados do CRUD de Medidas
    const [medidas, setMedidas] = useState([]);
    const [modalMedidas, setModalMedidas] = useState(false);
    const [medidaForm, setMedidaForm] = useState({ id: null, nome: '' });

    // Estados de Seleção para Montagem
    const [veiculoMontagem, setVeiculoMontagem] = useState(null);
    const [posicaoAlvo, setPosicaoAlvo] = useState(null);
    const [popoverAberto, setPopoverAberto] = useState(false);
    const [kmMontagemGlobal, setKmMontagemGlobal] = useState(''); // NOVO: Armazena o KM no passo 2
    const [buscaPopover, setBuscaPopover] = useState('');

    // Formulário Expresso
    const [formExpresso, setFormExpresso] = useState({ data_montagem: '', dot: '', fogo: '', km_montagem: '', medida: '', marca: '', sulco_novo: '', condicao: 'ORIGINAL', vida_util_km: 40000 });

    useEffect(() => { carregarDados(); }, []);

    async function carregarDados() {
        try {
            const [resP, resV, resD, resM] = await Promise.all([
                api.get('/pneus/'),
                api.get('/veiculos/'),
                api.get('/pneus/dashboard-resumo'),
                api.get('/pneus/medidas')
            ]);
            setPneus(resP.data);
            setVeiculos(resV.data);
            setResumo(resD.data);
            setMedidas(resM.data);
        } catch (error) { console.error("Erro ao carregar", error); }
    }

    async function handleNovaMedida(nomeInserido) {
        if (!nomeInserido || nomeInserido.trim() === '') return;
        try {
            const res = await api.post('/pneus/medidas', { nome: nomeInserido });
            setMedidas([...medidas, res.data]);
            return res.data;
        } catch (e) { alert("Erro ao criar medida: " + (e.response?.data?.detail || "Já existe")); }
    }

    async function handleSalvarMedida(e) {
        e.preventDefault();
        try {
            if (medidaForm.id) {
                await api.put(`/pneus/medidas/${medidaForm.id}`, { nome: medidaForm.nome });
            } else {
                await api.post('/pneus/medidas', { nome: medidaForm.nome });
            }
            setMedidaForm({ id: null, nome: '' });
            carregarDados();
        } catch (e) { alert("Erro: " + (e.response?.data?.detail || "Já existe")); }
    }

    async function handleExcluirMedida(id) {
        if (!window.confirm("Deseja mesmo excluir esta medida?")) return;
        try {
            await api.delete(`/pneus/medidas/${id}`);
            carregarDados();
        } catch (e) { alert("Erro: " + (e.response?.data?.detail || "Em uso")); }
    }

    const calcularStatusPneu = (pneu, kmAtualVeiculo) => {
        if (!pneu.vida_util_km) return { cor: '#a0aec0', msg: 'Sem parâmetro', status: 'neutro' };

        const kmRodado = (kmAtualVeiculo || 0) - (pneu.km_montagem || 0);
        const kmFaltante = pneu.vida_util_km - kmRodado;

        let sulcoOk = true;
        if (pneu.sulco_novo > 0 && pneu.sulco_atual <= 3) sulcoOk = false;

        if (kmFaltante <= 0 || !sulcoOk) return { cor: '#e53e3e', msg: 'Vencido', status: 'vermelho', kmFaltante };
        if (kmFaltante <= 5000) return { cor: '#ecc94b', msg: 'Próximo do Vencimento', status: 'amarelo', kmFaltante };

        return { cor: '#00d68f', msg: 'OK', status: 'verde', kmFaltante };
    };

    const veiculosProcessados = veiculos.map(v => {
        const pneusDoVeiculo = pneus.filter(p => p.veiculo_id === v.id && p.status === 'EM_USO');
        let statusFarol = 'verde';
        let contagens = { vermelho: 0, amarelo: 0, verde: 0 };

        pneusDoVeiculo.forEach(p => {
            const st = calcularStatusPneu(p, v.km_atual);
            contagens[st.status] = (contagens[st.status] || 0) + 1;
        });

        if (contagens.vermelho > 0) statusFarol = 'vermelho';
        else if (contagens.amarelo > 0) statusFarol = 'amarelo';
        else if (pneusDoVeiculo.length === 0) statusFarol = 'vazio';

        return { ...v, pneusMontados: pneusDoVeiculo, statusFarol, contagens };
    });

    const veiculosFiltrados = veiculosProcessados
        .filter(v => `${v.placa} ${v.modelo}`.toLowerCase().includes(buscaVeiculo.toLowerCase()))
        .filter(v => filtroStatusVeiculo ? v.statusFarol === filtroStatusVeiculo : true)
        .sort((a, b) => {
            const peso = { 'vermelho': 1, 'amarelo': 2, 'verde': 3, 'vazio': 4 };
            return peso[a.statusFarol] - peso[b.statusFarol];
        });

    // --- AÇÕES ---
    async function handleDesmontar(pneu) {
        if (!window.confirm(`Deseja desmontar o pneu ${pneu.dot || pneu.fogo} e enviá-lo ao Estoque?`)) return;
        try {
            await api.post(`/pneus/movimentar`, { pneu_id: pneu.id, tipo_evento: 'DESMONTAGEM', observacao: 'Desmontagem via painel visual' });
            carregarDados();
        } catch (e) { alert("Erro ao desmontar."); }
    }

    async function handleMontarEstoque(pneuId) {
        if (!veiculoMontagem || !posicaoAlvo) return;

        // PASSO 3.1: Usa o KM global inserido antes. Se esquecer, pede na hora.
        let km = kmMontagemGlobal;
        if (!km) {
            km = prompt("Você não preencheu o KM da montagem geral. Digite o KM de montagem agora:", veiculoMontagem.km_atual || '');
            if (!km) return;
            setKmMontagemGlobal(km);
        }

        try {
            // Usa o KM obtido (não mexe no KM real do veículo devido a trava enviada no backend, apenas registra histórico)
            await api.post(`/pneus/movimentar`, { pneu_id: pneuId, veiculo_id: veiculoMontagem.id, posicao: posicaoAlvo, tipo_evento: 'MONTAGEM', km_veiculo: parseFloat(km) });
            setPopoverAberto(false);
            carregarDados();
        } catch (e) { alert("Erro ao montar."); }
    }

    async function handleMontagemExpressa(e) {
        e.preventDefault();
        if (!kmMontagemGlobal) return alert("Por favor, feche este modal e insira o KM do veículo na tela de Montagem Geral antes de continuar.");
        try {
            // Injeta o KM definido na tela principal
            const payload = { ...formExpresso, veiculo_id: veiculoMontagem.id, posicao: posicaoAlvo, km_montagem: Number(kmMontagemGlobal) };
            await api.post(`/pneus/montagem-expressa`, payload);
            alert("Pneu cadastrado e montado com sucesso!");
            setModalExpresso(false);
            setPopoverAberto(false);
            carregarDados();
        } catch (e) { alert("Erro na montagem expressa: " + (e.response?.data?.detail || e.message)); }
    }

    async function abrirHistorico(pneuId) {
        try {
            const res = await api.get(`/pneus/${pneuId}/historico`);
            setHistoricoData(res.data);
            setModalHistorico(true);
        } catch (e) { alert("Erro ao buscar histórico"); }
    }

    function abrirModalEdicao(pneu) {
        setPneuEditando({
            ...pneu, medida: pneu.medida || '', sulco_novo: pneu.sulco_novo || 0,
            sulco_atual: pneu.sulco_atual || 0, vida_util_km: pneu.vida_util_km || ''
        });
        setModalEdicao(true);
    }

    async function salvarEdicao(e) {
        e.preventDefault();
        try {
            const payload = {
                fogo: pneuEditando.fogo || null, dot: pneuEditando.dot || null, marca: pneuEditando.marca || null,
                medida: pneuEditando.medida || null, sulco_novo: Number(pneuEditando.sulco_novo),
                sulco_atual: Number(pneuEditando.sulco_atual), status: pneuEditando.status,
                vida_util_km: pneuEditando.vida_util_km ? Number(pneuEditando.vida_util_km) : null
            };
            await api.put(`/pneus/${pneuEditando.id}/dados`, payload);
            alert("Pneu atualizado com sucesso!");
            setModalEdicao(false);
            carregarDados();
        } catch (error) { alert("Erro ao salvar: " + (error.response?.data?.detail || error.message)); }
    }

    async function excluirPneu(id) {
        if (!window.confirm("ATENÇÃO: Deseja excluir este pneu permanentemente do sistema?")) return;
        try {
            await api.delete(`/pneus/${id}`);
            alert("Pneu excluído.");
            carregarDados();
        } catch (e) { alert("Erro ao excluir: " + (e.response?.data?.detail || e.message)); }
    }

    // --- COMPONENTES VISUAIS ---
    const getSigla = (pos) => ({ 'DIANT_ESQ': 'DE', 'DIANT_DIR': 'DD', 'TRAC_ESQ_EXT': 'TE', 'TRAC_DIR_EXT': 'TD', 'ESTEPE_1': 'ST1', 'ESTEPE_2': 'ST2' }[pos] || pos);

    const RenderPosicao = ({ posicao, label, veiculoReferencia }) => {
        const pneu = veiculoReferencia?.pneusMontados?.find(p => p.posicao === posicao);
        return (
            <div
                onClick={() => {
                    if (!pneu && veiculoReferencia) {
                        setVeiculoMontagem(veiculoReferencia);
                        setPosicaoAlvo(posicao);
                        setBuscaPopover('');
                        setPopoverAberto(true);
                    } else if (pneu && can('pneus.gerenciar')) {
                        // PASSO 5: Clicar no pneu montado abre a edição mantendo a opção do 'X' funcional
                        abrirModalEdicao(pneu);
                    }
                }}
                style={{
                    position: 'relative', width: 60, height: 80, border: '2px dashed #4a5568', borderRadius: 8,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 5,
                    background: pneu ? 'rgba(0, 214, 143, 0.2)' : 'rgba(0,0,0,0.2)', borderColor: pneu ? '#00d68f' : '#4a5568',
                    cursor: (!pneu && veiculoReferencia) ? 'pointer' : 'default', transition: '0.2s'
                }}
                title={pneu ? `Montado: ${pneu.dot || pneu.fogo}` : "Clique para montar pneu nesta posição"}
            >
                {pneu && can('pneus.movimentar') && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDesmontar(pneu); }}
                        title="Desmontar Pneu"
                        style={{ position: 'absolute', top: -8, right: -8, background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                        <X size={14} />
                    </button>
                )}

                {pneu ? (
                    <>
                        <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-all', padding: '0 2px' }}>
                            {pneu.dot || pneu.fogo}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: '#00d68f', marginTop: 2 }}>{pneu.medida}</span>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 'bold' }}>{getSigla(posicao)}</span>
                        <span style={{ fontSize: '0.5rem', color: '#718096', marginTop: 2 }}>Vazio</span>
                    </>
                )}
            </div>
        );
    };

    const CardDashboard = ({ titulo, valor, cor, statusFiltro }) => (
        <div onClick={() => { setModalListaStatus(statusFiltro); setBuscaModalStatus(''); }} style={{ background: '#2d3748', padding: 15, borderRadius: 8, flex: 1, borderLeft: `4px solid ${cor}`, cursor: 'pointer', transition: '0.2s' }}>
            <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{titulo}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{valor}</div>
        </div>
    );

    const getTituloStatus = (status) => {
        switch (status) {
            case 'EM_USO': return 'Em Uso (Montados)';
            case 'ESTOQUE': return 'Em Estoque (Disponíveis)';
            case 'MANUTENCAO': return 'Em Manutenção';
            case 'SUCATA': return 'Sucata / Descartados';
            default: return status;
        }
    };

    // Função auxiliar para preencher os dados automáticos ao abrir a Montagem Expressa
    const abrirMontagemExpressa = (tipo) => {
        const vidaUtil = tipo === 'NOVO' ? 40000 : 15000;
        const hoje = new Date().toISOString().split('T')[0]; // Pega a data de hoje no formato YYYY-MM-DD

        setFormExpresso({
            data_montagem: hoje, // Data já preenchida
            dot: '',
            fogo: '',
            medida: '',
            marca: '',
            sulco_novo: '',
            condicao: tipo === 'NOVO' ? 'ORIGINAL' : 'USADO',
            vida_util_km: vidaUtil,
            km_montagem: veiculoMontagem?.km_atual || '' // KM já preenchido
        });
        setModalExpresso(true);
    };

    // --- LÓGICA NOVA: Juntar medidas oficiais com medidas já existentes nos pneus (sem repetir) ---
    const medidasDisponiveis = [...new Set([
        ...medidas.map(m => m.nome),
        ...pneus.map(p => p.medida).filter(m => m && m.trim() !== '')
    ])].sort();

    return (
        <div style={{ paddingTop: 10 }}>
            {/* CARDS */}
            <div style={{ display: 'flex', gap: 15, marginBottom: 25 }}>
                <CardDashboard titulo="Em Uso (Montados)" valor={resumo.em_uso} cor="#00d68f" statusFiltro="EM_USO" />
                <CardDashboard titulo="Em Estoque" valor={resumo.estoque} cor="#3182ce" statusFiltro="ESTOQUE" />
                <CardDashboard titulo="Em Manutenção" valor={resumo.manutencao} cor="#ecc94b" statusFiltro="MANUTENCAO" />
                <CardDashboard titulo="Sucata / Descartados" valor={resumo.sucata} cor="#e53e3e" statusFiltro="SUCATA" />
                <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, flex: 1, borderLeft: `4px solid #805ad5` }}>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>CPK Médio</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>R$ {resumo.cpk_medio?.toFixed(2).replace('.', ',') || '0,00'}</div>
                </div>
            </div>

            {/* AÇÕES E BUSCA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 15 }}>
                <div style={{ display: 'flex', gap: 15, flex: 1, minWidth: '300px' }}>
                    <div style={{ background: '#2d3748', padding: '8px 15px', borderRadius: 5, display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                        <input placeholder="Buscar veículo (Placa/Modelo)..." value={buscaVeiculo} onChange={e => setBuscaVeiculo(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    <select
                        value={filtroStatusVeiculo}
                        onChange={e => setFiltroStatusVeiculo(e.target.value)}
                        style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '0 15px', borderRadius: 5, outline: 'none' }}
                    >
                        <option value="">Todos os Status</option>
                        <option value="vermelho">Crítico (Vida Útil Vencida)</option>
                        <option value="amarelo">Atenção (Próximo de Vencer)</option>
                        <option value="verde">OK (Pneus em Dia)</option>
                        <option value="vazio">Sem Pneus Montados</option>
                    </select>
                </div>
                {can('pneus.movimentar') && (
                    <button onClick={() => { setVeiculoMontagem(null); setModalMontagem(true); }} className="btn-add" style={{ background: '#00d68f', color: 'black', fontWeight: 'bold' }}>
                        <Truck size={18} style={{ marginRight: 5 }} /> Nova Montagem
                    </button>
                )}
            </div>

            {/* TABELA DE VEÍCULOS */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Veículo (Placa - Modelo)</th>
                            <th>Status dos Pneus</th>
                        </tr>
                    </thead>
                    <tbody>
                        {veiculosFiltrados.map(v => (
                            <React.Fragment key={v.id}>
                                <tr onClick={() => setExpandedVeiculo(expandedVeiculo === v.id ? null : v.id)} style={{ cursor: 'pointer', background: expandedVeiculo === v.id ? '#2d3748' : 'transparent' }}>
                                    <td style={{ fontWeight: 'bold', color: 'white' }}>{v.placa} - {v.modelo}</td>
                                    <td>
                                        {v.statusFarol === 'vazio' && <span style={{ color: '#a0aec0' }}>Sem pneus montados</span>}
                                        {v.statusFarol === 'verde' && <span style={{ color: '#00d68f', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={14} /> Todos os {v.pneusMontados.length} pneus OK</span>}
                                        {v.statusFarol === 'amarelo' && <span style={{ color: '#ecc94b', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={14} /> {v.contagens.amarelo} pneu(s) próximo(s) do vencimento</span>}
                                        {v.statusFarol === 'vermelho' && <span style={{ color: '#e53e3e', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={14} /> {v.contagens.vermelho} pneu(s) com vida útil vencida!</span>}
                                    </td>
                                </tr>

                                {/* LINHA EXPANDIDA: VISUAL E LISTAGEM */}
                                {expandedVeiculo === v.id && (
                                    <tr>
                                        <td colSpan="2" style={{ background: '#1a202c', padding: 20 }}>
                                            <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>

                                                {/* DESENHO DO CARRO */}
                                                <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, minWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: 15 }}>Clique no espaço vazio para montar</div>

                                                    {/* Wrapper relativo para segurar o SVG e os eixos no lugar certo */}
                                                    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10 }}>
                                                        {/* Eixo Dianteiro */}
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 120, width: '100%', position: 'relative', zIndex: 2 }}>
                                                            <RenderPosicao posicao="DIANT_ESQ" label="Diant. Esq" veiculoReferencia={v} />
                                                            <RenderPosicao posicao="DIANT_DIR" label="Diant. Dir" veiculoReferencia={v} />
                                                        </div>

                                                        {/* SVG do Carro Realista */}
                                                        <SvgCarro />

                                                        {/* Eixo Traseiro */}
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 120, width: '100%', marginTop: 30, position: 'relative', zIndex: 2 }}>
                                                            <RenderPosicao posicao="TRAC_ESQ_EXT" label="Tras. Esq" veiculoReferencia={v} />
                                                            <RenderPosicao posicao="TRAC_DIR_EXT" label="Tras. Dir" veiculoReferencia={v} />
                                                        </div>
                                                    </div>

                                                    {/* Estepes */}
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 20, width: '100%', marginTop: 40, paddingTop: 20, borderTop: '2px dashed #4a5568' }}>
                                                        <RenderPosicao posicao="ESTEPE_1" label="Estepe 1" veiculoReferencia={v} />
                                                        <RenderPosicao posicao="ESTEPE_2" label="Estepe 2" veiculoReferencia={v} />
                                                    </div>
                                                </div>

                                                {/* LISTA DE PNEUS INSTALADOS */}
                                                <div style={{ flex: 1, minWidth: 400 }}>
                                                    <h4 style={{ color: '#a0aec0', marginTop: 0 }}>Pneus Montados Detalhados ({v.pneusMontados.length})</h4>
                                                    {v.pneusMontados.length === 0 ? <p style={{ color: '#718096' }}>Nenhum pneu montado neste veículo.</p> : (
                                                        <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                                            <thead>
                                                                <tr style={{ color: '#a0aec0', textAlign: 'left', borderBottom: '1px solid #4a5568' }}>
                                                                    <th style={{ paddingBottom: 8 }}>Posição</th><th style={{ paddingBottom: 8 }}>DOT/Fogo</th><th style={{ paddingBottom: 8 }}>Marca/Medida</th><th style={{ paddingBottom: 8 }}>Km Faltante</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {v.pneusMontados.map(p => {
                                                                    const statusCalc = calcularStatusPneu(p, v.km_atual);
                                                                    return (
                                                                        <tr key={p.id} style={{ borderBottom: '1px solid #2d3748' }}>
                                                                            <td style={{ padding: '8px 0' }}>{p.posicao}</td>
                                                                            <td style={{ fontWeight: 'bold' }}>{p.dot || p.fogo}</td>
                                                                            <td>{p.marca} {p.medida}</td>
                                                                            <td style={{ color: statusCalc.cor, fontWeight: 'bold' }}>
                                                                                {statusCalc.kmFaltante ? `${statusCalc.kmFaltante.toLocaleString()} km` : statusCalc.msg}
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL NOVA MONTAGEM (Geral) */}
            {modalMontagem && (
                <div className="modal-overlay" style={{ zIndex: 1000, overflowY: 'auto' }}>
                    <div className="modal-content" style={{ width: '800px', minHeight: '500px', background: '#1a202c', overflow: 'visible' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3>Nova Montagem Geral</h3>
                            <button onClick={() => setModalMontagem(false)} className="btn-close-modal"><X /></button>
                        </div>

                        <div style={{ position: 'relative', zIndex: 9999 }}>
                            <Select
                                styles={customSelectStyles}
                                /* CORREÇÃO DO Z-INDEX DO SELECT: Removido o menuPortalTarget para não dar conflito de camadas */
                                options={veiculosProcessados.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))}
                                onChange={sel => setVeiculoMontagem(veiculosProcessados.find(v => v.id === sel?.value))}
                                placeholder="Selecione o Veículo primeiro..."
                            />
                        </div>

                        {veiculoMontagem && (
                            <div style={{ marginTop: 20, padding: 30, background: '#2d3748', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

                                {/* PASSO 2: Inserir a kilometragem global da montagem */}
                                <div style={{ marginBottom: 20, width: '100%', textAlign: 'center', background: '#1a202c', padding: '15px', borderRadius: '8px', border: '1px solid #4a5568' }}>
                                    <label style={{ color: '#00d68f', fontWeight: 'bold', display: 'block', marginBottom: 5 }}>KM do Veículo no Momento da Montagem (Histórico)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 150000"
                                        value={kmMontagemGlobal}
                                        onChange={e => setKmMontagemGlobal(e.target.value)}
                                        style={{ width: '200px', padding: '10px', textAlign: 'center', borderRadius: '5px', border: '1px solid #00d68f', background: '#2d3748', color: 'white', fontSize: '1.1rem' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: 5 }}>Este KM será usado apenas para o rastreio da vida do pneu (não atualiza o KM do painel do veículo).</p>
                                </div>

                                <p style={{ color: '#a0aec0', marginBottom: 20, fontSize: '1.1rem' }}>Clique em um espaço vazio para montar ou no pneu para editar:</p>

                                {/* Wrapper relativo para segurar o SVG e os eixos no lugar certo */}
                                <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10 }}>
                                    {/* Eixo Dianteiro */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 120, width: '100%', position: 'relative', zIndex: 2 }}>
                                        <RenderPosicao posicao="DIANT_ESQ" label="Diant. Esq" veiculoReferencia={veiculoMontagem} />
                                        <RenderPosicao posicao="DIANT_DIR" label="Diant. Dir" veiculoReferencia={veiculoMontagem} />
                                    </div>

                                    {/* SVG do Carro Realista */}
                                    <SvgCarro />

                                    {/* Eixo Traseiro */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 120, width: '100%', marginTop: 30, position: 'relative', zIndex: 2 }}>
                                        <RenderPosicao posicao="TRAC_ESQ_EXT" label="Tras. Esq" veiculoReferencia={veiculoMontagem} />
                                        <RenderPosicao posicao="TRAC_DIR_EXT" label="Tras. Dir" veiculoReferencia={veiculoMontagem} />
                                    </div>
                                </div>

                                {/* Estepes */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, width: '100%', marginTop: 40, paddingTop: 20, borderTop: '2px dashed #4a5568' }}>
                                    <RenderPosicao posicao="ESTEPE_1" label="Estepe 1" veiculoReferencia={veiculoMontagem} />
                                    <RenderPosicao posicao="ESTEPE_2" label="Estepe 2" veiculoReferencia={veiculoMontagem} />
                                </div>

                                {/* Botão Estético para Finalizar */}
                                <div style={{ width: '100%', marginTop: 30, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #4a5568', paddingTop: 20 }}>
                                    <button onClick={() => { setModalMontagem(false); setKmMontagemGlobal(''); }} className="btn-add" style={{ background: '#3182ce', color: 'white' }}>
                                        Finalizar Montagem Geral
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* POPOVER SELEÇÃO/CADASTRO */}
            {popoverAberto && (
                <div className="modal-overlay" style={{ zIndex: 2100 }}>
                    <div className="modal-content" style={{ width: '450px', background: '#1a202c' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <h3>Montar em {posicaoAlvo} <br /><span style={{ fontSize: '0.8rem', color: '#00d68f' }}>{veiculoMontagem?.placa}</span></h3>
                            <button onClick={() => setPopoverAberto(false)} className="btn-close-modal"><X /></button>
                        </div>

                        <div style={{ background: '#2d3748', padding: '8px', borderRadius: 5, display: 'flex', alignItems: 'center', border: '1px solid #4a5568', marginBottom: 10 }}>
                            <Search size={16} color="#a0aec0" style={{ marginRight: 5 }} />
                            <input placeholder="Buscar no Estoque (DOT, Medida)..." autoFocus value={buscaPopover} onChange={e => setBuscaPopover(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                        </div>

                        <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 15 }}>
                            {pneus.filter(p => p.status === 'ESTOQUE' && ((p.dot || '').includes(buscaPopover) || (p.fogo || '').includes(buscaPopover) || (p.medida || '').includes(buscaPopover))).map(p => (
                                <div key={p.id} onClick={() => handleMontarEstoque(p.id)} style={{ padding: 15, background: '#2d3748', marginBottom: 5, borderRadius: 5, cursor: 'pointer', border: '1px solid #4a5568', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#00d68f'} onMouseOut={e => e.currentTarget.style.borderColor = '#4a5568'}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#00d68f', fontSize: '1.1rem' }}>{p.dot || p.fogo}</strong>
                                        <span style={{ color: '#a0aec0' }}>{p.marca} {p.medida}</span>
                                    </div>
                                </div>
                            ))}
                            {pneus.filter(p => p.status === 'ESTOQUE').length === 0 && <p style={{ color: '#718096', textAlign: 'center' }}>Nenhum pneu disponível no estoque.</p>}
                        </div>

                        <div style={{ borderTop: '1px solid #4a5568', paddingTop: 15, display: 'flex', gap: 10 }}>
                            <button onClick={() => abrirMontagemExpressa('NOVO')} className="btn-add" style={{ flex: 1, background: '#3182ce', fontSize: '0.8rem' }}>+ Pneu NOVO</button>
                            <button onClick={() => abrirMontagemExpressa('USADO')} className="btn-add" style={{ flex: 1, background: '#ecc94b', color: 'black', fontSize: '0.8rem' }}>+ Pneu USADO</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EXPRESSO */}
            {modalExpresso && (
                <div className="modal-overlay" style={{ zIndex: 2200 }}>
                    <div className="modal-content" style={{ width: '500px' }}>
                        <h3>Cadastrar e Montar Pneu {formExpresso.condicao}</h3>
                        <form onSubmit={handleMontagemExpressa} style={{ display: 'grid', gap: 10, marginTop: 15 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                                <div><label>Data da Montagem*</label><input type="date" required value={formExpresso.data_montagem} onChange={e => setFormExpresso({ ...formExpresso, data_montagem: e.target.value })} style={inputStyle} /></div>
                                {/* PASSO 3.2: KM da montagem e Atual já estão no passo 2 e não precisam poluir aqui */}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>DOT*</label><input required value={formExpresso.dot} onChange={e => setFormExpresso({ ...formExpresso, dot: e.target.value })} style={inputStyle} /></div>
                                <div><label>Fogo (Opcional)</label><input value={formExpresso.fogo} onChange={e => setFormExpresso({ ...formExpresso, fogo: e.target.value })} style={inputStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Marca (Opcional)</label><input value={formExpresso.marca} onChange={e => setFormExpresso({ ...formExpresso, marca: e.target.value })} style={inputStyle} /></div>
                                <div style={{ position: 'relative', zIndex: 100 }}>
                                    <label>Medida*</label>
                                    <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                                        <div style={{ flex: 1 }}>
                                            <Select
                                                styles={customSelectStyles}
                                                placeholder="Selecione..."
                                                options={[{ value: 'NOVA', label: '+ Nova medida' }, ...medidasDisponiveis.map(m => ({ value: m, label: m }))]}
                                                value={formExpresso.medida ? { value: formExpresso.medida, label: formExpresso.medida } : null}
                                                onChange={async (sel) => {
                                                    if (sel?.value === 'NOVA') {
                                                        const nome = prompt("Digite a nova medida:");
                                                        if (nome) {
                                                            const criada = await handleNovaMedida(nome);
                                                            if (criada) setFormExpresso({ ...formExpresso, medida: criada.nome });
                                                        }
                                                    } else {
                                                        setFormExpresso({ ...formExpresso, medida: sel?.value || '' });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button type="button" onClick={() => setModalMedidas(true)} title="Gerenciar Medidas" style={{ background: '#2d3748', border: '1px solid #4a5568', color: '#a0aec0', borderRadius: 4, padding: '0 10px', cursor: 'pointer' }}><Settings size={18} /></button>
                                    </div>
                                </div>
                            </div>
                            <div><label>Sulco Novo (mm) (Opcional)</label><input type="number" value={formExpresso.sulco_novo} onChange={e => setFormExpresso({ ...formExpresso, sulco_novo: e.target.value })} style={inputStyle} /></div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 5, fontSize: '0.85rem', color: '#a0aec0' }}>
                                A vida útil esperada configurada para este pneu será de <strong>{formExpresso.vida_util_km.toLocaleString()} km</strong>.
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <button type="submit" className="btn-add" style={{ flex: 1, background: '#00d68f', color: 'black' }}><Save size={16} /> Salvar e Montar</button>
                                <button type="button" onClick={() => setModalExpresso(false)} className="btn-close-modal" style={{ flex: 1, position: 'static' }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE LISTA DOS STATUS */}
            {modalListaStatus && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, borderBottom: '1px solid #4a5568', paddingBottom: 10 }}>
                            <h3 style={{ margin: 0, color: '#00d68f' }}>{getTituloStatus(modalListaStatus)}</h3>
                            <button onClick={() => setModalListaStatus(null)} className="btn-close-modal"><X /></button>
                        </div>

                        <div style={{ marginBottom: 15 }}>
                            <input
                                placeholder={`Pesquisar pneus em ${getTituloStatus(modalListaStatus)}...`}
                                value={buscaModalStatus}
                                onChange={e => setBuscaModalStatus(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#2d3748', color: '#00d68f' }}>
                                        <th style={{ textAlign: 'left', padding: 10 }}>Identificação</th>
                                        <th style={{ textAlign: 'left', padding: 10 }}>Marca/Medida</th>
                                        <th style={{ textAlign: 'center', padding: 10 }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pneus.filter(p =>
                                        p.status === modalListaStatus && (
                                            (p.dot || '').toLowerCase().includes(buscaModalStatus.toLowerCase()) ||
                                            (p.fogo || '').toLowerCase().includes(buscaModalStatus.toLowerCase()) ||
                                            (p.marca || '').toLowerCase().includes(buscaModalStatus.toLowerCase()) ||
                                            (p.medida || '').toLowerCase().includes(buscaModalStatus.toLowerCase())
                                        )
                                    ).map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #4a5568' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                                DOT: {p.dot || '-'} <br />
                                                <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 'normal' }}>Fogo: {p.fogo || '-'}</span>
                                            </td>
                                            <td style={{ padding: '10px' }}>{p.marca} <br /><span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>{p.medida}</span></td>
                                            <td style={{ textAlign: 'center', padding: '10px' }}>
                                                <button onClick={() => abrirHistorico(p.id)} title="Ver Histórico" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer', marginRight: 15 }}><FileText size={18} /></button>
                                                {can('pneus.gerenciar') && (
                                                    <button onClick={() => abrirModalEdicao(p)} title="Editar Dados" style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer', marginRight: 15 }}><Edit size={18} /></button>
                                                )}
                                                {can('pneus.gerenciar') && (
                                                    <button onClick={() => excluirPneu(p.id)} title="Excluir Pneu" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {pneus.filter(p => p.status === modalListaStatus).length === 0 && (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhum pneu nesta categoria.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIÇÃO DE DADOS DO PNEU */}
            {modalEdicao && (
                <div className="modal-overlay" style={{ zIndex: 2300 }}>
                    <div className="modal-content" style={{ width: '550px' }}> {/* <--- LARGURA AUMENTADA AQUI */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <h3>Editar Pneu</h3>
                            <button onClick={() => setModalEdicao(false)} className="btn-close-modal"><X /></button>
                        </div>
                        <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label>DOT</label><input value={pneuEditando.dot || ''} onChange={e => setPneuEditando({ ...pneuEditando, dot: e.target.value })} style={inputStyle} />
                            <label>Fogo</label><input value={pneuEditando.fogo || ''} onChange={e => setPneuEditando({ ...pneuEditando, fogo: e.target.value })} style={inputStyle} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Marca</label><input value={pneuEditando.marca || ''} onChange={e => setPneuEditando({ ...pneuEditando, marca: e.target.value })} style={inputStyle} /></div>
                                <div style={{ position: 'relative', zIndex: 100 }}>
                                    <label>Medida</label>
                                    <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                                        <div style={{ flex: 1 }}>
                                            <Select
                                                styles={customSelectStyles}
                                                options={[{ value: 'NOVA', label: '+ Nova medida' }, ...medidasDisponiveis.map(m => ({ value: m, label: m }))]}
                                                value={pneuEditando.medida ? { value: pneuEditando.medida, label: pneuEditando.medida } : null}
                                                onChange={async (sel) => {
                                                    if (sel?.value === 'NOVA') {
                                                        const nome = prompt("Digite a nova medida:");
                                                        if (nome) {
                                                            const criada = await handleNovaMedida(nome);
                                                            if (criada) setPneuEditando({ ...pneuEditando, medida: criada.nome });
                                                        }
                                                    } else {
                                                        setPneuEditando({ ...pneuEditando, medida: sel?.value || '' });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button type="button" onClick={() => setModalMedidas(true)} title="Gerenciar Medidas" style={{ background: '#2d3748', border: '1px solid #4a5568', color: '#a0aec0', borderRadius: 4, padding: '0 10px', cursor: 'pointer' }}><Settings size={18} /></button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Sulco Novo</label><input type="number" step="0.1" value={pneuEditando.sulco_novo} onChange={e => setPneuEditando({ ...pneuEditando, sulco_novo: e.target.value })} style={inputStyle} /></div>
                                <div><label>Sulco Atual</label><input type="number" step="0.1" value={pneuEditando.sulco_atual} onChange={e => setPneuEditando({ ...pneuEditando, sulco_atual: e.target.value })} style={inputStyle} /></div>
                            </div>

                            <div style={{ background: '#2d3748', padding: 10, borderRadius: 5, border: '1px solid #4a5568' }}>
                                <label style={{ color: '#00d68f', fontWeight: 'bold' }}>Vida Útil Esperada (Km)</label>
                                <input type="number" value={pneuEditando.vida_util_km || ''} placeholder="Ex: 40000" onChange={e => setPneuEditando({ ...pneuEditando, vida_util_km: e.target.value })} style={inputStyle} />
                                <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Preencha este campo para habilitar o status Verde/Amarelo/Vermelho na tabela.</span>
                            </div>

                            <label>Status Físico</label>
                            <select value={pneuEditando.status} onChange={e => setPneuEditando({ ...pneuEditando, status: e.target.value })} style={inputStyle}>
                                <option value="ESTOQUE">Estoque</option>
                                <option value="EM_USO">Em Uso</option>
                                <option value="MANUTENCAO">Manutenção</option>
                                <option value="SUCATA">Sucata</option>
                            </select>
                            <button type="submit" className="btn-add" style={{ marginTop: 15, background: '#ecc94b', color: 'black' }}><Save size={16} /> Salvar Alterações</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HISTÓRICO */}
            {modalHistorico && (
                <div className="modal-overlay" onClick={() => setModalHistorico(false)} style={{ zIndex: 2500 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxHeight: '70vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}><h3>Histórico do Pneu</h3><button onClick={() => setModalHistorico(false)} className="btn-close-modal"><X /></button></div>
                        {historicoData.length === 0 ? <p style={{ color: '#a0aec0' }}>Nenhum histórico encontrado.</p> : (
                            <ul style={{ padding: 0, listStyle: 'none' }}>
                                {historicoData.map((h, i) => (
                                    <li key={i} style={{ background: '#2d3748', padding: 15, marginBottom: 10, borderRadius: 5, borderLeft: '4px solid #63b3ed' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <strong style={{ color: 'white' }}>{h.tipo}</strong>
                                            <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{new Date(h.data).toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Veículo: {h.veiculo || '-'} | Km do veículo: {h.km_veiculo || '-'} | Sulco: {h.sulco || '-'}mm</div>
                                        {h.observacao && <div style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic', marginTop: 5 }}>"{h.observacao}"</div>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            {/* MODAL GERENCIAR MEDIDAS */}
            {modalMedidas && (
                <div className="modal-overlay" style={{ zIndex: 3000 }}>
                    <div className="modal-content" style={{ width: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <h3>Gerenciar Medidas</h3>
                            <button onClick={() => setModalMedidas(false)} className="btn-close-modal"><X /></button>
                        </div>

                        <form onSubmit={handleSalvarMedida} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <input required value={medidaForm.nome} onChange={e => setMedidaForm({ ...medidaForm, nome: e.target.value })} placeholder="Nome da Medida..." style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                            <button type="submit" className="btn-add">{medidaForm.id ? 'Salvar' : 'Adicionar'}</button>
                            {medidaForm.id && <button type="button" onClick={() => setMedidaForm({ id: null, nome: '' })} className="btn-close-modal" style={{ position: 'static' }}>Cancelar</button>}
                        </form>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {medidas.map(m => (
                                        <tr key={m.id} style={{ borderBottom: '1px solid #4a5568' }}>
                                            <td style={{ padding: '10px 0' }}>{m.nome}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => setMedidaForm(m)} style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer', marginRight: 15 }}><Edit size={16} /></button>
                                                <button onClick={() => handleExcluirMedida(m.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {medidas.length === 0 && <tr><td colSpan="2" style={{ color: '#a0aec0', padding: 10 }}>Nenhuma medida cadastrada.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
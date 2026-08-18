// Arquivo: frontend/src/pages/veiculos/TabPneus.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    Truck, Disc, Activity, PenTool, Search, Wrench, Layers,
    ArrowDownCircle, X, Save, FileText, Calendar, User, Plus, Package, ArrowUpCircle, Edit, Trash2
} from 'lucide-react';
import Select from 'react-select';

// Estilos padronizados para o React-Select
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#444',
        color: 'white',
        minHeight: '38px',
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none',
        '&:hover': { borderColor: '#00d68f' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#00d68f' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#4a5568' }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#e53e3e' } })
};

export default function TabPneus() {
    const { can } = useAuth();
    const [pneus, setPneus] = useState([]);
    const [veiculos, setVeiculos] = useState([]);

    // Modais
    const [modalMontagem, setModalMontagem] = useState(false);
    const [modalSelecaoPneu, setModalSelecaoPneu] = useState(false);
    const [modalEdicao, setModalEdicao] = useState(false);

    // --- NOVO: ESTADOS PARA O HISTÓRICO ---
    const [modalHistorico, setModalHistorico] = useState(false);
    const [historicoData, setHistoricoData] = useState([]);
    const [pneuFocado, setPneuFocado] = useState(null); // Pneu sendo visualizado

    const [pneuEditando, setPneuEditando] = useState({});

    // Seleções
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [posicaoAlvo, setPosicaoAlvo] = useState(null);

    // --- NOVO: ESTADOS DE BUSCA E FILTROS ---
    const [busca, setBusca] = useState('');
    const [buscaModal, setBuscaModal] = useState('');
    const [filtroStatus, setFiltroStatus] = useState([]);
    const [filtroMarca, setFiltroMarca] = useState([]);
    const [filtroMedida, setFiltroMedida] = useState([]);

    const [resumo, setResumo] = useState({ estoque: 0, rodando: 0, manutencao: 0, cpk_medio: 0 });

    // --- NOVOS ESTADOS PARA INCLUSÃO DE PNEUS ---
    const [modelosPneu, setModelosPneu] = useState([]); // Lista para o Select de Entrada
    const [proximoCodigo, setProximoCodigo] = useState('1001');
    const [modalTipoInclusao, setModalTipoInclusao] = useState(false); // Modal de escolha
    const [modalNovoModelo, setModalNovoModelo] = useState(false);
    const [modalEntrada, setModalEntrada] = useState(false);

    // Formulário para CRIAR MODELO (Ex: 295/80 Michelin X Multi)
    const [formModelo, setFormModelo] = useState({
        codigo_referencia: '', nome: '', categoria: 'PNEUS', unidade_medida: 'UN',
        estoque_minimo: 0, observacoes: '', tipo_controle: 'SERIALIZADO'
    });

    // Formulário para DAR ENTRADA (Físico: DOT 1234, Fogo 100)
    const [formEntrada, setFormEntrada] = useState({
        estoque_item_id: '', quantidade: '', observacao: '',
        numero_nf: '', valor_aquisicao: '',
        serial: '', fogo: '', dot: '', marca: '', medida: '', sulco_novo: ''
    });

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            const [resP, resV, resD, resItens] = await Promise.all([
                api.get('/pneus/'),
                api.get('/veiculos/'),
                api.get('/pneus/dashboard-resumo'),
                api.get('/estoque/itens')
            ]);
            setPneus(resP.data);
            setVeiculos(resV.data);
            setResumo(resD.data);

            // Filtra apenas o que é PNEU para o dropdown de entrada
            const soPneus = resItens.data.filter(i => i.categoria === 'PNEUS' || i.categoria === 'PNEU');
            setModelosPneu(soPneus);

            // --- NOVO: ACHA O MAIOR CÓDIGO DO ESTOQUE PARA EXIBIR A PREVISÃO ---
            let max = 0;
            resItens.data.forEach(i => {
                if (i.codigo_referencia) {
                    const numeros = i.codigo_referencia.match(/\d+/g);
                    if (numeros) {
                        const num = parseInt(numeros[numeros.length - 1], 10);
                        if (num > max) max = num;
                    }
                }
            });
            setProximoCodigo(`ID${String(max + 1).padStart(2, '0')}`);

        } catch (error) {
            console.error("Erro ao carregar dados", error);
        }
    }

    // --- HELPER: SIGLAS DE POSIÇÃO ---
    const getSiglaPosicao = (posicao) => {
        const mapa = {
            'DIANT_ESQ': 'DE',    // Dianteiro Esquerdo
            'DIANT_DIR': 'DD',    // Dianteiro Direito
            'TRAS_ESQ': 'TE',     // Traseiro Esquerdo (Moto)
            'TRAS_DIR': 'TD',     // Traseiro Direito
            'TRAC_ESQ_EXT': 'TE', // Tração Esq Externa
            'TRAC_ESQ_INT': 'TI', // Tração Esq Interna
            'TRAC_DIR_INT': 'TI', // Tração Dir Interna
            'TRAC_DIR_EXT': 'TD', // Tração Dir Externa
            'ESTEPE_1': 'ST1',
            'ESTEPE_2': 'ST2',
            'DIANT': 'DT',        // Dianteiro (Moto)
            'TRAS': 'TR'          // Traseiro (Moto)
        };
        return mapa[posicao] || '?';
    };

    // --- FUNÇÕES DE AÇÃO ---
    async function handleMontarPneu(pneuId) {
        if (!veiculoSelecionado || !posicaoAlvo) return;
        const kmVeiculo = prompt("Qual o KM atual do veículo no momento da montagem?");
        if (!kmVeiculo) return;

        try {
            await api.post(`/pneus/movimentar`, {
                pneu_id: pneuId,
                veiculo_id: veiculoSelecionado.id,
                posicao: posicaoAlvo,
                tipo_evento: 'MONTAGEM',
                km_veiculo: parseFloat(kmVeiculo),
                data_evento: new Date().toISOString()
            });

            alert("Pneu montado com sucesso!");
            setModalSelecaoPneu(false);
            carregarDados();
        } catch (error) {
            alert("Erro ao montar pneu: " + (error.response?.data?.detail || error.message));
        }
    }

    function abrirModalEdicao(pneu) {
        setPneuEditando({
            ...pneu,
            medida: pneu.medida || '',
            sulco_novo: pneu.sulco_novo || 0,
            sulco_atual: pneu.sulco_atual || 0
        });
        setModalEdicao(true);
    }

    async function salvarEdicao(e) {
        e.preventDefault();
        try {
            const payload = {
                fogo: pneuEditando.fogo || null,
                dot: pneuEditando.dot || null,
                marca: pneuEditando.marca || null,
                medida: pneuEditando.medida || null,
                sulco_novo: Number(pneuEditando.sulco_novo),
                sulco_atual: Number(pneuEditando.sulco_atual),
                status: pneuEditando.status
            };
            await api.put(`/pneus/${pneuEditando.id}/dados`, payload);
            alert("Pneu atualizado com sucesso!");
            setModalEdicao(false);
            carregarDados();
        } catch (error) {
            alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
        }
    }

    // --- NOVO: FUNÇÃO PARA ABRIR HISTÓRICO ---
    async function abrirHistorico(pneu) {
        setPneuFocado(pneu);
        setHistoricoData([]); // Limpa anterior
        setModalHistorico(true);
        try {
            const res = await api.get(`/pneus/${pneu.id}/historico`);
            setHistoricoData(res.data);
        } catch (error) {
            alert("Erro ao carregar histórico.");
        }
    }

    // --- RENDERIZADORES ---

    // ATUALIZADO: Mostra Sigla em vez de S/N
    const renderPosicao = (posicao, label) => {
        const pneuAqui = pneus.find(p => p.veiculo_id === veiculoSelecionado?.id && p.posicao === posicao);
        const sigla = getSiglaPosicao(posicao);

        return (
            <div
                onClick={() => { // <--- CORRETO (um 'o')
                    if (pneuAqui) alert(`Pneu ${pneuAqui.fogo || pneuAqui.dot} já está nesta posição.`);
                    else {
                        setPosicaoAlvo(posicao);
                        setBuscaModal(''); // <--- Limpa a busca ao abrir
                        setModalSelecaoPneu(true);
                    }
                }}
                style={{
                    width: 60, height: 80,
                    border: '2px dashed #4a5568', borderRadius: 8,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', margin: 5,
                    background: pneuAqui ? 'rgba(0, 214, 143, 0.2)' : 'rgba(0,0,0,0.2)',
                    borderColor: pneuAqui ? '#00d68f' : '#4a5568',
                    transition: '0.2s'
                }}
                title={pneuAqui ? `Pneu: ${pneuAqui.fogo || pneuAqui.dot}` : "Clique para montar"}
            >
                {pneuAqui ? (
                    <>
                        <Disc size={24} color="#00d68f" />
                        {/* AQUI ESTÁ A MUDANÇA: Se tem fogo mostra fogo, senão mostra a sigla da posição */}
                        <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 'bold' }}>
                            {pneuAqui.fogo ? pneuAqui.fogo : sigla}
                        </span>
                    </>
                ) : (
                    <span style={{ fontSize: '0.6rem', color: '#a0aec0' }}>Vazio</span>
                )}
                <span style={{ fontSize: '0.5rem', color: '#718096', marginTop: 2 }}>{label}</span>
            </div>
        );
    };

    const CardResumo = ({ titulo, valor, cor, icon: Icon }) => (
        <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, flex: 1, display: 'flex', alignItems: 'center', gap: 15, borderLeft: `4px solid ${cor}` }}>
            <div style={{ background: `${cor}20`, padding: 10, borderRadius: '50%', color: cor }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{titulo}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{valor}</div>
            </div>
        </div>
    );

    // Estilo básico para Inputs corrigido (boxSizing impede o campo de vazar do modal)
    const inputStyle = { width: '100%', padding: '8px', background: '#2d3748', border: '1px solid #4a5568', color: 'white', borderRadius: 4, marginTop: '5px', boxSizing: 'border-box' };

    // --- OPÇÕES PARA OS FILTROS ---
    const uniqueStatus = [...new Set(pneus.map(p => p.status).filter(Boolean))].map(s => ({ value: s, label: s.replace('_', ' ') }));
    const uniqueMarcas = [...new Set(pneus.map(p => p.marca).filter(Boolean))].map(m => ({ value: m, label: m }));
    const uniqueMedidas = [...new Set(pneus.map(p => p.medida).filter(Boolean))].map(m => ({ value: m, label: m }));

    // --- LÓGICA MESTRA DE FILTRAGEM ---
    const pneusFiltrados = pneus.filter(p => {
        const termo = busca.toLowerCase();

        // Determina a string de localização para a busca
        let txtLocalizacao = p.localizacao_atual || p.posicao || '';
        if (p.veiculo_id) {
            const v = veiculos.find(veic => veic.id === p.veiculo_id);
            if (v) txtLocalizacao = `${v.placa} - ${v.marca} - ${v.modelo} (${p.posicao || ''})`;
        }

        // Busca por texto (Fogo, DOT, Marca, Status ou Localização)
        const matchBusca =
            (p.fogo || '').toLowerCase().includes(termo) ||
            (p.marca || '').toLowerCase().includes(termo) ||
            (p.dot || '').toLowerCase().includes(termo) ||
            (p.status || '').toLowerCase().includes(termo) ||
            txtLocalizacao.toLowerCase().includes(termo);

        // Filtros Multi-Select
        const matchStatus = filtroStatus.length === 0 || filtroStatus.some(f => f.value === p.status);
        const matchMarca = filtroMarca.length === 0 || filtroMarca.some(f => f.value === p.marca);
        const matchMedida = filtroMedida.length === 0 || filtroMedida.some(f => f.value === p.medida);

        return matchBusca && matchStatus && matchMarca && matchMedida;
    });

    // --- AÇÃO: SALVAR NOVO MODELO ---
    async function handleSalvarModelo(e) {
        e.preventDefault();
        try {
            // Força categoria PNEUS e controle SERIALIZADO
            const payload = { ...formModelo, categoria: 'PNEUS', tipo_controle: 'SERIALIZADO', unidade_medida: 'UN' };
            await api.post('/estoque/itens', payload);
            alert("Modelo de pneu cadastrado com sucesso!");
            setModalNovoModelo(false);
            setModalTipoInclusao(false);
            carregarDados(); // Recarrega a lista de modelos
        } catch (error) {
            alert("Erro ao criar modelo: " + (error.response?.data?.detail || error.message));
        }
    }

    // --- AÇÃO: REALIZAR ENTRADA (ITEM FÍSICO) ---
    async function handleRealizarEntrada(e) {
        e.preventDefault();
        try {
            // Payload padrão de entrada via Estoque
            const payload = {
                ...formEntrada,
                tipo_movimento: 'ENTRADA',
                quantidade: formEntrada.quantidade || 1 // Geralmente 1 por vez ou lote
            };

            await api.post('/estoque/movimentar', payload);
            alert("Entrada realizada com sucesso! Os pneus estão no estoque.");
            setModalEntrada(false);
            setModalTipoInclusao(false);
            carregarDados(); // Recarrega o dashboard e lista de pneus
        } catch (error) {
            alert("Erro na entrada: " + (error.response?.data?.detail || error.message));
        }
    }

    return (
        <div style={{ paddingTop: 10 }}>

            {/* CARDS DE RESUMO */}
            <div style={{ display: 'flex', gap: 15, marginBottom: 25, flexWrap: 'wrap' }}>
                <CardResumo titulo="Pneus em Uso" valor={resumo.em_uso} cor="#00d68f" icon={Truck} />
                <CardResumo titulo="Em Estoque" valor={resumo.estoque} cor="#3182ce" icon={Layers} />
                <CardResumo titulo="Em Manutenção" valor={resumo.manutencao} cor="#ecc94b" icon={Wrench} />
                <CardResumo titulo="CPK Médio" valor={`R$ ${Number(resumo.cpk_medio).toFixed(2)}`} cor="#e53e3e" icon={Activity} />
            </div>

            {/* ÁREA DE FILTROS E BUSCA */}
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <Select styles={customSelectStyles} isMulti options={uniqueStatus} placeholder="Status" onChange={setFiltroStatus} />
                    <Select styles={customSelectStyles} isMulti options={uniqueMarcas} placeholder="Marca" onChange={setFiltroMarca} />
                    <Select styles={customSelectStyles} isMulti options={uniqueMedidas} placeholder="Medida" onChange={setFiltroMedida} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ background: '#2d3748', padding: '8px 15px', borderRadius: 5, display: 'flex', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                        <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                        <input placeholder="Buscar (Fogo, DOT, Marca, Status, Localização)..." value={busca} onChange={e => setBusca(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    {can('pneus.movimentar') && (
                        <button
                            onClick={() => {
                                setVeiculoSelecionado(null); // <--- ZERA O VESTÍGIO AQUI
                                setPosicaoAlvo(null);
                                setModalMontagem(true);
                            }}
                            className="btn-add"
                            style={{ background: '#00d68f', color: 'black', fontWeight: 'bold', height: '40px' }}
                        >
                            <Truck size={18} style={{ marginRight: 5 }} /> Nova Montagem Visual
                        </button>
                    )}

                    {can('pneus.gerenciar') && (
                        <button
                            onClick={() => setModalTipoInclusao(true)}
                            className="btn-add"
                            style={{ background: '#48bb78', color: 'white', fontWeight: 'bold', height: '40px', marginRight: 10 }}
                        >
                            <Plus size={18} style={{ marginRight: 5 }} /> Adicionar Pneu
                        </button>
                    )}
                </div>
            </div>

            {/* LISTA GERAL */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>DOT / Fogo</th>
                            <th>Marca/Medida</th>
                            <th>Status</th>
                            <th>Localização</th>
                            <th>KM Rodado</th>
                            <th>Vida Útil</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pneusFiltrados.map(p => {
                            // --- NOVO: LÓGICA DE LOCALIZAÇÃO E KM RODADO ---
                            let txtLocalizacao = p.localizacao_atual || p.posicao || '-';
                            let kmRodado = '-';

                            if (p.veiculo_id) {
                                const v = veiculos.find(veic => veic.id === p.veiculo_id);
                                if (v) {
                                    txtLocalizacao = `${v.placa} - ${v.marca} - ${v.modelo} (${p.posicao || '-'})`;
                                    if (p.km_montagem != null) {
                                        kmRodado = `${v.km_atual - p.km_montagem} km`;
                                    }
                                }
                            }

                            return (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 'bold', color: '#00d68f' }}>
                                        {p.dot ? p.dot : (p.fogo || 'S/N')}
                                        {p.dot && p.fogo && <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 'normal' }}>Fogo: {p.fogo}</div>}
                                    </td>
                                    <td>{p.marca} <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{p.medida}</span></td>
                                    <td><span className={`tag ${p.status}`}>{p.status?.replace('_', ' ')}</span></td>
                                    <td>{txtLocalizacao}</td>
                                    <td style={{ fontWeight: 'bold', color: '#63b3ed' }}>{kmRodado}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 60, height: 6, background: '#4a5568', borderRadius: 3 }}>
                                                <div style={{ width: `${(p.sulco_atual / p.sulco_novo) * 100}%`, height: '100%', background: p.sulco_atual < 3 ? '#e53e3e' : '#00d68f' }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }}>{p.sulco_atual}mm</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button onClick={() => abrirHistorico(p)} title="Ver Histórico e Detalhes" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}>
                                                <FileText size={16} />
                                            </button>
                                            {can('pneus.gerenciar') && ( // Usei gerenciar (já existe) para edição
                                                <button onClick={() => abrirModalEntrada(p)} title="Editar/Nova Entrada">
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                            {can('pneus.excluir') && ( // NOVA PERMISSÃO AQUI
                                                <button onClick={() => excluirPneu(p.id)} title="Excluir do Sistema">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL HISTÓRICO (NOVO) */}
            {modalHistorico && pneuFocado && (
                <div className="modal-overlay" onClick={() => setModalHistorico(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', padding: 20 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a202c', width: '700px', maxHeight: '80vh', borderRadius: 8, padding: 25, display: 'flex', flexDirection: 'column' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: 15, marginBottom: 15 }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#00d68f' }}>{pneuFocado.marca} - {pneuFocado.medida}</h3>
                                <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>DOT: {pneuFocado.dot || '-'} | Fogo: {pneuFocado.fogo || '-'}</span>
                            </div>
                            <button onClick={() => setModalHistorico(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 5 }}>
                            <h4 style={{ color: 'white', marginTop: 0 }}>Linha do Tempo</h4>
                            {historicoData.length === 0 ? (
                                <p style={{ color: '#718096', textAlign: 'center' }}>Nenhum histórico registrado.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                    {historicoData.map((h) => (
                                        <div key={h.id} style={{ display: 'flex', gap: 15, position: 'relative' }}>
                                            {/* Linha vertical visual */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: h.tipo === 'MONTAGEM' ? '#00d68f' : (h.tipo === 'DESMONTAGEM' ? '#e53e3e' : '#3182ce'), zIndex: 2 }}></div>
                                                <div style={{ width: 2, flex: 1, background: '#4a5568', marginTop: -2 }}></div>
                                            </div>

                                            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, flex: 1, border: '1px solid #4a5568' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                    <strong style={{ color: 'white' }}>{h.tipo}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        <Calendar size={12} /> {new Date(h.data).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: 5 }}>
                                                    {h.tipo === 'MONTAGEM' && <>Montado no veículo <strong style={{ color: '#63b3ed' }}>{h.veiculo}</strong> (Km: {h.km_veiculo})</>}
                                                    {h.tipo === 'DESMONTAGEM' && <>Removido do veículo <strong style={{ color: '#e53e3e' }}>{h.veiculo}</strong></>}
                                                    {h.tipo === 'COMPRA' && <>Entrada no Estoque (Compra)</>}
                                                    {h.tipo === 'AFERICAO' && <>Aferição de Sulco: {h.sulco}mm</>}
                                                </div>

                                                {h.observacao && <div style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic', borderTop: '1px solid #4a5568', paddingTop: 5, marginTop: 5 }}>"{h.observacao}"</div>}

                                                <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <User size={12} /> Resp: {h.usuario}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MONTAGEM (Visual com Siglas) */}
            {modalMontagem && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
                    <div style={{ background: '#1a202c', width: '900px', padding: 20, borderRadius: 8, height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2><Truck style={{ marginRight: 10 }} /> Montagem Visual</h2>
                            <button onClick={() => setModalMontagem(false)} style={{ color: 'white', background: 'none', border: 'none' }}><ArrowDownCircle /></button>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Buscar e Selecionar Veículo:</label>
                            <Select
                                styles={customSelectStyles}
                                options={veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.marca} - ${v.modelo}` }))}
                                placeholder="Digite a placa ou modelo do veículo..."
                                onChange={selected => {
                                    setVeiculoSelecionado(selected ? veiculos.find(v => v.id === selected.value) : null);
                                    setPosicaoAlvo(null);
                                }}
                                isClearable
                            />
                        </div>

                        {veiculoSelecionado && (
                            <div style={{ background: '#2d3748', padding: 30, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                <h3 style={{ color: '#a0aec0', marginBottom: 30, borderBottom: '1px solid #4a5568', paddingBottom: 10, width: '100%', textAlign: 'center' }}>
                                    {veiculoSelecionado.placa} ({veiculoSelecionado.layout_eixos || '4X2'})
                                </h3>

                                <div style={{ position: 'absolute', right: 20, top: 80, display: 'flex', flexDirection: 'column', gap: 10, border: '1px dashed #718096', padding: 10, borderRadius: 8 }}>
                                    <span style={{ fontSize: '0.7rem', color: '#a0aec0', textAlign: 'center' }}>ESTEPES</span>
                                    {renderPosicao("ESTEPE_1", "Estepe 1")}
                                    {renderPosicao("ESTEPE_2", "Estepe 2")}
                                </div>

                                {veiculoSelecionado.layout_eixos === 'MOTO' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center' }}>
                                        <div style={{ border: '1px solid gray', padding: 10, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>Guidão</div>
                                        {renderPosicao("DIANT", "Dianteiro")}
                                        <div style={{ height: 50, borderLeft: '4px solid #4a5568' }}></div>
                                        {renderPosicao("TRAS", "Traseiro")}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 150, marginBottom: 20 }}>
                                            {renderPosicao("DIANT_ESQ", "Diant. Esq.")}
                                            {renderPosicao("DIANT_DIR", "Diant. Dir.")}
                                        </div>
                                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: 5 }}>
                                                {renderPosicao("TRAC_ESQ_EXT", veiculoSelecionado.layout_eixos === '4X2_LEVE' ? "Tras. Esq." : "3 / Tração Ext.")}
                                                {!['4X2_LEVE', 'MOTO'].includes(veiculoSelecionado.layout_eixos) && renderPosicao("TRAC_ESQ_INT", "4 / Tração Int.")}
                                            </div>
                                            <div style={{ width: 80, borderBottom: '4px solid #4a5568', height: 40 }}></div>
                                            <div style={{ display: 'flex', gap: 5 }}>
                                                {!['4X2_LEVE', 'MOTO'].includes(veiculoSelecionado.layout_eixos) && renderPosicao("TRAC_DIR_INT", "5 / Tração Int.")}
                                                {renderPosicao("TRAC_DIR_EXT", veiculoSelecionado.layout_eixos === '4X2_LEVE' ? "Tras. Dir." : "6 / Tração Ext.")}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL SELEÇÃO DE PNEU COM BUSCA */}
            {modalSelecaoPneu && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: '#1a202c', width: '400px', padding: 20, borderRadius: 8, height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: 15 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <h3>Selecionar Pneu</h3>
                                <button onClick={() => setModalSelecaoPneu(false)} style={{ color: 'white', background: 'none', border: 'none' }}><ArrowDownCircle /></button>
                            </div>
                            {/* CAMPO DE BUSCA NO MODAL */}
                            <div style={{ background: '#2d3748', padding: '8px', borderRadius: 5, display: 'flex', alignItems: 'center', border: '1px solid #4a5568' }}>
                                <Search size={16} color="#a0aec0" style={{ marginRight: 5 }} />
                                <input
                                    placeholder="Filtrar por DOT, Fogo, Marca..."
                                    value={buscaModal}
                                    onChange={e => setBuscaModal(e.target.value)}
                                    autoFocus
                                    style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {pneus.filter(p => {
                                // Filtra apenas pneus em estoque OU novos
                                if (p.status !== 'ESTOQUE' && p.status !== 'Novo') return false;

                                // Filtro de texto da busca
                                const t = buscaModal.toLowerCase();
                                return (
                                    (p.fogo || '').toLowerCase().includes(t) ||
                                    (p.dot || '').toLowerCase().includes(t) ||
                                    (p.marca || '').toLowerCase().includes(t) ||
                                    (p.medida || '').toLowerCase().includes(t)
                                );
                            }).map(p => (
                                <div key={p.id} onClick={() => handleMontarPneu(p.id)} style={{ background: '#2d3748', padding: 15, marginBottom: 10, borderRadius: 5, cursor: 'pointer', border: '1px solid #4a5568' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#00d68f' }}>{p.dot ? `DOT: ${p.dot}` : (p.fogo || 'Sem Identificação')}</strong>
                                        <span>{p.medida}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>{p.marca}</div>
                                </div>
                            ))}
                            {pneus.filter(p => (p.status === 'ESTOQUE' || p.status === 'Novo') && ((p.fogo || '').includes(buscaModal) || (p.dot || '').includes(buscaModal))).length === 0 && (
                                <p style={{ color: '#718096', textAlign: 'center', marginTop: 20 }}>Nenhum pneu encontrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {modalEdicao && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: '400px', padding: 20, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <h3>Editar Pneu</h3>
                            <button onClick={() => setModalEdicao(false)} className="btn-close-modal" style={{ background: 'none', border: 'none', color: 'white' }}><X /></button>
                        </div>
                        <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label>DOT</label><input value={pneuEditando.dot || ''} onChange={e => setPneuEditando({ ...pneuEditando, dot: e.target.value })} style={inputStyle} />
                            <label>Fogo</label><input value={pneuEditando.fogo || ''} onChange={e => setPneuEditando({ ...pneuEditando, fogo: e.target.value })} style={inputStyle} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Marca</label><input value={pneuEditando.marca || ''} onChange={e => setPneuEditando({ ...pneuEditando, marca: e.target.value })} style={inputStyle} /></div>
                                <div><label>Medida</label><input value={pneuEditando.medida || ''} onChange={e => setPneuEditando({ ...pneuEditando, medida: e.target.value })} style={inputStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Sulco Novo</label><input type="number" value={pneuEditando.sulco_novo} onChange={e => setPneuEditando({ ...pneuEditando, sulco_novo: e.target.value })} style={inputStyle} /></div>
                                <div><label>Sulco Atual</label><input type="number" value={pneuEditando.sulco_atual} onChange={e => setPneuEditando({ ...pneuEditando, sulco_atual: e.target.value })} style={inputStyle} /></div>
                            </div>
                            <label>Status</label>
                            <select value={pneuEditando.status} onChange={e => setPneuEditando({ ...pneuEditando, status: e.target.value })} style={inputStyle}>
                                <option value="ESTOQUE">Estoque</option><option value="EM_USO">Em Uso</option><option value="MANUTENCAO">Manutenção</option><option value="SUCATA">Sucata</option>
                            </select>
                            <button type="submit" className="btn-add" style={{ marginTop: 10, background: '#00d68f', border: 'none', padding: 10, borderRadius: 5, color: 'black', fontWeight: 'bold' }}><Save size={16} /> Salvar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 1: ESCOLHA DO TIPO DE INCLUSÃO --- */}
            {modalTipoInclusao && (
                <div className="modal-overlay" onClick={() => setModalTipoInclusao(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a202c', padding: 30, borderRadius: 10, textAlign: 'center', width: 400 }}>
                        <h3 style={{ color: 'white', marginTop: 0 }}>Adicionar Pneu ao Estoque</h3>
                        <p style={{ color: '#a0aec0', marginBottom: 20 }}>O modelo (medida/marca) já existe no sistema?</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <button
                                onClick={() => { setModalTipoInclusao(false); setFormEntrada({ ...formEntrada, quantidade: 1 }); setModalEntrada(true); }}
                                style={{ padding: 15, borderRadius: 8, border: '1px solid #48bb78', background: 'rgba(72, 187, 120, 0.1)', color: '#48bb78', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '1rem' }}
                            >
                                <ArrowUpCircle size={24} />
                                <div>
                                    <strong>Sim, dar Entrada</strong>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Cadastrar Fogo, DOT e NF em modelo existente</div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setModalTipoInclusao(false);
                                    setFormModelo({ ...formModelo, codigo_referencia: proximoCodigo, nome: '' });
                                    setModalNovoModelo(true);
                                }}
                                style={{ padding: 15, borderRadius: 8, border: '1px solid #63b3ed', background: 'rgba(99, 179, 237, 0.1)', color: '#63b3ed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '1rem' }}
                            >
                                <Package size={24} />
                                <div>
                                    <strong>Não, criar Modelo</strong>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Cadastrar nova Medida ou Marca no catálogo</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: NOVO MODELO (Cópia simplificada do Estoque) --- */}
            {modalNovoModelo && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: 500, padding: 25, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, color: '#63b3ed' }}>Novo Modelo de Pneu</h3>
                            <button onClick={() => setModalNovoModelo(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X /></button>
                        </div>
                        <form onSubmit={handleSalvarModelo} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Nome do Modelo (Ex: 295/80 R22.5 Michelin)</label>
                                <input required value={formModelo.nome} onChange={e => setFormModelo({ ...formModelo, nome: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Código de Referência</label>
                                <input
                                    required
                                    value={formModelo.codigo_referencia}
                                    disabled // Mantém desativado para o usuário não mexer
                                    style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed', color: '#00d68f', fontWeight: 'bold' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Estoque Mínimo</label>
                                    <input type="number" value={formModelo.estoque_minimo} onChange={e => setFormModelo({ ...formModelo, estoque_minimo: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Unidade</label>
                                    <input value="UN" disabled style={{ ...inputStyle, opacity: 0.5 }} />
                                </div>
                            </div>
                            <button type="submit" className="btn-add" style={{ marginTop: 10, background: '#3182ce', color: 'white' }}>Cadastrar Modelo</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: ENTRADA (Cópia adaptada do Estoque) --- */}
            {modalEntrada && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: 600, padding: 25, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, color: '#48bb78' }}>Entrada de Pneu (Estoque)</h3>
                            <button onClick={() => setModalEntrada(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X /></button>
                        </div>
                        <form onSubmit={handleRealizarEntrada} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                            {/* --- MENSAGEM DE ATENÇÃO FINANCEIRA ADICIONADA --- */}
                            <div style={{ background: 'rgba(229, 62, 62, 0.1)', borderLeft: '4px solid #e53e3e', padding: '10px', borderRadius: '4px', marginBottom: '5px' }}>
                                <span style={{ color: '#fc8181', fontSize: '0.8rem', lineHeight: '1.4', display: 'block' }}>
                                    <strong>Atenção:</strong> Para itens adicionados diretamente no estoque, é obrigatório fazer o lançamento manual no menu <strong>GASTOS</strong> para controle financeiro.
                                </span>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Selecione o Modelo</label>
                                <select required value={formEntrada.estoque_item_id} onChange={e => setFormEntrada({ ...formEntrada, estoque_item_id: e.target.value })} style={inputStyle}>
                                    <option value="">Selecione...</option>
                                    {modelosPneu.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome} ({m.codigo_referencia})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Quantidade</label>
                                    <input type="number" min="1" required value={formEntrada.quantidade} onChange={e => setFormEntrada({ ...formEntrada, quantidade: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Valor Unit. (R$)</label>
                                    {/* REMOVIDO REQUIRED AQUI */}
                                    <input type="number" step="0.01" value={formEntrada.valor_aquisicao} onChange={e => setFormEntrada({ ...formEntrada, valor_aquisicao: e.target.value })} style={inputStyle} />
                                </div>
                            </div>

                            {/* CÁLCULO VISUAL DO TOTAL PARA PNEUS */}
                            <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#00d68f', fontWeight: 'bold', marginTop: '-5px' }}>
                                Custo Total: R$ {((formEntrada.quantidade || 0) * (formEntrada.valor_aquisicao || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Nota Fiscal (Opcional)</label>
                                {/* REMOVIDO REQUIRED AQUI */}
                                <input value={formEntrada.numero_nf} onChange={e => setFormEntrada({ ...formEntrada, numero_nf: e.target.value })} style={inputStyle} />
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 5, border: '1px dashed #4a5568' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#00d68f' }}>Dados Técnicos</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <div><label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>DOT (Obrigatório)</label><input required value={formEntrada.dot} onChange={e => setFormEntrada({ ...formEntrada, dot: e.target.value })} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Fogo (Opcional)</label><input value={formEntrada.fogo} onChange={e => setFormEntrada({ ...formEntrada, fogo: e.target.value })} style={inputStyle} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div><label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Marca (Opcional)</label><input value={formEntrada.marca || ''} onChange={e => setFormEntrada({ ...formEntrada, marca: e.target.value })} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Medida</label><input required value={formEntrada.medida || ''} onChange={e => setFormEntrada({ ...formEntrada, medida: e.target.value })} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Sulco (mm) (Opcional)</label><input type="number" value={formEntrada.sulco_novo || ''} onChange={e => setFormEntrada({ ...formEntrada, sulco_novo: e.target.value })} style={inputStyle} /></div>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Observação</label>
                                {/* REMOVIDO REQUIRED AQUI */}
                                <input value={formEntrada.observacao} onChange={e => setFormEntrada({ ...formEntrada, observacao: e.target.value })} style={inputStyle} />
                            </div>

                            <button type="submit" className="btn-add" style={{ marginTop: 10, background: '#48bb78', color: 'white' }}>Confirmar Entrada</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
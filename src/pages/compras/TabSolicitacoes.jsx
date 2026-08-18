// Arquivo: frontend/src/pages/compras/TabSolicitacoes.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Plus, Search, FileDown, Eye, Edit, Trash2, X, Calendar, Filter, FileText, ShoppingCart, PlusCircle, Package, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

// Estilos padronizados para o React-Select
const customSelectStyles = {
    control: (base, state) => ({
        ...base, backgroundColor: '#2d3748', borderColor: '#4a5568', color: 'white', minHeight: '40px',
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none', '&:hover': { borderColor: '#00d68f' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#00d68f' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' }),
};

export default function TabSolicitacoes({ onCriarOrcamento }) {
    const { can } = useAuth();
    const [lista, setLista] = useState([]);
    const [itensEstoque, setItensEstoque] = useState([]);
    const [servicosPadroes, setServicosPadroes] = useState([]);
    const [tiposGasto, setTiposGasto] = useState([]);
    const [categoriasEstoque, setCategoriasEstoque] = useState([]);
    const [unidadesBD, setUnidadesBD] = useState([]);

    const [veiculos, setVeiculos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [bases, setBases] = useState([]);

    // Modais
    const [modalAberto, setModalAberto] = useState(false);
    const [scSelecionada, setScSelecionada] = useState(null);

    // Modal de "Novo Item no Estoque"
    const [modalNovoItemEstoque, setModalNovoItemEstoque] = useState(false);
    const [formNovoItem, setFormNovoItem] = useState({
        nome: '', codigo_referencia: '', categoria: '', unidade_medida: 'UN',
        tipo_controle: 'QUANTIDADE', estoque_minimo: 0, observacoes: ''
    });

    // Filtros e Paginação
    const [busca, setBusca] = useState('');
    const [filtroData, setFiltroData] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);

    const statusList = [
        'Em Análise', 'Cancelada', 'Reprovada', 'Em Orçamento',
        'Orçamento Aprovado', 'Orçamento Reprovado', 'Ordem de Compra Emitida',
        'Ordem de Compra Finalizada'
    ];

    // Carrinho
    const [formCapa, setFormCapa] = useState({ id: null, local_entrega_id: '', observacoes: '', data_necessidade: '', veiculo_id: '', colaborador_id: '' });
    const [carrinhoItens, setCarrinhoItens] = useState([]);
    const [itemAtual, setItemAtual] = useState({ tipo_gasto: '', classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '', quantidade: '' });

    useEffect(() => { carregarDados(); }, []);

    async function carregarDados() {
        try {
            const [resSC, resEst, resTipos, resVeic, resUsu, resBas, resCat, resServ, resUnid] = await Promise.all([
                api.get('/compras/sc'), api.get('/estoque/itens'), api.get('/opcoes/tipos-gasto'),
                api.get('/veiculos'), api.get('/usuarios'), api.get('/bases'),
                api.get('/estoque/categorias'), api.get('/compras/servicos'),
                api.get('/estoque/unidades')
            ]);
            setLista(resSC.data); setItensEstoque(resEst.data); setTiposGasto(resTipos.data);
            setVeiculos(resVeic.data); setUsuarios(resUsu.data); setBases(resBas.data);
            setCategoriasEstoque(resCat.data); setServicosPadroes(resServ.data);
            setUnidadesBD(resUnid.data);
        } catch (error) { console.error("Erro ao carregar", error); }
    }

    // --- HELPER PARA PEGAR O NOME REAL DO ITEM ---
    const getNomeItem = (item) => {
        if (item.tipo_item === 'PRODUTO' || item.classificacao === 'PRODUTO') {
            const idBusca = item.estoque_item_id;
            const itemBd = itensEstoque.find(e => e.id === idBusca);
            return itemBd ? itemBd.nome : 'Produto Desconhecido';
        }
        return item.nome_novo_item;
    };

    // ================= LÓGICA DE FILTROS =================
    const dadosFiltrados = lista.filter(sc => {
        const termo = busca.toLowerCase();
        const matchTexto =
            (sc.numero || '').toLowerCase().includes(termo) ||
            (sc.solicitante?.nome || '').toLowerCase().includes(termo) ||
            sc.itens.some(i => getNomeItem(i).toLowerCase().includes(termo)) ||
            sc.itens.some(i => (i.tipo_gasto || '').toLowerCase().includes(termo));

        const matchStatus = filtroStatus ? sc.status?.toLowerCase() === filtroStatus.toLowerCase() : true;
        const dataCriacao = sc.data_criacao ? sc.data_criacao.split('T')[0] : '';
        const matchData = filtroData ? dataCriacao === filtroData : true;

        return matchTexto && matchStatus && matchData;
    });

    const dadosPaginados = dadosFiltrados.slice(0, visibleCount);

    // ================= GERAÇÃO DE PDFS =================
    const baixarListaPDF = () => {
        const doc = new jsPDF();
        doc.text("Relatório de Solicitações de Compras (SCs)", 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [['Nº SC', 'Data', 'Solicitante', 'Resumo Itens', 'Qtd Total', 'Status']],
            body: dadosFiltrados.map(sc => [
                sc.numero,
                sc.data_criacao ? new Date(sc.data_criacao).toLocaleDateString() : '-',
                sc.solicitante?.nome || '-',
                sc.itens.length === 1 ? getNomeItem(sc.itens[0]) : `${sc.itens.length} itens`,
                sc.itens.reduce((acc, i) => acc + i.quantidade, 0),
                sc.status
            ]),
            styles: { fontSize: 8 }
        });
        doc.save(`Relatorio_SCs_${new Date().getTime()}.pdf`);
    };

    // Função auxiliar para carregar a logo do diretório public
    const getBase64ImageFromUrl = async (imageUrl) => {
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Erro ao carregar logo:", e);
            return null;
        }
    };

    const baixarResumoPDF = async (sc) => {
        const doc = new jsPDF();
        const agora = new Date(); // Data exata do download do PDF

        // 1. Data e Hora do Download
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Baixado em: ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 15);

        // 2. Título
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(`Solicitação de compra ${sc.numero}`, 14, 25);

        // 3. Logo da Empresa
        const logoData = await getBase64ImageFromUrl('/looplogo.png');
        if (logoData) {
            doc.setFillColor(58, 12, 163); // Nova Cor Roxa
            doc.rect(150, 10, 45, 20, 'F');
            doc.addImage(logoData, 'PNG', 152, 12, 41, 16);
        }

        // 4. Dados da Empresa
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("LOOP SERVICES LTDA", 14, 35);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("AL GRAJAU, Nº 614, CONJ. COM. 0703 COND, OFFICE", 14, 40);
        doc.text("06454050 - Barueri, SP", 14, 44);
        doc.text("CNPJ: 44.232.560/0001-47,, IE: 206902815118", 14, 48);

        // 5. Dados da Solicitação
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhes do Pedido:", 14, 60);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        // --- AQUI VAI A DATA E HORA DE CRIAÇÃO ORIGINAL ---
        // A letra 'Z' no final força o JavaScript a converter do horário Global (UTC) para o horário do Brasil
        const dataCriacao = sc.data_criacao ? new Date(sc.data_criacao.endsWith('Z') ? sc.data_criacao : `${sc.data_criacao}Z`) : null;
        const strDataCriacao = dataCriacao ? `${dataCriacao.toLocaleDateString('pt-BR')} às ${dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-';
        doc.text(`Data e hora da criação: ${strDataCriacao}`, 14, 65);

        doc.text(`Solicitante: ${sc.solicitante?.nome || 'Sistema'}`, 14, 70);
        const localNome = sc.local_entrega?.nome || (bases && bases.length > 0 && bases.find(b => b.id == sc.local_entrega_id)?.nome) || '-';
        doc.text(`Local de Entrega: ${localNome}`, 14, 75);
        doc.text(`Data Necessidade: ${sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem urgência definida'}`, 14, 80);

        doc.text(`Veículo: ${sc.veiculo?.placa || 'Geral'}`, 110, 65);
        doc.text(`Colaborador: ${sc.colaborador?.nome || 'Geral'}`, 110, 70);
        doc.text(`Status Atual: ${sc.status}`, 110, 75);

        // 6. Tabela de Itens
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Itens Solicitados", 14, 95);

        const tableData = sc.itens.map(i => [
            (i.tipo_item === 'PRODUTO' || i.tipo_item === 'ESTOQUE' || i.classificacao === 'PRODUTO' || i.classificacao === 'ESTOQUE') ? getNomeItem(i) : (i.nome_novo_item || 'Item Genérico'),
            i.tipo_gasto || 'Geral',
            i.quantidade,
            "UN"
        ]);

        autoTable(doc, {
            startY: 100, // Ajustado para não sobrepor
            head: [['Descrição do produto/serviço', 'Categoria (Tipo de Gasto)', 'Qtde', 'Un']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
            styles: { fontSize: 8 }
        });

        let finalY = doc.lastAutoTable.finalY + 15;

        // 7. Observações
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Observações", 14, finalY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const splitObs = doc.splitTextToSize(sc.observacoes || 'Nenhuma observação descrita na solicitação.', 180);
        doc.text(splitObs, 14, finalY + 5);

        doc.save(`Solicitacao_Compra_${sc.numero}.pdf`);
    };

    // --- LÓGICA DO CARRINHO ---
    function adicionarItemAoCarrinho() {
        if (!itemAtual.tipo_gasto) return alert("Selecione a Categoria/Tipo de Gasto.");
        if (itemAtual.classificacao === 'PRODUTO' && !itemAtual.estoque_item_id) return alert("Selecione um Produto do Estoque.");
        if (itemAtual.classificacao === 'SERVICO' && !itemAtual.nome_novo_item) return alert("Selecione ou Cadastre o Serviço.");
        if (!itemAtual.quantidade || itemAtual.quantidade <= 0) return alert("Informe a quantidade válida.");

        const nomeParaMostrar = getNomeItem(itemAtual);

        setCarrinhoItens([...carrinhoItens, { ...itemAtual, nome_exibicao: nomeParaMostrar }]);
        setItemAtual({ ...itemAtual, estoque_item_id: '', nome_novo_item: '', quantidade: '' });
    }

    function removerItemDoCarrinho(index) {
        const novoCarrinho = [...carrinhoItens];
        novoCarrinho.splice(index, 1);
        setCarrinhoItens(novoCarrinho);
    }

    // --- SALVAR SOLICITAÇÃO ---
    async function handleSubmit(e) {
        e.preventDefault();
        if (carrinhoItens.length === 0) return alert("Adicione pelo menos um item à solicitação!");
        if (!formCapa.local_entrega_id) return alert("Selecione o local de entrega.");

        let payload = {
            ...formCapa,
            itens: carrinhoItens.map(i => ({
                tipo_gasto: i.tipo_gasto,
                tipo_item: i.classificacao,
                estoque_item_id: i.estoque_item_id || null,
                nome_novo_item: i.nome_novo_item || null,
                quantidade: i.quantidade
            }))
        };

        // Limpa strings vazias (exigência do Python)
        Object.keys(payload).forEach(k => {
            if (payload[k] === '') payload[k] = null;
        });

        try {
            if (formCapa.id) {
                await api.put(`/compras/sc/${formCapa.id}`, payload);
                alert("SC atualizada!");
            } else {
                await api.post('/compras/sc', payload);
                alert("SC Criada com sucesso!");
            }
            setModalAberto(false);
            carregarDados();
        } catch (error) {
            const det = error.response?.data?.detail;
            const msgErro = typeof det === 'object' ? JSON.stringify(det) : (det || error.message);
            alert("Erro: " + msgErro);
        }
    }

    async function handleCriarNovoItemEstoque(e) {
        e.preventDefault();
        if (!formNovoItem.categoria) return alert("Por favor, selecione ou digite a Categoria.");
        if (!formNovoItem.unidade_medida) return alert("Por favor, selecione ou digite a Unidade de Medida.");

        if (itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase())) {
            return alert("Já existe um item com este Código/SKU.");
        }

        try {
            const res = await api.post('/estoque/itens', formNovoItem);
            alert("Novo modelo cadastrado no estoque!");
            setItensEstoque([...itensEstoque, res.data]);
            setModalNovoItemEstoque(false);
            setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: res.data.id });
        } catch (error) { alert("Erro ao criar item: " + (error.response?.data?.detail || error.message)); }
    }

    async function handleCriarNovoServico() {
        const nome = prompt("Descreva o novo Serviço Padrão:");
        if (nome) {
            try {
                const res = await api.post('/compras/servicos', { nome });
                setServicosPadroes([...servicosPadroes, res.data]);
                setItemAtual({ ...itemAtual, classificacao: 'SERVICO', nome_novo_item: res.data.nome });
            } catch (e) { alert("Erro ao criar serviço. Talvez já exista."); }
        }
    }

    function abrirModalEdicao(sc) {
        setScSelecionada(null); // Fecha o olhinho se estiver aberto
        setFormCapa({
            id: sc.id, local_entrega_id: sc.local_entrega_id || '', observacoes: sc.observacoes || '',
            data_necessidade: sc.data_necessidade || '', veiculo_id: sc.veiculo_id || '', colaborador_id: sc.colaborador_id || ''
        });

        setCarrinhoItens(sc.itens.map(i => ({
            tipo_gasto: i.tipo_gasto,
            classificacao: i.tipo_item,
            estoque_item_id: i.estoque_item_id,
            nome_novo_item: i.nome_novo_item,
            quantidade: i.quantidade,
            nome_exibicao: getNomeItem(i)
        })));

        setItemAtual({ tipo_gasto: '', classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '', quantidade: '' });
        setModalAberto(true);
    }

    async function handleDelete(id) {
        if (!confirm("Excluir esta SC? Todos os itens atrelados serão apagados.")) return;
        try { await api.delete(`/compras/sc/${id}`); carregarDados(); } catch (e) { alert("Erro."); }
    }

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };
    const opcoesEstoque = itensEstoque.map(i => ({ value: i.id, label: `${i.nome} (${i.codigo_referencia})` }));

    return (
        <div style={{ paddingTop: 10 }}>
            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, alignItems: 'center', marginBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}>
                        <Calendar size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                        <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}>
                        <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar por Nº SC, Item..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {can('compras.sc.baixar') && (
                            <button onClick={baixarListaPDF} className="btn-add" style={{ flex: 1, background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                <FileDown size={16} /> Baixar PDF
                            </button>
                        )}
                        {can('compras.sc.criar') && (
                            <button onClick={() => { setFormCapa({ id: null, local_entrega_id: '', observacoes: '', data_necessidade: '', veiculo_id: '', colaborador_id: '' }); setCarrinhoItens([]); setItemAtual({ tipo_gasto: '', classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '', quantidade: '' }); setModalAberto(true); }} className="btn-add" style={{ flex: 1, background: '#00d68f', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                <Plus size={18} /> Nova SC
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 5 }}>
                    <button onClick={() => setFiltroStatus('')} style={{ padding: '5px 15px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: filtroStatus === '' ? '#00d68f' : '#1a202c', color: filtroStatus === '' ? '#000' : '#a0aec0', whiteSpace: 'nowrap' }}>
                        Todos
                    </button>
                    {statusList.map(s => (
                        <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: '5px 15px', borderRadius: 20, border: '1px solid #4a5568', cursor: 'pointer', background: filtroStatus === s ? '#63b3ed' : 'transparent', color: filtroStatus === s ? '#000' : '#a0aec0', whiteSpace: 'nowrap' }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Data Abertura</th>
                            <th>Data Limite</th>
                            <th>Itens Solicitados</th>
                            <th>Qtd. Total</th>
                            <th>Solicitante</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosPaginados.map(sc => (
                            <tr key={sc.id}>
                                <td style={{ fontWeight: 'bold', color: '#63b3ed' }}>{sc.numero}</td>
                                <td>{new Date(sc.data_criacao).toLocaleDateString('pt-BR')}</td>
                                <td style={{ color: sc.data_necessidade ? '#ecc94b' : '#a0aec0' }}>{sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                                <td>
                                    {sc.itens.length === 1 ? getNomeItem(sc.itens[0]) : `${sc.itens.length} itens (Lista)`}
                                </td>
                                <td style={{ fontWeight: 'bold' }}>{sc.itens.reduce((acc, i) => acc + i.quantidade, 0)}</td>
                                <td>{sc.solicitante?.nome}</td>
                                <td><span className={`tag ${sc.status.replace(' ', '_')}`}>{sc.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => setScSelecionada(sc)} title="Ver Detalhes" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}><Eye size={18} /></button>
                                        {can('compras.sc.baixar') && (
                                            <button onClick={() => baixarResumoPDF(sc)} title="Baixar PDF" style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}><FileText size={18} /></button>
                                        )}

                                        {/* Editar e Excluir liberados independente do status se tiver permissão (removi a trava de status) */}
                                        {can('compras.sc.editar') && <button onClick={() => abrirModalEdicao(sc)} title="Editar" style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer' }}><Edit size={18} /></button>}
                                        {can('compras.sc.excluir') && <button onClick={() => handleDelete(sc.id)} title="Excluir" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={18} /></button>}

                                        {/* Botão de Cotar aparece se estiver Em Análise OU Em Orçamento */}
                                        {(sc.status === 'Em Análise' || sc.status === 'Em Orçamento') && can('compras.orcamento.criar') && (
                                            <button onClick={() => onCriarOrcamento(sc.id)} title="Lançar Orçamentos" style={{ background: '#3182ce', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                                                <FileDown size={14} style={{ marginRight: 5 }} /> Cotar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {dadosFiltrados.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', color: '#a0aec0' }}>Nenhuma solicitação encontrada.</td></tr>}
                    </tbody>
                </table>
            </div>

            {visibleCount < dadosFiltrados.length && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={() => setVisibleCount(v => v + 20)} style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '10px 30px', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>
                        Carregar + ({dadosFiltrados.length - visibleCount} restantes)
                    </button>
                </div>
            )}

            {/* MODAL NOVA SC COM CARRINHO */}
            {modalAberto && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2>{formCapa.id ? `Editar ${formCapa.numero || 'SC'}` : 'Nova Solicitação de Compra'}</h2>
                            <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <h3 style={{ marginTop: 0, color: '#00d68f', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}><FileText size={20} /> 1. Informações Gerais do Pedido</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 15 }}>
                                    <div><label style={{ display: 'block', marginBottom: 5 }}>Data Limite / Necessidade</label><input type="date" value={formCapa.data_necessidade} onChange={e => setFormCapa({ ...formCapa, data_necessidade: e.target.value })} style={inputStyle} /></div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Local Entrega (Base) <span style={{ color: '#e53e3e' }}>*</span></label>
                                        <select required value={formCapa.local_entrega_id} onChange={e => setFormCapa({ ...formCapa, local_entrega_id: e.target.value })} style={inputStyle}>
                                            <option value="">Selecione...</option>
                                            {bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Veículo (Opcional)</label>
                                        <select value={formCapa.veiculo_id} onChange={e => setFormCapa({ ...formCapa, veiculo_id: e.target.value })} style={inputStyle}>
                                            <option value="">Geral / Nenhum</option>
                                            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Colaborador (Opcional)</label>
                                        <select value={formCapa.colaborador_id} onChange={e => setFormCapa({ ...formCapa, colaborador_id: e.target.value })} style={inputStyle}>
                                            <option value="">Nenhum</option>
                                            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div><label style={{ display: 'block', marginBottom: 5 }}>Justificativa / Observação Geral</label><textarea rows="2" value={formCapa.observacoes} onChange={e => setFormCapa({ ...formCapa, observacoes: e.target.value })} style={inputStyle} /></div>
                            </div>

                            <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <h3 style={{ marginTop: 0, color: '#63b3ed', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}><Package size={20} /> 2. Adicionar Item ao Pedido</h3>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginBottom: 15, alignItems: 'flex-end' }}>
                                    <div style={{ flex: '1 1 200px' }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Categoria (Tipo Gasto)</label>
                                        <select value={itemAtual.tipo_gasto} onChange={e => setItemAtual({ ...itemAtual, tipo_gasto: e.target.value })} style={inputStyle}>
                                            <option value="">Selecione...</option>
                                            {tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 10, flex: '2 1 300px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                            <input type="radio" checked={itemAtual.classificacao === 'PRODUTO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '' })} />
                                            Produto (Catálogo do Estoque)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                            <input type="radio" checked={itemAtual.classificacao === 'SERVICO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'SERVICO', estoque_item_id: '', nome_novo_item: '' })} />
                                            Serviço Padrão
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'flex-end' }}>
                                    <div style={{ flex: '1 1 350px' }}>
                                        {itemAtual.classificacao === 'PRODUTO' ? (
                                            <>
                                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                    <span>Buscar Produto no Estoque</span>
                                                    <span onClick={() => setModalNovoItemEstoque(true)} style={{ color: '#00d68f', cursor: 'pointer', fontSize: '0.85rem' }}>+ Cadastrar Novo Modelo no Estoque</span>
                                                </label>
                                                <Select
                                                    styles={customSelectStyles}
                                                    options={opcoesEstoque}
                                                    value={opcoesEstoque.find(o => o.value === itemAtual.estoque_item_id) || null}
                                                    onChange={opt => setItemAtual({ ...itemAtual, estoque_item_id: opt ? opt.value : '' })}
                                                    placeholder="Digite o nome, código ou medida..."
                                                    isClearable
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <label style={{ display: 'block', marginBottom: 5 }}>Selecione o Serviço Padrão</label>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <select value={itemAtual.nome_novo_item} onChange={e => setItemAtual({ ...itemAtual, nome_novo_item: e.target.value })} style={inputStyle}>
                                                        <option value="">Selecione um serviço tabelado...</option>
                                                        {servicosPadroes.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                                    </select>
                                                    <button type="button" onClick={handleCriarNovoServico} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '0 15px', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                        + Novo Serviço
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ width: '100px' }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Qtd.</label>
                                        <input type="number" value={itemAtual.quantidade} onChange={e => setItemAtual({ ...itemAtual, quantidade: e.target.value })} style={inputStyle} placeholder="Ex: 4" />
                                    </div>
                                    <div>
                                        <button type="button" onClick={adicionarItemAoCarrinho} style={{ height: '42px', padding: '0 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <PlusCircle size={18} /> Inserir
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#1a202c', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <h3 style={{ marginTop: 0, color: 'white', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}><ShoppingCart size={20} /> 3. Lista de Itens a Comprar</h3>

                                {carrinhoItens.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#a0aec0', padding: 20, fontStyle: 'italic' }}>Nenhum item adicionado ainda. Preencha acima e clique em "Inserir".</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #4a5568', textAlign: 'left' }}>
                                                    <th style={{ padding: 10 }}>Categoria</th>
                                                    <th style={{ padding: 10 }}>Item / Descrição</th>
                                                    <th style={{ padding: 10, textAlign: 'center' }}>Qtd.</th>
                                                    <th style={{ padding: 10, textAlign: 'center' }}>Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {carrinhoItens.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #2d3748' }}>
                                                        <td style={{ padding: 10, color: '#a0aec0', fontSize: '0.9rem' }}>{item.tipo_gasto}</td>
                                                        <td style={{ padding: 10 }}>
                                                            <span style={{ fontWeight: 'bold' }}>{item.nome_exibicao}</span>
                                                            <span style={{ marginLeft: 10, fontSize: '0.7rem', padding: '2px 5px', background: item.classificacao === 'PRODUTO' ? '#00d68f20' : '#ecc94b20', color: item.classificacao === 'PRODUTO' ? '#00d68f' : '#ecc94b', borderRadius: 4 }}>{item.classificacao}</span>
                                                        </td>
                                                        <td style={{ padding: 10, textAlign: 'center', fontWeight: 'bold' }}>{item.quantidade}</td>
                                                        <td style={{ padding: 10, textAlign: 'center' }}>
                                                            <button type="button" onClick={() => removerItemDoCarrinho(idx)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', background: '#00d68f', color: 'black', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <CheckCircle size={20} style={{ marginRight: 10 }} />
                                Finalizar e Gravar Solicitação Completa
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CADASTRAR NOVO ITEM NO ESTOQUE (Embutido na SC) */}
            {modalNovoItemEstoque && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: '600px', padding: 25, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ color: '#00d68f', margin: 0 }}>Cadastrar Novo Modelo no Estoque</h3>
                            <button onClick={() => setModalNovoItemEstoque(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCriarNovoItemEstoque} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Nome do Item / Modelo <span style={{ color: '#e53e3e' }}>*</span></label><input required value={formNovoItem.nome} onChange={e => setFormNovoItem({ ...formNovoItem, nome: e.target.value })} style={inputStyle} /></div>
                                <div>
                                    <label>Cód. Referência (SKU) <span style={{ color: '#e53e3e' }}>*</span></label>
                                    <input required placeholder="ID123" value={formNovoItem.codigo_referencia} onChange={e => setFormNovoItem({ ...formNovoItem, codigo_referencia: e.target.value })} style={{ ...inputStyle, borderColor: (formNovoItem.codigo_referencia && itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase())) ? '#e53e3e' : '#4a5568' }} />
                                    {formNovoItem.codigo_referencia && itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase()) && (
                                        <span style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>Este código já está em uso no estoque!</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label>Categoria <span style={{ color: '#e53e3e' }}>*</span></label>
                                    <CreatableSelect styles={customSelectStyles} options={categoriasEstoque.map(c => ({ value: c.nome || c, label: c.nome || c }))} value={formNovoItem.categoria ? { value: formNovoItem.categoria, label: formNovoItem.categoria } : null} onChange={opt => setFormNovoItem({ ...formNovoItem, categoria: opt ? opt.value : '' })} placeholder="Selecione ou digite..." formatCreateLabel={(val) => `Criar nova: "${val}"`} />
                                </div>
                                <div>
                                    <label>Unidade de Medida <span style={{ color: '#e53e3e' }}>*</span></label>
                                    <CreatableSelect styles={customSelectStyles} options={unidadesBD.map(u => ({ value: u.nome || u, label: u.nome || u }))} value={formNovoItem.unidade_medida ? { value: formNovoItem.unidade_medida, label: formNovoItem.unidade_medida } : null} onChange={opt => setFormNovoItem({ ...formNovoItem, unidade_medida: opt ? opt.value : '' })} placeholder="Selecione ou digite..." formatCreateLabel={(val) => `Criar nova: "${val}"`} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label>Tipo de Controle <span style={{ color: '#e53e3e' }}>*</span></label>
                                    <select value={formNovoItem.tipo_controle} onChange={e => setFormNovoItem({ ...formNovoItem, tipo_controle: e.target.value })} style={inputStyle}>
                                        <option value="QUANTIDADE">Quantidade Simples (Granel)</option>
                                        <option value="SERIALIZADO">Serializado (Único)</option>
                                    </select>
                                </div>
                                <div><label>Estoque Mínimo de Alerta</label><input type="number" placeholder="0" value={formNovoItem.estoque_minimo} onChange={e => setFormNovoItem({ ...formNovoItem, estoque_minimo: e.target.value })} style={inputStyle} /></div>
                            </div>

                            <div><label>Observações / Link</label><textarea rows="2" value={formNovoItem.observacoes} onChange={e => setFormNovoItem({ ...formNovoItem, observacoes: e.target.value })} style={inputStyle} /></div>

                            <button type="submit" className="btn-add" style={{ background: '#3182ce', color: 'white', marginTop: 10 }}>Gravar e Selecionar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL VER DETALHES DA SC (RESUMO) */}
            {scSelecionada && (
                <div className="modal-overlay" onClick={() => setScSelecionada(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a202c', width: '700px', padding: 30, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: 15, marginBottom: 20 }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#63b3ed' }}>Solicitação {scSelecionada.numero}</h2>
                                <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Emitida em {new Date(scSelecionada.data_criacao).toLocaleDateString('pt-BR')} por {scSelecionada.solicitante?.nome}</span>
                            </div>
                            <button onClick={() => setScSelecionada(null)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8 }}>
                                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Data Limite de Necessidade</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: scSelecionada.data_necessidade ? '#ecc94b' : 'white' }}>{scSelecionada.data_necessidade ? new Date(scSelecionada.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data definida'}</div>
                            </div>
                            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8 }}>
                                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Local de Entrega (Base)</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{scSelecionada.local_entrega?.nome || bases.find(b => b.id == scSelecionada.local_entrega_id)?.nome || '-'}</div>
                            </div>
                        </div>

                        <h4 style={{ color: 'white', marginBottom: 10 }}>Itens Solicitados:</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #4a5568', textAlign: 'left', color: '#a0aec0' }}>
                                        <th style={{ padding: 8 }}>Item</th>
                                        <th style={{ padding: 8 }}>Categoria</th>
                                        <th style={{ padding: 8, textAlign: 'center' }}>Qtd</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scSelecionada.itens.map((i, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #2d3748' }}>
                                            <td style={{ padding: 8, color: 'white' }}>{getNomeItem(i)}</td>
                                            <td style={{ padding: 8, color: '#a0aec0', fontSize: '0.9rem' }}>{i.tipo_gasto}</td>
                                            <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold' }}>{i.quantidade}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {scSelecionada.observacoes && (
                            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginTop: 10, marginBottom: 15 }}>
                                <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: 5 }}>Observações Gerais:</div>
                                <div>{scSelecionada.observacoes}</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button onClick={() => baixarResumoPDF(scSelecionada)} style={{ flex: 1, background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                                <FileText size={16} /> Baixar PDF
                            </button>

                            {(scSelecionada.status === 'Em Análise' || scSelecionada.status === 'Em Orçamento') && can('compras.orcamento.criar') && (
                                <button
                                    onClick={() => {
                                        onCriarOrcamento(scSelecionada.id);
                                        setScSelecionada(null);
                                    }}
                                    style={{ flex: 1, background: '#00d68f', border: 'none', color: 'black', fontWeight: 'bold', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}
                                >
                                    <ShoppingCart size={16} /> Criar Orçamento
                                </button>
                            )}

                            {can('compras.sc.editar') && (
                                <button onClick={() => abrirModalEdicao(scSelecionada)} title="Editar Solicitação" style={{ flex: 1, background: '#ecc94b', border: 'none', color: 'black', fontWeight: 'bold', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                                    <Edit size={16} /> Editar
                                </button>
                            )}

                            {can('compras.sc.excluir') && (
                                <button onClick={() => { setScSelecionada(null); handleDelete(scSelecionada.id); }} title="Excluir Solicitação" style={{ flex: 1, background: '#e53e3e', border: 'none', color: 'white', fontWeight: 'bold', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                                    <Trash2 size={16} /> Excluir
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
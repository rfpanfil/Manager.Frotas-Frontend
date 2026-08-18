// Arquivo: frontend/src/pages/compras/TabOrdensCompra.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Printer, Trash2, Plus, X, CheckSquare, Search, ShoppingCart, PlusCircle, Package, FileText, CheckCircle, Calendar, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const customSelectStyles = {
    control: (base, state) => ({ ...base, backgroundColor: '#2d3748', borderColor: '#4a5568', color: 'white', minHeight: '40px', boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none', '&:hover': { borderColor: '#00d68f' } }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#00d68f' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' }),
};

export default function TabOrdensCompra({ orcAprovado, clearOrcAprovado }) {
    const { can } = useAuth();
    const [ocs, setOcs] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [itensEstoque, setItensEstoque] = useState([]);
    const [tiposGasto, setTiposGasto] = useState([]);
    const [bases, setBases] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [servicosPadroes, setServicosPadroes] = useState([]);
    const [categoriasEstoque, setCategoriasEstoque] = useState([]);
    const [unidadesBD, setUnidadesBD] = useState([]);

    // --- FILTROS E BUSCA ---
    const [busca, setBusca] = useState('');
    const [filtroData, setFiltroData] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);

    const statusList = ['Emitida', 'Recebida Parcialmente', 'Recebimento Concluído', 'Cancelada'];

    // --- ESTADOS DO MODAL DE APROVAÇÃO ---
    const [modalAprovacao, setModalAprovacao] = useState(false);
    const [formAprovacao, setFormAprovacao] = useState({ orcamento_id: '', desconto: '', centro_custo_id: '', veiculo_id: '', colaborador_id: '', litros: '', km_atual: '', tipo_gasto: '' });

    // --- ESTADOS DA OC MANUAL ---
    const [modalOCManual, setModalOCManual] = useState(false);
    const [formCapa, setFormCapa] = useState({ fornecedor_id: '', centro_custo_id: '', veiculo_id: '', colaborador_id: '', litros: '', km_atual: '', prazo_entrega: '', prazo_pagamento: '', tipo_pagamento: '', frete: '0', desconto: '0', observacoes: '' });
    const [carrinhoItens, setCarrinhoItens] = useState([]);
    const [itemAtual, setItemAtual] = useState({ tipo_gasto: '', classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '', quantidade: '', valor_unitario: '' });

    const [modalNovoItemEstoque, setModalNovoItemEstoque] = useState(false);
    const [formNovoItem, setFormNovoItem] = useState({ nome: '', codigo_referencia: '', categoria: '', unidade_medida: '', tipo_controle: 'QUANTIDADE', estoque_minimo: 0, observacoes: '' });

    // --- ESTADOS DE RECEBIMENTO (BAIXA) ---
    const [modalBaixa, setModalBaixa] = useState(false);
    const [ocRecebendo, setOcRecebendo] = useState(null);
    const [dadosBaixa, setDadosBaixa] = useState({ numero_nf: '', observacao: '', detalhes: [] });

    useEffect(() => { carregarDados(); }, []);

    // --- ESCUTA A APROVAÇÃO VINDA DA TELA DE ORÇAMENTOS ---
    useEffect(() => {
        if (orcAprovado) {
            const sc = orcAprovado.sc;
            const orc = orcAprovado.orcamento;

            // Pega a categoria do primeiro item para aplicar as SUAS regras originais de Veículo/Motorista
            const primeiroItemSc = (sc.itens && sc.itens.length > 0) ? sc.itens[0] : {};
            const primeiroItemOrc = (orc.itens && orc.itens.length > 0) ? orc.itens[0] : {};

            setFormAprovacao({
                orcamento_id: orc.id,
                solicitacao_id: sc.id,
                solicitacao_numero: sc.numero,
                fornecedor_id: orc.fornecedor_id,
                fornecedor_nome: orc.fornecedor?.razao_social || 'Fornecedor Vencedor',
                tipo_gasto: primeiroItemSc.tipo_gasto || '',
                nome_exibicao: primeiroItemSc.nome_novo_item || primeiroItemSc.item_estoque?.nome || 'Múltiplos Itens / Lista',
                quantidade: primeiroItemOrc.quantidade || primeiroItemSc.quantidade || sc.itens.length,
                valor_unitario: primeiroItemOrc.valor_unitario || '',
                frete: orc.frete || '0',
                desconto: '',
                prazo_pagamento: orc.prazo_pagamento ? orc.prazo_pagamento.split('T')[0] : '',
                centro_custo_id: sc.local_entrega_id || '',
                veiculo_id: sc.veiculo_id || '',
                colaborador_id: sc.colaborador_id || '',
                litros: '', km_atual: '',
                valor_total_original: orc.valor_total || 0
            });

            setModalAprovacao(true);
            if (clearOrcAprovado) clearOrcAprovado();
        }
    }, [orcAprovado]);

    async function carregarDados() {
        try {
            const [resOC, resF, resE, resTG, resB, resV, resU, resSP, resCat, resUnid] = await Promise.all([
                api.get('/compras/oc'), api.get('/compras/fornecedores'), api.get('/estoque/itens'),
                api.get('/opcoes/tipos-gasto'), api.get('/bases'), api.get('/veiculos'),
                api.get('/usuarios'), api.get('/compras/servicos'), api.get('/estoque/categorias'),
                api.get('/estoque/unidades')
            ]);
            setOcs(resOC.data); setFornecedores(resF.data); setItensEstoque(resE.data);
            setTiposGasto(resTG.data); setBases(resB.data); setVeiculos(resV.data);
            setUsuarios(resU.data); setServicosPadroes(resSP.data); setCategoriasEstoque(resCat.data);
            setUnidadesBD(resUnid.data);
        } catch (error) { console.error("Erro ao carregar OCs", error); }
    }

    const dadosFiltrados = ocs.filter(oc => {
        const termo = busca.toLowerCase();
        const matchTexto = (oc.numero || '').toLowerCase().includes(termo) ||
            (oc.fornecedor?.razao_social || '').toLowerCase().includes(termo) ||
            oc.itens.some(i => {
                const nomeItem = (i.tipo_item === 'PRODUTO' || i.tipo_item === 'ESTOQUE') ? getNomeEstoque(i.estoque_item_id) : (i.nome_novo_item || '');
                return nomeItem.toLowerCase().includes(termo);
            });
        const matchStatus = filtroStatus ? oc.status?.toLowerCase() === filtroStatus.toLowerCase() : true;
        const dataCriacao = oc.data_emissao ? oc.data_emissao.split('T')[0] : '';
        const matchData = filtroData ? dataCriacao === filtroData : true;
        return matchTexto && matchStatus && matchData;
    });

    const dadosPaginados = dadosFiltrados.slice(0, visibleCount);

    const verificarRegrasManual = (itens) => {
        if (!itens || itens.length === 0) return { precisaVeiculo: false, precisaColaborador: false, isCombustivel: false };
        const tipos = itens.map(i => i.tipo_gasto);
        return {
            precisaVeiculo: tipos.some(t => ['Manutenção', 'Combustível', 'Multa', 'Documentação', 'Lavagem', 'Revisão', 'Borracharia'].includes(t)),
            precisaColaborador: tipos.some(t => ['Combustível', 'Multa'].includes(t)),
            isCombustivel: tipos.some(t => t === 'Combustível')
        };
    };
    const regrasManual = verificarRegrasManual(carrinhoItens);

    const formatarM = (v) => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // NOVA FUNÇÃO AUXILIAR PARA BUSCAR O NOME DO ESTOQUE
    const getNomeEstoque = (estoque_item_id) => {
        const est = itensEstoque.find(e => e.id === estoque_item_id);
        return est ? est.nome : 'Produto Desconhecido';
    };

    const baixarListaPDF = () => {
        const doc = new jsPDF();
        doc.text("Relatório de Ordens de Compra", 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [['Nº OC', 'Fornecedor', 'Data', 'Itens', 'Valor Total', 'Status']],
            body: dadosFiltrados.map(oc => [
                oc.numero, oc.fornecedor?.razao_social || '-',
                new Date(oc.data_emissao).toLocaleDateString('pt-BR'),
                `${oc.itens.length} item(s)`, formatarM(oc.valor_total), oc.status
            ]),
            styles: { fontSize: 8 }
        });
        doc.save(`Lista_OCs_${new Date().getTime()}.pdf`);
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

    async function imprimirOC(oc) {
        const doc = new jsPDF();
        const agora = new Date(); // Data exata do download do PDF

        // 1. Data e Hora do Download (Canto superior esquerdo)
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Baixado em: ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 15);

        // 2. Título
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(`Ordem de compra ${oc.numero}`, 14, 25);

        // --- DATA E HORA DE EMISSÃO DA OC ---
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        // A letra 'Z' no final força o JavaScript a converter do horário Global (UTC) para o horário do Brasil
        const dataEmissao = oc.data_emissao ? new Date(oc.data_emissao.endsWith('Z') ? oc.data_emissao : `${oc.data_emissao}Z`) : null;
        const strDataEmissao = dataEmissao ? `${dataEmissao.toLocaleDateString('pt-BR')} às ${dataEmissao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-';
        doc.text(`Data e hora da emissão: ${strDataEmissao}`, 14, 30);

        // 3. Logo da Empresa (Com a nova cor roxa)
        const logoData = await getBase64ImageFromUrl('/looplogo.png');
        if (logoData) {
            doc.setFillColor(58, 12, 163);
            doc.rect(150, 10, 45, 20, 'F');
            doc.addImage(logoData, 'PNG', 152, 12, 41, 16);
        }

        // 4. Dados da Empresa Emitente (Descemos o Y para 40 para não sobrepor)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("LOOP SERVICES LTDA", 14, 40);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("AL GRAJAU, Nº 614, CONJ. COM. 0703 COND, OFFICE", 14, 45);
        doc.text("06454050 - Barueri, SP", 14, 49);
        doc.text("CNPJ: 44.232.560/0001-47,, IE: 206902815118", 14, 53);

        // 5. Dados do Fornecedor
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Fornecedor:", 14, 65);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Razão Social: ${oc.fornecedor?.razao_social || '-'}`, 14, 70);
        doc.text(`CNPJ/CPF: ${oc.fornecedor?.cnpj_cpf || '-'}`, 14, 75);

        // 6. Tabela de Itens
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Itens do pedido de compra", 14, 90);

        const tableData = oc.itens.map(i => {
            const nomeItem = (i.tipo_item === 'PRODUTO' || i.tipo_item === 'ESTOQUE') ? getNomeEstoque(i.estoque_item_id) : (i.nome_novo_item || 'Item Genérico');
            return [
                nomeItem,
                i.tipo_gasto || 'Geral',
                i.quantidade,
                "UN",
                formatarM(i.valor_unitario),
                formatarM(i.quantidade * i.valor_unitario)
            ];
        });

        autoTable(doc, {
            startY: 95, // Descemos a tabela para o Y: 95
            head: [['Descrição do produto/serviço', 'Categoria', 'Qtde', 'Un', 'Valor unitário', 'Valor total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
            styles: { fontSize: 8 }
        });

        let finalY = doc.lastAutoTable.finalY + 10;

        // 7. Resumo Financeiro
        doc.setFont("helvetica", "bold");
        doc.text(`FRETE (+): ${formatarM(oc.frete)}`, 140, finalY);
        finalY += 6;
        doc.text(`DESCONTO (-): ${formatarM(oc.desconto)}`, 140, finalY);
        finalY += 8;
        doc.setFontSize(12);
        doc.text(`VALOR TOTAL DA OC: ${formatarM(oc.valor_total)}`, 110, finalY);

        finalY += 15;

        // 8. Informações Adicionais e Aplicação
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Informações de Pagamento e Entrega", 14, finalY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Prazo de Entrega: ${oc.prazo_entrega ? new Date(oc.prazo_entrega).toLocaleDateString('pt-BR') : 'N/I'}`, 14, finalY + 5);
        doc.text(`Data Vencimento: ${oc.prazo_pagamento ? new Date(oc.prazo_pagamento).toLocaleDateString('pt-BR') : 'N/I'}`, 14, finalY + 10);
        doc.text(`Meio Pagamento: ${oc.tipo_pagamento || 'N/I'}`, 14, finalY + 15);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Aplicação (Frota)", 110, finalY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Veículo: ${oc.veiculo?.placa || 'Geral/Estoque'}`, 110, finalY + 5);
        doc.text(`Colaborador: ${oc.colaborador?.nome || 'Geral/Estoque'}`, 110, finalY + 10);

        finalY += 25;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Observações", 14, finalY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        const splitObs = doc.splitTextToSize(oc.observacoes || 'Nenhuma observação informada.', 180);
        doc.text(splitObs, 14, finalY + 5);

        doc.save(`Ordem_Compra_${oc.numero}.pdf`);
    }

    // --- SALVAR APROVAÇÃO (GERAR OC A PARTIR DE ORÇAMENTO) ---
    async function salvarAprovacao(e) {
        e.preventDefault();
        try {
            const limpaNulos = (val) => (val === '' ? null : val);
            let payload = {
                desconto: formAprovacao.desconto || 0,
                veiculo_id: limpaNulos(formAprovacao.veiculo_id),
                colaborador_id: limpaNulos(formAprovacao.colaborador_id),
                centro_custo_id: parseInt(formAprovacao.centro_custo_id),
                prazo_pagamento: limpaNulos(formAprovacao.prazo_pagamento),
                litros: limpaNulos(formAprovacao.litros),
                km_atual: formAprovacao.km_atual ? parseInt(formAprovacao.km_atual) : null
            };
            await api.post(`/compras/orcamentos/${formAprovacao.orcamento_id}/aprovar`, payload);
            alert("Ordem de Compra Emitida com Sucesso!");
            setModalAprovacao(false);
            carregarDados();
        } catch (error) { alert("Erro ao emitir OC: " + (error.response?.data?.detail || error.message)); }
    }

    // --- LÓGICA DO CARRINHO OC MANUAL ---
    function adicionarItemOC() {
        if (!itemAtual.tipo_gasto) return alert("Selecione a Categoria/Tipo de Gasto.");
        if (itemAtual.classificacao === 'PRODUTO' && !itemAtual.estoque_item_id) return alert("Selecione um Produto do Estoque.");
        if (itemAtual.classificacao === 'SERVICO' && !itemAtual.nome_novo_item) return alert("Selecione ou Cadastre o Serviço.");
        if (!itemAtual.quantidade || !itemAtual.valor_unitario) return alert("Informe a quantidade e o valor unitário.");

        let nomeParaMostrar = itemAtual.nome_novo_item;
        if (itemAtual.classificacao === 'PRODUTO') {
            const prod = itensEstoque.find(i => i.id === parseInt(itemAtual.estoque_item_id));
            if (prod) nomeParaMostrar = prod.nome;
        }

        setCarrinhoItens([...carrinhoItens, { ...itemAtual, nome_exibicao: nomeParaMostrar }]);
        setItemAtual({ ...itemAtual, estoque_item_id: '', nome_novo_item: '', quantidade: '', valor_unitario: '' });
    }

    async function salvarOCManual(e) {
        e.preventDefault();
        if (carrinhoItens.length === 0) return alert("Adicione itens à OC.");
        if (!formCapa.fornecedor_id) return alert("Selecione o fornecedor.");

        let payload = {
            ...formCapa,
            itens: carrinhoItens.map(i => ({
                tipo_gasto: i.tipo_gasto, tipo_item: i.classificacao,
                estoque_item_id: i.estoque_item_id || null, nome_novo_item: i.nome_novo_item || null,
                quantidade: i.quantidade, valor_unitario: i.valor_unitario
            }))
        };
        Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });

        try {
            await api.post('/compras/oc', payload);
            alert("OC Manual Criada com Sucesso!");
            setModalOCManual(false); carregarDados();
        } catch (error) { alert("Erro ao criar OC: " + (error.response?.data?.detail || error.message)); }
    }

    async function handleCriarNovoItemEstoque(e) {
        e.preventDefault();
        if (!formNovoItem.categoria) return alert("Selecione ou digite a Categoria.");
        if (!formNovoItem.unidade_medida) return alert("Selecione ou digite a Unidade de Medida.");
        if (itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase())) {
            return alert("Já existe um item com este Código/SKU.");
        }
        try {
            const res = await api.post('/estoque/itens', formNovoItem);
            alert("Novo modelo cadastrado!");
            setItensEstoque([...itensEstoque, res.data]);
            setModalNovoItemEstoque(false);
            setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: res.data.id });
        } catch (e) { alert("Erro."); }
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

    // --- RECEBIMENTO DE OC ---
    function abrirModalBaixa(oc) {
        const detalhesIniciais = [];
        oc.itens.forEach(item => {
            // Verifica os dois status e faz a busca manual no array de estoque
            if (item.tipo_item === 'PRODUTO' || item.tipo_item === 'ESTOQUE') {
                const est = itensEstoque.find(e => e.id === item.estoque_item_id);
                if (est) {
                    const controle = est.tipo_controle;
                    const catFixa = (est.categoria || '').toUpperCase();
                    if (controle === 'SERIALIZADO' || controle === 'UNIDADE' || catFixa === 'PNEUS') {
                        for (let i = 0; i < item.quantidade; i++) {
                            detalhesIniciais.push({
                                oc_item_id: item.id, estoque_item_id: item.estoque_item_id, categoria: catFixa,
                                serial: '', patrimonio: '', fogo: '', dot: '', marca: '', medida: '', sulco_novo: ''
                            });
                        }
                    }
                }
            }
        });
        setDadosBaixa({ numero_nf: '', observacao: '', detalhes: detalhesIniciais });
        setOcRecebendo(oc);
        setModalBaixa(true);
    }

    async function handleConfirmarBaixa(e) {
        e.preventDefault();
        try {
            await api.post(`/compras/oc/${ocRecebendo.id}/receber`, dadosBaixa);
            alert("Recebimento Concluído! O estoque e o financeiro foram atualizados.");
            setModalBaixa(false);
            carregarDados();
        } catch (error) { alert("Erro no recebimento: " + (error.response?.data?.detail || error.message)); }
    }

    function atualizarDetalheBaixa(idxGeral, campo, valor) {
        const novosDet = [...dadosBaixa.detalhes];
        novosDet[idxGeral][campo] = valor;
        setDadosBaixa({ ...dadosBaixa, detalhes: novosDet });
    }

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };
    const inputDisabledStyle = { ...inputStyle, background: '#1a202c', color: '#a0aec0', cursor: 'not-allowed', border: '1px dashed #4a5568' };
    const opcoesEstoque = itensEstoque.map(i => ({ value: i.id, label: `${i.nome} (${i.codigo_referencia})` }));

    return (
        <div style={{ paddingTop: 10 }}>
            {/* 1. TOPO DA ABA: FILTROS E BUSCA */}
            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, alignItems: 'center', marginBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}>
                        <Calendar size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                        <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}>
                        <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar por Nº OC, Fornecedor..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={baixarListaPDF} className="btn-add" style={{ flex: 1, background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <FileDown size={16} /> Baixar PDF
                        </button>
                        {can('compras.oc.criar') && (
                            <button onClick={() => { setFormCapa({ fornecedor_id: '', centro_custo_id: '', veiculo_id: '', colaborador_id: '', litros: '', km_atual: '', prazo_entrega: '', prazo_pagamento: '', tipo_pagamento: '', frete: '0', desconto: '0', observacoes: '' }); setCarrinhoItens([]); setItemAtual({ tipo_gasto: '', classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '', quantidade: '', valor_unitario: '' }); setModalOCManual(true); }} className="btn-add" style={{ flex: 1, background: '#00d68f', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                <Plus size={18} /> Emitir OC Manual
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtros Rápidos de Status */}
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
                            <th>Número OC</th>
                            <th>Fornecedor</th>
                            <th>Itens</th>
                            <th>Valor Total</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosPaginados.map(oc => (
                            <tr key={oc.id}>
                                <td style={{ fontWeight: 'bold', color: '#00d68f' }}>{oc.numero}</td>
                                <td>{oc.fornecedor?.razao_social}</td>
                                <td style={{ fontSize: '0.85rem', color: '#a0aec0' }}>{oc.itens.length} item(s)</td>
                                <td style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatarM(oc.valor_total)}</td>
                                <td><span style={{ color: oc.status === 'Cancelada' ? '#e53e3e' : '#00d68f' }}>{oc.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {oc.status === 'Emitida' && can('compras.oc.receber') && ( // MUDEI AQUI
                                            <button onClick={() => abrirModalBaixa(oc)} title="Dar Baixa (Receber)">
                                                <CheckSquare size={18} />
                                            </button>
                                        )}
                                        {can('compras.oc.baixar') && <button onClick={() => imprimirOC(oc)} title="Imprimir OC" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}><Printer size={18} /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {dadosFiltrados.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#a0aec0' }}>Nenhuma OC encontrada.</td></tr>}
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

            {/* O SEU MODAL DE APROVAÇÃO RESTAURADO PERFEITAMENTE */}
            {modalAprovacao && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '850px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                            <h3 style={{ color: '#00d68f', margin: 0 }}>Aprovar Orçamento (Ref. SC-{formAprovacao.solicitacao_numero}) e Emitir OC</h3>
                            <button onClick={() => { setModalAprovacao(false); if (clearOrcAprovado) clearOrcAprovado(); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                        </div>

                        <form onSubmit={salvarAprovacao} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Fornecedor (Vencedor)</label><input disabled value={formAprovacao.fornecedor_nome || ''} style={inputDisabledStyle} /></div>
                                <div><label>Tipo de Gasto Base</label><input disabled value={formAprovacao.tipo_gasto || 'Geral'} style={inputDisabledStyle} /></div>
                            </div>

                            {/* OS BLOCOS DE VEÍCULO, MOTORISTA, LITROS E KM FORAM REMOVIDOS DAQUI! */}

                            <div style={{ background: '#2d3748', padding: 15, borderRadius: 5, border: '1px solid #4a5568' }}>
                                <label style={{ color: '#a0aec0', display: 'block', marginBottom: 5 }}>Resumo do Item Base</label>
                                <input disabled value={formAprovacao.nome_exibicao} style={{ ...inputDisabledStyle, marginBottom: 10 }} title="Exibindo o primeiro item como referência" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div><label>Quantidade</label><input type="number" disabled value={formAprovacao.quantidade} style={inputDisabledStyle} /></div>
                                    <div><label>Valor Unit. Base (R$)</label><input disabled value={formAprovacao.valor_unitario} style={inputDisabledStyle} /></div>
                                    <div><label>Frete Total (R$)</label><input disabled value={formAprovacao.frete} style={inputDisabledStyle} /></div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0, 214, 143, 0.1)', padding: 15, borderRadius: 5, border: '1px solid #00d68f' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#00d68f' }}>Dados de Faturamento e Negociação</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div><label>Centro Custo (Base)*</label><select required value={formAprovacao.centro_custo_id} onChange={e => setFormAprovacao({ ...formAprovacao, centro_custo_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
                                    <div><label>Prazo Pagamento</label><input type="date" value={formAprovacao.prazo_pagamento} onChange={e => setFormAprovacao({ ...formAprovacao, prazo_pagamento: e.target.value })} style={inputStyle} /></div>
                                    <div><label>Desconto Extra na OC</label><input type="number" step="0.01" value={formAprovacao.desconto} onChange={e => setFormAprovacao({ ...formAprovacao, desconto: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', fontSize: '1.3rem', padding: '15px', background: '#2d3748', borderRadius: 5, border: '1px solid #4a5568', marginTop: 5 }}>
                                <span style={{ color: '#a0aec0', marginRight: 10 }}>Total Final da OC:</span>
                                <strong style={{ color: '#00d68f' }}>
                                    R$ {(() => {
                                        const parseMonetario = (val) => {
                                            if (!val) return 0;
                                            const v = String(val).replace('R$', '').trim();
                                            if (v.includes(',') && v.includes('.')) return parseFloat(v.replace(/\./g, '').replace(',', '.'));
                                            return parseFloat(v.replace(',', '.')) || 0;
                                        };
                                        const desc = parseMonetario(formAprovacao.desconto);
                                        const total = formAprovacao.valor_total_original - desc;
                                        return total > 0 ? total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
                                    })()}
                                </strong>
                            </div>

                            <button type="submit" className="btn-add" style={{ padding: 15, background: '#00d68f', color: 'black', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={20} style={{ display: 'inline', marginRight: 5 }} /> Confirmar Orçamento e Emitir OC
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE OC MANUAL COM CARRINHO (TURBINADO E COM BARRA DE ROLAGEM) */}
            {modalOCManual && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2>Nova Ordem de Compra (Manual)</h2>
                            <button onClick={() => setModalOCManual(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                        </div>
                        <form onSubmit={salvarOCManual} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <h3 style={{ marginTop: 0, color: '#00d68f', marginBottom: 15 }}><FileText size={20} style={{ display: 'inline', marginRight: 5 }} /> 1. Fornecedor e Prazos</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                                    <div><label style={{ display: 'block', marginBottom: 5 }}>Fornecedor *</label><select required value={formCapa.fornecedor_id} onChange={e => setFormCapa({ ...formCapa, fornecedor_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.razao_social}</option>)}</select></div>
                                    <div><label style={{ display: 'block', marginBottom: 5 }}>Condição de Pagamento</label><input placeholder="Boleto, Pix, etc" value={formCapa.tipo_pagamento} onChange={e => setFormCapa({ ...formCapa, tipo_pagamento: e.target.value })} style={inputStyle} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div><label style={{ display: 'block', marginBottom: 5 }}>Vencimento do Pagamento</label><input type="date" value={formCapa.prazo_pagamento} onChange={e => setFormCapa({ ...formCapa, prazo_pagamento: e.target.value })} style={inputStyle} /></div>
                                    <div><label style={{ display: 'block', marginBottom: 5 }}>Prazo de Entrega</label><input type="date" value={formCapa.prazo_entrega} onChange={e => setFormCapa({ ...formCapa, prazo_entrega: e.target.value })} style={inputStyle} /></div>
                                </div>
                            </div>

                            <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <h3 style={{ marginTop: 0, color: '#63b3ed', marginBottom: 15 }}><Package size={20} style={{ display: 'inline', marginRight: 5 }} /> 2. Adicionar Itens à OC</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 15, marginBottom: 15 }}>
                                    <div><label style={{ display: 'block', marginBottom: 5 }}>Categoria (Tipo Gasto)</label><select value={itemAtual.tipo_gasto} onChange={e => setItemAtual({ ...itemAtual, tipo_gasto: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}</select></div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, paddingBottom: 10 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" checked={itemAtual.classificacao === 'PRODUTO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '' })} /> Produto</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" checked={itemAtual.classificacao === 'SERVICO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'SERVICO', estoque_item_id: '', nome_novo_item: '' })} /> Serviço</label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'flex-end' }}>
                                    <div style={{ flex: '1 1 350px' }}>
                                        {itemAtual.classificacao === 'PRODUTO' ? (
                                            <>
                                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span>Produto no Estoque</span><span onClick={() => setModalNovoItemEstoque(true)} style={{ color: '#00d68f', cursor: 'pointer', fontSize: '0.85rem' }}>+ Novo Modelo</span></label>
                                                <Select styles={customSelectStyles} options={opcoesEstoque} value={opcoesEstoque.find(o => o.value === itemAtual.estoque_item_id) || null} onChange={opt => setItemAtual({ ...itemAtual, estoque_item_id: opt ? opt.value : '' })} placeholder="Digite o nome..." isClearable />
                                            </>
                                        ) : (
                                            <>
                                                <label style={{ display: 'block', marginBottom: 5 }}>Selecione o Serviço Padrão</label>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <select value={itemAtual.nome_novo_item} onChange={e => setItemAtual({ ...itemAtual, nome_novo_item: e.target.value })} style={inputStyle}>
                                                        <option value="">Selecione um serviço tabelado...</option>
                                                        {servicosPadroes.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                                    </select>
                                                    <button type="button" onClick={handleCriarNovoServico} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '0 15px', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Novo</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ width: '100px' }}><label style={{ display: 'block', marginBottom: 5 }}>Qtd.</label><input type="number" value={itemAtual.quantidade} onChange={e => setItemAtual({ ...itemAtual, quantidade: e.target.value })} style={inputStyle} placeholder="Ex: 4" /></div>
                                    <div style={{ width: '120px' }}><label style={{ display: 'block', marginBottom: 5 }}>V. Unit (R$)</label><input type="number" step="0.01" value={itemAtual.valor_unitario} onChange={e => setItemAtual({ ...itemAtual, valor_unitario: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                                    <div><button type="button" onClick={adicionarItemOC} style={{ height: '42px', padding: '0 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}><PlusCircle size={18} style={{ display: 'inline' }} /> Inserir</button></div>
                                </div>
                            </div>

                            <div style={{ background: '#1a202c', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <h3 style={{ marginTop: 0, color: 'white', marginBottom: 15 }}><ShoppingCart size={20} style={{ display: 'inline', marginRight: 5 }} /> 3. Itens Lançados</h3>
                                {carrinhoItens.length === 0 ? <p style={{ color: '#a0aec0' }}>Nenhum item na OC.</p> : (
                                    <>
                                        <div style={{ overflowX: 'auto', paddingBottom: 15 }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                                <thead><tr style={{ borderBottom: '2px solid #4a5568', textAlign: 'left' }}><th style={{ padding: 10 }}>Item / Descrição</th><th style={{ padding: 10, textAlign: 'center' }}>Qtd</th><th style={{ padding: 10, textAlign: 'right' }}>V. Unit</th><th style={{ padding: 10, textAlign: 'right' }}>Subtotal</th><th style={{ padding: 10, textAlign: 'center' }}>Ação</th></tr></thead>
                                                <tbody>
                                                    {carrinhoItens.map((item, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #2d3748' }}>
                                                            <td style={{ padding: 10 }}>
                                                                <div style={{ fontWeight: 'bold' }}>{item.nome_exibicao}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{item.tipo_gasto}</div>
                                                            </td>
                                                            <td style={{ padding: 10, textAlign: 'center' }}>{item.quantidade}</td>
                                                            <td style={{ padding: 10, textAlign: 'right' }}>{formatarM(item.valor_unitario)}</td>
                                                            <td style={{ padding: 10, textAlign: 'right', color: '#00d68f', fontWeight: 'bold' }}>{formatarM(item.quantidade * item.valor_unitario)}</td>
                                                            <td style={{ padding: 10, textAlign: 'center' }}><button type="button" onClick={() => setCarrinhoItens(carrinhoItens.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {(regrasManual.precisaVeiculo || regrasManual.precisaColaborador || regrasManual.isCombustivel) && (
                                            <div style={{ background: 'rgba(236, 201, 75, 0.1)', padding: 15, borderRadius: 5, border: '1px dashed #ecc94b', marginBottom: 20 }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#ecc94b' }}>Informações Específicas Requeridas</h4>

                                                {(regrasManual.precisaVeiculo || regrasManual.precisaColaborador) && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
                                                        {regrasManual.precisaVeiculo && <div><label style={{ display: 'block', marginBottom: 5 }}>Veículo *</label><select required value={formCapa.veiculo_id} onChange={e => setFormCapa({ ...formCapa, veiculo_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{veiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}</select></div>}
                                                        {regrasManual.precisaColaborador && <div><label style={{ display: 'block', marginBottom: 5 }}>Colaborador *</label><select required value={formCapa.colaborador_id} onChange={e => setFormCapa({ ...formCapa, colaborador_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></div>}
                                                    </div>
                                                )}

                                                {regrasManual.isCombustivel && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                                                        <div><label style={{ display: 'block', marginBottom: 5 }}>Litros Abastecidos *</label><input required type="number" step="0.01" value={formCapa.litros} onChange={e => setFormCapa({ ...formCapa, litros: e.target.value })} style={inputStyle} /></div>
                                                        <div><label style={{ display: 'block', marginBottom: 5 }}>KM Atual *</label><input required type="number" value={formCapa.km_atual} onChange={e => setFormCapa({ ...formCapa, km_atual: e.target.value })} style={inputStyle} /></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                <div style={{ background: 'rgba(0, 214, 143, 0.1)', padding: 15, borderRadius: 5, border: '1px solid #00d68f' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#00d68f' }}>Dados de Faturamento e Negociação</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
                                        <div><label style={{ display: 'block', marginBottom: 5 }}>Centro Custo (Base)*</label><select required value={formCapa.centro_custo_id} onChange={e => setFormCapa({ ...formCapa, centro_custo_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
                                        <div><label style={{ display: 'block', marginBottom: 5 }}>Frete Total (R$)</label><input type="number" step="0.01" value={formCapa.frete} onChange={e => setFormCapa({ ...formCapa, frete: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                                        <div><label style={{ display: 'block', marginBottom: 5 }}>Desconto Geral (R$)</label><input type="number" step="0.01" value={formCapa.desconto} onChange={e => setFormCapa({ ...formCapa, desconto: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 15 }}>
                                    <label style={{ display: 'block', marginBottom: 5, color: '#63b3ed' }}>Observações / Detalhes Adicionais da OC</label>
                                    <textarea rows="2" value={formCapa.observacoes} onChange={e => setFormCapa({ ...formCapa, observacoes: e.target.value })} style={inputStyle} placeholder="Escreva aqui se houver mais detalhes..." />
                                </div>
                            </div>

                            <button type="submit" className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', background: '#00d68f', color: 'black', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={20} style={{ marginRight: 5 }} /> Salvar OC Manual</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CADASTRAR NOVO ITEM NO ESTOQUE (Embutido na OC) */}
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

            {/* MODAL DE RECEBIMENTO / BAIXA DA OC COM BARRA DE ROLAGEM */}
            {modalBaixa && ocRecebendo && (
                <div className="modal-overlay" onClick={() => setModalBaixa(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                            <h3 style={{ color: '#ecc94b' }}>Receber Material - OC {ocRecebendo.numero}</h3>
                            <button onClick={() => setModalBaixa(false)} className="btn-close-modal"><X /></button>
                        </div>

                        <form onSubmit={handleConfirmarBaixa} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ background: '#2d3748', padding: 15, borderRadius: 5 }}>
                                    <label style={{ color: '#00d68f', fontWeight: 'bold' }}>Número da Nota Fiscal (NF)*</label>
                                    <input required placeholder="Ex: 123456" value={dadosBaixa.numero_nf} onChange={e => setDadosBaixa({ ...dadosBaixa, numero_nf: e.target.value })} style={{ ...inputStyle, marginTop: 5, fontSize: '1.2rem' }} />
                                </div>
                                <div style={{ background: '#2d3748', padding: 15, borderRadius: 5 }}>
                                    <label style={{ color: '#a0aec0', fontWeight: 'bold' }}>Observação do Lote (Opcional)</label>
                                    <textarea rows="2" placeholder="Ex: Entregue pela Tnt..." value={dadosBaixa.observacao} onChange={e => setDadosBaixa({ ...dadosBaixa, observacao: e.target.value })} style={{ ...inputStyle, marginTop: 5 }} />
                                </div>
                            </div>

                            {ocRecebendo.itens.map(item => {
                                if (item.tipo_item !== 'PRODUTO' && item.tipo_item !== 'ESTOQUE') return null;

                                // BUSA MANUAL DO ITEM
                                const est = itensEstoque.find(e => e.id === item.estoque_item_id);
                                if (!est) return null;

                                const catFixa = (est.categoria || '').toUpperCase();

                                if (est.tipo_controle === 'QUANTIDADE' && catFixa !== 'PNEUS') {
                                    return (
                                        <div key={item.id} style={{ background: '#2d3748', padding: 15, borderRadius: 5, borderLeft: '4px solid #3182ce' }}>
                                            <div style={{ fontWeight: 'bold' }}>{est.nome}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#a0aec0' }}>{item.quantidade}x unidades serão adicionadas automaticamente ao estoque geral.</div>
                                        </div>
                                    );
                                }

                                const detalhesDesteItem = dadosBaixa.detalhes.map((d, indexGeral) => ({ d, indexGeral })).filter(x => x.d.oc_item_id === item.id);

                                return (
                                    <div key={item.id} style={{ background: '#2d3748', padding: 15, borderRadius: 8, border: '1px solid #4a5568' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#63b3ed' }}>Item: {est.nome} (Qtd Comprada: {item.quantidade})</h4>
                                        <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: 0 }}>Por favor, preencha os dados físicos de cada unidade entregue.</p>

                                        <div style={{ overflowX: 'auto' }}>
                                            <div style={{ minWidth: catFixa === 'PNEUS' ? '650px' : '400px' }}>
                                                {detalhesDesteItem.map(({ d, indexGeral }, i) => (
                                                    <div key={indexGeral} style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: catFixa === 'PNEUS' ? 'repeat(auto-fit, minmax(130px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))',
                                                        gap: 10,
                                                        marginBottom: 10,
                                                        background: '#1a202c',
                                                        padding: 10,
                                                        borderRadius: 5
                                                    }}>
                                                        <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#ecc94b', fontWeight: 'bold' }}>Unidade {i + 1}</div>

                                                        {catFixa === 'PNEUS' ? (
                                                            <>
                                                                <input required placeholder="DOT (Obrigatório)*" value={d.dot} onChange={e => atualizarDetalheBaixa(indexGeral, 'dot', e.target.value)} style={inputStyle} />
                                                                <input placeholder="Fogo (Opcional)" value={d.fogo} onChange={e => atualizarDetalheBaixa(indexGeral, 'fogo', e.target.value)} style={inputStyle} />
                                                                <input placeholder="Marca (Opcional)" value={d.marca} onChange={e => atualizarDetalheBaixa(indexGeral, 'marca', e.target.value)} style={inputStyle} />
                                                                <input required placeholder="Medida*" value={d.medida} onChange={e => atualizarDetalheBaixa(indexGeral, 'medida', e.target.value)} style={inputStyle} />
                                                                <input type="number" step="0.1" placeholder="Sulco (mm) (Opc)" value={d.sulco_novo} onChange={e => atualizarDetalheBaixa(indexGeral, 'sulco_novo', e.target.value)} style={inputStyle} />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <input required placeholder="Nº de Série (Obrigatório)*" value={d.serial} onChange={e => atualizarDetalheBaixa(indexGeral, 'serial', e.target.value)} style={inputStyle} />
                                                                <input placeholder="Nº Patrimônio (Opcional)" value={d.patrimonio} onChange={e => atualizarDetalheBaixa(indexGeral, 'patrimonio', e.target.value)} style={inputStyle} />
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <button type="submit" className="btn-add" style={{ marginTop: 10, padding: 15, background: '#ecc94b', color: 'black', fontWeight: 'bold' }}>
                                <CheckSquare size={20} style={{ display: 'inline', marginRight: 5 }} /> Confirmar Recebimento de Todos os Itens
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
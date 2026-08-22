import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

import FiltrosOrdensCompra from '../../components/compras/FiltrosOrdensCompra';
import TabelaOrdensCompra from '../../components/compras/TabelaOrdensCompra';
import ModalAprovarOrcamento from '../../components/compras/ModalAprovarOrcamento';
import ModalNovaOCManual from '../../components/compras/ModalNovaOCManual';
import ModalNovoItemEstoque from '../../components/compras/ModalNovoItemEstoque';
import ModalReceberOC from '../../components/compras/ModalReceberOC';

import { baixarListaPDF, imprimirOC } from '../../utils/pdfOrdensCompra';

export default function TabOrdensCompra({ orcAprovado, clearOrcAprovado }) {
    const { can, user } = useAuth();
    const queryClient = useQueryClient();

    const { data: ocs = [] } = useQuery({ queryKey: ['ocs'], queryFn: async () => (await api.get('/compras/oc')).data });
    const { data: fornecedores = [] } = useQuery({ queryKey: ['fornecedores'], queryFn: async () => (await api.get('/compras/fornecedores')).data });
    const { data: itensEstoque = [] } = useQuery({ queryKey: ['itensEstoque'], queryFn: async () => (await api.get('/estoque/itens/resumo')).data });
    const { data: tiposGasto = [] } = useQuery({ queryKey: ['tiposGasto'], queryFn: async () => (await api.get('/opcoes/tipos-gasto')).data });
    const { data: bases = [] } = useQuery({ queryKey: ['bases'], queryFn: async () => (await api.get('/bases')).data });
    const { data: veiculos = [] } = useQuery({ queryKey: ['veiculos'], queryFn: async () => (await api.get('/veiculos')).data });
    const { data: usuarios = [] } = useQuery({ queryKey: ['usuarios'], queryFn: async () => (await api.get('/usuarios')).data });
    const { data: servicosPadroes = [] } = useQuery({ queryKey: ['servicosPadroes'], queryFn: async () => (await api.get('/compras/servicos').catch(() => ({ data: [] }))).data });
    const { data: categoriasEstoque = [] } = useQuery({ queryKey: ['categoriasEstoque'], queryFn: async () => (await api.get('/estoque/categorias').catch(() => ({ data: [] }))).data });
    const { data: unidadesBD = [] } = useQuery({ queryKey: ['unidadesBD'], queryFn: async () => (await api.get('/estoque/unidades')).data });

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


    // --- ESCUTA A APROVAÇÃO VINDA DA TELA DE ORÇAMENTOS ---
    useEffect(() => {
        if (orcAprovado) {
            const sc = orcAprovado.sc;
            const orc = orcAprovado.orcamento;

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
    }, [orcAprovado, clearOrcAprovado]);


    const formatarM = (v) => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const getNomeEstoque = (estoque_item_id) => {
        const est = itensEstoque.find(e => e.id === estoque_item_id);
        return est ? est.nome : 'Produto Desconhecido';
    };

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

    const opcoesEstoque = itensEstoque.map(i => ({ value: i.id, label: `${i.nome} (${i.codigo_referencia})` }));

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
            toast.success("Ordem de Compra Emitida com Sucesso!");
            setModalAprovacao(false);
            queryClient.invalidateQueries({ queryKey: ['ocs'] });
        } catch (error) { toast.error("Erro ao emitir OC: " + (error.response?.data?.detail || error.message)); }
    }

    // --- LÓGICA DO CARRINHO OC MANUAL ---
    function adicionarItemOC() {
        if (!itemAtual.tipo_gasto) return toast.error("Selecione a Categoria/Tipo de Gasto.");
        if (itemAtual.classificacao === 'PRODUTO' && !itemAtual.estoque_item_id) return toast.error("Selecione um Produto do Estoque.");
        if (itemAtual.classificacao === 'SERVICO' && !itemAtual.nome_novo_item) return toast.error("Selecione ou Cadastre o Serviço.");
        if (!itemAtual.quantidade || !itemAtual.valor_unitario) return toast("Informe a quantidade e o valor unitário.");

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
        if (carrinhoItens.length === 0) return toast("Adicione itens à OC.");
        if (!formCapa.fornecedor_id) return toast.error("Selecione o fornecedor.");

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
            toast.success("OC Manual Criada com Sucesso!");
            setModalOCManual(false); queryClient.invalidateQueries({ queryKey: ['ocs'] });
        } catch (error) { toast.error("Erro ao criar OC: " + (error.response?.data?.detail || error.message)); }
    }

    async function handleCriarNovoItemEstoque(e) {
        e.preventDefault();
        if (!formNovoItem.categoria) return toast.error("Selecione ou digite a Categoria.");
        if (!formNovoItem.unidade_medida) return toast.error("Selecione ou digite a Unidade de Medida.");
        if (itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase())) {
            return toast("Já existe um item com este Código/SKU.");
        }
        try {
            const res = await api.post('/estoque/itens', formNovoItem);
            toast("Novo modelo cadastrado!");
            queryClient.invalidateQueries({ queryKey: ['itensEstoque'] });
            setModalNovoItemEstoque(false);
            setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: res.data.id });
        } catch (e) { toast.error("Erro."); }
    }

    async function handleCriarNovoServico() {
        const nome = prompt("Descreva o novo Serviço Padrão:");
        if (nome) {
            try {
                const res = await api.post('/compras/servicos', { nome });
                queryClient.invalidateQueries({ queryKey: ['servicosPadroes'] });
                setItemAtual({ ...itemAtual, classificacao: 'SERVICO', nome_novo_item: res.data.nome });
            } catch (e) { toast.error("Erro ao criar serviço. Talvez já exista."); }
        }
    }

    // --- RECEBIMENTO DE OC ---
    function abrirModalBaixa(oc) {
        const detalhesIniciais = [];
        oc.itens.forEach(item => {
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
            toast.success("Recebimento Concluído! O estoque e o financeiro foram atualizados.");
            setModalBaixa(false);
            queryClient.invalidateQueries({ queryKey: ['ocs'] });
        } catch (error) { toast.error("Erro no recebimento: " + (error.response?.data?.detail || error.message)); }
    }

    function atualizarDetalheBaixa(idxGeral, campo, valor) {
        const novosDet = [...dadosBaixa.detalhes];
        novosDet[idxGeral][campo] = valor;
        setDadosBaixa({ ...dadosBaixa, detalhes: novosDet });
    }

    function abrirModalOCManual() {
        setFormCapa({ fornecedor_id: '', centro_custo_id: '', veiculo_id: '', colaborador_id: '', litros: '', km_atual: '', prazo_entrega: '', prazo_pagamento: '', tipo_pagamento: '', frete: '0', desconto: '0', observacoes: '' });
        setCarrinhoItens([]);
        setItemAtual({ tipo_gasto: '', classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '', quantidade: '', valor_unitario: '' });
        setModalOCManual(true);
    }

    return (
        <div style={{ paddingTop: 10 }}>
            <FiltrosOrdensCompra
                busca={busca} setBusca={setBusca}
                filtroData={filtroData} setFiltroData={setFiltroData}
                filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
                statusList={statusList}
                baixarListaPDF={() => baixarListaPDF(dadosFiltrados)}
                can={can}
                abrirModalOCManual={abrirModalOCManual}
            />

            <TabelaOrdensCompra
                dadosPaginados={dadosPaginados}
                dadosFiltrados={dadosFiltrados}
                formatarM={formatarM}
                abrirModalBaixa={abrirModalBaixa}
                imprimirOC={(oc) => imprimirOC(oc, getNomeEstoque, user)}
                can={can}
                visibleCount={visibleCount}
                setVisibleCount={setVisibleCount}
            />

            <ModalAprovarOrcamento
                modalAprovacao={modalAprovacao} setModalAprovacao={setModalAprovacao}
                formAprovacao={formAprovacao} setFormAprovacao={setFormAprovacao}
                bases={bases} salvarAprovacao={salvarAprovacao} clearOrcAprovado={clearOrcAprovado}
            />

            <ModalNovaOCManual
                modalOCManual={modalOCManual} setModalOCManual={setModalOCManual}
                formCapa={formCapa} setFormCapa={setFormCapa}
                carrinhoItens={carrinhoItens} setCarrinhoItens={setCarrinhoItens}
                itemAtual={itemAtual} setItemAtual={setItemAtual}
                tiposGasto={tiposGasto} fornecedores={fornecedores}
                veiculos={veiculos} usuarios={usuarios} bases={bases}
                opcoesEstoque={opcoesEstoque} servicosPadroes={servicosPadroes}
                adicionarItemOC={adicionarItemOC} salvarOCManual={salvarOCManual}
                handleCriarNovoServico={handleCriarNovoServico}
                setModalNovoItemEstoque={setModalNovoItemEstoque}
                regrasManual={regrasManual} formatarM={formatarM}
            />

            <ModalNovoItemEstoque
                modalNovoItemEstoque={modalNovoItemEstoque} setModalNovoItemEstoque={setModalNovoItemEstoque}
                formNovoItem={formNovoItem} setFormNovoItem={setFormNovoItem}
                categoriasEstoque={categoriasEstoque} unidadesBD={unidadesBD}
                itensEstoque={itensEstoque} handleCriarNovoItemEstoque={handleCriarNovoItemEstoque}
            />

            <ModalReceberOC
                modalBaixa={modalBaixa} setModalBaixa={setModalBaixa}
                ocRecebendo={ocRecebendo} dadosBaixa={dadosBaixa} setDadosBaixa={setDadosBaixa}
                itensEstoque={itensEstoque} handleConfirmarBaixa={handleConfirmarBaixa}
                atualizarDetalheBaixa={atualizarDetalheBaixa}
            />
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

import FiltrosSolicitacoes from '../../components/compras/FiltrosSolicitacoes';
import TabelaSolicitacoes from '../../components/compras/TabelaSolicitacoes';
import ModalNovaSolicitacao from '../../components/compras/ModalNovaSolicitacao';
import ModalResumoSolicitacao from '../../components/compras/ModalResumoSolicitacao';
import ModalNovoItemEstoque from '../../components/compras/ModalNovoItemEstoque';

import { baixarListaPDF, baixarResumoPDF } from '../../utils/pdfSolicitacoes';

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
                api.get('/compras/sc'), api.get('/estoque/itens/resumo'), api.get('/opcoes/tipos-gasto'),
                api.get('/veiculos'), api.get('/usuarios'), api.get('/bases'),
                api.get('/estoque/categorias').catch(() => ({ data: [] })), api.get('/compras/servicos').catch(() => ({ data: [] })),
                api.get('/estoque/unidades')
            ]);
            setLista(resSC.data); setItensEstoque(resEst.data); setTiposGasto(resTipos.data);
            setVeiculos(resVeic.data); setUsuarios(resUsu.data); setBases(resBas.data);
            setCategoriasEstoque(resCat.data); setServicosPadroes(resServ.data);
            setUnidadesBD(resUnid.data);
        } catch (error) { console.error("Erro ao carregar", error); }
    }

    const getNomeItem = (item) => {
        if (!item) return 'Produto Desconhecido';
        if (item.tipo_item === 'PRODUTO' || item.classificacao === 'PRODUTO') {
            const idBusca = item.estoque_item_id;
            const itemBd = itensEstoque.find(e => e.id === idBusca);
            return itemBd ? itemBd.nome : 'Produto Desconhecido';
        }
        return item.nome_novo_item || 'Produto Desconhecido';
    };

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

    function adicionarItemAoCarrinho() {
        if (!itemAtual.tipo_gasto) return toast.error("Selecione a Categoria/Tipo de Gasto.");
        if (itemAtual.classificacao === 'PRODUTO' && !itemAtual.estoque_item_id) return toast.error("Selecione um Produto do Estoque.");
        if (itemAtual.classificacao === 'SERVICO' && !itemAtual.nome_novo_item) return toast.error("Selecione ou Cadastre o Serviço.");
        if (!itemAtual.quantidade || itemAtual.quantidade <= 0) return toast("Informe a quantidade válida.");

        const nomeParaMostrar = getNomeItem(itemAtual);

        setCarrinhoItens([...carrinhoItens, { ...itemAtual, nome_exibicao: nomeParaMostrar }]);
        setItemAtual({ ...itemAtual, estoque_item_id: '', nome_novo_item: '', quantidade: '' });
    }

    function removerItemDoCarrinho(index) {
        const novoCarrinho = [...carrinhoItens];
        novoCarrinho.splice(index, 1);
        setCarrinhoItens(novoCarrinho);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (carrinhoItens.length === 0) return toast("Adicione pelo menos um item à solicitação!");
        if (!formCapa.local_entrega_id) return toast.error("Selecione o local de entrega.");

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

        Object.keys(payload).forEach(k => {
            if (payload[k] === '') payload[k] = null;
        });

        try {
            if (formCapa.id) {
                await api.put(`/compras/sc/${formCapa.id}`, payload);
                toast("SC atualizada!");
            } else {
                await api.post('/compras/sc', payload);
                toast.success("SC Criada com sucesso!");
            }
            setModalAberto(false);
            carregarDados();
        } catch (error) {
            const det = error.response?.data?.detail;
            const msgErro = typeof det === 'object' ? JSON.stringify(det) : (det || error.message);
            toast.error("Erro: " + msgErro);
        }
    }

    async function handleCriarNovoItemEstoque(e) {
        e.preventDefault();
        if (!formNovoItem.categoria) return toast.error("Por favor, selecione ou digite a Categoria.");
        if (!formNovoItem.unidade_medida) return toast.error("Por favor, selecione ou digite a Unidade de Medida.");

        if (itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase())) {
            return toast("Já existe um item com este Código/SKU.");
        }

        try {
            const res = await api.post('/estoque/itens', formNovoItem);
            toast("Novo modelo cadastrado no estoque!");
            setItensEstoque([...itensEstoque, res.data]);
            setModalNovoItemEstoque(false);
            setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: res.data.id });
        } catch (error) { toast.error("Erro ao criar item: " + (error.response?.data?.detail || error.message)); }
    }

    async function handleCriarNovoServico() {
        const nome = prompt("Descreva o novo Serviço Padrão:");
        if (nome) {
            try {
                const res = await api.post('/compras/servicos', { nome });
                setServicosPadroes([...servicosPadroes, res.data]);
                setItemAtual({ ...itemAtual, classificacao: 'SERVICO', nome_novo_item: res.data.nome });
            } catch (e) { toast.error("Erro ao criar serviço. Talvez já exista."); }
        }
    }

    function abrirModalEdicao(sc) {
        setScSelecionada(null);
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
        try { await api.delete(`/compras/sc/${id}`); carregarDados(); } catch (e) { toast.error("Erro."); }
    }

    function abrirModalNovaSC() {
        setFormCapa({ id: null, local_entrega_id: '', observacoes: '', data_necessidade: '', veiculo_id: '', colaborador_id: '' });
        setCarrinhoItens([]);
        setItemAtual({ tipo_gasto: '', classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '', quantidade: '' });
        setModalAberto(true);
    }

    const opcoesEstoque = itensEstoque.map(i => ({ value: i.id, label: `${i.nome} (${i.codigo_referencia})` }));

    return (
        <div style={{ paddingTop: 10 }}>
            <FiltrosSolicitacoes
                busca={busca} setBusca={setBusca}
                filtroData={filtroData} setFiltroData={setFiltroData}
                filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
                statusList={statusList}
                baixarListaPDF={() => baixarListaPDF(dadosFiltrados, getNomeItem)}
                can={can}
                abrirModalNovaSC={abrirModalNovaSC}
            />

            <TabelaSolicitacoes
                dadosPaginados={dadosPaginados}
                dadosFiltrados={dadosFiltrados}
                visibleCount={visibleCount}
                setVisibleCount={setVisibleCount}
                getNomeItem={getNomeItem}
                setScSelecionada={setScSelecionada}
                baixarResumoPDF={(sc) => baixarResumoPDF(sc, bases, getNomeItem)}
                abrirModalEdicao={abrirModalEdicao}
                handleDelete={handleDelete}
                onCriarOrcamento={onCriarOrcamento}
                can={can}
            />

            <ModalNovaSolicitacao
                modalAberto={modalAberto}
                setModalAberto={setModalAberto}
                formCapa={formCapa}
                setFormCapa={setFormCapa}
                bases={bases}
                veiculos={veiculos}
                usuarios={usuarios}
                itemAtual={itemAtual}
                setItemAtual={setItemAtual}
                tiposGasto={tiposGasto}
                opcoesEstoque={opcoesEstoque}
                servicosPadroes={servicosPadroes}
                setModalNovoItemEstoque={setModalNovoItemEstoque}
                handleCriarNovoServico={handleCriarNovoServico}
                adicionarItemAoCarrinho={adicionarItemAoCarrinho}
                carrinhoItens={carrinhoItens}
                removerItemDoCarrinho={removerItemDoCarrinho}
                handleSubmit={handleSubmit}
            />

            <ModalResumoSolicitacao
                scSelecionada={scSelecionada}
                setScSelecionada={setScSelecionada}
                bases={bases}
                getNomeItem={getNomeItem}
                baixarResumoPDF={(sc) => baixarResumoPDF(sc, bases, getNomeItem)}
                onCriarOrcamento={onCriarOrcamento}
                abrirModalEdicao={abrirModalEdicao}
                handleDelete={handleDelete}
                can={can}
            />

            {/* Reaproveitamento do componente de estoque extraído anteriormente */}
            <ModalNovoItemEstoque
                modalNovoItemEstoque={modalNovoItemEstoque}
                setModalNovoItemEstoque={setModalNovoItemEstoque}
                formNovoItem={formNovoItem}
                setFormNovoItem={setFormNovoItem}
                categoriasEstoque={categoriasEstoque}
                unidadesBD={unidadesBD}
                itensEstoque={itensEstoque}
                handleCriarNovoItemEstoque={handleCriarNovoItemEstoque}
            />
        </div>
    );
}
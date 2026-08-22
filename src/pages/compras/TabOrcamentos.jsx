import React, { useState, useEffect } from 'react';
import api, { baseURL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

import FiltrosOrcamentos from '../../components/compras/FiltrosOrcamentos';
import TabelaOrcamentos from '../../components/compras/TabelaOrcamentos';
import ModalNovaCotacao from '../../components/compras/ModalNovaCotacao';
import ModalComparativoOrcamentos from '../../components/compras/ModalComparativoOrcamentos';

import { baixarListaPDF, baixarComparativoPDF } from '../../utils/pdfComparativoOrcamentos';

export default function TabOrcamentos({ scPreSelecionada, clearScPreSelecionada, onAprovar }) {
    const { can } = useAuth();
    const [todasScs, setTodasScs] = useState([]);
    const [orcamentos, setOrcamentos] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [itensEstoque, setItensEstoque] = useState([]);
    const [bases, setBases] = useState([]);

    const [scsPendentes, setScsPendentes] = useState([]);
    const [scsComOrcamentos, setScsComOrcamentos] = useState([]);

    const [busca, setBusca] = useState('');
    const [filtroData, setFiltroData] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');

    const statusList = ['Em Análise', 'Orçamento Aprovado', 'Orçamento Reprovado'];

    const [modalAberto, setModalAberto] = useState(false);
    const [scSelecionadaId, setScSelecionadaId] = useState('');
    const [formOrcamentos, setFormOrcamentos] = useState([]);

    const [modalDetalhes, setModalDetalhes] = useState(null);
    const isEditando = formOrcamentos.some(o => o.id);

    useEffect(() => { carregarDados(); }, []);

    useEffect(() => {
        if (scPreSelecionada && todasScs.length > 0) {
            abrirModalCotacao(scPreSelecionada);
            clearScPreSelecionada();
        }
    }, [scPreSelecionada, todasScs]);

    async function carregarDados() {
        try {
            const [resSC, resOrc, resForn, resEst, resBas] = await Promise.all([
                api.get('/compras/sc'),
                api.get('/compras/orcamentos'),
                api.get('/compras/fornecedores'),
                api.get('/estoque/itens/resumo'),
                api.get('/bases')
            ]);

            setTodasScs(resSC.data);
            setOrcamentos(resOrc.data);
            setFornecedores(resForn.data.filter(f => f.status === 'Ativo'));
            setItensEstoque(resEst.data);
            setBases(resBas.data);

            setScsPendentes(resSC.data.filter(s => s.status === 'Em Análise' || s.status === 'Orçamento Reprovado'));

            const scIdsComOrc = [...new Set(resOrc.data.map(o => o.solicitacao_id))];
            setScsComOrcamentos(resSC.data.filter(s => scIdsComOrc.includes(s.id)));
        } catch (error) { console.error("Erro ao carregar orçamentos", error); }
    }

    const getNomeItem = (item) => {
        if (!item) return 'Produto Desconhecido';
        if (item.tipo_item === 'PRODUTO' || item.tipo_item === 'ESTOQUE' || item.classificacao === 'PRODUTO' || item.classificacao === 'ESTOQUE') {
            const idBusca = item.estoque_item_id;
            const itemBd = itensEstoque.find(e => e.id === idBusca);
            return itemBd ? itemBd.nome : 'Produto Desconhecido';
        }
        return item.nome_novo_item || 'Produto Desconhecido';
    };

    const dadosFiltrados = scsComOrcamentos.filter(sc => {
        const termo = busca.toLowerCase();
        const matchTexto = (sc.numero || '').toLowerCase().includes(termo) || (sc.local_entrega?.nome || '').toLowerCase().includes(termo) || sc.itens.some(i => getNomeItem(i).toLowerCase().includes(termo));
        const matchStatus = filtroStatus ? sc.status?.toLowerCase() === filtroStatus.toLowerCase() : true;
        const dataCriacao = sc.data_necessidade ? sc.data_necessidade.split('T')[0] : '';
        const matchData = filtroData ? dataCriacao === filtroData : true;
        return matchTexto && matchStatus && matchData;
    });

    function gerarOrcamentoVazio(sc) {
        return {
            id: null, fornecedor_id: '', frete: '0', prazo_entrega: '', prazo_pagamento: '',
            tipo_pagamento: '', obs: '', arquivo: null, arquivo_url: null,
            itens: sc.itens.map(i => ({ solicitacao_item_id: i.id, nome_exibicao: getNomeItem(i), quantidade: i.quantidade, valor_unitario: '' }))
        };
    }

    function mapearOrcamentoExistente(orc, sc) {
        return {
            id: orc.id, fornecedor_id: orc.fornecedor_id || '', frete: orc.frete || '0',
            prazo_entrega: orc.prazo_entrega ? orc.prazo_entrega.substring(0, 10) : '',
            prazo_pagamento: orc.prazo_pagamento ? orc.prazo_pagamento.substring(0, 10) : '',
            tipo_pagamento: orc.tipo_pagamento || '', obs: orc.observacoes || '', arquivo: null, arquivo_url: orc.anexo_path,
            itens: sc.itens.map(scItem => {
                const orcItem = orc.itens?.find(oi => oi.solicitacao_item_id === scItem.id);
                return { solicitacao_item_id: scItem.id, nome_exibicao: getNomeItem(scItem), quantidade: scItem.quantidade, valor_unitario: orcItem ? orcItem.valor_unitario : '' };
            })
        };
    }

    function abrirModalNovaCotacao() {
        setScSelecionadaId(''); setFormOrcamentos([]); setModalAberto(true);
    }

    function abrirModalCotacao(scId) {
        if (!scId) { setScSelecionadaId(''); setFormOrcamentos([]); return; }
        const sc = todasScs.find(s => s.id === parseInt(scId));
        if (!sc) return;

        setScSelecionadaId(sc.id);
        const orcsDestaSc = orcamentos.filter(o => o.solicitacao_id === sc.id);

        if (orcsDestaSc.length > 0) {
            const orcsMapeados = orcsDestaSc.map(o => mapearOrcamentoExistente(o, sc));
            while (orcsMapeados.length < 3) orcsMapeados.push(gerarOrcamentoVazio(sc));
            setFormOrcamentos(orcsMapeados);
        } else {
            setFormOrcamentos([gerarOrcamentoVazio(sc), gerarOrcamentoVazio(sc), gerarOrcamentoVazio(sc)]);
        }
        setModalAberto(true);
    }

    function addNovaOpcaoCotacao() {
        const sc = todasScs.find(s => s.id === parseInt(scSelecionadaId));
        setFormOrcamentos([...formOrcamentos, gerarOrcamentoVazio(sc)]);
    }

    function removerOpcaoCotacao(index) {
        if (formOrcamentos.length <= 3) return toast("O sistema exige um mínimo de 3 opções de cotação na tela.");
        const novos = [...formOrcamentos]; novos.splice(index, 1); setFormOrcamentos(novos);
    }

    function handleChange(orcIndex, field, value) {
        const novos = [...formOrcamentos]; novos[orcIndex][field] = value; setFormOrcamentos(novos);
    }

    function handleItemChange(orcIndex, itemIndex, value) {
        const novos = [...formOrcamentos]; novos[orcIndex].itens[itemIndex].valor_unitario = value; setFormOrcamentos(novos);
    }

    function handleFileChange(orcIndex, file) {
        const novos = [...formOrcamentos]; novos[orcIndex].arquivo = file; setFormOrcamentos(novos);
    }

    async function salvarOrcamentos(e) {
        e.preventDefault();
        try {
            let enviadas = 0;
            for (let i = 0; i < formOrcamentos.length; i++) {
                const o = formOrcamentos[i];
                if (!o.fornecedor_id) continue;

                const itensValidos = o.itens.map(it => ({ solicitacao_item_id: it.solicitacao_item_id, valor_unitario: it.valor_unitario || 0 }));
                const formData = new FormData();
                formData.append('solicitacao_id', scSelecionadaId); formData.append('fornecedor_id', o.fornecedor_id); formData.append('frete', o.frete);
                if (o.prazo_entrega) formData.append('prazo_entrega', o.prazo_entrega);
                if (o.prazo_pagamento) formData.append('prazo_pagamento', o.prazo_pagamento);
                if (o.tipo_pagamento) formData.append('tipo_pagamento', o.tipo_pagamento);
                if (o.obs) formData.append('observacoes', o.obs);
                if (o.arquivo) formData.append('arquivo', o.arquivo);
                formData.append('itens', JSON.stringify(itensValidos));

                if (o.id) await api.put(`/compras/orcamentos/${o.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                else await api.post('/compras/orcamentos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                enviadas++;
            }
            if (enviadas === 0) return toast.error("Preencha o Fornecedor e os Valores de pelo menos uma cotação.");
            toast.success("Orçamentos salvos com sucesso!"); setModalAberto(false); carregarDados();
        } catch (error) { toast.error("Erro ao salvar: " + error.message); }
    }

    async function excluirOrcamentoUnico(orcId, index) {
        if (!confirm("Remover esta cotação do sistema?")) return;
        if (orcId) {
            try {
                await api.delete(`/compras/orcamentos/${orcId}`);
                const novos = [...formOrcamentos]; novos.splice(index, 1);
                if (novos.length < 3) novos.push(gerarOrcamentoVazio(todasScs.find(s => s.id === parseInt(scSelecionadaId))));
                setFormOrcamentos(novos); carregarDados();
            } catch (e) { toast.error("Erro ao excluir."); }
        } else { removerOpcaoCotacao(index); }
    }

    const calcularTotalOrcamento = (orc) => {
        const sumItens = orc.itens.reduce((acc, i) => acc + (parseFloat(i.quantidade || 0) * parseFloat(String(i.valor_unitario || 0).replace(',', '.') || 0)), 0);
        const vFrete = parseFloat(String(orc.frete || 0).replace(',', '.') || 0);
        return sumItens + vFrete;
    };

    const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div style={{ paddingTop: 10 }}>
            <FiltrosOrcamentos
                busca={busca} setBusca={setBusca}
                filtroData={filtroData} setFiltroData={setFiltroData}
                filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
                statusList={statusList}
                baixarListaPDF={() => baixarListaPDF(dadosFiltrados, orcamentos)}
                can={can}
                abrirModalNovaCotacao={abrirModalNovaCotacao}
            />

            <TabelaOrcamentos
                dadosFiltrados={dadosFiltrados}
                orcamentos={orcamentos}
                setModalDetalhes={setModalDetalhes}
                baixarComparativoPDF={(sc) => baixarComparativoPDF(sc, orcamentos, bases, getNomeItem)}
                abrirModalCotacao={abrirModalCotacao}
                can={can}
            />

            <ModalNovaCotacao
                modalAberto={modalAberto}
                setModalAberto={setModalAberto}
                isEditando={isEditando}
                salvarOrcamentos={salvarOrcamentos}
                scSelecionadaId={scSelecionadaId}
                abrirModalCotacao={abrirModalCotacao}
                scsPendentes={scsPendentes}
                todasScs={todasScs}
                bases={bases}
                formOrcamentos={formOrcamentos}
                handleChange={handleChange}
                handleItemChange={handleItemChange}
                handleFileChange={handleFileChange}
                excluirOrcamentoUnico={excluirOrcamentoUnico}
                addNovaOpcaoCotacao={addNovaOpcaoCotacao}
                fornecedores={fornecedores}
                formatarMoeda={formatarMoeda}
                calcularTotalOrcamento={calcularTotalOrcamento}
            />

            <ModalComparativoOrcamentos
                modalDetalhes={modalDetalhes}
                setModalDetalhes={setModalDetalhes}
                orcamentos={orcamentos}
                bases={bases}
                getNomeItem={getNomeItem}
                formatarMoeda={formatarMoeda}
                can={can}
                onAprovar={onAprovar}
                baseURL={baseURL}
            />
        </div>
    );
}
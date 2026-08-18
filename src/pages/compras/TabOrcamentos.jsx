// Arquivo: frontend/src/pages/compras/TabOrcamentos.jsx
import React, { useState, useEffect } from 'react';
import api, { baseURL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Paperclip, CheckCircle, Trash2, X, PlusCircle, Eye, Edit, Truck, Calendar, DollarSign, Download, Search, FileDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };
const tableHeaderStyle = { padding: '10px', textAlign: 'left', color: 'white', fontSize: '0.9rem', borderBottom: '2px solid #4a5568' };

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
                api.get('/estoque/itens'),
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
        if (item.tipo_item === 'PRODUTO' || item.tipo_item === 'ESTOQUE' || item.classificacao === 'PRODUTO' || item.classificacao === 'ESTOQUE') {
            const idBusca = item.estoque_item_id;
            const itemBd = itensEstoque.find(e => e.id === idBusca);
            return itemBd ? itemBd.nome : 'Produto Desconhecido';
        }
        return item.nome_novo_item;
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
        const sc = todasScs.find(s => s.id === scSelecionadaId);
        setFormOrcamentos([...formOrcamentos, gerarOrcamentoVazio(sc)]);
    }

    function removerOpcaoCotacao(index) {
        if (formOrcamentos.length <= 3) return alert("O sistema exige um mínimo de 3 opções de cotação na tela.");
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
            if (enviadas === 0) return alert("Preencha o Fornecedor e os Valores de pelo menos uma cotação.");
            alert("Orçamentos salvos com sucesso!"); setModalAberto(false); carregarDados();
        } catch (error) { alert("Erro ao salvar: " + error.message); }
    }

    async function excluirOrcamentoUnico(orcId, index) {
        if (!confirm("Remover esta cotação do sistema?")) return;
        if (orcId) {
            try {
                await api.delete(`/compras/orcamentos/${orcId}`);
                const novos = [...formOrcamentos]; novos.splice(index, 1);
                if (novos.length < 3) novos.push(gerarOrcamentoVazio(todasScs.find(s => s.id === scSelecionadaId)));
                setFormOrcamentos(novos); carregarDados();
            } catch (e) { alert("Erro ao excluir."); }
        } else { removerOpcaoCotacao(index); }
    }

    const calcularTotalOrcamento = (orc) => {
        const sumItens = orc.itens.reduce((acc, i) => acc + (parseFloat(i.quantidade || 0) * parseFloat(String(i.valor_unitario || 0).replace(',', '.') || 0)), 0);
        const vFrete = parseFloat(String(orc.frete || 0).replace(',', '.') || 0);
        return sumItens + vFrete;
    };

    const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

    const baixarComparativoPDF = async (sc) => {
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
        doc.text(`Comparativo de Cotações - SC ${sc.numero}`, 14, 25);

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

        // 5. Dados da SC (O Pedido Original)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Referência: Pedido Original", 14, 60);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        // --- AQUI VAI A DATA E HORA DE CRIAÇÃO ORIGINAL ---
        // A letra 'Z' no final força o JavaScript a converter do horário Global (UTC) para o horário do Brasil
        const dataCriacao = sc.data_criacao ? new Date(sc.data_criacao.endsWith('Z') ? sc.data_criacao : `${sc.data_criacao}Z`) : null;
        const strDataCriacao = dataCriacao ? `${dataCriacao.toLocaleDateString('pt-BR')} às ${dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-';
        doc.text(`Data e hora da criação: ${strDataCriacao}`, 14, 65);

        doc.text(`Solicitante: ${sc.solicitante?.nome || 'Sistema'}`, 14, 70);
        const localNome = sc.local_entrega?.nome || (bases && bases.length > 0 && bases.find(b => b.id == sc.local_entrega_id)?.nome) || '-';
        doc.text(`Entrega: ${localNome}`, 14, 75);

        let currentY = 90; // Descemos o Y para iniciar os itens
        const orcsDesta = orcamentos.filter(o => o.solicitacao_id === sc.id);

        if (orcsDesta.length === 0) {
            doc.text("Nenhuma cotação registrada para esta solicitação.", 14, currentY);
            doc.save(`Comparativo_SC_${sc.numero}.pdf`);
            return;
        }

        // 6. Loop detalhado por cada Orçamento
        for (let i = 0; i < orcsDesta.length; i++) {
            const orc = orcsDesta[i];

            // Quebra de página se estiver chegando no fim
            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0);

            // Destaque se for o aprovado
            const statusTexto = orc.status === 'Aprovado' ? " [VENCEDOR]" : "";
            doc.text(`Opção ${i + 1} - Fornecedor: ${orc.fornecedor?.razao_social || 'Desconhecido'}${statusTexto}`, 14, currentY);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            currentY += 5;
            doc.text(`Pagamento: ${orc.tipo_pagamento || '-'} | Prazo Entrega: ${orc.prazo_entrega ? new Date(orc.prazo_entrega).toLocaleDateString('pt-BR') : '-'}`, 14, currentY);
            currentY += 5;
            doc.text(`Obs: ${orc.observacoes || 'Nenhuma'}`, 14, currentY);

            currentY += 5;

            // Monta os itens desta cotação
            const tableData = orc.itens.map(oi => {
                const scRef = sc.itens.find(item => item.id === oi.solicitacao_item_id);
                const qtd = scRef ? scRef.quantidade : 1;
                const nome = getNomeItem(scRef || oi);
                return [nome, qtd, formatarMoeda(oi.valor_unitario), formatarMoeda(qtd * oi.valor_unitario)];
            });

            // Adiciona Frete como última linha da tabela
            tableData.push([{ content: 'FRETE ESTIMADO', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, formatarMoeda(orc.frete)]);
            // Adiciona Total da Cotação
            tableData.push([{ content: 'TOTAL DA COTAÇÃO', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: formatarMoeda(orc.valor_total), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);

            autoTable(doc, {
                startY: currentY,
                head: [['Item', 'Qtd', 'V. Unit', 'Subtotal']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [74, 85, 104], textColor: [255, 255, 255] }, // Cinza escuro
                styles: { fontSize: 8 }
            });

            currentY = doc.lastAutoTable.finalY + 15;
        }

        doc.save(`Comparativo_SC_${sc.numero}.pdf`);
    };

    const baixarListaPDF = () => {
        const doc = new jsPDF(); doc.text("Relatório de SCs Aguardando Aprovação", 14, 15);
        autoTable(doc, {
            startY: 20, head: [['Nº SC', 'Local Entrega', 'Data Limite', 'Qtd Cotações', 'Status']],
            body: dadosFiltrados.map(sc => [sc.numero, sc.local_entrega?.nome || '-', sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString() : '-', `${orcamentos.filter(o => o.solicitacao_id === sc.id).length} Fornecedores`, sc.status]),
            styles: { fontSize: 8 }
        });
        doc.save(`Aprovacoes_Pendentes_${new Date().getTime()}.pdf`);
    };

    return (
        <div style={{ paddingTop: 10 }}>
            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, alignItems: 'center', marginBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}><Calendar size={18} color="#a0aec0" style={{ marginRight: 10 }} /><input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}><Search size={18} color="#a0aec0" style={{ marginRight: 10 }} /><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar por Nº SC, Local..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} /></div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={baixarListaPDF} className="btn-add" style={{ flex: 1, background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><FileDown size={16} /> Baixar PDF</button>
                        {can('compras.orcamentos.criar') && (<button onClick={abrirModalNovaCotacao} className="btn-add" style={{ flex: 1, background: '#00d68f', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Plus size={18} /> Registrar Cotações (Múltiplas)</button>)}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 5 }}>
                    <button onClick={() => setFiltroStatus('')} style={{ padding: '5px 15px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: filtroStatus === '' ? '#00d68f' : '#1a202c', color: filtroStatus === '' ? '#000' : '#a0aec0', whiteSpace: 'nowrap' }}>Todos</button>
                    {statusList.map(s => (<button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: '5px 15px', borderRadius: 20, border: '1px solid #4a5568', cursor: 'pointer', background: filtroStatus === s ? '#63b3ed' : 'transparent', color: filtroStatus === s ? '#000' : '#a0aec0', whiteSpace: 'nowrap' }}>{s}</button>))}
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <h2>Aprovar Cotações Lançadas</h2>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Solicitação Origem</th><th>Local de Entrega</th><th>Data Limite</th><th>Nº de Cotações</th><th>Status da SC</th><th>Ações</th></tr></thead>
                        <tbody>
                            {dadosFiltrados.map(sc => {
                                const orcsDesta = orcamentos.filter(o => o.solicitacao_id === sc.id);
                                return (
                                    <tr key={sc.id}>
                                        <td style={{ fontWeight: 'bold', color: '#63b3ed' }}>{sc.numero}</td>
                                        <td>{sc.local_entrega?.nome || '-'}</td>
                                        <td style={{ color: sc.data_necessidade ? '#ecc94b' : '#a0aec0' }}>{sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data definida'}</td>
                                        <td><span style={{ background: '#4a5568', padding: '3px 8px', borderRadius: 10, fontSize: '0.8rem' }}>{orcsDesta.length} Fornecedores</span></td>
                                        <td><span className={`tag ${sc.status.replace(' ', '_')}`}>{sc.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button onClick={() => setModalDetalhes(sc)} title="Ver Cotações e Aprovar" className="btn-add" style={{ background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', padding: '5px 10px', fontSize: '0.8rem' }}><Eye size={14} style={{ marginRight: 5 }} /> Ver Cotações</button>
                                                <button onClick={() => baixarComparativoPDF(sc)} title="Baixar PDF" className="btn-add" style={{ background: 'transparent', border: '1px solid #a0aec0', color: '#a0aec0', padding: '5px 10px', fontSize: '0.8rem' }}><FileText size={14} /> PDF</button>
                                                {can('compras.orcamentos.criar') && sc.status !== 'Orçamento Aprovado' && (<button onClick={() => abrirModalCotacao(sc.id)} title="Editar Grupo de Cotações" style={{ background: '#ecc94b', border: 'none', color: 'black', padding: '5px 10px', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Edit size={16} /> Editar</button>)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {dadosFiltrados.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhuma cotação lançada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalAberto && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '1200px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #4a5568', paddingBottom: 15, marginBottom: 20 }}>
                            <h2 style={{ margin: 0 }}>{isEditando ? 'Editar Orçamentos' : 'Registrar Novos Orçamentos'}</h2>
                            <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                        </div>

                        <form onSubmit={salvarOrcamentos} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ marginBottom: 10, background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <label style={{ color: '#00d68f', fontWeight: 'bold', fontSize: '1.1rem', display: 'block', marginBottom: 10 }}>1. Selecione a Solicitação de Compra (SC):</label>
                                <select required value={scSelecionadaId} onChange={e => abrirModalCotacao(e.target.value)} disabled={isEditando} style={{ ...inputStyle, opacity: isEditando ? 0.7 : 1, fontSize: '1.1rem' }}>
                                    <option value="">Selecione uma SC pendente...</option>
                                    {scsPendentes.map(s => <option key={s.id} value={s.id}>SC-{s.numero} | Solicitante: {s.solicitante?.nome}</option>)}
                                    {scSelecionadaId && !scsPendentes.some(s => s.id === scSelecionadaId) && (<option value={scSelecionadaId}>SC Editada ({todasScs.find(s => s.id === scSelecionadaId)?.numero})</option>)}
                                </select>
                                {scSelecionadaId && (
                                    (() => {
                                        const scD = todasScs.find(s => s.id === parseInt(scSelecionadaId));
                                        if (!scD) return null;
                                        return (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, color: '#a0aec0', marginTop: 15, background: '#1a202c', padding: 15, borderRadius: 8, border: '1px solid #444' }}>
                                                <div>Data Limite de Necessidade: <strong style={{ color: scD.data_necessidade ? '#ecc94b' : 'white' }}>{scD.data_necessidade ? new Date(scD.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data definida'}</strong></div>
                                                <div>Local Entrega (Base): <strong style={{ color: 'white' }}>{scD.local_entrega?.nome || bases.find(b => b.id === scD.local_entrega_id)?.nome || '-'}</strong></div>
                                            </div>
                                        );
                                    })()
                                )}
                            </div>

                            {scSelecionadaId && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
                                    {formOrcamentos.map((orc, index) => (
                                        <div key={index} style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: index === 0 ? '2px solid #00d68f' : '1px solid #4a5568', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: 10, marginBottom: 15 }}>
                                                <h3 style={{ margin: 0, color: index === 0 ? '#00d68f' : '#63b3ed' }}>
                                                    {index === 0 ? 'Opção 1 (Principal)' : `Opção ${index + 1}`}
                                                    {orc.id && <span style={{ fontSize: '0.7rem', color: '#ecc94b', marginLeft: 10 }}>(Editando)</span>}
                                                </h3>
                                                {index > 0 && (<button type="button" onClick={() => excluirOrcamentoUnico(orc.id, index)} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><X size={18} /></button>)}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 15 }}>
                                                <div><label style={{ display: 'block', marginBottom: 5 }}>Fornecedor Concorrente <span style={{ color: '#e53e3e' }}>*</span></label><select required={index === 0 || !!orc.id} value={orc.fornecedor_id} onChange={e => handleChange(index, 'fornecedor_id', e.target.value)} style={inputStyle}><option value="">Selecione...</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.razao_social}</option>)}</select></div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Condição de Pagamento</label>
                                                        <select value={orc.tipo_pagamento} onChange={e => handleChange(index, 'tipo_pagamento', e.target.value)} style={inputStyle}><option value="">Selecione...</option><option value="À Vista">À Vista</option><option value="Boleto Bancário">Boleto Bancário</option><option value="Pix">Pix</option><option value="Cartão de Crédito">Cartão de Crédito</option><option value="A Prazo / Faturado">A Prazo / Faturado</option></select>
                                                    </div>
                                                    <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}><Calendar size={12} style={{ display: 'inline' }} /> Vencimento</label><input type="date" value={orc.prazo_pagamento} onChange={e => handleChange(index, 'prazo_pagamento', e.target.value)} style={inputStyle} /></div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                                                    <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}><Truck size={12} style={{ display: 'inline' }} /> Prazo Entrega</label><input type="date" value={orc.prazo_entrega} onChange={e => handleChange(index, 'prazo_entrega', e.target.value)} style={inputStyle} /></div>
                                                    <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Frete (R$)</label><input type="number" step="0.01" placeholder="0.00" value={orc.frete} onChange={e => handleChange(index, 'frete', e.target.value)} style={inputStyle} /></div>
                                                </div>
                                            </div>

                                            <div style={{ background: '#1a202c', padding: 15, borderRadius: 8, marginBottom: 15, overflowX: 'auto' }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '0.9rem' }}>Tabela de Preços Unitários</h4>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '280px' }}>
                                                    <thead><tr><th style={tableHeaderStyle}>Item</th><th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Qtd</th><th style={{ ...tableHeaderStyle, width: '110px' }}>V. Unit *</th></tr></thead>
                                                    <tbody>
                                                        {orc.itens.map((item, iIdx) => (
                                                            <tr key={iIdx} style={{ borderBottom: '1px solid #2d3748' }}>
                                                                <td style={{ padding: '8px 5px', fontSize: '0.8rem', color: '#e2e8f0' }}>{item.nome_exibicao}</td>
                                                                <td style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantidade}</td>
                                                                <td style={{ padding: '8px 5px' }}><input type="number" step="0.01" required={index === 0 || !!orc.id} placeholder="0.00" value={item.valor_unitario} onChange={e => handleItemChange(index, iIdx, e.target.value)} style={{ ...inputStyle, padding: '6px', fontSize: '0.85rem', minWidth: '80px' }} /></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Observação / Link</label><textarea rows="1" value={orc.obs} onChange={e => handleChange(index, 'obs', e.target.value)} style={inputStyle} /></div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}><Paperclip size={14} style={{ display: 'inline' }} /> Anexo {orc.id && "(Novo substitui)"}</label>
                                                    <input type="file" onChange={e => handleFileChange(index, e.target.files[0])} style={{ ...inputStyle, padding: '6px', fontSize: '0.8rem' }} accept=".pdf,.jpg,.jpeg,.png" />
                                                    {orc.arquivo_url && <a href={`${baseURL}/files/${orc.arquivo_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#63b3ed', display: 'block', marginTop: 5 }}>Ver arquivo salvo</a>}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 15, background: '#1a202c', padding: '10px 15px', borderRadius: 8, border: '1px solid #00d68f', textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase' }}>Total da Cotação</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#00d68f' }}>{formatarMoeda(calcularTotalOrcamento(orc))}</div>
                                            </div>
                                        </div>
                                    ))}

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                                        <button type="button" onClick={addNovaOpcaoCotacao} style={{ background: 'transparent', border: '2px dashed #4a5568', color: '#a0aec0', padding: '20px', borderRadius: 8, cursor: 'pointer', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                            <PlusCircle size={32} /><span>Adicionar Mais Opções</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {scSelecionadaId && (
                                <button type="submit" className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', background: '#00d68f', color: 'black', fontWeight: 'bold' }}>
                                    <CheckCircle style={{ display: 'inline', marginRight: 10 }} />
                                    {isEditando ? 'Salvar Alterações das Cotações' : 'Gravar Todas as Cotações'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETALHES (O OLHINHO) */}
            {modalDetalhes && (
                <div className="modal-overlay" onClick={() => setModalDetalhes(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a202c', width: '100%', maxWidth: '1200px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: 15, marginBottom: 20 }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#63b3ed' }}>Comparativo de Cotações - {modalDetalhes.numero}</h2>
                                <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Data Necessidade: {modalDetalhes.data_necessidade ? new Date(modalDetalhes.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Indefinida'}</span>
                            </div>
                            <button onClick={() => setModalDetalhes(null)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, color: '#a0aec0', marginBottom: 20, background: '#2d3748', padding: 15, borderRadius: 8 }}>
                            <div>Solicitante: <strong style={{ color: 'white' }}>{modalDetalhes.solicitante?.nome || 'Sistema'}</strong></div>
                            <div>Local de Entrega: <strong style={{ color: 'white' }}>{modalDetalhes.local_entrega?.nome || bases.find(b => b.id === modalDetalhes.local_entrega_id)?.nome || '-'}</strong></div>
                            <div>Observação Geral: <strong style={{ color: '#ecc94b' }}>{modalDetalhes.observacoes || 'Nenhuma'}</strong></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
                            {orcamentos.filter(o => o.solicitacao_id === modalDetalhes.id).map((orc, idx) => (
                                <div key={orc.id} style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: orc.status === 'Aprovado' ? '2px solid #00d68f' : '1px solid #4a5568', position: 'relative' }}>
                                    {orc.status === 'Aprovado' && <div style={{ position: 'absolute', top: -12, right: 10, background: '#00d68f', color: 'black', padding: '2px 10px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 'bold' }}>VENCEDOR</div>}

                                    <h3 style={{ margin: '0 0 15px 0', color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ background: '#4a5568', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>{idx + 1}</div>
                                        {orc.fornecedor?.razao_social}
                                    </h3>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 15, fontSize: '0.85rem', color: '#a0aec0' }}>
                                        <div style={{ background: '#1a202c', padding: '5px 10px', borderRadius: 4 }}><DollarSign size={12} /> {orc.tipo_pagamento || 'N/I'}</div>
                                        {orc.prazo_pagamento && <div style={{ background: '#1a202c', padding: '5px 10px', borderRadius: 4 }}><Calendar size={12} /> Pgmto: {new Date(orc.prazo_pagamento).toLocaleDateString('pt-BR')}</div>}
                                    </div>

                                    <div style={{ background: '#1a202c', borderRadius: 5, padding: 10, marginBottom: 15 }}>
                                        {orc.itens.map(oi => {
                                            const scRef = modalDetalhes.itens.find(i => i.id === oi.solicitacao_item_id);
                                            const nome = getNomeItem(scRef);
                                            const qtd = scRef ? scRef.quantidade : 1;
                                            return (
                                                <div key={oi.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px dashed #4a5568', padding: '5px 0' }}>
                                                    <span style={{ color: '#e2e8f0' }}>{qtd}x {nome}</span>
                                                    <span style={{ color: '#a0aec0' }}>{formatarMoeda(oi.valor_unitario)}</span>
                                                </div>
                                            );
                                        })}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '5px' }}>
                                            <span style={{ color: '#e2e8f0' }}>Frete Estimado</span>
                                            <span style={{ color: '#a0aec0' }}>{formatarMoeda(orc.frete)}</span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#00d68f', textAlign: 'center', marginBottom: 15 }}>
                                        {formatarMoeda(orc.valor_total)}
                                    </div>

                                    {/* --- PRAZO E OBSERVAÇÕES E ANEXO AGRUPADOS AQUI --- */}
                                    <div style={{ background: '#1a202c', padding: '10px 15px', borderRadius: 5, marginBottom: 15 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, color: '#a0aec0', fontSize: '0.85rem' }}>
                                            <div>Prazo Entrega: <strong style={{ color: 'white' }}>{orc.prazo_entrega ? new Date(orc.prazo_entrega).toLocaleDateString('pt-BR') : 'A Combinar'}</strong></div>
                                            <div>Obs / Link: <strong style={{ color: '#ecc94b' }}>{orc.observacoes || 'Nenhuma'}</strong></div>
                                        </div>

                                        {orc.anexo_path && (
                                            <div style={{ marginTop: 10 }}>
                                                <a href={`${baseURL}/files/${encodeURI(orc.anexo_path)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#63b3ed', textDecoration: 'none', background: '#2d3748', padding: '5px 10px', borderRadius: 4, border: '1px solid #63b3ed' }}>
                                                    <Download size={14} /> Baixar Arquivo Anexo
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {modalDetalhes.status === 'Em Orçamento' && can('compras.orcamentos.aprovar') && (
                                        <button onClick={() => { setModalDetalhes(null); onAprovar({ sc: modalDetalhes, orcamento: orc }); }} className="btn-add" style={{ width: '100%', background: '#ecc94b', color: 'black', fontWeight: 'bold' }}>
                                            <CheckCircle size={18} style={{ marginRight: 5, display: 'inline' }} /> Aprovar Esta Cotação
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
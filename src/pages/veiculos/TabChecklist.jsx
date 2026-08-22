import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getLocalTodayString } from '../../utils/checklistHelpers.jsx';
import { exportarPDFResumido } from '../../utils/pdfChecklistResumido';
import { gerarRelatorioDetalhado } from '../../utils/checklistPdfGenerator';

import ChecklistsHeaderFiltros from '../../components/checklists/ChecklistsHeaderFiltros';
import ChecklistsTabela from '../../components/checklists/ChecklistsTabela';
import ModalPreencherChecklist from '../../components/checklists/ModalPreencherChecklist';
import ModalGerenciarItens from '../../components/checklists/ModalGerenciarItens';

export default function ChecklistMensal() {
    const { user, can } = useAuth();

    // PERMISSÕES
    const podeGerenciar = can('checklist.gerenciar');
    const podeRealizar = can('checklist.realizar');
    const podeAprovar = can('checklist.aprovar');
    const podeExcluir = can('checklist.excluir');
    const podeBaixar = can('checklist.baixar');

    // ESTADOS DE DADOS
    const [veiculosStatus, setVeiculosStatus] = useState([]);
    const [veiculosDetalhados, setVeiculosDetalhados] = useState([]);
    const [checklistItensDef, setChecklistItensDef] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // FILTROS
    const [filtroData, setFiltroData] = useState(getLocalTodayString().slice(0, 7));
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroBase, setFiltroBase] = useState(null);
    const [filtroResponsavel, setFiltroResponsavel] = useState(null);
    const [busca, setBusca] = useState('');

    // MODAIS E LOADING
    const [showModalChecklist, setShowModalChecklist] = useState(false);
    const [showModalGerenciar, setShowModalGerenciar] = useState(false);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // FORMULÁRIO DO CHECKLIST
    const [formData, setFormData] = useState({
        data_verificacao: getLocalTodayString(),
        usuario_id: '',
        status: 'FINALIZADO',
        respostas: {}
    });

    // FORMULÁRIO ADMIN (Gerenciar Itens)
    const [editingItem, setEditingItem] = useState(null);
    const [formItem, setFormItem] = useState({ nome_item: '', categoria: 'Geral', quantidade_padrao: 1, ativo: true });

    // CARREGAMENTO INICIAL
    useEffect(() => {
        carregarTudo();
    }, [filtroData]);

    useEffect(() => {
        if (user && !formData.usuario_id && showModalChecklist && !isReadOnly) {
            setFormData(prev => ({ ...prev, usuario_id: user.id }));
        }
    }, [user, showModalChecklist, isReadOnly]);

    async function carregarTudo() {
        try {
            const [ano, mes] = filtroData.split('-');
            const [resDash, resVeic, resDef, resUser] = await Promise.all([
                api.get(`/checklists/dashboard`, { params: { mes, ano } }),
                api.get('/veiculos/resumo'),
                api.get('/checklists/definicoes'),
                api.get('/usuarios/')
            ]);
            setVeiculosStatus(resDash.data);
            setVeiculosDetalhados(resVeic.data);
            setChecklistItensDef(resDef.data);
            setUsuarios(resUser.data);
        } catch (e) { console.error("Erro ao carregar dados", e); }
    }

    async function carregarDefinicoes() { 
        try { const res = await api.get('/checklists/definicoes'); setChecklistItensDef(res.data); } 
        catch (e) { } 
    }

    // LISTAS DE FILTROS E PERMISSÕES
    const uniqueBases = [...new Set(veiculosDetalhados.map(v => v.base).filter(Boolean))].sort().map(b => ({ value: b, label: b }));
    const uniqueResponsaveis = [...new Set(veiculosStatus.map(v => v.responsavel_nome).filter(Boolean))].sort().map(r => ({ value: r, label: r }));
    const usuariosFiltrados = (!podeGerenciar && !podeAprovar) ? usuarios.filter(u => u.id === user.id) : usuarios;

    const veiculosFiltrados = veiculosStatus.filter(v => {
        const veiculoCompleto = veiculosDetalhados.find(vd => vd.id === v.id);
        const matchBusca = v.placa.toLowerCase().includes(busca.toLowerCase()) || v.modelo.toLowerCase().includes(busca.toLowerCase());

        let matchStatus = true;
        if (filtroStatus === 'Realizado') matchStatus = v.status_checklist === 'FINALIZADO';
        else if (filtroStatus === 'Pendente') matchStatus = v.status_checklist === 'PENDENTE';
        else if (filtroStatus === 'NaoRealizado') matchStatus = !v.checklist_realizado && v.status_checklist !== 'PENDENTE';
        else if (filtroStatus === 'Aprovado') matchStatus = v.status_checklist === 'APROVADO';
        else if (filtroStatus === 'Reprovado') matchStatus = v.status_checklist === 'REPROVADO';

        const matchBase = !filtroBase || (veiculoCompleto && veiculoCompleto.base === filtroBase.value);
        const matchResp = !filtroResponsavel || v.responsavel_nome === filtroResponsavel.value;

        return matchBusca && matchStatus && matchBase && matchResp;
    });

    const itensPorCategoria = checklistItensDef.reduce((acc, item) => {
        if (!acc[item.categoria]) acc[item.categoria] = [];
        acc[item.categoria].push(item);
        return acc;
    }, {});

    // EVENTOS DOS BOTÕES
    function handleExportarResumido() { exportarPDFResumido(veiculosFiltrados, filtroData); }
    function handleExportarDetalhado() { gerarRelatorioDetalhado(veiculosFiltrados); }
    function handleExportarIndividual(veiculo) { gerarRelatorioDetalhado([veiculo]); }

    async function handleOpenChecklist(veiculo) {
        setVeiculoSelecionado(veiculo);
        if (veiculo.checklist_id) {
            await carregarDadosChecklist(veiculo.checklist_id);
            setIsReadOnly(false);
        } else {
            setIsReadOnly(false);
            const respostasIniciais = {};
            checklistItensDef.forEach(def => {
                for (let i = 1; i <= def.quantidade_padrao; i++) {
                    respostasIniciais[`${def.nome_item}_${i}`] = { status: '', observacao: '', categoria: def.categoria, foto: null };
                }
            });
            setFormData({
                data_verificacao: getLocalTodayString(),
                usuario_id: user?.id || '',
                status: 'FINALIZADO',
                respostas: respostasIniciais
            });
        }
        setShowModalChecklist(true);
    }

    async function handleVerChecklist(veiculo) {
        if (!veiculo.checklist_id) return;
        await carregarDadosChecklist(veiculo.checklist_id);
        setVeiculoSelecionado(veiculo);
        setIsReadOnly(true);
        setShowModalChecklist(true);
    }

    async function carregarDadosChecklist(id) {
        setLoading(true);
        try {
            const res = await api.get(`/checklists/${id}`);
            const dados = res.data;
            const respostasRecuperadas = {};

            checklistItensDef.forEach(def => {
                const chave = `${def.nome_item}_1`;
                respostasRecuperadas[chave] = { status: '', observacao: '', categoria: def.categoria, foto: null, foto_path: null };
            });

            if (dados.itens) {
                dados.itens.forEach(item => {
                    if (item.indice === 1) {
                        const chave = `${item.nome_item}_1`;
                        if (respostasRecuperadas[chave]) {
                            let statusBanco = item.status || '';
                            if (dados.status === 'PENDENTE' && statusBanco === 'N/A') statusBanco = '';
                            respostasRecuperadas[chave] = {
                                ...respostasRecuperadas[chave],
                                status: statusBanco,
                                observacao: item.observacao || '',
                                foto_path: item.foto_path
                            };
                        }
                    }
                });
            }

            setFormData({
                data_verificacao: dados.data_verificacao.slice(0, 10),
                usuario_id: dados.usuario_id,
                status: dados.status || 'FINALIZADO',
                respostas: respostasRecuperadas
            });
        } catch (error) { toast.error("Erro ao carregar checklist."); } 
        finally { setLoading(false); }
    }

    function handleRespostaChange(chave, campo, valor) {
        if (isReadOnly) return;
        setFormData(prev => ({ ...prev, respostas: { ...prev.respostas, [chave]: { ...prev.respostas[chave], [campo]: valor } } }));
    }

    function handleFileChange(chave, e) {
        if (isReadOnly) return;
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, respostas: { ...prev.respostas, [chave]: { ...prev.respostas[chave], foto: file } } }));
    }

    async function handleSubmitChecklist(e, statusFinal) {
        e.preventDefault();
        if (isReadOnly) return;

        if (statusFinal === 'FINALIZADO') {
            const itensFaltantes = [];
            Object.keys(formData.respostas).forEach(chave => {
                const resp = formData.respostas[chave];
                const partes = chave.split('_'); partes.pop();
                const nomeAmigavel = partes.join('_');
                if (!resp.status || resp.status === '') itensFaltantes.push(`- Status não selecionado: ${nomeAmigavel}`);
                if (!resp.foto && !resp.foto_path) itensFaltantes.push(`- Foto não anexada: ${nomeAmigavel}`);
            });

            if (itensFaltantes.length > 0) {
                const limiteErros = itensFaltantes.slice(0, 10).join('\n');
                const temMais = itensFaltantes.length > 10 ? `\n... e mais ${itensFaltantes.length - 10} pendências.` : '';
                return toast.error(`⚠️ NÃO É POSSÍVEL FINALIZAR.\n\nVocê precisa selecionar um status e anexar uma foto para TODOS os itens.\n\nPendências encontradas:\n${limiteErros}${temMais}`);
            }
        }

        setLoading(true);
        const itensParaSalvar = [];
        const filesToUpload = [];
        const defMap = new Map((checklistItensDef || []).map(d => [d.nome_item, d.quantidade_padrao || 1]));

        Object.keys(formData.respostas).forEach(chave => {
            const resp = formData.respostas[chave];
            const partes = chave.split('_');
            const indiceOriginal = parseInt(partes.pop());
            const nomeReal = partes.join('_');
            const qtdTotal = defMap.get(nomeReal) || 1;

            if (indiceOriginal === 1) {
                for (let i = 1; i <= qtdTotal; i++) {
                    itensParaSalvar.push({
                        nome_item: nomeReal,
                        categoria: resp.categoria,
                        indice: i,
                        quantidade_total: qtdTotal,
                        status: resp.status || '',
                        observacao: resp.observacao
                    });
                    if (resp.foto && i === 1) {
                        const extensao = resp.foto.name.split('.').pop();
                        const indexNaListaJson = itensParaSalvar.length - 1;
                        const novoNome = `item_${indexNaListaJson}.${extensao}`;
                        const arquivoRenomeado = new File([resp.foto], novoNome, { type: resp.foto.type });
                        filesToUpload.push(arquivoRenomeado);
                    }
                }
            }
        });

        const payloadJson = {
            id: veiculoSelecionado.checklist_id || null,
            veiculo_id: veiculoSelecionado.id,
            data_verificacao: formData.data_verificacao,
            usuario_id: formData.usuario_id,
            status: statusFinal,
            itens: itensParaSalvar
        };

        const dataToSend = new FormData();
        dataToSend.append('dados_json', JSON.stringify(payloadJson));
        filesToUpload.forEach(file => dataToSend.append('arquivos', file));

        try {
            await api.post('/checklists/', dataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast(statusFinal === 'PENDENTE' ? 'Rascunho salvo!' : 'Checklist finalizado!');
            setShowModalChecklist(false);
            carregarTudo();
        } catch (error) { toast.error("Erro ao salvar: " + (error.response?.data?.detail || error.message)); }
        finally { setLoading(false); }
    }

    async function handleStatusChange(novoStatus) {
        if (!confirm(`Confirma mudar o status para ${novoStatus}?`)) return;
        try {
            await api.patch(`/checklists/${veiculoSelecionado.checklist_id}/status`, { status: novoStatus });
            toast.success("Status atualizado!");
            setShowModalChecklist(false);
            carregarTudo();
        } catch (error) { toast.error("Erro ao atualizar status."); }
    }

    async function handleExcluirChecklist(id) {
        if (!confirm("Excluir este checklist realizado?")) return;
        try { await api.delete(`/checklists/${id}`); toast.success("Excluído!"); carregarTudo(); }
        catch (error) { toast.error("Erro ao excluir."); }
    }

    async function handleSaveItem(e) {
        e.preventDefault();
        try {
            if (editingItem) await api.put(`/checklists/definicoes/${editingItem.id}`, formItem);
            else await api.post('/checklists/definicoes', formItem);
            setEditingItem(null);
            setFormItem({ nome_item: '', categoria: 'Geral', quantidade_padrao: 1, ativo: true });
            carregarDefinicoes();
        } catch (error) { toast.error("Erro ao salvar item"); }
    }

    async function handleDeleteItem(id) {
        if (!confirm("Remover este item?")) return;
        try { await api.delete(`/checklists/definicoes/${id}`); carregarDefinicoes(); }
        catch (error) { toast.error("Erro ao excluir item"); }
    }

    function startEdit(item) {
        setEditingItem(item);
        setFormItem(item);
        setShowModalGerenciar(true);
    }

    return (
        <div>
            <ChecklistsHeaderFiltros 
                filtroData={filtroData} setFiltroData={setFiltroData}
                filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
                filtroBase={filtroBase} setFiltroBase={setFiltroBase} uniqueBases={uniqueBases}
                filtroResponsavel={filtroResponsavel} setFiltroResponsavel={setFiltroResponsavel} uniqueResponsaveis={uniqueResponsaveis}
                busca={busca} setBusca={setBusca}
                podeBaixar={podeBaixar} 
                exportarPDFResumido={handleExportarResumido} 
                handleExportarDetalhado={handleExportarDetalhado}
                podeGerenciar={podeGerenciar} 
                setShowModalGerenciar={setShowModalGerenciar}
            />

            <ChecklistsTabela 
                veiculosFiltrados={veiculosFiltrados}
                podeExcluir={podeExcluir} podeBaixar={podeBaixar} podeRealizar={podeRealizar}
                handleExcluirChecklist={handleExcluirChecklist}
                handleExportarIndividual={handleExportarIndividual}
                handleVerChecklist={handleVerChecklist}
                handleOpenChecklist={handleOpenChecklist}
            />

            <ModalPreencherChecklist 
                isOpen={showModalChecklist} 
                setShowModalChecklist={setShowModalChecklist}
                isReadOnly={isReadOnly}
                veiculoSelecionado={veiculoSelecionado}
                formData={formData} 
                setFormData={setFormData}
                podeGerenciar={podeGerenciar} 
                podeAprovar={podeAprovar} 
                usuariosFiltrados={usuariosFiltrados}
                itensPorCategoria={itensPorCategoria}
                handleRespostaChange={handleRespostaChange}
                handleFileChange={handleFileChange}
                handleSubmitChecklist={handleSubmitChecklist}
                handleStatusChange={handleStatusChange}
            />

            <ModalGerenciarItens 
                isOpen={showModalGerenciar} 
                setShowModalGerenciar={setShowModalGerenciar}
                checklistItensDef={checklistItensDef}
                formItem={formItem} 
                setFormItem={setFormItem}
                handleSaveItem={handleSaveItem}
                editingItem={editingItem}
                startEdit={startEdit}
                handleDeleteItem={handleDeleteItem}
            />
        </div>
    );
}
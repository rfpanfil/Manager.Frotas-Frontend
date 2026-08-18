// Arquivo: frontend/src/pages/veiculos/TabChecklist.jsx
import React, { useState, useEffect } from 'react';
import api, { baseURL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, CheckCircle, AlertCircle, Camera, Eye, Trash2, X, Plus, Save, Edit, FileText, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select'; // Necessário: npm install react-select
import { gerarRelatorioDetalhado } from '../../utils/checklistPdfGenerator';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import ptBR from 'date-fns/locale/pt-BR';

registerLocale('pt-BR', ptBR);

const MonthInput = React.forwardRef(function MonthInput({ value, onClick }, ref) {
    return (
        <input
            ref={ref}
            value={value || ""}
            readOnly
            onClick={onClick}
            style={{
                padding: "7px",
                borderRadius: 5,
                border: "1px solid #444",
                background: "#2d3748",
                color: "white",
                height: "38px",
                cursor: "pointer",
                fontFamily: "sans-serif",
                minWidth: 140,
            }}
        />
    );
});

// helpers (string YYYY-MM <-> Date)
function ymToDate(ym) {
    if (!ym) return null;
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, (m || 1) - 1, 1);
}

function dateToYm(date) {
    if (!date) return "";
    return format(date, "yyyy-MM");
}

// --- NOVA FUNÇÃO PARA PEGAR DATA LOCAL CORRETA ---
function getLocalTodayString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// --- ESTILOS DO SELECT (DARK MODE) ---
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
};

export default function ChecklistMensal() {
    const { user, can } = useAuth();

    // PERMISSÕES
    const podeGerenciar = can('checklist.gerenciar');
    const podeRealizar = can('checklist.realizar');
    const podeAprovar = can('checklist.aprovar');
    const podeExcluir = can('checklist.excluir');
    const podeBaixar = can('checklist.baixar');

    // ESTADOS DE DADOS
    const [veiculosStatus, setVeiculosStatus] = useState([]); // Dados do Dashboard (Checklists feitos/pendentes)
    const [veiculosDetalhados, setVeiculosDetalhados] = useState([]); // Dados Completos dos Veículos (para pegar a Base)
    const [checklistItensDef, setChecklistItensDef] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // FILTROS
    const [filtroData, setFiltroData] = useState(getLocalTodayString().slice(0, 7)); // Ex: "2026-02"
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroBase, setFiltroBase] = useState(null);       // Novo Filtro
    const [filtroResponsavel, setFiltroResponsavel] = useState(null); // Novo Filtro
    const [busca, setBusca] = useState('');

    // MODAIS E LOADING
    const [showModalChecklist, setShowModalChecklist] = useState(false);
    const [showModalGerenciar, setShowModalGerenciar] = useState(false);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [fabOpen, setFabOpen] = useState(false); // Novo controle do botão flutuante

    // FORMULÁRIO
    const [formData, setFormData] = useState({
        data_verificacao: getLocalTodayString(),
        usuario_id: '',
        status: 'FINALIZADO',
        respostas: {}
    });

    // ESTADOS ADMIN (Gerenciar Itens)
    const [editingItem, setEditingItem] = useState(null);
    const [formItem, setFormItem] = useState({ nome_item: '', categoria: 'Geral', quantidade_padrao: 1, ativo: true });

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        carregarTudo();
    }, [filtroData]);

    // Define usuário logado automaticamente ao abrir modal
    useEffect(() => {
        if (user && !formData.usuario_id && showModalChecklist && !isReadOnly) {
            setFormData(prev => ({ ...prev, usuario_id: user.id }));
        }
    }, [user, showModalChecklist, isReadOnly]);

    async function carregarTudo() {
        try {
            const [ano, mes] = filtroData.split('-');

            // Carrega Dashboard (Status dos checklists) e Veículos (Para saber a Base) em paralelo
            const [resDash, resVeic, resDef, resUser] = await Promise.all([
                api.get(`/checklists/dashboard`, { params: { mes, ano } }),
                api.get('/veiculos/'),
                api.get('/checklists/definicoes'),
                api.get('/usuarios/')
            ]);

            setVeiculosStatus(resDash.data);
            setVeiculosDetalhados(resVeic.data);
            setChecklistItensDef(resDef.data);
            setUsuarios(resUser.data);

        } catch (e) { console.error("Erro ao carregar dados", e); }
    }

    // --- FUNÇÕES AUXILIARES PARA CARREGAMENTO DO ADMIN ---
    async function carregarDefinicoes() { try { const res = await api.get('/checklists/definicoes'); setChecklistItensDef(res.data); } catch (e) { } }

    // --- CÁLCULO DAS OPÇÕES DE FILTRO (BASE E RESPONSÁVEL) ---
    // Extrai todas as bases únicas dos veículos carregados
    const uniqueBases = [...new Set(veiculosDetalhados.map(v => v.base).filter(Boolean))].sort().map(b => ({ value: b, label: b }));

    // Extrai todos os responsáveis únicos que aparecem no dashboard atual
    const uniqueResponsaveis = [...new Set(veiculosStatus.map(v => v.responsavel_nome).filter(Boolean))].sort().map(r => ({ value: r, label: r }));

    // --- LÓGICA DINÂMICA DE OPERADOR: FILTRAR E TRAVAR ---
    // Se o usuário não tem permissão gerencial, ele só pode selecionar a si mesmo
    const usuariosFiltrados = (!podeGerenciar && !podeAprovar) ? usuarios.filter(u => u.id === user.id) : usuarios;

    // --- FUNÇÃO: EXPORTAR PDF RESUMIDO ---
    function exportarPDFResumido() {
        const doc = new jsPDF();
        doc.text(`Resumo Checklist - ${filtroData}`, 14, 10);

        const tableRows = veiculosFiltrados.map(v => [
            v.placa,
            `${v.marca} ${v.modelo}`,
            v.status_checklist === 'FINALIZADO' ? "Realizado" : v.status_checklist === 'PENDENTE' ? "Pendente" : "Não Realizado",
            v.responsavel_nome || '-',
            v.data_checklist ? new Date(v.data_checklist).toLocaleDateString() : '-'
        ]);

        autoTable(doc, {
            head: [["Placa", "Veículo", "Status", "Responsável", "Data"]],
            body: tableRows,
            startY: 20,
        });
        doc.save(`resumo_checklist_${filtroData}.pdf`);
    }

    // --- FUNÇÃO: EXPORTAR PDF DETALHADO ---
    function handleExportarDetalhado() {
        gerarRelatorioDetalhado(veiculosFiltrados);
    }

    // --- NOVA FUNÇÃO: EXPORTAR PDF DE UM ÚNICO VEÍCULO ---
    function handleExportarIndividual(veiculo) {
        // Passamos o veículo como um array de 1 item, que é o que o gerador espera
        gerarRelatorioDetalhado([veiculo]);
    }

    // --- LÓGICA: ABRIR CHECKLIST (NOVO OU CONTINUAR) ---
    async function handleOpenChecklist(veiculo) {
        setVeiculoSelecionado(veiculo);

        // Se já tem ID (mesmo que pendente), carrega do backend
        if (veiculo.checklist_id) {
            await carregarDadosChecklist(veiculo.checklist_id);
            setIsReadOnly(false);
        } else {
            // Se não tem, prepara um novo formulário vazio
            setIsReadOnly(false);
            const respostasIniciais = {};
            checklistItensDef.forEach(def => {
                for (let i = 1; i <= def.quantidade_padrao; i++) {
                    respostasIniciais[`${def.nome_item}_${i}`] = {
                        status: '',
                        observacao: '',
                        categoria: def.categoria,
                        foto: null
                    };
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

    // --- LÓGICA: VER CHECKLIST (SOMENTE LEITURA) ---
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

            // Inicializa esqueleto vazio (Só indice 1)
            checklistItensDef.forEach(def => {
                const chave = `${def.nome_item}_1`;
                respostasRecuperadas[chave] = {
                    status: '', observacao: '', categoria: def.categoria, foto: null, foto_path: null
                };
            });

            // Preenche com dados do banco (APENAS se for indice 1)
            if (dados.itens) {
                dados.itens.forEach(item => {
                    if (item.indice === 1) { // Só carregamos o "mestre"
                        const chave = `${item.nome_item}_1`;
                        // Atualiza se existir na definição
                        if (respostasRecuperadas[chave]) {

                            // Limpa o falso 'N/A' que era salvo pelo bug anterior em rascunhos
                            let statusBanco = item.status || '';
                            if (dados.status === 'PENDENTE' && statusBanco === 'N/A') {
                                statusBanco = '';
                            }

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
        } catch (error) {
            alert("Erro ao carregar checklist.");
        } finally {
            setLoading(false);
        }
    }

    // --- HANDLERS DE FORMULÁRIO ---
    function handleRespostaChange(chave, campo, valor) {
        if (isReadOnly) return;
        setFormData(prev => ({
            ...prev,
            respostas: { ...prev.respostas, [chave]: { ...prev.respostas[chave], [campo]: valor } }
        }));
    }

    function handleFileChange(chave, e) {
        if (isReadOnly) return;
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            respostas: { ...prev.respostas, [chave]: { ...prev.respostas[chave], foto: file } }
        }));
    }

    // --- SALVAR (PENDENTE OU FINALIZADO) ---
    async function handleSubmitChecklist(e, statusFinal) {
        e.preventDefault();
        if (isReadOnly) return;

        // Validação rigorosa SÓ se for FINALIZAR
        if (statusFinal === 'FINALIZADO') {
            const itensFaltantes = [];

            Object.keys(formData.respostas).forEach(chave => {
                const resp = formData.respostas[chave];

                // Extrai o nome do item limpando o "_1" do final para a mensagem de erro
                const partes = chave.split('_');
                partes.pop();
                const nomeAmigavel = partes.join('_');

                // Verifica se o status foi escolhido
                if (!resp.status || resp.status === '') {
                    itensFaltantes.push(`- Status não selecionado: ${nomeAmigavel}`);
                }

                // Verifica se tem foto (nova ou já salva no banco)
                if (!resp.foto && !resp.foto_path) {
                    itensFaltantes.push(`- Foto não anexada: ${nomeAmigavel}`);
                }
            });

            if (itensFaltantes.length > 0) {
                const limiteErros = itensFaltantes.slice(0, 10).join('\n');
                const temMais = itensFaltantes.length > 10 ? `\n... e mais ${itensFaltantes.length - 10} pendências.` : '';
                return alert(`⚠️ NÃO É POSSÍVEL FINALIZAR.\n\nVocê precisa selecionar um status e anexar uma foto para TODOS os itens.\n\nPendências encontradas:\n${limiteErros}${temMais}`);
            }
        }

        setLoading(true);

        const itensParaSalvar = [];
        const filesToUpload = [];

        // Mapa para consulta rápida da quantidade definida por item
        const defMap = new Map((checklistItensDef || []).map(d => [d.nome_item, d.quantidade_padrao || 1]));

        let uploadIndex = 0; // Contador para nomear os arquivos de forma única

        Object.keys(formData.respostas).forEach(chave => {
            const resp = formData.respostas[chave];

            // Extrai o nome real (tudo antes do último underscore)
            const partes = chave.split('_');
            const indiceOriginal = parseInt(partes.pop());
            const nomeReal = partes.join('_');

            // Pega a quantidade que deveria existir (ex: 3)
            const qtdTotal = defMap.get(nomeReal) || 1;

            // Se for o índice 1 (o "mestre" que aparece na tela), nós replicamos ele
            if (indiceOriginal === 1) {
                // Loop para criar N cópias (Item 1, Item 2, Item 3...)
                for (let i = 1; i <= qtdTotal; i++) {

                    // Adiciona o item na lista JSON
                    itensParaSalvar.push({
                        nome_item: nomeReal,
                        categoria: resp.categoria,
                        indice: i, // Aqui gera 1, 2, 3...
                        quantidade_total: qtdTotal,
                        status: resp.status || '', // <--- CORREÇÃO: Agora envia vazio, parando de forçar o N/A
                        observacao: resp.observacao
                    });

                    // Se tiver foto NOVA, temos que enviar a mesma foto para cada item replicado
                    // OU (Decisão de projeto) enviar só para o primeiro. 
                    // GERALMENTE, enviamos só para o primeiro (índice 1) para economizar espaço e evitar duplicidade visual.
                    // Mas o backend espera foto vinculada pelo indice.
                    // Vamos enviar a foto apenas para o índice 1 para não travar o upload com arquivos duplicados.
                    if (resp.foto && i === 1) {
                        const extensao = resp.foto.name.split('.').pop();
                        // O nome do arquivo DEVE bater com o índice que o backend espera na lista "itensParaSalvar"
                        // Como itensParaSalvar é uma lista linear, precisamos saber a posição exata dela.
                        // O backend usa "item_{index_da_lista_json}".
                        const indexNaListaJson = itensParaSalvar.length - 1;

                        const novoNome = `item_${indexNaListaJson}.${extensao}`;
                        const arquivoRenomeado = new File([resp.foto], novoNome, { type: resp.foto.type });
                        filesToUpload.push(arquivoRenomeado);
                    }
                }
            }
            // Se por algum motivo existirem chaves indice > 1 no formData (lixo de memória), ignoramos, pois o loop acima já gerou tudo.
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
            await api.post('/checklists/', dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const msg = statusFinal === 'PENDENTE' ? 'Rascunho salvo!' : 'Checklist finalizado!';
            alert(msg);

            setShowModalChecklist(false);
            carregarTudo();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
        } finally { setLoading(false); }
    }

    // --- FUNÇÕES ADMIN ---
    async function handleSaveItem(e) {
        e.preventDefault();
        try {
            if (editingItem) await api.put(`/checklists/definicoes/${editingItem.id}`, formItem);
            else await api.post('/checklists/definicoes', formItem);

            setEditingItem(null);
            setFormItem({ nome_item: '', categoria: 'Geral', quantidade_padrao: 1, ativo: true });
            carregarDefinicoes();
        } catch (error) { alert("Erro ao salvar item"); }
    }

    async function handleDeleteItem(id) {
        if (!window.confirm("Remover este item?")) return;
        try { await api.delete(`/checklists/definicoes/${id}`); carregarDefinicoes(); }
        catch (error) { alert("Erro ao excluir item"); }
    }

    function startEdit(item) {
        setEditingItem(item);
        setFormItem(item);
        setShowModalGerenciar(true);
    }

    async function handleExcluirChecklist(id) {
        if (!window.confirm("Excluir este checklist realizado?")) return;
        try { await api.delete(`/checklists/${id}`); alert("Excluído!"); carregarTudo(); }
        catch (error) { alert("Erro ao excluir."); }
    }

    // --- FILTRAGEM DE DADOS ---
    const veiculosFiltrados = veiculosStatus.filter(v => {
        // Busca dados complementares do veículo (como Base)
        const veiculoCompleto = veiculosDetalhados.find(vd => vd.id === v.id);

        const matchBusca = v.placa.toLowerCase().includes(busca.toLowerCase()) || v.modelo.toLowerCase().includes(busca.toLowerCase());

        let matchStatus = true;
        if (filtroStatus === 'Realizado') matchStatus = v.status_checklist === 'FINALIZADO';
        else if (filtroStatus === 'Pendente') matchStatus = v.status_checklist === 'PENDENTE';
        else if (filtroStatus === 'NaoRealizado') matchStatus = !v.checklist_realizado && v.status_checklist !== 'PENDENTE';
        // --- ADICIONE ESTAS DUAS LINHAS AQUI ---
        else if (filtroStatus === 'Aprovado') matchStatus = v.status_checklist === 'APROVADO';
        else if (filtroStatus === 'Reprovado') matchStatus = v.status_checklist === 'REPROVADO';

        // Filtros Novos
        const matchBase = !filtroBase || (veiculoCompleto && veiculoCompleto.base === filtroBase.value);
        const matchResp = !filtroResponsavel || v.responsavel_nome === filtroResponsavel.value;

        return matchBusca && matchStatus && matchBase && matchResp;
    });

    // Agrupa itens do checklist por categoria para exibir no modal
    const itensPorCategoria = checklistItensDef.reduce((acc, item) => {
        if (!acc[item.categoria]) acc[item.categoria] = [];
        acc[item.categoria].push(item);
        return acc;
    }, {});

    async function handleStatusChange(novoStatus) {
        if (!confirm(`Confirma mudar o status para ${novoStatus}?`)) return;
        try {
            await api.patch(`/checklists/${veiculoSelecionado.checklist_id}/status`, { status: novoStatus });
            alert("Status atualizado!");
            setShowModalChecklist(false);
            carregarTudo();
        } catch (error) {
            alert("Erro ao atualizar status: " + (error.response?.data?.detail || error.message));
        }
    }

    return (
        <div>
            {/* --- CABEÇALHO COM FILTROS --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Filtro de Data (Mês) */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Período</label>
                        <DatePicker
                            selected={ymToDate(filtroData)}
                            onChange={(date) => setFiltroData(dateToYm(date))}
                            showMonthYearPicker
                            dateFormat="yyyy-MM"
                            locale="pt-BR"
                            customInput={<MonthInput />}
                            popperPlacement="bottom-start"
                        />
                    </div>


                    {/* Filtro de Status */}
                    <div style={{ minWidth: '160px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Status</label>
                        <select
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: 5, border: '1px solid #444', background: '#2d3748', color: 'white', height: '38px' }}
                        >
                            <option value="Todos">Todos os Status</option>
                            <option value="Realizado">Realizados</option>
                            <option value="Pendente">Pendentes (Rascunho)</option>
                            <option value="NaoRealizado">Não Realizados</option>
                            <option value="Aprovado">Aprovados</option>
                            <option value="Reprovado">Reprovados</option>
                        </select>
                    </div>

                    {/* Filtro de Base (Novo) */}
                    <div style={{ minWidth: '160px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Base</label>
                        <Select
                            styles={customSelectStyles}
                            options={uniqueBases}
                            placeholder="Todas"
                            isClearable
                            onChange={setFiltroBase}
                        />
                    </div>

                    {/* Filtro de Responsável (Novo) */}
                    <div style={{ minWidth: '160px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Responsável</label>
                        <Select
                            styles={customSelectStyles}
                            options={uniqueResponsaveis}
                            placeholder="Todos"
                            isClearable
                            onChange={setFiltroResponsavel}
                        />
                    </div>

                    {/* Botões PDF */}
                    {podeBaixar && (
                        <div style={{ display: 'flex', gap: 5, alignSelf: 'flex-end' }}>
                            <button onClick={exportarPDFResumido} className="btn-secondary" style={{ background: '#4a5568', color: 'white', height: '38px', padding: '0 15px', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                                Resumido
                            </button>
                            <button onClick={handleExportarDetalhado} className="btn-add" style={{ background: '#e53e3e', color: 'white', height: '38px' }}>
                                <FileText size={18} style={{ marginRight: 5 }} /> Completo
                            </button>
                        </div>
                    )}
                </div>

                {/* Botão Admin */}
                {podeGerenciar && (
                    <button
                        onClick={() => setShowModalGerenciar(true)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#4a5568', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 5, cursor: 'pointer' }}
                    >
                        <Settings size={16} /> Gerenciar Itens
                    </button>
                )}
            </div>

            {/* --- BARRA DE BUSCA --- */}
            <div className="search-bar" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', background: '#2d3748', padding: '10px', borderRadius: '8px' }}>
                <div style={{ marginRight: 10 }}><Settings size={20} color="#a0aec0" style={{ opacity: 0 }} /></div>
                <input
                    type="text"
                    placeholder="Buscar veículo por placa ou modelo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                />
            </div>

            <div className="table-container">
                <table className="table-mobile-fit">
                    <thead>
                        <tr>
                            <th>Placa</th>
                            <th className="hide-mobile">Veículo</th>
                            <th>Status</th>
                            <th className="hide-mobile">Responsável</th>
                            <th className="hide-mobile">Data</th>
                            <th style={{ textAlign: 'right' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {veiculosFiltrados.map(v => (
                            <tr key={v.id}>
                                <td><strong style={{ color: '#00d68f' }}>{v.placa}</strong></td>
                                <td className="hide-mobile">{v.marca} {v.modelo}</td>
                                <td>
                                    {v.status_checklist === 'APROVADO' && <span style={{ color: '#00d68f', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={16} /> Aprovado</span>}
                                    {v.status_checklist === 'REPROVADO' && <span style={{ color: '#e53e3e', display: 'flex', alignItems: 'center', gap: 5 }}><X size={16} /> Reprovado</span>}
                                    {v.status_checklist === 'FINALIZADO' && <span style={{ color: '#3182ce', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={16} /> Aguardando Aprovação</span>}
                                    {v.status_checklist === 'PENDENTE' && <span style={{ color: '#ecc94b', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={16} /> Pendente</span>}
                                    {(v.status_checklist === 'NAO_REALIZADO' || !v.status_checklist) && <span style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={16} /> Não Realizado</span>}
                                </td>
                                <td className="hide-mobile">{v.responsavel_nome || '-'}</td>
                                <td className="hide-mobile">{v.data_checklist ? new Date(v.data_checklist).toLocaleDateString() : '-'}</td>
                                <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>

                                    {/* Botão de Excluir */}
                                    {v.checklist_id && podeExcluir && (
                                        <button
                                            onClick={() => handleExcluirChecklist(v.checklist_id)}
                                            style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer' }}
                                            title="Excluir Rascunho"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    {/* Botão de PDF Individual */}
                                    {v.checklist_id && podeBaixar && (
                                        <button
                                            onClick={() => handleExportarIndividual(v)}
                                            style={{ background: '#3182ce', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer' }}
                                            title="Baixar PDF deste veículo"
                                        >
                                            <FileText size={16} />
                                        </button>
                                    )}

                                    {/* Botão de Ver (Leitura) - Mostra para quem já finalizou, foi aprovado ou reprovado */}
                                    {(v.status_checklist === 'FINALIZADO' || v.status_checklist === 'APROVADO' || v.status_checklist === 'REPROVADO') && (
                                        <button
                                            onClick={() => handleVerChecklist(v)}
                                            style={{ background: '#4a5568', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer' }}
                                            title="Visualizar"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}

                                    {/* Botão Realizar/Continuar/Refazer (Edição) */}
                                    {/* ESCONDE se estiver Aprovado ou Finalizado (Aguardando) */}
                                    {podeRealizar && (v.status_checklist === 'NAO_REALIZADO' || !v.status_checklist || v.status_checklist === 'PENDENTE' || v.status_checklist === 'REPROVADO') && (
                                        <button
                                            className="btn-add"
                                            style={{
                                                padding: '5px 10px', fontSize: '0.8rem', border: 'none', borderRadius: 4, cursor: 'pointer',
                                                background: v.status_checklist === 'REPROVADO' ? '#e53e3e' : (v.status_checklist === 'PENDENTE' ? '#ecc94b' : '#00d68f'),
                                                color: v.status_checklist === 'PENDENTE' ? 'black' : 'white'
                                            }}
                                            onClick={() => handleOpenChecklist(v)}
                                        >
                                            {v.status_checklist === 'PENDENTE' ? 'Continuar' : (v.status_checklist === 'REPROVADO' ? 'Refazer' : 'Realizar')}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {veiculosFiltrados.length === 0 && (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhum veículo encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL CHECKLIST (PREENCHIMENTO) --- */}
            {showModalChecklist && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, padding: 0 /* padding 0 no mobile */, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>

                    {/* Adicionado className "modal-content-responsivo" para o CSS atuar */}
                    <div className="modal-content-responsivo" style={{ background: '#1a202c', width: '100%', maxWidth: '900px', borderRadius: 8, padding: 20, height: 'fit-content', margin: 'auto' }}>

                        <form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* CABEÇALHO SUPER COMPACTO */}
                            <div style={{ background: '#2d3748', padding: '10px', borderRadius: 5, marginBottom: 10, border: '1px solid #4a5568' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h3 style={{ margin: 0, color: '#ecc94b', fontSize: '1rem' }}>
                                        {isReadOnly ? 'Vistoria:' : 'Preencher:'} {veiculoSelecionado?.placa}
                                    </h3>
                                    <button type="button" onClick={() => setShowModalChecklist(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', padding: 0 }}><X size={20} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#a0aec0', marginBottom: 2 }}>Data</label>
                                        <input type="date" disabled={isReadOnly} value={formData.data_verificacao} onChange={e => setFormData({ ...formData, data_verificacao: e.target.value })} required style={{ width: '100%', padding: '5px', borderRadius: 4, border: '1px solid #444', background: '#1a202c', color: 'white', fontSize: '0.85rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#a0aec0', marginBottom: 2 }}>Responsável</label>
                                        <Select
                                            isDisabled={isReadOnly || (!podeGerenciar && !podeAprovar)}
                                            value={usuariosFiltrados.map(u => ({ value: u.id, label: `${u.nome} ${u.sobrenome || ''}` })).find(o => o.value === formData.usuario_id) || null}
                                            onChange={v => setFormData({ ...formData, usuario_id: v ? v.value : '' })}
                                            options={usuariosFiltrados.map(u => ({ value: u.id, label: `${u.nome} ${u.sobrenome || ''}` }))}
                                            placeholder="Selecione..."
                                            styles={{ ...customSelectStyles, control: (b, s) => ({ ...customSelectStyles.control(b, s), minHeight: '32px', height: '32px' }), valueContainer: (b) => ({ ...b, padding: '0 8px' }) }}
                                            menuPlacement="auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Itens do Checklist - Lista esticada e com respiro no fundo */}
                            <div className="checklist-scroll-area" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: 5, paddingBottom: '90px' }}>
                                {Object.keys(itensPorCategoria).map(categoria => (
                                    <div key={categoria} style={{ marginBottom: 20 }}>
                                        <h3 style={{ borderBottom: '1px solid #444', color: '#00d68f', fontSize: '1rem', marginBottom: '10px' }}>{categoria}</h3>
                                        {itensPorCategoria[categoria].map((def) => {
                                            const indice = 1;
                                            const chave = `${def.nome_item}_${indice}`;
                                            const dados = formData.respostas[chave] || { status: '', observacao: '', foto: null };
                                            const temFoto = dados.foto || dados.foto_path;
                                            const qtd = def.quantidade_padrao || 1;

                                            return (
                                                /* SUBSTITUÍDO O STYLE INLINE PELA CLASSE "checklist-item-grid" */
                                                <div key={chave} className="checklist-item-grid">

                                                    {/* ÁREA NOME */}
                                                    <div className="chk-area-name" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '28px', height: '28px', borderRadius: '50%',
                                                            backgroundColor: qtd > 1 ? '#000000' : '#000000',
                                                            color: 'white', fontWeight: 'bold', fontSize: '0.85rem',
                                                            border: '1px solid #00d68f', flexShrink: 0
                                                        }} title={`Quantidade exigida: ${qtd}`}>
                                                            {qtd}x
                                                        </span>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: '500', lineHeight: '1.2' }}>
                                                            {def.nome_item}
                                                        </span>
                                                    </div>

                                                    {/* ÁREA STATUS */}
                                                    <select
                                                        className="chk-area-status"
                                                        disabled={isReadOnly}
                                                        value={dados.status}
                                                        onChange={e => handleRespostaChange(chave, 'status', e.target.value)}
                                                        style={{ width: '100%', padding: 8, borderRadius: 4, background: dados.status === 'OK' ? '#00d68f' : dados.status === 'RUIM' ? '#e53e3e' : dados.status === 'FALTANTE' ? '#ecc94b' : '#4a5568', color: 'white', border: '1px solid #555' }}
                                                    >
                                                        <option value="" disabled>Status...</option>
                                                        <option value="OK">OK</option>
                                                        <option value="RUIM">RUIM</option>
                                                        <option value="FALTANTE">FALTANTE</option>
                                                        <option value="N/A">N/A</option>
                                                    </select>

                                                    {/* ÁREA OBSERVAÇÃO */}
                                                    <input
                                                        className="chk-area-obs"
                                                        type="text"
                                                        disabled={isReadOnly}
                                                        placeholder="Obs..."
                                                        value={dados.observacao}
                                                        onChange={e => handleRespostaChange(chave, 'observacao', e.target.value)}
                                                        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#1a202c', color: 'white', boxSizing: 'border-box' }}
                                                    />

                                                    {/* ÁREA FOTO */}
                                                    <div className="chk-area-foto" style={{ display: 'flex', alignItems: 'center' }}>
                                                        {isReadOnly ? (
                                                            dados.foto_path ?
                                                                <span style={{ color: '#00d68f', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}><Camera size={16} /> Com Foto</span> :
                                                                <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Sem Foto</span>
                                                        ) : (
                                                            <label style={{ cursor: 'pointer', background: temFoto ? '#00d68f' : '#4a5568', padding: '8px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', transition: 'background 0.2s' }}>
                                                                <Camera size={16} color="white" />
                                                                <span style={{ marginLeft: 5, fontSize: '0.8rem', color: 'white', fontWeight: 'bold' }}>{temFoto ? 'Alterar' : 'Foto'}</span>
                                                                <input type="file" accept="image/*" onChange={e => handleFileChange(chave, e)} style={{ display: 'none' }} />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* BOTÃO FLUTUANTE DE AÇÕES (FAB) */}
                            <div style={{
                                position: 'fixed',
                                bottom: '25px',
                                right: '25px',
                                display: 'flex',
                                flexDirection: 'column-reverse',
                                alignItems: 'flex-end',
                                gap: '15px',
                                zIndex: 2000
                            }}>
                                {/* Botão Principal (Gatilho) */}
                                <button
                                    type="button"
                                    onClick={() => setFabOpen(!fabOpen)}
                                    style={{
                                        width: '60px', height: '60px', borderRadius: '50%',
                                        background: fabOpen ? '#4a5568' : '#3182ce', color: 'white',
                                        border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        transition: 'background 0.3s'
                                    }}
                                >
                                    {fabOpen ? <X size={30} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Settings size={22} /><span style={{ fontSize: '0.6rem', fontWeight: 'bold', marginTop: '2px' }}>Ações</span></div>}
                                </button>

                                {/* Opções Expandidas */}
                                {fabOpen && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', marginBottom: '5px' }}>
                                        {!isReadOnly ? (
                                            <>
                                                <button type="button" onClick={(e) => { handleSubmitChecklist(e, 'FINALIZADO'); setFabOpen(false); }} className="btn-add" style={{ background: '#00d68f', color: 'black', borderRadius: '30px', padding: '12px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', fontWeight: 'bold' }}>
                                                    <CheckCircle size={18} style={{ marginRight: 8, display: 'inline' }} /> Finalizar e Enviar
                                                </button>
                                                <button type="button" onClick={(e) => { handleSubmitChecklist(e, 'PENDENTE'); setFabOpen(false); }} className="btn-add" style={{ background: '#ecc94b', color: 'black', borderRadius: '30px', padding: '12px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', fontWeight: 'bold' }}>
                                                    <Save size={18} style={{ marginRight: 8, display: 'inline' }} /> Salvar (Pendente)
                                                </button>
                                            </>
                                        ) : (
                                            podeAprovar && formData.status !== 'PENDENTE' && (
                                                <>
                                                    <button type="button" onClick={() => { handleStatusChange('APROVADO'); setFabOpen(false); }} className="btn-add" style={{ background: '#00d68f', color: 'black', borderRadius: '30px', padding: '12px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', fontWeight: 'bold' }}>
                                                        <CheckCircle size={18} style={{ marginRight: 8, display: 'inline' }} /> Aprovar
                                                    </button>
                                                    <button type="button" onClick={() => { handleStatusChange('REPROVADO'); setFabOpen(false); }} className="btn-add" style={{ background: '#e53e3e', color: 'white', borderRadius: '30px', padding: '12px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', fontWeight: 'bold' }}>
                                                        <X size={18} style={{ marginRight: 8, display: 'inline' }} /> Reprovar
                                                    </button>
                                                </>
                                            )
                                        )}
                                        <button type="button" onClick={() => { setShowModalChecklist(false); setFabOpen(false); }} className="btn-add" style={{ background: '#e53e3e', color: 'white', borderRadius: '30px', padding: '12px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', fontWeight: 'bold' }}>
                                            <X size={18} style={{ marginRight: 8, display: 'inline' }} /> Fechar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: GERENCIAR ITENS (Admin) --- */}
            {showModalGerenciar && (() => {
                const grupos = (checklistItensDef || []).reduce((acc, item) => {
                    const cat = item.categoria || 'Sem Categoria';
                    (acc[cat] ||= []).push(item);
                    return acc;
                }, {});
                const categoriasOrdenadas = Object.keys(grupos).sort((a, b) => a.localeCompare(b));

                return (
                    <div
                        className="modal-overlay"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.8)',
                            zIndex: 1100,
                            padding: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div className="checklist-gerenciar" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <div
                                style={{
                                    background: '#1a202c',
                                    width: '100%',
                                    maxWidth: '800px',
                                    height: '80vh',
                                    padding: 20,
                                    borderRadius: 8,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <h2>Gerenciar Itens do Checklist</h2>
                                    <button
                                        type="button"
                                        onClick={() => setShowModalGerenciar(false)}
                                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                                    >
                                        <X />
                                    </button>
                                </div>

                                <form
                                    onSubmit={handleSaveItem}
                                    style={{
                                        background: '#2d3748',
                                        padding: 15,
                                        borderRadius: 5,
                                        marginBottom: 20,
                                        display: 'flex',
                                        gap: 10,
                                        alignItems: 'flex-end',
                                        flexWrap: 'wrap'
                                    }}
                                >
                                    <div style={{ flex: 2, minWidth: 200 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Nome do Item</label>
                                        <input
                                            required
                                            value={formItem.nome_item}
                                            onChange={(e) => setFormItem({ ...formItem, nome_item: e.target.value })}
                                            style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                                        />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 150 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Categoria</label>
                                        <select
                                            value={formItem.categoria}
                                            onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })}
                                            style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                                        >
                                            <option>Ferramentas</option>
                                            <option>Sinalização & EPC</option>
                                            <option>EPI</option>
                                            <option>Segurança</option>
                                            <option>Instrumentos</option>
                                            <option>Geral / Outros</option>
                                        </select>
                                    </div>

                                    <div style={{ width: 80 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Qtd</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={formItem.quantidade_padrao}
                                            onChange={(e) => setFormItem({ ...formItem, quantidade_padrao: e.target.value })}
                                            style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        style={{
                                            padding: '9px 15px',
                                            background: '#3182ce',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5
                                        }}
                                    >
                                        {editingItem ? <Save size={18} /> : <Plus size={18} />} {editingItem ? 'Salvar' : 'Adicionar'}
                                    </button>
                                </form>

                                <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #4a5568', borderRadius: 5 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #444', background: '#222' }}>
                                                <th style={{ padding: 10 }}>Item</th>
                                                <th>Cat.</th>
                                                <th>Qtd</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {categoriasOrdenadas.map((cat) => (
                                                <React.Fragment key={cat}>
                                                    <tr style={{ background: '#111827' }}>
                                                        <td colSpan={4} style={{ padding: '10px', color: '#00d68f', fontWeight: 'bold', textAlign: 'left' }}>
                                                            {cat}
                                                        </td>
                                                    </tr>

                                                    {grupos[cat].map((item) => (
                                                        <tr
                                                            key={item.id}
                                                            style={{
                                                                borderBottom: '1px solid #2d3748',
                                                                background: item.id === editingItem?.id ? '#2c5282' : 'transparent'
                                                            }}
                                                        >
                                                            <td style={{ padding: 10 }}>{item.nome_item}</td>
                                                            <td>
                                                                <span style={{ background: '#4a5568', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem' }}>
                                                                    {item.categoria}
                                                                </span>
                                                            </td>
                                                            <td>{item.quantidade_padrao}</td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEdit(item)}
                                                                    style={{ marginRight: 10, background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}
                                                                    title="Editar"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}
                                                                    title="Remover"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
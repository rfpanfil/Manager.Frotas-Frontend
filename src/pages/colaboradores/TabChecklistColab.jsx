// Arquivo: frontend/src/pages/colaboradores/TabChecklistColab.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, CheckCircle, AlertCircle, Camera, Eye, Trash2, X, Save, FileText, Clock, Plus, Shield, Edit } from 'lucide-react';
import Select from 'react-select';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ptBR from 'date-fns/locale/pt-BR';
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gerarRelatorioDetalhadoColab } from '../../utils/checklistColabPdfGenerator';

registerLocale('pt-BR', ptBR);

const MonthInput = React.forwardRef(function MonthInput({ value, onClick }, ref) {
    return <input ref={ref} value={value || ""} readOnly onClick={onClick} style={{ padding: "7px", borderRadius: 5, border: "1px solid #444", background: "#2d3748", color: "white", height: "38px", cursor: "pointer", minWidth: 140 }} />;
});

function ymToDate(ym) { return ym ? new Date(ym.split("-")[0], (ym.split("-")[1] || 1) - 1, 1) : null; }
function dateToYm(date) { return date ? format(date, "yyyy-MM") : ""; }
function getLocalTodayString() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export default function TabChecklistColab() {
    const { user, can } = useAuth();

    // <--- ATUALIZADO AQUI COM AS NOVAS SLUGS ESPECÍFICAS DE COLAB --->
    const podeGerenciar = can('checklist_colab.gerenciar');
    const podeRealizar = can('checklist_colab.realizar');
    const podeAprovar = can('checklist_colab.aprovar');

    const [colaboradoresStatus, setColaboradoresStatus] = useState([]);
    const [checklistItensDef, setChecklistItensDef] = useState([]);
    const [configCargos, setConfigCargos] = useState([]); // NOVO ESTADO
    const [cargosDisponiveis, setCargosDisponiveis] = useState([]); // <--- ADICIONADO AQUI

    const [filtroData, setFiltroData] = useState(getLocalTodayString().slice(0, 7));
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [busca, setBusca] = useState('');

    const [showModalChecklist, setShowModalChecklist] = useState(false);
    const [showModalGerenciar, setShowModalGerenciar] = useState(false);
    const [colabSelecionado, setColabSelecionado] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);

    const [formData, setFormData] = useState({ data_verificacao: getLocalTodayString(), usuario_id: '', status: 'FINALIZADO', respostas: {} });
    const [editingItem, setEditingItem] = useState(null);
    const [formItem, setFormItem] = useState({ nome_item: '', categoria: 'EPI', quantidade_padrao: 1, ativo: true });

    // Formulário do novo Cargo
    const [formCargo, setFormCargo] = useState({ cargo_alvo: '', exige_foto: true });

    useEffect(() => { carregarTudo(); }, [filtroData]);
    useEffect(() => { if (user && !formData.usuario_id && showModalChecklist && !isReadOnly) setFormData(p => ({ ...p, usuario_id: user.id })); }, [user, showModalChecklist, isReadOnly]);

    async function carregarTudo() {
        try {
            const [ano, mes] = filtroData.split('-');
            const [resDash, resDef, resConf, resCargos] = await Promise.all([
                api.get(`/checklists-colab/dashboard`, { params: { mes, ano } }),
                api.get('/checklists-colab/definicoes'),
                api.get('/checklists-colab/config'),
                api.get('/usuarios/cargos/lista') // <--- BUSCA OS CARGOS OFICIAIS
            ]);
            setColaboradoresStatus(resDash.data);
            setChecklistItensDef(resDef.data);
            setConfigCargos(resConf.data);
            setCargosDisponiveis(resCargos.data); // <--- SALVA NO ESTADO
        } catch (e) { console.error("Erro", e); }
    }

    const colabFiltrados = colaboradoresStatus.filter(c => {
        const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cpf.includes(busca);
        let matchStatus = true;
        if (filtroStatus === 'Realizado') matchStatus = c.status_checklist === 'FINALIZADO';
        else if (filtroStatus === 'Pendente') matchStatus = c.status_checklist === 'PENDENTE';
        else if (filtroStatus === 'NaoRealizado') matchStatus = !c.checklist_realizado && c.status_checklist !== 'PENDENTE';
        else if (filtroStatus === 'Aprovado') matchStatus = c.status_checklist === 'APROVADO';
        else if (filtroStatus === 'Reprovado') matchStatus = c.status_checklist === 'REPROVADO';
        return matchBusca && matchStatus;
    });

    async function handleOpenChecklist(colab) {
        setColabSelecionado(colab);
        if (colab.checklist_id) {
            await carregarDadosChecklist(colab.checklist_id); setIsReadOnly(false);
        } else {
            setIsReadOnly(false); const respostasIniciais = {};
            checklistItensDef.forEach(def => {
                for (let i = 1; i <= def.quantidade_padrao; i++) {
                    respostasIniciais[`${def.nome_item}_${i}`] = { status: '', observacao: '', categoria: def.categoria, foto: null };
                }
            });
            setFormData({ data_verificacao: getLocalTodayString(), usuario_id: user?.id || '', status: 'FINALIZADO', respostas: respostasIniciais });
        }
        setShowModalChecklist(true);
    }

    async function handleVerChecklist(colab) {
        if (!colab.checklist_id) return;
        await carregarDadosChecklist(colab.checklist_id);
        setColabSelecionado(colab); setIsReadOnly(true); setShowModalChecklist(true);
    }

    async function carregarDadosChecklist(id) {
        try {
            const res = await api.get(`/checklists-colab/${id}`);
            const dados = res.data;
            const resps = {};
            checklistItensDef.forEach(def => { resps[`${def.nome_item}_1`] = { status: '', observacao: '', categoria: def.categoria, foto: null, foto_path: null }; });
            if (dados.itens) {
                dados.itens.forEach(item => {
                    if (item.indice === 1 && resps[`${item.nome_item}_1`]) {
                        resps[`${item.nome_item}_1`] = { status: item.status || '', observacao: item.observacao || '', foto_path: item.foto_path, categoria: item.categoria };
                    }
                });
            }
            setFormData({ data_verificacao: dados.data_verificacao.slice(0, 10), usuario_id: dados.usuario_id, status: dados.status || 'FINALIZADO', respostas: resps });
        } catch (e) { alert("Erro ao carregar"); }
    }

    function handleRespostaChange(chave, campo, valor) {
        if (isReadOnly) return;
        setFormData(p => ({ ...p, respostas: { ...p.respostas, [chave]: { ...p.respostas[chave], [campo]: valor } } }));
    }

    function handleFileChange(chave, e) {
        if (isReadOnly) return;
        setFormData(p => ({ ...p, respostas: { ...p.respostas, [chave]: { ...p.respostas[chave], foto: e.target.files[0] } } }));
    }

    async function handleSubmitChecklist(e, statusFinal) {
        e.preventDefault(); if (isReadOnly) return;

        const exigeFoto = colabSelecionado?.exige_foto; // Pega a flag que o backend mandou

        if (statusFinal === 'FINALIZADO') {
            const faltantes = [];
            Object.keys(formData.respostas).forEach(k => {
                const r = formData.respostas[k];
                if (!r.status) faltantes.push(`- Status: ${k.replace('_1', '')}`);

                // SÓ EXIGE FOTO SE O CARGO MANDAR
                if (exigeFoto && !r.foto && !r.foto_path) {
                    faltantes.push(`- Foto: ${k.replace('_1', '')}`);
                }
            });
            if (faltantes.length > 0) return alert(`⚠️ Pendências:\n${faltantes.slice(0, 10).join('\n')}`);
        }

        const itensSalvar = []; const files = [];
        const defMap = new Map((checklistItensDef || []).map(d => [d.nome_item, d.quantidade_padrao || 1]));

        Object.keys(formData.respostas).forEach(k => {
            const r = formData.respostas[k];
            const nomeReal = k.split('_').slice(0, -1).join('_');
            const qtd = defMap.get(nomeReal) || 1;
            if (k.endsWith('_1')) {
                for (let i = 1; i <= qtd; i++) {
                    itensSalvar.push({ nome_item: nomeReal, categoria: r.categoria, indice: i, quantidade_total: qtd, status: r.status || '', observacao: r.observacao });
                    // Só envia arquivo se houver
                    if (r.foto && i === 1) {
                        const ext = r.foto.name.split('.').pop();
                        files.push(new File([r.foto], `item_${itensSalvar.length - 1}.${ext}`, { type: r.foto.type }));
                    }
                }
            }
        });

        const fd = new FormData();
        fd.append('dados_json', JSON.stringify({ id: colabSelecionado.checklist_id || null, colaborador_id: colabSelecionado.id, data_verificacao: formData.data_verificacao, usuario_id: formData.usuario_id, status: statusFinal, itens: itensSalvar }));
        files.forEach(f => fd.append('arquivos', f));

        try {
            await api.post('/checklists-colab/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('Checklist salvo!'); setShowModalChecklist(false); setFabOpen(false); carregarTudo();
        } catch (e) { alert("Erro ao salvar"); }
    }

    async function handleStatusChange(st) {
        try {
            await api.patch(`/checklists-colab/${colabSelecionado.checklist_id}/status`, { status: st });
            alert("Status atualizado!"); setShowModalChecklist(false); setFabOpen(false); carregarTudo();
        } catch (e) { alert("Erro"); }
    }

    // --- FUNÇÕES DE GERENCIAMENTO (MODAL) ---
    async function handleSaveItem(e) {
        e.preventDefault();
        try {
            if (editingItem) await api.put(`/checklists-colab/definicoes/${editingItem.id}`, formItem);
            else await api.post('/checklists-colab/definicoes', formItem);
            setEditingItem(null); setFormItem({ nome_item: '', categoria: 'EPI', quantidade_padrao: 1, ativo: true });
            const res = await api.get('/checklists-colab/definicoes'); setChecklistItensDef(res.data);
        } catch (e) { alert("Erro"); }
    }
    async function handleDeleteItem(id) {
        if (confirm("Excluir item?")) { await api.delete(`/checklists-colab/definicoes/${id}`); const res = await api.get('/checklists-colab/definicoes'); setChecklistItensDef(res.data); }
    }

    async function handleSaveCargo(e) {
        e.preventDefault();
        try {
            await api.post('/checklists-colab/config', formCargo);
            setFormCargo({ cargo_alvo: '', exige_foto: true });
            carregarTudo(); // Recarrega os configs e a dashboard
        } catch (e) { alert("Erro"); }
    }
    async function handleDeleteCargo(id) {
        if (confirm("Parar de exigir checklist para este cargo?")) {
            await api.delete(`/checklists-colab/config/${id}`);
            carregarTudo();
        }
    }

    const itensPorCategoria = checklistItensDef.reduce((acc, it) => { (acc[it.categoria] = acc[it.categoria] || []).push(it); return acc; }, {});

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <DatePicker selected={ymToDate(filtroData)} onChange={d => setFiltroData(dateToYm(d))} showMonthYearPicker dateFormat="yyyy-MM" customInput={<MonthInput />} />
                    <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ padding: '8px', borderRadius: 5, border: '1px solid #444', background: '#2d3748', color: 'white' }}>
                        <option value="Todos">Todos os Status</option><option value="Realizado">Realizados</option><option value="Pendente">Pendentes (Rascunho)</option>
                        <option value="NaoRealizado">Não Realizados</option><option value="Aprovado">Aprovados</option><option value="Reprovado">Reprovados</option>
                    </select>
                    <button onClick={() => { const doc = new jsPDF(); doc.text(`Resumo - ${filtroData}`, 14, 10); autoTable(doc, { head: [["Colaborador", "Cargo", "Status", "Data"]], body: colabFiltrados.map(c => [c.nome, c.tipo_colaborador, c.status_checklist, c.data_checklist ? new Date(c.data_checklist).toLocaleDateString() : '-']), startY: 20 }); doc.save("resumo.pdf"); }} className="btn-secondary" style={{ background: '#4a5568', color: 'white', padding: '10px 15px', border: 'none', borderRadius: 5, cursor: 'pointer' }}>PDF Resumido</button>
                    <button onClick={() => gerarRelatorioDetalhadoColab(colabFiltrados)} className="btn-add" style={{ background: '#e53e3e', color: 'white', padding: '10px 15px' }}><FileText size={18} style={{ marginRight: 5 }} /> Completo</button>
                </div>
                {podeGerenciar && <button onClick={() => setShowModalGerenciar(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#4a5568', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 5, cursor: 'pointer' }}><Settings size={16} /> Configurações</button>}
            </div>

            <input type="text" placeholder="Buscar colaborador ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} style={{ width: '100%', padding: '10px', background: '#2d3748', border: 'none', color: 'white', borderRadius: 8, marginBottom: 20 }} />

            <div className="table-container">
                <table style={{ width: '100%' }}>
                    <thead><tr><th>Nome (CPF)</th><th>Cargo</th><th>Status</th><th>Avaliador</th><th>Data</th><th style={{ textAlign: 'right' }}>Ação</th></tr></thead>
                    <tbody>
                        {colabFiltrados.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhum colaborador configurado para responder checklist neste mês. Use o botão Configurações para habilitar cargos.</td></tr>
                        ) : colabFiltrados.map(c => (
                            <tr key={c.id}>
                                <td><strong style={{ color: '#00d68f' }}>{c.nome}</strong><br /><small style={{ color: '#a0aec0' }}>{c.cpf}</small></td>
                                <td>{c.tipo_colaborador}</td>
                                <td>
                                    {c.status_checklist === 'APROVADO' && <span style={{ color: '#00d68f' }}><CheckCircle size={14} /> Aprovado</span>}
                                    {c.status_checklist === 'REPROVADO' && <span style={{ color: '#e53e3e' }}><X size={14} /> Reprovado</span>}
                                    {c.status_checklist === 'FINALIZADO' && <span style={{ color: '#3182ce' }}><CheckCircle size={14} /> Em Análise</span>}
                                    {c.status_checklist === 'PENDENTE' && <span style={{ color: '#ecc94b' }}><Clock size={14} /> Rascunho</span>}
                                    {(c.status_checklist === 'NAO_REALIZADO' || !c.status_checklist) && <span style={{ color: '#a0aec0' }}><AlertCircle size={14} /> Faltante</span>}
                                </td>
                                <td>{c.responsavel_nome || '-'}</td>
                                <td>{c.data_checklist ? new Date(c.data_checklist).toLocaleDateString() : '-'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    {c.checklist_id && <button onClick={() => gerarRelatorioDetalhadoColab([c])} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer', marginRight: 5 }}><FileText size={16} /></button>}
                                    {(c.status_checklist === 'FINALIZADO' || c.status_checklist === 'APROVADO' || c.status_checklist === 'REPROVADO') && <button onClick={() => handleVerChecklist(c)} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer', marginRight: 5 }}><Eye size={16} /></button>}
                                    {podeRealizar && (!c.status_checklist || c.status_checklist === 'NAO_REALIZADO' || c.status_checklist === 'PENDENTE' || c.status_checklist === 'REPROVADO') && <button onClick={() => handleOpenChecklist(c)} style={{ background: c.status_checklist === 'REPROVADO' ? '#e53e3e' : '#00d68f', color: 'black', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>{c.status_checklist === 'PENDENTE' ? 'Continuar' : 'Realizar'}</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHECKLIST */}
            {showModalChecklist && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center' }}>
                    <div className="modal-content-responsivo" style={{ background: '#1a202c', width: '100%', maxWidth: '900px', borderRadius: 8, padding: 20, height: 'fit-content', margin: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, background: '#2d3748', padding: 15, borderRadius: 5 }}>
                            <h3 style={{ margin: 0, color: '#ecc94b' }}>{isReadOnly ? 'Inspeção:' : 'Avaliar:'} {colabSelecionado?.nome}</h3>
                            <button onClick={() => setShowModalChecklist(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div className="checklist-scroll-area" style={{ maxHeight: '65vh', overflowY: 'auto', paddingBottom: 80 }}>
                            {Object.keys(itensPorCategoria).map(cat => (
                                <div key={cat} style={{ marginBottom: 20 }}>
                                    <h3 style={{ borderBottom: '1px solid #444', color: '#00d68f', paddingBottom: 5 }}>{cat}</h3>
                                    {itensPorCategoria[cat].map(def => {
                                        const chave = `${def.nome_item}_1`;
                                        const dados = formData.respostas[chave] || { status: '', observacao: '', foto: null };
                                        return (
                                            <div key={chave} className="checklist-item-grid" style={{ marginBottom: 10, background: '#2d3748', padding: 10, borderRadius: 5 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ width: 25, height: 25, borderRadius: '50%', background: 'black', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #00d68f', fontSize: '0.8rem' }}>{def.quantidade_padrao}x</span>
                                                    <strong>{def.nome_item}</strong>
                                                </div>
                                                <select disabled={isReadOnly} value={dados.status} onChange={e => handleRespostaChange(chave, 'status', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, background: dados.status === 'OK' ? '#00d68f' : dados.status === 'RUIM' ? '#e53e3e' : dados.status === 'FALTANTE' ? '#ecc94b' : '#1a202c', color: 'white', marginTop: 10 }}>
                                                    <option value="" disabled>Status...</option><option value="OK">OK</option><option value="RUIM">RUIM</option><option value="FALTANTE">FALTANTE</option><option value="N/A">N/A</option>
                                                </select>
                                                <input disabled={isReadOnly} type="text" placeholder="Observações" value={dados.observacao} onChange={e => handleRespostaChange(chave, 'observacao', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, background: '#1a202c', border: '1px solid #444', color: 'white', marginTop: 10 }} />

                                                {/* CONDICIONAL DA FOTO BASEADO NA CONFIGURAÇÃO DO CARGO */}
                                                {colabSelecionado?.exige_foto && (
                                                    <div style={{ marginTop: 10 }}>
                                                        {isReadOnly ? (dados.foto_path ? <span style={{ color: '#00d68f' }}><Camera size={16} /> Tem Foto</span> : <span style={{ color: '#a0aec0' }}>Sem Foto</span>) : (
                                                            <label style={{ cursor: 'pointer', background: dados.foto || dados.foto_path ? '#00d68f' : '#4a5568', padding: 8, borderRadius: 4, display: 'flex', justifyContent: 'center', color: 'white' }}>
                                                                <Camera size={16} /> <span style={{ marginLeft: 5 }}>{dados.foto || dados.foto_path ? 'Alterar' : 'Anexar Foto (Obrigatório)'}</span>
                                                                <input type="file" accept="image/*" onChange={e => handleFileChange(chave, e)} style={{ display: 'none' }} />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* FAB BOTÕES */}
                        <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-end', gap: 10 }}>
                            <button onClick={() => setFabOpen(!fabOpen)} style={{ width: 60, height: 60, borderRadius: '50%', background: '#3182ce', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {fabOpen ? <X size={30} /> : <Settings size={26} />}
                            </button>
                            {fabOpen && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {!isReadOnly ? (
                                        <>
                                            <button onClick={e => handleSubmitChecklist(e, 'FINALIZADO')} style={{ background: '#00d68f', padding: '10px 20px', borderRadius: 20, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}><CheckCircle size={16} /> Finalizar</button>
                                            <button onClick={e => handleSubmitChecklist(e, 'PENDENTE')} style={{ background: '#ecc94b', padding: '10px 20px', borderRadius: 20, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}><Save size={16} /> Rascunho</button>
                                        </>
                                    ) : (
                                        podeAprovar && formData.status !== 'PENDENTE' && (
                                            <>
                                                <button onClick={() => handleStatusChange('APROVADO')} style={{ background: '#00d68f', padding: '10px 20px', borderRadius: 20, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}><CheckCircle size={16} /> Aprovar</button>
                                                <button onClick={() => handleStatusChange('REPROVADO')} style={{ background: '#e53e3e', padding: '10px 20px', borderRadius: 20, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}><X size={16} /> Reprovar</button>
                                            </>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CONFIGURAÇÕES E ITENS */}
            {showModalGerenciar && (
                <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ background: '#1a202c', padding: 30, borderRadius: 8, width: '100%', maxWidth: '1100px', display: 'flex', gap: 20, border: '1px solid #4a5568', maxHeight: '90vh', overflowY: 'auto' }}>

                        {/* COLUNA ESQUERDA: CARGOS */}
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <h3 style={{ color: '#ecc94b', marginTop: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={20} /> Cargos Exigidos
                            </h3>

                            <form onSubmit={handleSaveCargo} style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 20, background: '#2d3748', padding: 15, borderRadius: 8, border: '1px solid #4a5568' }}>
                                {/* <--- SELECT COM OS CARGOS DO BANCO DE DADOS ---> */}
                                <select
                                    required
                                    value={formCargo.cargo_alvo}
                                    onChange={e => setFormCargo({ ...formCargo, cargo_alvo: e.target.value })}
                                    style={{ padding: '10px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none' }}
                                >
                                    <option value="" disabled>Selecione um cargo...</option>
                                    {cargosDisponiveis.map(c => (
                                        <option key={c.id} value={c.nome}>{c.nome.charAt(0).toUpperCase() + c.nome.slice(1)}</option>
                                    ))}
                                </select>

                                <label style={{ color: 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formCargo.exige_foto} onChange={e => setFormCargo({ ...formCargo, exige_foto: e.target.checked })} style={{ transform: 'scale(1.2)' }} />
                                    Exigir foto nos itens?
                                </label>

                                <button type="submit" style={{ background: '#3182ce', color: 'white', border: 'none', padding: '10px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Adicionar Cargo</button>
                            </form>

                            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #4a5568', borderRadius: 5, background: '#2d3748', boxSizing: 'border-box' }}>
                                {configCargos.length === 0 && (
                                    <div style={{ padding: 15, color: '#a0aec0', textAlign: 'center', fontSize: '0.9rem' }}>
                                        Nenhum cargo configurado.
                                    </div>
                                )}
                                {configCargos.map(cfg => (
                                    <div key={cfg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #4a5568', boxSizing: 'border-box', color: 'white', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <strong style={{ textTransform: 'capitalize' }}>{cfg.cargo_alvo}</strong>
                                            <span style={{ fontSize: '0.75rem', color: cfg.exige_foto ? '#00d68f' : '#e53e3e' }}>
                                                {cfg.exige_foto ? 'Exige Fotos' : 'Fotos Opcionais'}
                                            </span>
                                        </div>
                                        {/* Coluna da lixeira (div com alinhamento à direita e tamanho mínimo fixo para garantir visibilidade) */}
                                        <div style={{ textAlign: 'right', minWidth: '30px', marginLeft: 10, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <button onClick={() => handleDeleteCargo(cfg.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 0 }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* DIVISÓRIA E COLUNA DIREITA: ITENS */}
                        <div style={{ flex: 1.5, borderLeft: '1px solid #4a5568', paddingLeft: 20, minWidth: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0, color: '#00d68f' }}>Gerenciar Itens do Checklist</h3>
                                <button onClick={() => setShowModalGerenciar(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={26} /></button>
                            </div>

                            {/* FORMULÁRIO COM CSS GRID PARA FICAR PERFEITAMENTE ALINHADO */}
                            <form onSubmit={handleSaveItem} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 100px 100px', gap: 10, marginBottom: 20, background: '#2d3748', padding: 15, borderRadius: 8, border: '1px solid #4a5568', alignItems: 'flex-end', boxSizing: 'border-box' }}>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Nome do Item</label>
                                    <input
                                        required
                                        value={formItem.nome_item}
                                        onChange={e => setFormItem({ ...formItem, nome_item: e.target.value })}
                                        placeholder="Ex: Bota de Segurança"
                                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Categoria</label>
                                    <select
                                        required
                                        value={formItem.categoria}
                                        onChange={e => {
                                            if (e.target.value === 'ADD_NEW') {
                                                const novaCategoria = prompt("Digite o nome da nova categoria:");
                                                if (novaCategoria && novaCategoria.trim() !== '') {
                                                    setFormItem({ ...formItem, categoria: novaCategoria.trim() });
                                                } else {
                                                    setFormItem({ ...formItem, categoria: '' });
                                                }
                                            } else {
                                                setFormItem({ ...formItem, categoria: e.target.value });
                                            }
                                        }}
                                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                                    >
                                        <option value="" disabled>Selecione...</option>
                                        {[...new Set([...checklistItensDef.map(i => i.categoria), formItem.categoria].filter(Boolean))].map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#00d68f' }}>+ Adicionar categoria...</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Qtd</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formItem.quantidade_padrao}
                                        onChange={e => setFormItem({ ...formItem, quantidade_padrao: e.target.value })}
                                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: 'white', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <button type="submit" style={{ width: '100%', height: '40px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, fontWeight: 'bold' }}>
                                    {editingItem ? <Save size={18} /> : <Plus size={18} />}
                                    {editingItem ? 'Salvar' : 'Add'}
                                </button>
                            </form>

                            <div style={{ maxHeight: 350, overflowY: 'auto', background: '#2d3748', borderRadius: 5, border: '1px solid #4a5568' }}>
                                <table style={{ width: '100%', color: 'white', textAlign: 'left', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#1a202c' }}>
                                        <tr>
                                            <th style={{ padding: '10px 15px', color: '#00d68f' }}>ITEM</th>
                                            <th style={{ padding: '10px 15px', color: '#00d68f' }}>CATEGORIA</th>
                                            <th style={{ padding: '10px 15px', color: '#00d68f', textAlign: 'center' }}>QTD</th>
                                            <th style={{ padding: '10px 15px', color: '#00d68f', textAlign: 'right' }}>AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checklistItensDef.length === 0 && <tr><td colSpan="4" style={{ padding: 15, color: '#a0aec0', textAlign: 'center' }}>Nenhum item cadastrado.</td></tr>}
                                        {checklistItensDef.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #4a5568', background: editingItem?.id === item.id ? '#2c5282' : 'transparent' }}>
                                                <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{item.nome_item}</td>
                                                <td style={{ padding: '12px 15px' }}><span style={{ background: '#4a5568', padding: '3px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{item.categoria}</span></td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>{item.quantidade_padrao}</td>
                                                <td style={{ textAlign: 'right', padding: '12px 15px' }}>
                                                    {/* BOTÃO DE EDITAR ADICIONADO AQUI */}
                                                    <button onClick={() => { setEditingItem(item); setFormItem({ nome_item: item.nome_item, categoria: item.categoria, quantidade_padrao: item.quantidade_padrao, ativo: item.ativo }); }} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', marginRight: 15 }} title="Editar"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }} title="Excluir"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
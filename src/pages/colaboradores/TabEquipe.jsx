// Arquivo: frontend/src/pages/TabEquipe.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircle, Users, Edit, Trash2, XCircle, FileText, X, Search, Filter, AlertTriangle, CheckCircle, Clock, Eye, UploadCloud } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select'; // Importando o Select para os novos filtros

// Estilos para o React Select (Modo Escuro)
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#444',
        color: 'white',
        minHeight: '38px',
        boxShadow: 'none',
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

export default function TabEquipe() {
    const { user, can } = useAuth();
    const [colaboradores, setColaboradores] = useState([]);
    const [bases, setBases] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [arquivoCNH, setArquivoCNH] = useState(null);

    // --- ESTADOS DE FILTRO ---
    const [busca, setBusca] = useState('');

    // Filtro Original (CNH) - Mantido
    const [filtroStatusCNH, setFiltroStatusCNH] = useState('Todos');

    // Novos Filtros (Multi-Select)
    const [filtroStatusColaborador, setFiltroStatusColaborador] = useState([]); // Ativo/Inativo
    const [filtroBase, setFiltroBase] = useState([]); // Seleção de Bases
    const [filtroCargo, setFiltroCargo] = useState([]);

    // Opções para os Selects
    const opcoesStatusColaborador = [
        { value: 'Ativo', label: 'Ativo' },
        { value: 'Inativo', label: 'Inativo' }
    ];
    const opcoesBases = bases.map(b => ({ value: b.nome, label: b.nome }));
    const opcoesCargos = cargos.map(c => {
        const nomeFormatado = c.nome.charAt(0).toUpperCase() + c.nome.slice(1);
        return { value: nomeFormatado, label: nomeFormatado };
    });

    // Adicionado campo 'tipo_colaborador' e 'status' no formulário
    const initialForm = { nome: '', tipo_colaborador: 'Técnico', cpf: '', tipo_cnh: 'B', vencimento_cnh: '', base: '', status: 'Ativo' };
    const [form, setForm] = useState(initialForm);

    // --- MUDANÇA: Usa a permissão dinâmica em vez de chumbar a palavra 'cliente' ---
    const isReadOnly = !can('colaboradores.criar');

    useEffect(() => {
        carregarColaboradores();
        carregarBases();
        carregarCargos(); // <--- ADICIONE ESTA LINHA
    }, []);

    async function carregarBases() {
        try { const res = await api.get('/bases/'); setBases(res.data); } catch (e) { }
    }

    async function carregarCargos() {
        try { const res = await api.get('/usuarios/cargos/lista'); setCargos(res.data); } catch (e) { }
    }

    async function carregarColaboradores() {
        try {
            const response = await api.get('/colaboradores/');

            // --- LÓGICA DE ORDENAÇÃO ADICIONADA ---
            const listaOrdenada = response.data.sort((a, b) => {
                // Se nenhum tiver data, consideramos iguais na ordem
                if (!a.vencimento_cnh && !b.vencimento_cnh) return 0;
                // Se não tiver data, joga para o final da lista
                if (!a.vencimento_cnh) return 1;
                if (!b.vencimento_cnh) return -1;

                // Ordena ascendente: Menor data (mais antiga) aparece primeiro
                return new Date(a.vencimento_cnh) - new Date(b.vencimento_cnh);
            });
            // --------------------------------------

            setColaboradores(listaOrdenada);
        } catch (error) {
            console.error("Erro ao carregar colaboradores", error);
        }
    }

    // --- LÓGICA DE STATUS DA CNH (MANTIDA) ---
    function getStatusCNH(dataVencimento) {
        if (!dataVencimento) return 'Sem Data';

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const vencimento = new Date(dataVencimento);
        // Adiciona fuso horário simples para evitar erro de dia anterior
        vencimento.setMinutes(vencimento.getMinutes() + vencimento.getTimezoneOffset());

        const doisMeses = new Date();
        doisMeses.setDate(hoje.getDate() + 60); // Hoje + 60 dias

        if (vencimento < hoje) return 'Vencida';
        if (vencimento <= doisMeses) return 'Prestes a vencer';
        return 'Em dia';
    }

    async function handleUploadCNH(e) {
        if (editandoId && e.target.files && e.target.files[0]) {
            // Upload imediato se estiver editando
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('arquivo', file);
            try {
                await api.post(`/colaboradores/${editandoId}/cnh`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Documento anexado com sucesso!");
                carregarColaboradores();
            } catch (error) { alert("Erro ao enviar documento."); }
        } else if (e.target.files && e.target.files[0]) {
            // Apenas guarda o arquivo se for cadastro novo
            setArquivoCNH(e.target.files[0]);
        }
    }

    // --- LÓGICA DE FILTRAGEM (COMBINADA) ---
    const colaboradoresFiltrados = colaboradores.filter((m) => {
        const termo = busca.toLowerCase();

        // 1. Busca Textual (Nome, CPF, Base e Cargo)
        const matchBusca =
            m.nome.toLowerCase().includes(termo) ||
            m.cpf.includes(busca) ||
            (m.base && m.base.toLowerCase().includes(termo)) ||
            (m.tipo_colaborador && m.tipo_colaborador.toLowerCase().includes(termo));

        // 2. Filtro de CNH (Original Mantido)
        const statusCNH = getStatusCNH(m.vencimento_cnh);
        let matchStatusCNH = true;
        if (filtroStatusCNH !== 'Todos') {
            matchStatusCNH = statusCNH === filtroStatusCNH;
        }

        // 3. Novo Filtro: Status do Colaborador (Ativo/Inativo)
        let matchStatusColaborador = true;
        if (filtroStatusColaborador.length > 0) {
            const status = m.status || 'Ativo';
            matchStatusColaborador = filtroStatusColaborador.some(opt => opt.value === status);
        }

        // 4. Novo Filtro: Base
        let matchBase = true;
        if (filtroBase.length > 0) {
            matchBase = filtroBase.some(opt => opt.value === m.base);
        }

        // 5. NOVO FILTRO: Cargo
        let matchCargo = true;
        if (filtroCargo.length > 0) {
            const cargoAtual = m.tipo_colaborador || 'Técnico';
            matchCargo = filtroCargo.some(opt => opt.value.toLowerCase() === cargoAtual.toLowerCase());
        }

        return matchBusca && matchStatusCNH && matchStatusColaborador && matchBase && matchCargo; // <-- ADD matchCargo NO FINAL
    });

    // --- COMPONENTE VISUAL DO STATUS CNH NA TABELA (MANTIDO) ---
    function RenderStatusCNH({ data }) {
        const status = getStatusCNH(data);
        // Formatação simples da data para exibição
        const dataFormatada = data ? new Date(data).toLocaleDateString() : '-';

        let cor = '#a0aec0';
        let icone = null;

        if (status === 'Vencida') {
            cor = '#e53e3e'; icone = <XCircle size={14} />;
        } else if (status === 'Prestes a vencer') {
            cor = '#f6ad55'; icone = <AlertTriangle size={14} />;
        } else if (status === 'Em dia') {
            cor = '#00d68f'; icone = <CheckCircle size={14} />;
        }

        return (
            <span style={{ color: cor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {icone} {dataFormatada}
            </span>
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            let res;
            // Prepara payload e remove datas vazias para evitar erro no backend
            const payload = { ...form };
            if (!payload.vencimento_cnh) delete payload.vencimento_cnh;

            if (editandoId) {
                res = await api.put(`/colaboradores/${editandoId}`, payload);
                alert("Colaborador atualizado!");
            } else {
                res = await api.post('/colaboradores/', payload);
                alert("Colaborador cadastrado!");
            }

            // Upload do arquivo pendente (se for cadastro novo)
            if (arquivoCNH && res.data.id && !editandoId) {
                const formData = new FormData();
                formData.append('arquivo', arquivoCNH);
                await api.post(`/colaboradores/${res.data.id}/cnh`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            fecharModal();
            carregarColaboradores();
        } catch (error) {
            alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
        }
    }

    async function handleDelete(id) {
        if (confirm("Tem certeza que deseja excluir este colaborador?")) {
            try { await api.delete(`/colaboradores/${id}`); carregarColaboradores(); }
            catch (error) { alert("Erro ao excluir."); }
        }
    }

    function abrirModal(colaborador = null) {
        setArquivoCNH(null);
        if (colaborador) {
            setEditandoId(colaborador.id);
            setForm({
                nome: colaborador.nome,
                tipo_colaborador: colaborador.tipo_colaborador || 'Técnico', // Adicionado Cargo
                cpf: colaborador.cpf,
                tipo_cnh: colaborador.tipo_cnh || '',
                vencimento_cnh: colaborador.vencimento_cnh,
                base: colaborador.base || '',
                status: colaborador.status || 'Ativo', // Status carregado
                cnh_path: colaborador.cnh_path
            });
        } else {
            setEditandoId(null);
            setForm(initialForm);
        }
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditandoId(null);
        setForm(initialForm);
    }

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function exportarPDF() {
        const doc = new jsPDF();
        doc.text("Relatório de Colaboradores", 14, 10);

        const tableRows = colaboradoresFiltrados.map(m => [
            m.nome,
            m.tipo_colaborador || 'Técnico', // Adicionado Cargo no PDF
            m.cpf,
            m.base || '-',
            m.status || 'Ativo',
            m.vencimento_cnh ? new Date(m.vencimento_cnh).toLocaleDateString() : '-',
            getStatusCNH(m.vencimento_cnh)
        ]);

        autoTable(doc, {
            head: [["Nome", "Cargo", "CPF", "Base", "Status", "Venc. CNH", "Situação"]],
            body: tableRows,
            startY: 20,
        });
        doc.save("colaboradores.pdf");
    }

    function abrirCNH(path) {
        if (!path) return alert("Nenhum arquivo anexado.");
        const url = `http://localhost:8000/files/${path}`;
        window.open(url, '_blank');
    }

    return (
        <div>
            {/* 1. CABEÇALHO E BOTÕES DE AÇÃO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h1><Users style={{ marginRight: '10px' }} /> Colaboradores</h1>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '38px' }}>
                        <FileText size={18} style={{ marginRight: 5 }} /> PDF
                    </button>
                    {!isReadOnly && (
                        <button onClick={() => abrirModal()} className="btn-add" style={{ backgroundColor: '#00d68f', color: 'black', height: '38px' }}>
                            <PlusCircle size={18} style={{ marginRight: 5 }} /> Novo Colaborador
                        </button>
                    )}
                </div>
            </div>

            {/* 2. ÁREA DE FILTROS (MISTO: Busca + Selects + Botões CNH) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>

                {/* Linha Superior: Busca e Filtros Multi-Select */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Campo de Busca */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#2d3748', borderRadius: '5px', padding: '0 10px', height: '38px', minWidth: '250px' }}>
                        <Search size={18} color="#a0aec0" />
                        <input
                            placeholder="Buscar (Nome, Cargo, CPF, Base...)"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', outline: 'none', width: '100%' }}
                        />
                    </div>

                    {/* Filtro Status Colaborador */}
                    <div style={{ minWidth: '180px' }}>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            options={opcoesStatusColaborador}
                            value={filtroStatusColaborador}
                            onChange={setFiltroStatusColaborador}
                            placeholder="Status"
                        />
                    </div>

                    {/* Filtro Base */}
                    <div style={{ minWidth: '200px' }}>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            options={opcoesBases}
                            value={filtroBase}
                            onChange={setFiltroBase}
                            placeholder="Filtrar Base"
                        />
                    </div>

                    {/* NOVO: Filtro Cargo */}
                    <div style={{ minWidth: '200px' }}>
                        <Select
                            styles={customSelectStyles}
                            isMulti
                            options={opcoesCargos}
                            value={filtroCargo}
                            onChange={setFiltroCargo}
                            placeholder="Filtrar Cargo"
                        />
                    </div>
                </div>

                {/* Linha Inferior: Filtros de CNH (Botões Originais) */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.9rem' }}>
                        <Filter size={16} /> CNH:
                    </span>
                    {['Todos', 'Em dia', 'Prestes a vencer', 'Vencida'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFiltroStatusCNH(status)}
                            style={{
                                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                                backgroundColor: filtroStatusCNH === status ?
                                    (status === 'Vencida' ? '#e53e3e' : status === 'Prestes a vencer' ? '#f6ad55' : '#00d68f')
                                    : '#2d3748',
                                color: filtroStatusCNH === status ? (status === 'Vencida' ? 'white' : 'black') : '#a0aec0',
                                transition: '0.2s'
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. TABELA */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Cargo</th>
                            <th>CPF</th>
                            <th>Base</th>
                            <th>Status</th>
                            <th>CNH</th>
                            <th>Vencimento CNH</th>
                            {!isReadOnly && <th style={{ textAlign: 'right' }}>Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {colaboradoresFiltrados.map((m) => {
                            // Define cor do status
                            const statusColor = m.status === 'Inativo' ? '#e53e3e' : '#00d68f';

                            return (
                                <tr key={m.id} style={{ opacity: m.status === 'Inativo' ? 0.6 : 1 }}>
                                    <td style={{ fontWeight: 'bold', color: 'white' }}>{m.nome}</td>
                                    <td><span style={{ background: 'rgba(49, 130, 206, 0.2)', color: '#63b3ed', border: '1px solid #3182ce', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{m.tipo_colaborador || 'Técnico'}</span></td>
                                    <td>{m.cpf}</td>
                                    <td><span style={{ background: '#2d3748', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{m.base || '-'}</span></td>

                                    {/* Badge de Status do Colaborador */}
                                    <td>
                                        <span style={{
                                            color: statusColor,
                                            border: `1px solid ${statusColor}`,
                                            padding: '2px 8px', borderRadius: '10px',
                                            fontSize: '0.7rem', textTransform: 'uppercase'
                                        }}>
                                            {m.status || 'Ativo'}
                                        </span>
                                    </td>

                                    <td style={{ textAlign: 'center' }}>
                                        {/* Botão Categoria */}
                                        {m.cnh_path ? (
                                            <a href={`${api.defaults.baseURL}/colaboradores/${m.id}/cnh`} target="_blank" rel="noopener noreferrer"
                                                style={{ fontWeight: 'bold', color: '#fff', backgroundColor: '#00d68f', padding: '4px 10px', borderRadius: '15px', textDecoration: 'none', fontSize: '0.8rem' }}
                                            >
                                                {m.tipo_cnh}
                                            </a>
                                        ) : (
                                            <span style={{ fontWeight: 'bold', color: '#718096', border: '1px solid #4a5568', padding: '3px 9px', borderRadius: '15px', fontSize: '0.8rem' }}>
                                                {m.tipo_cnh || 'N/A'}
                                            </span>
                                        )}

                                        {/* Ícone Olho (se houver anexo) */}
                                        {m.cnh_path && (
                                            <a href={`${api.defaults.baseURL}/colaboradores/${m.id}/cnh`} target="_blank" rel="noopener noreferrer"
                                                style={{ marginLeft: '10px', color: '#63b3ed', verticalAlign: 'middle' }} title="Ver Documento">
                                                <Eye size={16} />
                                            </a>
                                        )}
                                    </td>

                                    {/* Coluna Vencimento com Cores */}
                                    <td> <RenderStatusCNH data={m.vencimento_cnh} /> </td>

                                    {!isReadOnly && (
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                                <button onClick={() => abrirModal(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3182ce' }} title="Editar"><Edit size={18} /></button>
                                                {can('colaboradores.excluir') && <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }} title="Excluir"><Trash2 size={18} /></button>}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                        {colaboradoresFiltrados.length === 0 && (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>Nenhum colaborador encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 4. MODAL */}
            {modalAberto && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="form-card" style={{ position: 'relative', width: '600px', maxHeight: '90vh', overflowY: 'auto', background: '#1a202c', border: '1px solid #4a5568', padding: '30px' }}>
                        <button onClick={fecharModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>

                        <h2 style={{ marginTop: 0, color: '#00d68f', marginBottom: '20px' }}>{editandoId ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-group">
                                <label>Nome Completo</label>
                                <input name="nome" value={form.nome} onChange={handleChange} required placeholder="Ex: João da Silva" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label>Cargo / Função</label>
                                    <select name="tipo_colaborador" value={form.tipo_colaborador} onChange={handleChange} required>
                                        <option value="">Selecione...</option>
                                        {cargos.map(c => {
                                            const nomeF = c.nome.charAt(0).toUpperCase() + c.nome.slice(1);
                                            return <option key={c.id} value={nomeF}>{nomeF}</option>;
                                        })}
                                    </select>
                                </div>
                                <div className="input-group"><label>CPF</label><input name="cpf" value={form.cpf} onChange={handleChange} required placeholder="000.000.000-00" /></div>

                                <div className="input-group">
                                    <label>Base Alocada</label>
                                    <select name="base" value={form.base || ""} onChange={handleChange}>
                                        <option value="">Selecione...</option>
                                        {bases.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)}
                                    </select>
                                </div>

                                {/* NOVO CAMPO: STATUS */}
                                <div className="input-group">
                                    <label>Status</label>
                                    <select name="status" value={form.status} onChange={handleChange} style={{ background: form.status === 'Inativo' ? '#742a2a' : '#1a202c' }}>
                                        <option value="Ativo">Ativo</option>
                                        <option value="Inativo">Inativo</option>
                                    </select>
                                </div>

                                <div className="input-group"><label>Categoria CNH (Opcional)</label><select name="tipo_cnh" value={form.tipo_cnh || ""} onChange={handleChange}><option value="">Nenhuma / N/A</option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>AB</option><option>AD</option><option>AE</option></select></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group"><label>Vencimento CNH</label><input type="date" name="vencimento_cnh" value={form.vencimento_cnh} onChange={handleChange} /></div>

                                {/* Campo de Upload */}
                                <div className="input-group" style={{ marginTop: '0px', border: '1px dashed #4a5568', padding: '10px', borderRadius: '5px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#a0aec0', fontSize: '0.85rem' }}>
                                        <UploadCloud size={18} />
                                        {arquivoCNH ? arquivoCNH.name : (form.cnh_path ? "Substituir Doc..." : "Anexar CNH/Doc")}
                                    </label>
                                    <input type="file" accept="image/*,application/pdf" onChange={handleUploadCNH} style={{ display: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={fecharModal} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white' }}>Cancelar</button>
                                <button type="submit" className="btn-add" style={{ backgroundColor: '#00d68f', color: '#000' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
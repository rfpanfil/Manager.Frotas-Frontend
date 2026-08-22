import useCan from '../../hooks/useCan';
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircle, Car, Edit, Trash2, XCircle, FileText, X, Search, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import toast from 'react-hot-toast';

// Estilos padronizados
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#444',
        color: 'white',
        minHeight: '38px',
        boxShadow: state.isFocused ? '0 0 0 1px #8B5CF6' : 'none',
        '&:hover': { borderColor: '#8B5CF6' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#8B5CF6' : '#2d3748',
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

export default function Veiculos() {
    const { user } = useAuth();
    const can = useCan();
    const queryClient = useQueryClient();
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    // --- FILTROS MULTI-SELECT ---
    const [filtroStatus, setFiltroStatus] = useState([]);
    const [filtroBase, setFiltroBase] = useState([]);
    const [filtroSeguradora, setFiltroSeguradora] = useState([]);
    const [filtroPneu, setFiltroPneu] = useState([]);
    const [filtroAno, setFiltroAno] = useState([]);
    const [mostrarColunas, setMostrarColunas] = useState({ ano: true, renavam: true, chassi: true });

    // --- ESTADO DA BUSCA ---
    const [busca, setBusca] = useState('');

    const { data: veiculos = [] } = useQuery({ queryKey: ['veiculosLista'], queryFn: async () => (await api.get('/veiculos/')).data , staleTime: 1000 * 60 * 5 });
    const { data: bases = [] } = useQuery({ queryKey: ['bases'], queryFn: async () => (await api.get('/bases/')).data , staleTime: 1000 * 60 * 5 });
    const { data: tiposVeiculo = [] } = useQuery({ queryKey: ['tiposVeiculo'], queryFn: async () => (await api.get('/opcoes/tipos-veiculo')).data , staleTime: 1000 * 60 * 5 });
    const { data: marcasVeiculo = [] } = useQuery({ queryKey: ['marcasVeiculo'], queryFn: async () => (await api.get('/opcoes/marcas-veiculo')).data , staleTime: 1000 * 60 * 5 });

    const initialForm = {
        base: '', tipo: '', marca: '', modelo: '', placa: '', status: 'Ativo',
        renavam: '', chassi: '', ano: '', cor: '',
        modelo_pneu: '', rastreador: '',
        seguradora: '', apolice: '', vencimento_seguro: '', observacao: '', layout_eixos: '', km_atual: ''
    };

    const [form, setForm] = useState(initialForm);

    // --- MUDANÇA: Usa a permissão dinâmica em vez de chumbar a palavra 'cliente' ---
    const isReadOnly = !can('veiculos.criar');

    const identificacaoCalculada = (form.marca && form.modelo && form.placa)
        ? `${form.placa} - ${form.marca} - ${form.modelo}`.toUpperCase()
        : "Preencha marca, modelo e placa";



    // --- OPÇÕES PARA OS SELECTS (Extraídas dos dados carregados) ---
    const opcoesStatus = [{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }, { value: 'Desativado', label: 'Desativado' }];
    const uniqueBases = bases.map(b => ({ value: b.nome, label: b.nome }));
    const uniqueSeguros = [...new Set(veiculos.map(v => v.seguradora).filter(Boolean))].map(s => ({ value: s, label: s }));
    const uniquePneus = [...new Set(veiculos.map(v => v.modelo_pneu).filter(Boolean))].map(p => ({ value: p, label: p }));
    const uniqueAnos = [...new Set(veiculos.map(v => v.ano).filter(Boolean))].sort().map(a => ({ value: a, label: String(a) }));
    const uniqueEixos = [...new Set(veiculos.map(v => v.layout_eixos).filter(Boolean))].sort().map(e => ({ value: e, label: e }));

    // --- LÓGICA DE FILTRAGEM ---
    const veiculosFiltrados = veiculos.filter(v => {
        const termo = busca.toLowerCase();

        const matchBusca =
            v.placa?.toLowerCase().includes(termo) ||
            v.modelo?.toLowerCase().includes(termo) ||
            v.renavam?.toLowerCase().includes(termo) ||
            v.chassi?.toLowerCase().includes(termo) ||
            v.seguradora?.toLowerCase().includes(termo) ||
            v.base?.toLowerCase().includes(termo) ||
            String(v.ano || '').includes(termo);

        const matchStatus = filtroStatus.length === 0 || filtroStatus.some(f => f.value === v.status || (!v.status && f.value === 'Ativo'));
        const matchBase = filtroBase.length === 0 || filtroBase.some(f => f.value === v.base);
        const matchSeguro = filtroSeguradora.length === 0 || filtroSeguradora.some(f => f.value === v.seguradora);
        const matchPneu = filtroPneu.length === 0 || filtroPneu.some(f => f.value === v.modelo_pneu);
        const matchAno = filtroAno.length === 0 || filtroAno.some(f => String(f.value) === String(v.ano));

        return matchBusca && matchStatus && matchBase && matchSeguro && matchPneu && matchAno;
    });

    async function handleSelectChange(e, endpoint, stateUpdater, fieldName) {
        const valor = e.target.value;
        if (valor === 'ADD_NEW') {
            const novoNome = prompt(`Digite o nome para o novo ${fieldName}:`);
            if (novoNome) {
                try {
                    await api.post(endpoint, { nome: novoNome });
                    queryClient.invalidateQueries({ queryKey: fieldName === 'tipo' ? ['tiposVeiculo'] : ['marcasVeiculo'] });
                    setForm(prev => ({ ...prev, [fieldName]: novoNome }));
                } catch (error) {
                    toast.error("Erro ao cadastrar: " + (error.response?.data?.detail || error.message));
                }
            }
        } else {
            setForm(prev => ({ ...prev, [fieldName]: valor }));
        }
    }

    function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

    function exportarPDF() {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text("Relatório de Frota", 14, 10);

        // Monta o cabeçalho dinâmico baseado no que está visível
        const head = ["Base", "Eixo", "Identificação"];
        if (mostrarColunas.ano) head.push("Ano");
        if (mostrarColunas.renavam) head.push("Renavam");
        if (mostrarColunas.chassi) head.push("Chassi");
        head.push("Seguro", "Pneu");

        // Monta as linhas dinâmicas
        const tableRows = veiculosFiltrados.map(v => {
            const row = [
                v.base || '-',
                v.layout_eixos || '-',
                `${v.placa} - ${v.marca} - ${v.modelo}`
            ];
            if (mostrarColunas.ano) row.push(v.ano || '-');
            if (mostrarColunas.renavam) row.push(v.renavam || '-');
            if (mostrarColunas.chassi) row.push(v.chassi || '-');
            row.push(v.seguradora || '-', v.modelo_pneu || '-');
            return row;
        });

        autoTable(doc, { head: [head], body: tableRows, startY: 20 });
        doc.save("relatorio_veiculos.pdf");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!payload.ano) delete payload.ano;
            if (!payload.vencimento_seguro) delete payload.vencimento_seguro;

            if (editandoId) { await api.put(`/veiculos/${editandoId}`, payload); toast.success("Atualizado!"); }
            else { await api.post('/veiculos/', payload); toast("Cadastrado!"); }

            setModalAberto(false);
            setEditandoId(null);
            setForm(initialForm);
            queryClient.invalidateQueries({ queryKey: ['veiculosLista'] });
        } catch (error) { toast.error("Erro ao salvar."); }
    }

    async function handleDelete(id) {
        if (!confirm("Excluir?")) return;
        try { await api.delete(`/veiculos/${id}`); queryClient.invalidateQueries({ queryKey: ['veiculosLista'] }); } catch (error) { toast.error("Erro."); }
    }

    async function abrirModal(v = null) {
        if (v) { 
            const tid = toast.loading("Carregando dados completos...");
            try {
                const res = await api.get(`/veiculos/${v.id}`);
                setEditandoId(v.id); 
                setForm(res.data);
                toast.dismiss(tid);
            } catch (error) {
                console.error("Erro no abrirModal:", error);
                toast.dismiss(tid);
                toast.error("Erro ao carregar dados do veículo.");
                return;
            }
        }
        else { setEditandoId(null); setForm(initialForm); }
        setModalAberto(true);
    }

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* ÁREA DE FILTROS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <Select styles={customSelectStyles} isMulti options={opcoesStatus} placeholder="Status" onChange={setFiltroStatus} />
                    <Select styles={customSelectStyles} isMulti options={uniqueBases} placeholder="Base" onChange={setFiltroBase} />
                    <Select styles={customSelectStyles} isMulti options={uniqueSeguros} placeholder="Seguradora" onChange={setFiltroSeguradora} />
                    <Select styles={customSelectStyles} isMulti options={uniquePneus} placeholder="Pneu" onChange={setFiltroPneu} />
                    <Select styles={customSelectStyles} isMulti options={uniqueAnos} placeholder="Ano" onChange={setFiltroAno} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* CAMPO DE BUSCA */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#2d3748', borderRadius: '5px', padding: '0 10px', flex: 1, minWidth: '300px' }}>
                        <Search size={18} color="#a0aec0" />
                        <input
                            placeholder="Buscar (Placa, Renavam, Chassi...)"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', outline: 'none', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px' }}>
                            <FileText size={18} style={{ marginRight: 5 }} /> Relatório
                        </button>
                        {!isReadOnly && (
                            <button onClick={() => abrirModal()} className="btn-add" style={{ backgroundColor: '#8B5CF6', color: '#fff', height: '40px' }}>
                                <PlusCircle size={18} style={{ marginRight: 5 }} /> Novo Veículo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', padding: '10px 15px', background: '#2d3748', borderRadius: '5px', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ color: '#a0aec0', fontSize: '0.9rem', fontWeight: 'bold' }}>Colunas Visíveis:</span>
                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={mostrarColunas.ano} onChange={e => setMostrarColunas({ ...mostrarColunas, ano: e.target.checked })} /> Ano
                </label>
                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={mostrarColunas.renavam} onChange={e => setMostrarColunas({ ...mostrarColunas, renavam: e.target.checked })} /> Renavam
                </label>
                <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={mostrarColunas.chassi} onChange={e => setMostrarColunas({ ...mostrarColunas, chassi: e.target.checked })} /> Chassi
                </label>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Base</th>
                            <th>Eixo</th>
                            <th>Identificação</th>
                            {mostrarColunas.ano && <th>Ano</th>}
                            {mostrarColunas.renavam && <th>Renavam</th>}
                            {mostrarColunas.chassi && <th>Chassi</th>}
                            <th>Seguro</th>
                            <th>Pneu</th>
                            {!isReadOnly && <th>Opções</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {veiculosFiltrados.map((v) => (
                            <tr key={v.id}>
                                <td><span style={{ background: '#2d3748', padding: '2px 5px', borderRadius: '4px', fontSize: '0.8rem' }}>{v.base || '-'}</span></td>
                                <td><span style={{ color: '#63b3ed', fontSize: '0.85rem' }}>{v.layout_eixos || '-'}</span></td>
                                <td><span style={{ color: '#fff', fontWeight: 'bold' }}>{v.placa} - {v.marca} - {v.modelo}</span></td>
                                {mostrarColunas.ano && <td>{v.ano || '-'}</td>}
                                {mostrarColunas.renavam && <td>{v.renavam || '-'}</td>}
                                {mostrarColunas.chassi && <td>{v.chassi || '-'}</td>}
                                <td>{v.seguradora || '-'}</td>
                                <td>{v.modelo_pneu || '-'}</td>
                                {!isReadOnly && <td style={{ textAlign: 'center' }}><button onClick={() => abrirModal(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3182ce', marginRight: '10px' }}><Edit size={18} /></button>{can("veiculos.excluir") && ( <button onClick={() => handleDelete(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}><Trash2 size={18} /></button> )}</td>}
                            </tr>
                        ))}
                        {veiculosFiltrados.length === 0 && <tr><td colSpan="10" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhum veículo encontrado.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CADASTRO (Mantido intacto) */}
            {modalAberto && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="form-card" style={{ position: 'relative', width: '1100px', maxHeight: '90vh', overflowY: 'auto', background: '#1a202c', border: '1px solid #4a5568', padding: '30px' }}>

                        <button onClick={() => setModalAberto(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}>
                            <X size={28} />
                        </button>

                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#8B5CF6' }}>{editandoId ? 'Editar Veículo' : 'Novo Veículo'}</h3>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            <div style={{ background: '#2d3748', padding: '10px', borderRadius: '5px', textAlign: 'center', border: '1px dashed #8B5CF6' }}>
                                <label style={{ color: '#8B5CF6', fontSize: '0.8rem', textTransform: 'uppercase' }}>Identificação Automática</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{identificacaoCalculada}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label>Base Alocada</label>
                                    <select name="base" value={form.base} onChange={handleChange}>
                                        <option value="">Selecione...</option>
                                        {bases.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Tipo Veículo</label>
                                    <select name="tipo" value={form.tipo} onChange={(e) => handleSelectChange(e, '/opcoes/tipos-veiculo', setTiposVeiculo, 'tipo')}>
                                        <option value="">Selecione...</option>
                                        {tiposVeiculo.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#8B5CF6' }}>+ Cadastrar Novo Tipo...</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Layout de Eixos</label>
                                    <select name="layout_eixos" value={form.layout_eixos || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', background: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                                        <option value="">Selecione...</option>
                                        <option value="MOTO">Moto (2 Rodas)</option>
                                        <option value="4X2_LEVE">4x2 Leve (Carro/S10 - 4 Pneus)</option>
                                        <option value="4X2_PESADO">4x2 Pesado (Toco - 6 Pneus)</option>
                                        <option value="6X2">6x2 (Trucado / 3 Eixos)</option>
                                        <option value="6X4">6x4 (Traçado / 3 Eixos)</option>
                                        <option value="8X2">8x2 (Bitruck / 4 Eixos)</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Marca</label>
                                    <select name="marca" value={form.marca} onChange={(e) => handleSelectChange(e, '/opcoes/marcas-veiculo', setMarcasVeiculo, 'marca')}>
                                        <option value="">Selecione...</option>
                                        {marcasVeiculo.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#8B5CF6' }}>+ Cadastrar Nova Marca...</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Modelo</label>
                                    <input name="modelo" value={form.modelo} onChange={handleChange} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                                <div className="input-group"><label>Placa</label><input name="placa" value={form.placa} onChange={handleChange} required /></div>
                                <div className="input-group"><label>KM Atual (Hodômetro)</label><input type="number" name="km_atual" value={form.km_atual} onChange={handleChange} placeholder="Ex: 0 ou 50000" required /></div>
                                <div className="input-group"><label>Ano</label><input type="number" name="ano" value={form.ano} onChange={handleChange} /></div>
                                <div className="input-group"><label>Cor</label><input name="cor" value={form.cor} onChange={handleChange} /></div>
                                <div className="input-group"><label>Renavam</label><input name="renavam" value={form.renavam} onChange={handleChange} /></div>
                                <div className="input-group">
                                    <label>Situação do Veículo</label>
                                    <select name="status" value={form.status} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', background: '#2d3748', color: 'white', border: '1px solid #4a5568' }}>
                                        <option value="Ativo">🟢 Ativo (Em Operação)</option>
                                        <option value="Inativo">🔴 Inativo (Manutenção/Parado)</option>
                                        <option value="Desativado">⚫ Desativado (Vendido/Baixado)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div className="input-group"><label>Chassi</label><input name="chassi" value={form.chassi} onChange={handleChange} /></div>
                                <div className="input-group"><label>Modelo Pneu</label><input name="modelo_pneu" value={form.modelo_pneu} onChange={handleChange} /></div>
                                <div className="input-group"><label>Rastreador</label><input name="rastreador" value={form.rastreador} onChange={handleChange} /></div>
                            </div>

                            <hr style={{ borderColor: '#4a5568' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div className="input-group"><label>Seguradora</label><input name="seguradora" value={form.seguradora} onChange={handleChange} /></div>
                                <div className="input-group"><label>Apólice</label><input name="apolice" value={form.apolice} onChange={handleChange} /></div>
                                <div className="input-group"><label>Vencimento Seguro</label><input type="date" name="vencimento_seguro" value={form.vencimento_seguro} onChange={handleChange} /></div>
                            </div>

                            <div className="input-group"><label>Observação</label><input name="observacao" value={form.observacao} onChange={handleChange} /></div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={() => setModalAberto(false)} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white' }}>Cancelar</button>
                                <button type="submit" className="btn-add" style={{ backgroundColor: '#8B5CF6', color: '#fff' }}>Salvar Veículo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
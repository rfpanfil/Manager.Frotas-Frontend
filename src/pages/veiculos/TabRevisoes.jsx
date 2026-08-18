// Arquivo: frontend/src/pages/veiculos/TabRevisoes.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Wrench, PlusCircle, Trash2, AlertTriangle, CheckCircle, Clock, X, Search, FileText, CheckSquare, History, User } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select';

const customSelectStyles = {
    container: (base) => ({ ...base, width: '100%' }),
    control: (base, state) => ({ ...base, backgroundColor: '#2d3748', borderColor: '#444', color: 'white', minHeight: '38px', boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none', '&:hover': { borderColor: '#00d68f' } }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#00d68f' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),

    // --- A MÁGICA ESTÁ AQUI: Escudo contra o CSS Global ---
    input: (base) => ({
        ...base,
        color: 'white',
        '& input': {
            width: 'auto !important',
            padding: '0 !important',
            margin: '0 !important',
            boxShadow: 'none !important'
        }
    }),

    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#4a5568' }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#e53e3e' } })
};

export default function Revisoes() {
    const { user, can } = useAuth();
    const [revisoes, setRevisoes] = useState([]);
    const [veiculos, setVeiculos] = useState([]);

    const [busca, setBusca] = useState('');
    const [filtroStatusVeiculo, setFiltroStatusVeiculo] = useState([]);
    const [filtroStatusRevisao, setFiltroStatusRevisao] = useState([]); // NOVO FILTRO DE STATUS
    const [filtroBase, setFiltroBase] = useState([]);
    const [filtroSeguradora, setFiltroSeguradora] = useState([]);
    const [filtroPneu, setFiltroPneu] = useState([]);
    const [filtroAno, setFiltroAno] = useState([]);

    // Modais
    const [modalNovoPlanoAberto, setModalNovoPlanoAberto] = useState(false);
    const [modalRegistroAberto, setModalRegistroAberto] = useState(false);
    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

    const [revisaoSelecionada, setRevisaoSelecionada] = useState(null);
    const [historicoLogs, setHistoricoLogs] = useState([]);

    // Forms
    const [formPlano, setFormPlano] = useState({ veiculo_id: '', intervalo_km: 10000 });
    const [formRegistro, setFormRegistro] = useState({ data_revisao: new Date().toISOString().slice(0, 10), km_revisao: '', observacao: '' });

    useEffect(() => { carregarDados(); }, []);

    async function carregarDados() {
        try {
            const [resRev, resVei] = await Promise.all([api.get('/revisoes/'), api.get('/veiculos/')]);
            setRevisoes(resRev.data);
            setVeiculos(resVei.data);
        } catch (error) { console.error("Erro ao carregar:", error); }
    }

    const opcoesStatusVeiculo = [{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }, { value: 'Desativado', label: 'Desativado' }];
    const opcoesStatusRevisao = [{ value: 'Em Dia', label: 'Em Dia' }, { value: 'Próximo', label: 'Próximo' }, { value: 'Vencido', label: 'Vencido' }]; // NOVO FILTRO
    const uniqueBases = [...new Set(veiculos.map(v => v.base).filter(Boolean))].map(b => ({ value: b, label: b }));
    const uniqueSeguros = [...new Set(veiculos.map(v => v.seguradora).filter(Boolean))].map(s => ({ value: s, label: s }));
    const uniquePneus = [...new Set(veiculos.map(v => v.modelo_pneu).filter(Boolean))].map(p => ({ value: p, label: p }));
    const uniqueAnos = [...new Set(veiculos.map(v => v.ano).filter(Boolean))].sort().map(a => ({ value: a, label: String(a) }));

    // Opções para o select dinâmico de veículos
    const opcoesVeiculos = veiculos.map(v => ({ value: v.id, label: v.identificacao }));

    const revisoesFiltradas = revisoes.filter(r => {
        const v = r.veiculo || {};
        const termo = busca.toLowerCase();
        const matchBusca = String(r.id).includes(termo) || (v.identificacao || '').toLowerCase().includes(termo) || (v.placa || '').toLowerCase().includes(termo) || (r.status || '').toLowerCase().includes(termo);

        const matchStatusV = filtroStatusVeiculo.length === 0 || filtroStatusVeiculo.some(f => f.value === v.status);
        const matchStatusR = filtroStatusRevisao.length === 0 || filtroStatusRevisao.some(f => f.value === r.status);
        const matchBase = filtroBase.length === 0 || filtroBase.some(f => f.value === v.base);

        return matchBusca && matchStatusV && matchStatusR && matchBase;
    }).sort((a, b) => {
        const saldoA = a.proxima_revisao_km - (a.veiculo?.km_atual || 0);
        const saldoB = b.proxima_revisao_km - (b.veiculo?.km_atual || 0);
        return saldoA - saldoB;
    });

    // --- FUNÇÕES DE API ---
    async function criarPlano(e) {
        e.preventDefault();
        if (!formPlano.veiculo_id) return alert("Por favor, selecione um veículo.");
        try {
            // Ocultamos a data e o KM inicial no momento da criação para satisfazer o banco de dados
            const payload = {
                veiculo_id: parseInt(formPlano.veiculo_id),
                intervalo_km: parseFloat(formPlano.intervalo_km),
                km_ultima_revisao: 0,
                data_ultima_revisao: new Date().toISOString().slice(0, 10),
                descricao: ''
            };

            await api.post('/revisoes/', payload);
            alert("Plano configurado com sucesso! Agora você já pode registrar a primeira execução na lista.");
            setModalNovoPlanoAberto(false);
            carregarDados();
        } catch (error) { alert("Erro ao salvar: " + (error.response?.data?.detail || error.message)); }
    }

    async function registrarExecucao(e) {
        e.preventDefault();
        try {
            await api.post(`/revisoes/${revisaoSelecionada.id}/realizar`, {
                data_revisao: formRegistro.data_revisao,
                km_revisao: parseFloat(formRegistro.km_revisao),
                observacao: formRegistro.observacao
            });
            alert("Revisão registrada com sucesso!");
            setModalRegistroAberto(false);
            carregarDados();
        } catch (error) { alert("Erro ao registrar: " + (error.response?.data?.detail || error.message)); }
    }

    async function abrirHistorico(r) {
        setRevisaoSelecionada(r);
        try {
            const res = await api.get(`/revisoes/${r.id}/historico`);
            setHistoricoLogs(res.data);
            setModalHistoricoAberto(true);
        } catch (error) { alert("Erro ao carregar histórico."); }
    }

    async function handleDelete(id) {
        if (confirm("Excluir este plano de revisão completamente? (O histórico também será apagado)")) {
            try { await api.delete(`/revisoes/${id}`); carregarDados(); }
            catch (error) { alert("Erro ao excluir."); }
        }
    }

    // --- EXPORTAR PDF ---
    function exportarPDF() {
        const doc = new jsPDF();
        doc.text("Relatório de Revisões da Frota", 14, 10);

        const tableRows = revisoesFiltradas.map(r => {
            const kmAtual = r.veiculo?.km_atual || 0;
            const saldo = r.proxima_revisao_km - kmAtual;
            return [
                r.veiculo?.identificacao || 'N/D',
                `${r.km_ultima_revisao} km`,
                `${kmAtual} km`,
                `${r.intervalo_km} km`,
                `${r.proxima_revisao_km} km`,
                `${saldo} km`,
                r.status
            ];
        });

        autoTable(doc, {
            head: [["Veículo", "Km Últ. Rev", "Km Atual", "Intervalo", "Próxima (Km)", "Saldo", "Status"]],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 }
        });
        doc.save("Relatorio_Revisoes.pdf");
    }

    // --- RENDERIZAÇÃO ---
    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <Select styles={customSelectStyles} isMulti options={opcoesStatusRevisao} placeholder="Status (Vencido, etc)" onChange={setFiltroStatusRevisao} />
                    <Select styles={customSelectStyles} isMulti options={opcoesStatusVeiculo} placeholder="Status Veículo" onChange={setFiltroStatusVeiculo} />
                    <Select styles={customSelectStyles} isMulti options={uniqueBases} placeholder="Base" onChange={setFiltroBase} />
                    <Select styles={customSelectStyles} isMulti options={uniqueSeguros} placeholder="Seguradora" onChange={setFiltroSeguradora} />
                    <Select styles={customSelectStyles} isMulti options={uniquePneus} placeholder="Pneu" onChange={setFiltroPneu} />
                    <Select styles={customSelectStyles} isMulti options={uniqueAnos} placeholder="Ano" onChange={setFiltroAno} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', background: '#2d3748', padding: '5px 10px', borderRadius: '5px', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ color: '#a0aec0', marginRight: '5px' }} />
                        <input placeholder="Buscar (Placa, Renavam, Status...)" value={busca} onChange={e => setBusca(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {can('revisoes.baixar') && (
                            <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '38px' }}>
                                <FileText size={18} style={{ marginRight: 5 }} /> PDF
                            </button>
                        )}

                        {can('revisoes.criar') && (
                            <button onClick={() => setModalNovoPlanoAberto(true)} className="btn-add" style={{ display: 'flex', alignItems: 'center', height: '38px', background: '#3182ce' }}>
                                <PlusCircle size={18} style={{ marginRight: 5 }} /> Configurar plano de revisão
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Veículo</th>
                            <th>Km Últ. Rev.</th>
                            <th>Km Atual do Veículo</th>
                            <th>Intervalo</th>
                            <th>Próxima (Km)</th>
                            <th>Saldo (Faltam)</th>
                            <th>Status</th>
                            <th>Ações de Manutenção</th>
                        </tr>
                    </thead>
                    <tbody>
                        {revisoesFiltradas.map((r) => {
                            const kmAtual = r.veiculo?.km_atual || 0;
                            const saldo = r.proxima_revisao_km - kmAtual;
                            return (
                                <tr key={r.id}>
                                    <td><strong style={{ color: '#fff', fontSize: '0.9rem' }}>{r.veiculo?.identificacao}</strong></td>
                                    <td style={{ color: '#a0aec0' }}>{r.km_ultima_revisao} km</td>
                                    <td style={{ fontWeight: 'bold' }}>{kmAtual} km</td>
                                    <td>{r.intervalo_km} km</td>
                                    <td><strong style={{ color: '#fff' }}>{r.proxima_revisao_km} km</strong></td>
                                    <td><strong style={{ color: saldo < 0 ? '#e53e3e' : '#00d68f' }}>{saldo} km</strong></td>
                                    <td>
                                        {r.status === 'Em Dia' && <span style={{ color: '#00d68f' }}><CheckCircle size={14} style={{ display: 'inline' }} /> Em Dia</span>}
                                        {r.status === 'Próximo' && <span style={{ color: '#ecc94b' }}><Clock size={14} style={{ display: 'inline' }} /> Próximo</span>}
                                        {r.status === 'Vencido' && <span style={{ color: '#e53e3e' }}><AlertTriangle size={14} style={{ display: 'inline' }} /> Vencido</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {can('revisoes.criar') && (
                                                <button onClick={() => { setRevisaoSelecionada(r); setFormRegistro({ ...formRegistro, km_revisao: kmAtual, observacao: '' }); setModalRegistroAberto(true); }} className="btn-add" style={{ padding: '5px 10px', background: '#00d68f', color: '#000', fontSize: '0.8rem' }}>
                                                    <CheckSquare size={14} style={{ marginRight: 3, display: 'inline' }} /> Atualizar / Executar
                                                </button>
                                            )}
                                            <button onClick={() => abrirHistorico(r)} className="btn-add" style={{ padding: '5px 10px', background: '#2b6cb0', color: '#fff', fontSize: '0.8rem' }}>
                                                <History size={14} style={{ marginRight: 3, display: 'inline' }} /> Histórico
                                            </button>
                                            {can('revisoes.excluir') && (
                                                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }} title="Excluir Plano"><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL 1: REGISTRAR EXECUÇÃO */}
            {modalRegistroAberto && revisaoSelecionada && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="form-card" style={{ width: '500px', background: '#1a202c', border: '1px solid #4a5568', padding: '30px', position: 'relative' }}>
                        <button onClick={() => setModalRegistroAberto(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                        <h3 style={{ marginTop: 0, color: '#00d68f' }}><Wrench size={20} style={{ display: 'inline', marginRight: 8 }} />Registrar Manutenção Realizada</h3>
                        <p style={{ color: '#a0aec0', marginBottom: 20 }}>Veículo: <strong>{revisaoSelecionada.veiculo?.identificacao}</strong></p>

                        <form onSubmit={registrarExecucao} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label>Data da Manutenção</label>
                                    <input type="date" value={formRegistro.data_revisao} onChange={e => setFormRegistro({ ...formRegistro, data_revisao: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    {/* LABEL ALTERADO CONFORME PEDIDO */}
                                    <label>KM da revisão</label>
                                    <input type="number" value={formRegistro.km_revisao} onChange={e => setFormRegistro({ ...formRegistro, km_revisao: e.target.value })} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ color: '#f6ad55', fontWeight: 'bold' }}>Observação / Justificativa (Obrigatório)*</label>
                                <textarea rows="3" placeholder="Ex: Feita com 500km de atraso pois a peça não chegou a tempo..." value={formRegistro.observacao} onChange={e => setFormRegistro({ ...formRegistro, observacao: e.target.value })} required minLength="5" style={{ width: '100%', background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: 10, borderRadius: 5 }} />
                            </div>
                            <button type="submit" className="btn-add" style={{ backgroundColor: '#00d68f', color: '#000', padding: 15, fontSize: '1rem', marginTop: 10 }}>
                                Confirmar Execução
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: HISTÓRICO DE REVISÕES */}
            {modalHistoricoAberto && revisaoSelecionada && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="form-card" style={{ width: '600px', background: '#1a202c', border: '1px solid #4a5568', padding: '30px', position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <button onClick={() => setModalHistoricoAberto(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                        <h3 style={{ marginTop: 0, color: '#fff' }}><History size={20} style={{ display: 'inline', marginRight: 8 }} />Histórico de Revisões</h3>
                        <p style={{ color: '#a0aec0' }}>Veículo: <strong>{revisaoSelecionada.veiculo?.identificacao}</strong></p>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 10, marginTop: 15 }}>
                            {historicoLogs.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid #4a5568', marginLeft: 10 }}>
                                    {historicoLogs.map(h => (
                                        <li key={h.id} style={{ position: 'relative', paddingLeft: 20, paddingBottom: 25 }}>
                                            <div style={{ position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%', background: '#00d68f' }}></div>
                                            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginTop: -5 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a0aec0', fontSize: '0.85rem', marginBottom: 5 }}>
                                                    <span>Data: <strong>{new Date(h.data_revisao).toLocaleDateString()}</strong></span>
                                                    <span>KM: <strong style={{ color: '#fff' }}>{h.km_revisao} km</strong></span>
                                                </div>
                                                <div style={{ fontSize: '0.95rem', color: '#fff', fontStyle: 'italic', background: '#1a202c', padding: 10, borderRadius: 5, marginTop: 10 }}>
                                                    "{h.observacao}"
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#718096', marginTop: 10 }}>
                                                    <User size={12} /> Lançado por: {h.usuario?.nome || 'Desconhecido'} em {new Date(h.data_evento).toLocaleString()}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p style={{ textAlign: 'center', color: '#a0aec0' }}>Nenhum histórico registrado ainda.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: CONFIGURAR PLANO DE REVISÃO */}
            {modalNovoPlanoAberto && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="form-card" style={{ width: '500px', background: '#1a202c', border: '1px solid #4a5568', padding: '30px', position: 'relative' }}>
                        <button onClick={() => setModalNovoPlanoAberto(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                        <h3 style={{ marginTop: 0, color: '#3182ce' }}>Configurar plano de revisão</h3>
                        <form onSubmit={criarPlano} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-group">
                                {/* LABEL E SELECT ATUALIZADOS */}
                                <label>Veículo</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={opcoesVeiculos}
                                    placeholder="Buscar por placa, marca ou modelo..."
                                    onChange={(selected) => setFormPlano({ ...formPlano, veiculo_id: selected ? selected.value : '' })}
                                    isClearable
                                />
                            </div>

                            <div className="input-group">
                                <label>Intervalo a cada (Km)</label>
                                <input type="number" placeholder="Ex: 10000" value={formPlano.intervalo_km} onChange={e => setFormPlano({ ...formPlano, intervalo_km: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn-add" style={{ backgroundColor: '#3182ce', color: '#fff', padding: 15 }}>Criar Plano</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
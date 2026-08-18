// Arquivo: frontend/src/pages/compras/TabFornecedores.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Plus, Edit, Trash2, Search, FileDown, Eye, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TabFornecedores() {
    const { can } = useAuth();
    const [lista, setLista] = useState([]);
    const [ocs, setOcs] = useState([]); // Usado para buscar o histórico de OCs do fornecedor

    const [modalAberto, setModalAberto] = useState(false);
    const [fornSelecionado, setFornSelecionado] = useState(null); // Resumo

    // Filtros e Paginação
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(''); // 'Ativo' ou 'Inativo'
    const [visibleCount, setVisibleCount] = useState(20);

    const [form, setForm] = useState({ id: null, razao_social: '', cnpj_cpf: '', tipo: 'PRODUTO', contato: '', endereco: '', observacao: '', status: 'Ativo' });

    useEffect(() => { carregar(); }, []);

    async function carregar() {
        try {
            const [resForn, resOc] = await Promise.all([
                api.get('/compras/fornecedores'),
                api.get('/compras/oc') // Pega OCs para mostrar no histórico
            ]);
            setLista(resForn.data);
            setOcs(resOc.data);
        } catch (e) { console.error(e); }
    }

    // Função Salvar Inteligente (Cria ou Edita)
    async function salvar(e) {
        e.preventDefault();
        try {
            if (form.id) {
                // Se tem ID, é Edição (PUT)
                await api.put(`/compras/fornecedores/${form.id}`, form);
                alert("Fornecedor atualizado com sucesso!");
            } else {
                // Se não tem ID, é Criação (POST)
                await api.post('/compras/fornecedores', form);
                alert("Fornecedor cadastrado com sucesso!");
            }
            setModalAberto(false);
            setForm({ id: null, razao_social: '', cnpj_cpf: '', tipo: 'PRODUTO', contato: '', endereco: '', observacao: '', status: 'Ativo' }); // Limpa o form
            carregar();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar. Verifique os dados.");
        }
    }


    // Função para abrir o modal de edição preenchido
    function prepararEdicao(fornecedor) {
        setForm({
            id: fornecedor.id,
            razao_social: fornecedor.razao_social,
            cnpj_cpf: fornecedor.cnpj_cpf,
            tipo: fornecedor.tipo,
            contato: fornecedor.contato || '',
            endereco: fornecedor.endereco || '',
            observacao: fornecedor.observacao || '',
            status: fornecedor.status
        });
        setFornSelecionado(null); // Fecha o modal de visualização
        setModalAberto(true);     // Abre o modal de formulário
    }

    // Função para excluir
    async function excluirFornecedor(id) {
        if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
            try {
                await api.delete(`/compras/fornecedores/${id}`);
                alert("Fornecedor excluído!");
                setFornSelecionado(null);
                carregar();
            } catch (error) {
                console.error(error);
                // Mostra a mensagem de erro vinda do backend (ex: tem vínculos)
                alert(error.response?.data?.detail || "Erro ao excluir fornecedor.");
            }
        }
    }

    // ================= LÓGICA DE FILTROS =================
    const dadosFiltrados = lista.filter(f => {
        const termo = busca.toLowerCase();
        const matchTexto =
            (f.razao_social || '').toLowerCase().includes(termo) ||
            (f.cnpj_cpf || '').toLowerCase().includes(termo) ||
            (f.tipo || '').toLowerCase().includes(termo);

        const matchStatus = filtroStatus ? f.status?.toLowerCase() === filtroStatus.toLowerCase() : true;
        return matchTexto && matchStatus;
    });

    const dadosPaginados = dadosFiltrados.slice(0, visibleCount);

    // ================= GERAÇÃO DE PDFS =================
    const baixarListaPDF = () => {
        const doc = new jsPDF();
        doc.text("Relatório de Fornecedores", 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [['Razão Social', 'CNPJ/CPF', 'Tipo', 'Contato', 'Status']],
            body: dadosFiltrados.map(f => [f.razao_social, f.cnpj_cpf, f.tipo, f.contato || '-', f.status])
        });
        doc.save(`Fornecedores_${new Date().getTime()}.pdf`);
    };

    const baixarResumoPDF = (forn) => {
        const doc = new jsPDF();
        doc.text(`Resumo do Fornecedor: ${forn.razao_social}`, 14, 20);
        autoTable(doc, {
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [0, 214, 143], textColor: [0, 0, 0] },
            body: [
                ['Razão Social', forn.razao_social],
                ['CNPJ/CPF', forn.cnpj_cpf],
                ['Tipo de Fornecedor', forn.tipo],
                ['Contato', forn.contato || 'Não informado'],
                ['Endereço', forn.endereco || 'Não informado'],
                ['Status', forn.status]
            ]
        });
        doc.save(`${forn.razao_social.replace(/ /g, '_')}_Resumo.pdf`);
    };

    const inputStyle = { width: '100%', padding: '10px', background: '#1a202c', border: '1px solid #444', color: 'white', borderRadius: '4px', boxSizing: 'border-box' };

    return (
        <div>
            {/* 1. TOPO DA ABA: FILTROS E BUSCA */}
            <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568', width: '400px' }}>
                        <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar por nome, CNPJ ou tipo..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={baixarListaPDF} className="btn-add" style={{ background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FileDown size={16} /> Baixar PDF
                        </button>
                        {can('compras.fornecedores.criar') && (
                            <button className="btn-add" 
                                onClick={() => {
                                    setForm({ id: null, razao_social: '', cnpj_cpf: '', tipo: 'PRODUTO', contato: '', endereco: '', observacao: '', status: 'Ativo' });
                                    setModalAberto(true);
                                }} 
                                style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Plus size={16} /> Novo Fornecedor
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setFiltroStatus('')} style={{ padding: '5px 15px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: filtroStatus === '' ? '#00d68f' : '#1a202c', color: filtroStatus === '' ? '#000' : '#a0aec0' }}>Todos</button>
                    <button onClick={() => setFiltroStatus('Ativo')} style={{ padding: '5px 15px', borderRadius: 20, border: '1px solid #4a5568', cursor: 'pointer', background: filtroStatus === 'Ativo' ? '#63b3ed' : 'transparent', color: filtroStatus === 'Ativo' ? '#000' : '#a0aec0' }}>Ativos</button>
                    <button onClick={() => setFiltroStatus('Inativo')} style={{ padding: '5px 15px', borderRadius: 20, border: '1px solid #4a5568', cursor: 'pointer', background: filtroStatus === 'Inativo' ? '#e53e3e' : 'transparent', color: filtroStatus === 'Inativo' ? '#fff' : '#a0aec0' }}>Inativos</button>
                </div>
            </div>

            {/* 2. TABELA PRINCIPAL */}
            <div className="table-container">
                <table>
                    <thead><tr><th>Razão Social</th><th>CNPJ/CPF</th><th>Tipo</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                        {dadosPaginados.map(f => (
                            <tr key={f.id}>
                                <td style={{ fontWeight: 'bold' }}>{f.razao_social}</td>
                                <td>{f.cnpj_cpf}</td>
                                <td><span style={{ fontSize: '0.75rem', padding: '3px 6px', background: '#4a5568', borderRadius: 3 }}>{f.tipo}</span></td>
                                <td>{f.contato || '-'}</td>
                                <td><span style={{ color: f.status === 'Ativo' ? '#00d68f' : '#e53e3e' }}>{f.status}</span></td>
                                <td>
                                    <button onClick={() => setFornSelecionado(f)} title="Ver Resumo" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Eye size={18} /> Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {visibleCount < dadosFiltrados.length && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={() => setVisibleCount(v => v + 20)} style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '10px 30px', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>
                        Carregar + ({dadosFiltrados.length - visibleCount} restantes)
                    </button>
                </div>
            )}

            {/* 3. MODAL DE RESUMO "VER" (COM HISTÓRICO) */}
            {fornSelecionado && (
                <div className="modal-overlay" onClick={() => setFornSelecionado(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                            <h3>Ficha do Fornecedor: <span style={{ color: '#00d68f' }}>{fornSelecionado.razao_social}</span></h3>
                            <button onClick={() => setFornSelecionado(null)} className="btn-close-modal"><X /></button>
                        </div>

                        <div style={{ background: '#1a202c', padding: 15, borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                            <div><small style={{ color: '#a0aec0' }}>CNPJ/CPF:</small><div style={{ fontWeight: 'bold' }}>{fornSelecionado.cnpj_cpf}</div></div>
                            <div><small style={{ color: '#a0aec0' }}>Status:</small><div style={{ color: fornSelecionado.status === 'Ativo' ? '#00d68f' : '#e53e3e' }}>{fornSelecionado.status}</div></div>
                            <div><small style={{ color: '#a0aec0' }}>Contato (Tel/Email):</small><div>{fornSelecionado.contato || 'Não informado'}</div></div>
                            <div><small style={{ color: '#a0aec0' }}>Tipo:</small><div>{fornSelecionado.tipo}</div></div>
                            <div style={{ gridColumn: 'span 2' }}><small style={{ color: '#a0aec0' }}>Endereço:</small><div>{fornSelecionado.endereco || 'Não informado'}</div></div>
                            <div style={{ gridColumn: 'span 2' }}><small style={{ color: '#a0aec0' }}>Observações:</small><div style={{ background: '#2d3748', padding: 10, borderRadius: 4 }}>{fornSelecionado.observacao || 'Sem observações.'}</div></div>
                        </div>

                        {/* HISTÓRICO DE OCs */}
                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ borderBottom: '1px solid #444', paddingBottom: 5, color: '#f6ad55' }}>Histórico de Ordens de Compra (OC)</h4>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#1a202c', padding: 10, borderRadius: 5 }}>
                                {ocs.filter(oc => oc.fornecedor_id === fornSelecionado.id).length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {ocs.filter(oc => oc.fornecedor_id === fornSelecionado.id).map(oc => (
                                            <li key={oc.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #444', padding: '5px 0' }}>
                                                <span style={{ color: '#63b3ed' }}>{oc.numero}</span>
                                                <span style={{ color: '#a0aec0' }}>{new Date(oc.data_emissao).toLocaleDateString()}</span>
                                                <span style={{ fontWeight: 'bold' }}>R$ {oc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                <span style={{ fontSize: '0.8rem', color: oc.status === 'Cancelada' ? '#e53e3e' : '#00d68f' }}>{oc.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div style={{ color: '#a0aec0', fontSize: '0.9rem', textAlign: 'center' }}>Nenhuma Ordem de Compra registrada com este fornecedor.</div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button onClick={() => baixarResumoPDF(fornSelecionado)} style={{ flex: 1, background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                                <FileText size={16} /> Baixar PDF
                            </button>
                            
                            {can('compras.fornecedores.criar') && (
                                <button 
                                    onClick={() => prepararEdicao(fornSelecionado)} 
                                    title="Editar Fornecedor"
                                    style={{ background: '#ecc94b', border: 'none', color: 'black', padding: '10px 15px', borderRadius: 5, cursor: 'pointer' }}
                                >
                                    <Edit size={16} />
                                </button>
                            )}
                            
                            {can('compras.fornecedores.excluir') && (
                                <button 
                                    onClick={() => excluirFornecedor(fornSelecionado.id)} 
                                    title="Excluir Fornecedor"
                                    style={{ background: '#e53e3e', border: 'none', color: 'white', padding: '10px 15px', borderRadius: 5, cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CRIAÇÃO */}
            {modalAberto && (
                <div className="modal-overlay" onClick={() => setModalAberto(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                            <h3>{form.id ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</h3>
                            <button onClick={() => setModalAberto(false)} className="btn-close-modal"><X /></button>
                        </div>
                        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                                <label>Razão Social / Nome</label>
                                <input 
                                    required 
                                    value={form.razao_social} // <--- ADICIONADO
                                    onChange={e => setForm({ ...form, razao_social: e.target.value })} 
                                    style={inputStyle} 
                                />
                            </div>
                            
                            <div>
                                <label>CNPJ ou CPF</label>
                                <input 
                                    required 
                                    value={form.cnpj_cpf} // <--- ADICIONADO
                                    onChange={e => setForm({ ...form, cnpj_cpf: e.target.value })} 
                                    style={inputStyle} 
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label>Tipo</label>
                                    <select 
                                        value={form.tipo} // <--- ADICIONADO
                                        onChange={e => setForm({ ...form, tipo: e.target.value })} 
                                        style={inputStyle}
                                    >
                                        <option value="PRODUTO">Produto</option>
                                        <option value="SERVICO">Serviço</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Status</label>
                                    <select 
                                        value={form.status} // <--- ADICIONADO
                                        onChange={e => setForm({ ...form, status: e.target.value })} 
                                        style={inputStyle}
                                    >
                                        <option value="Ativo">Ativo</option>
                                        <option value="Inativo">Inativo</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label>Contato (Telefone / E-mail)</label>
                                <input 
                                    value={form.contato} // <--- ADICIONADO
                                    onChange={e => setForm({ ...form, contato: e.target.value })} 
                                    style={inputStyle} 
                                />
                            </div>
                            
                            <div>
                                <label>Endereço Completo</label>
                                <input 
                                    value={form.endereco} // <--- ADICIONADO
                                    onChange={e => setForm({ ...form, endereco: e.target.value })} 
                                    style={inputStyle} 
                                />
                            </div>
                            
                            <div>
                                <label>Observações</label>
                                <textarea 
                                    rows="2" 
                                    value={form.observacao} // <--- ADICIONADO
                                    onChange={e => setForm({ ...form, observacao: e.target.value })} 
                                    style={inputStyle} 
                                />
                            </div>
                            
                            <button className="btn-add" style={{ marginTop: 10 }}>
                                {form.id ? 'Salvar Alterações' : 'Salvar Fornecedor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
// Arquivo: frontend/src/pages/Empresas.jsx
import React, { useState, useEffect } from 'react';
import { Building, Plus, X, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';
import { SAAS_CONFIG, TODOS_MODULOS } from '../config/saas';
import { useAuth } from '../contexts/AuthContext';

export default function Empresas() {
    const { user, carregarPermissoesDoBackend } = useAuth();
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editandoId, setEditandoId] = useState(null); // NOVO

    const initialForm = { nome_fantasia: '', cnpj: '', status: 'Ativo', modulos_ativos: TODOS_MODULOS };
    const [formData, setFormData] = useState(initialForm);

    function handleModuloToggle(modulo, isChecked) {
        let atuais = formData.modulos_ativos || [];
        if (isChecked) atuais = [...atuais, modulo];
        else atuais = atuais.filter(m => m !== modulo);
        setFormData({ ...formData, modulos_ativos: atuais });
    }

    useEffect(() => {
        carregarEmpresas();
    }, []);

    const carregarEmpresas = async () => {
        try {
            const res = await api.get('/empresas/');
            setEmpresas(res.data);
        } catch (error) {
            console.error("Erro ao buscar empresas:", error);
            alert("Erro ao carregar as empresas. Verifique se você é um Super Admin.");
        } finally {
            setLoading(false);
        }
    };

    function abrirModal(empresa = null) {
        if (empresa) {
            setEditandoId(empresa.id);
            setFormData({
                nome_fantasia: empresa.nome_fantasia,
                cnpj: empresa.cnpj || '',
                status: empresa.status,
                modulos_ativos: empresa.modulos_ativos || TODOS_MODULOS
            });
        } else {
            setEditandoId(null);
            setFormData(initialForm);
        }
        setShowModal(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome_fantasia) return alert("O Nome Fantasia é obrigatório.");

        try {
            if (editandoId) {
                await api.put(`/empresas/${editandoId}`, formData);
                alert("Empresa atualizada com sucesso!");
                // Se o superadmin editou a empresa que ele está acessando no momento, atualizamos o storage e damos reload!
                if (user?.empresa_atual?.id === editandoId) {
                    const updatedUser = { ...user };
                    updatedUser.modulos_ativos = formData.modulos_ativos;
                    updatedUser.empresa_atual = { ...updatedUser.empresa_atual, modulos_ativos: formData.modulos_ativos };
                    localStorage.setItem('loop_user', JSON.stringify(updatedUser));
                }
            } else {
                await api.post('/empresas/', formData);
                alert("Empresa cadastrada com sucesso!");
            }
            setShowModal(false);
            carregarEmpresas();
            // Atualiza o sidebar forçando o reload se o usuário atualizou a própria empresa (ou atualizar a sessão no futuro)
            if (user?.empresa_atual?.id === editandoId) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Erro ao salvar empresa:", error);
            alert(error.response?.data?.detail || "Erro ao salvar empresa.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("CUIDADO! Tem certeza que deseja tentar excluir esta empresa?")) return;

        try {
            await api.delete(`/empresas/${id}`);
            alert("Empresa excluída com sucesso.");
            carregarEmpresas();
        } catch (error) {
            alert(error.response?.data?.detail || "Erro ao excluir empresa.");
        }
    };

    return (
        <div>
            <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h1 style={{ margin: 0, borderBottom: '2px solid #00d68f', paddingBottom: '5px' }}>
                    <Building size={28} style={{ marginRight: '10px', verticalAlign: 'middle', color: '#00d68f' }} />
                    Gestão de Clientes (SaaS)
                </h1>
                <button className="btn-add" onClick={() => abrirModal()}>
                    <Plus size={20} /> Nova Empresa
                </button>
            </div>

            <div style={{ backgroundColor: 'rgba(0, 214, 143, 0.1)', borderLeft: '4px solid #00d68f', padding: '15px', marginBottom: '20px', borderRadius: '4px', fontSize: '0.9rem', color: '#e2e8f0' }}>
                <strong>Modo Deus (Super Admin):</strong> Você está vendo todas as empresas do sistema. Use o seletor no menu lateral esquerdo para entrar dentro de uma empresa específica e gerenciar os dados dela (Gastos, Veículos, Usuários, etc).
            </div>

            <div className="table-container">
                {loading ? (
                    <p>Carregando carteira de clientes...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome Fantasia</th>
                                <th>CNPJ</th>
                                <th>Status</th>
                                <th>Data de Entrada</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empresas.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>Nenhuma empresa cadastrada ainda.</td>
                                </tr>
                            ) : (
                                empresas.map(emp => (
                                    <tr key={emp.id}>
                                        <td>#{emp.id}</td>
                                        <td style={{ fontWeight: 'bold', color: '#00d68f' }}>{emp.nome_fantasia}</td>
                                        <td>{emp.cnpj || 'Não informado'}</td>
                                        <td>
                                            <span className={`status-badge ${emp.status === 'Ativo' ? 'status-open' : 'status-closed'}`} style={{ backgroundColor: emp.status === 'Ativo' ? '#00d68f' : '#4a5568', color: emp.status === 'Ativo' ? '#000' : '#fff' }}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td>{new Date(emp.data_cadastro).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => abrirModal(emp)} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', marginRight: '15px' }} title="Editar Empresa">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(emp.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }} title="Excluir Empresa">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL DE NOVA/EDITAR EMPRESA */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                            <X size={24} />
                        </button>
                        <h2 style={{ marginTop: 0, color: '#00d68f', marginBottom: '20px' }}>
                            {editandoId ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group" style={{ marginBottom: '15px' }}>
                                <label>Nome Fantasia *</label>
                                <input
                                    type="text"
                                    value={formData.nome_fantasia}
                                    onChange={e => setFormData({ ...formData, nome_fantasia: e.target.value })}
                                    placeholder="Ex: Transportadora Expresso..."
                                    required
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '15px' }}>
                                <label>CNPJ</label>
                                <input
                                    type="text"
                                    value={formData.cnpj}
                                    onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                    placeholder="Opcional"
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '25px' }}>
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                >
                                    <option value="Ativo">Ativo</option>
                                    <option value="Inativo">Inativo</option>
                                </select>
                            </div>

                            {/* --- CHECKBOXES DE MÓDULOS (SAAS CONFIG-DRIVEN) --- */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#00d68f', fontWeight: 'bold' }}>Páginas Contratadas (SaaS)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '10px', background: '#1a202c', padding: '15px', borderRadius: '5px', border: '1px solid #4a5568' }}>
                                    {['Gestão', 'Operação', 'Cadastros'].map(categoria => (
                                        <div key={categoria} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <span style={{ color: '#a0aec0', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px', borderBottom: '1px solid #444', paddingBottom: '3px' }}>{categoria}</span>
                                            {SAAS_CONFIG.filter(m => m.categoria === categoria).map(mod => (
                                                <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.modulos_ativos?.includes(mod.id)}
                                                        onChange={(e) => handleModuloToggle(mod.id, e.target.checked)}
                                                        style={{ minWidth: 'auto' }}
                                                    /> {mod.label}
                                                </label>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1px solid #666', color: '#fff', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-add">
                                    {editandoId ? 'Salvar Alterações' : 'Salvar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
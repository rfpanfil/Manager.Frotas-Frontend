import { useAuth } from '../contexts/AuthContext';
import usePersistedTab from '../hooks/usePersistedTab';
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Shield, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPermissoes() {
    const { user } = useAuth();
    const [abaAtiva, setAbaAtiva] = usePersistedTab('geral', 'adminpermissoes');
    const queryClient = useQueryClient();
    const { data, isLoading: loading } = useQuery({ queryKey: ['permissoesMatriz'], queryFn: async () => (await api.get('/permissoes/matriz')).data });

    const cargos = data?.estrutura?.cargos || [];
    const modulos = data?.estrutura?.modulos || {};
    const [matriz, setMatriz] = useState({}); 
    const [cargoSelecionado, setCargoSelecionado] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [cargoParaEditar, setCargoParaEditar] = useState({ id: null, nome: '' });

    useEffect(() => {
        if (data?.matriz) setMatriz(data.matriz);
        
        if (cargos.length > 0) {
            // Se já tem um cargo selecionado, atualize-o para o novo objeto (caso o nome tenha mudado)
            if (cargoSelecionado) {
                const updatedCargo = cargos.find(c => c.id === cargoSelecionado.id);
                if (updatedCargo) setCargoSelecionado(updatedCargo);
                else setCargoSelecionado(cargos[0]); // Se foi deletado, volta pro primeiro
            } else {
                setCargoSelecionado(cargos[0]);
            }
        } else {
             setCargoSelecionado(null);
        }
    }, [data, cargos]);

    async function handleToggle(cargoId, permId, temPermissao) {
        const novaMatriz = { ...matriz };
        if (temPermissao) {
            novaMatriz[cargoId] = novaMatriz[cargoId].filter(id => id !== permId);
        } else {
            novaMatriz[cargoId] = novaMatriz[cargoId] ? [...novaMatriz[cargoId], permId] : [permId];
        }
        setMatriz(novaMatriz);

        try {
            await api.post(`/permissoes/cargo/${cargoId}/toggle`, { permissao_id: permId, ativo: !temPermissao });
        } catch (error) {
            toast.error("Erro ao salvar permissão.");
            queryClient.invalidateQueries({ queryKey: ['permissoesMatriz'] });
        }
    }

    async function handleAddCargo() {
        const nome = prompt("Nome do Novo Cargo:");
        if (!nome) return;
        try {
            await api.post('/usuarios/cargos/', { nome });
            toast.success(`Cargo '${nome}' criado!`);
            queryClient.invalidateQueries({ queryKey: ['permissoesMatriz'] });
        } catch (error) {
            toast.error("Erro ao criar cargo: " + (error.response?.data?.detail || error.message));
        }
    }

        async function confirmEditCargo() {
        if (!cargoParaEditar.nome || cargoParaEditar.nome.trim() === '') return;
        try {
            await api.put(`/usuarios/cargos/${cargoParaEditar.id}`, { nome: cargoParaEditar.nome.trim() });
            toast.success("Cargo atualizado!");
            setIsEditModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['permissoesMatriz'] });
        } catch (error) {
            toast.error(error.response?.data?.detail || "Erro ao editar cargo.");
        }
    }

    function openEditModal(cargoId, nomeAtual) {
        setCargoParaEditar({ id: cargoId, nome: nomeAtual });
        setIsEditModalOpen(true);
    }
    async function handleEditCargo_OLD(cargoId, nomeAtual) {
        const novoNome = prompt("Novo nome do cargo:", nomeAtual);
        if (!novoNome || novoNome === nomeAtual) return;
        try {
            await api.put(`/usuarios/cargos/${cargoId}`, { nome: novoNome });
            toast.success("Cargo atualizado!");
            queryClient.invalidateQueries({ queryKey: ['permissoesMatriz'] });
        } catch (error) {
            toast.error(error.response?.data?.detail || "Erro ao editar cargo.");
        }
    }

    async function handleDeleteCargo(cargoId) {
        if (!confirm("Tem certeza que deseja excluir este cargo? Usuários atrelados precisarão ser reatribuídos.")) return;
        try {
            await api.delete(`/usuarios/cargos/${cargoId}`);
            toast.success("Cargo excluído!");
            queryClient.invalidateQueries({ queryKey: ['permissoesMatriz'] });
        } catch (error) {
            toast.error(error.response?.data?.detail || "Erro ao excluir cargo.");
        }
    }

    if (loading) return <div style={{padding:30, color:'white'}}>Carregando...</div>;

    const isAdmin = cargoSelecionado?.nome === 'admin';

    return (
        <div style={{padding: '20px', maxWidth: '1400px', margin: '0 auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px'}}>
                <h1 style={{margin: 0}}>Gerenciamento de Permissões</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={handleAddCargo} className="btn-add" style={{backgroundColor: '#8B5CF6', color: '#fff', height:'40px', padding:'0 15px', fontSize:'0.9rem', borderRadius: 8, display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer'}}>
                        <PlusCircle size={18} style={{marginRight:8}}/> Novo Cargo
                    </button>
                    {user?.cargo?.toLowerCase() === 'superadmin' && ( <button onClick={() => api.post('/permissoes/setup-inicial').then(() => queryClient.invalidateQueries({ queryKey: ['permissoesMatriz'] }))} className="btn-add" style={{fontSize:'0.9rem', background:'#4a5568', color:'white', height:'40px', borderRadius: 8, border: 'none', padding: '0 15px', cursor: 'pointer'}}>
                        Restaurar Padrões
                    </button> )}
                </div>
            </div>

            {/* SEÇÃO SUPERIOR: CARGOS (PÍLULAS) */}
            <div style={{background: '#1a202c', borderRadius: '12px', border: '1px solid #2d3748', padding: '20px', marginBottom: '20px'}}>
                <h3 style={{color: '#a0aec0', marginTop: 0, marginBottom: '15px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8}}>
                    <Shield size={18}/> Selecione o Cargo
                </h3>
                <div style={{display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px'}} className="scrollbar-custom">
                    {cargos.map(c => {
                        const isSelected = cargoSelecionado?.id === c.id;
                        return (
                            <div key={c.id} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: isSelected ? '#8B5CF6' : '#2d3748',
                                color: isSelected ? 'white' : '#cbd5e0',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                border: isSelected ? '1px solid #a78bfa' : '1px solid #4a5568'
                            }} onClick={() => setCargoSelecionado(c)}>
                                <span style={{textTransform: 'capitalize'}}>{c.nome}</span>
                                {c.nome !== 'admin' && (
                                    <div style={{display: 'flex', gap: '5px', marginLeft: '10px'}} onClick={e => e.stopPropagation()}>
                                        <button onClick={() => openEditModal(c.id, c.nome)} style={{background: 'none', border: 'none', color: isSelected ? '#fff' : '#a0aec0', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'}}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteCargo(c.id)} style={{background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'}}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SEÇÃO INFERIOR: PERMISSÕES */}
            <div style={{width: '100%'}}>
                {cargoSelecionado ? (
                    <div style={{background: '#1a202c', borderRadius: '12px', border: '1px solid #2d3748', padding: '25px'}}>
                        <div style={{marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #2d3748'}}>
                            <h2 style={{margin: 0, color: 'white', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 10}}>
                                Permissões: <span style={{color: '#8B5CF6'}}>{cargoSelecionado.nome}</span>
                                {isAdmin && <span style={{fontSize: '0.75rem', background: '#e53e3e', padding: '4px 8px', borderRadius: 12, verticalAlign: 'middle', marginLeft: 10, color: 'white', fontWeight: 'bold'}}>Acesso Total</span>}
                            </h2>
                            <p style={{color: '#a0aec0', margin: '8px 0 0 0', fontSize: '0.9rem'}}>
                                {isAdmin ? 'O cargo de Administrador possui todas as permissões do sistema e não pode ser restrito.' : 'Ative ou desative as permissões específicas para este cargo.'}
                            </p>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                            {Object.entries(modulos).map(([nomeModulo, permissoes]) => (
                                <div key={nomeModulo} style={{background: '#2d3748', borderRadius: '10px', padding: '20px', border: '1px solid #4a5568'}}>
                                    <h3 style={{margin: '0 0 15px 0', color: '#8B5CF6', textTransform: 'uppercase', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #4a5568'}}>
                                        📂 {nomeModulo}
                                    </h3>
                                    
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                        {permissoes.map(perm => {
                                            const temPermissao = matriz[cargoSelecionado.id]?.includes(perm.id) || false;
                                            const checked = temPermissao || isAdmin;

                                            return (
                                                <div key={perm.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', opacity: isAdmin ? 0.7 : 1}}>
                                                    <div>
                                                        <div style={{color: 'white', fontWeight: '500', fontSize: '0.9rem'}}>{perm.nome}</div>
                                                        <div style={{color: '#a0aec0', fontSize: '0.75rem'}}>{perm.slug}</div>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => !isAdmin && handleToggle(cargoSelecionado.id, perm.id, temPermissao)}
                                                        disabled={isAdmin}
                                                        style={{
                                                            background: checked ? '#047857' : '#4a5568',
                                                            border: 'none',
                                                            borderRadius: '20px',
                                                            width: '46px',
                                                            height: '24px',
                                                            position: 'relative',
                                                            cursor: isAdmin ? 'not-allowed' : 'pointer',
                                                            transition: 'background 0.3s',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '2px',
                                                            left: checked ? '24px' : '2px',
                                                            width: '20px',
                                                            height: '20px',
                                                            background: 'white',
                                                            borderRadius: '50%',
                                                            transition: 'left 0.3s'
                                                        }}/>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', background: '#1a202c', borderRadius: '12px', border: '1px dashed #4a5568', color: '#a0aec0'}}>
                        Selecione um cargo na barra superior para visualizar suas permissões.
                    </div>
                )}
            </div>

            {/* MODAL DE EDIÇÃO DE CARGO */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a202c', border: '1px solid #2d3748', borderRadius: '12px',
                        padding: '25px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{color: 'white', marginTop: 0, display: 'flex', alignItems: 'center', gap: 10}}>
                            <Pencil size={20} color="#8B5CF6"/> Editar Nome do Cargo
                        </h3>
                        <p style={{color: '#a0aec0', fontSize: '0.85rem', marginBottom: '20px'}}>
                            Atenção: A alteração se aplicará a todos os usuários atuais.
                        </p>
                        
                        <input 
                            type="text" 
                            value={cargoParaEditar.nome}
                            onChange={(e) => setCargoParaEditar({...cargoParaEditar, nome: e.target.value})}
                            style={{
                                width: '100%', padding: '10px 15px', borderRadius: '8px',
                                border: '1px solid #4a5568', background: '#2d3748', color: 'white',
                                marginBottom: '25px', fontSize: '1rem', boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                        
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                            <button onClick={() => setIsEditModalOpen(false)} style={{
                                padding: '10px 15px', borderRadius: '8px', border: 'none',
                                background: '#4a5568', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                            }}>
                                Cancelar
                            </button>
                            <button onClick={confirmEditCargo} style={{
                                padding: '10px 15px', borderRadius: '8px', border: 'none',
                                background: '#8B5CF6', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                            }}>
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, PlusCircle, Pencil, Trash2, Lock, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Cargos são gravados como texto em usuários, colaboradores e checklist. O backend leva todos junto
// ao renomear e exige um destino ao excluir um cargo em uso; aqui a tela mostra quem será afetado antes.

const fundo = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 };
const caixa = { background: '#1a202c', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 25, borderRadius: 8, border: '1px solid #4a5568', color: 'white' };
const campo = { flex: 1, padding: '8px 10px', borderRadius: 5, border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', minWidth: 0 };
const botao = (cor, desativado = false) => ({ opacity: desativado ? 0.5 : 1, background: cor, color: 'white', border: 'none', borderRadius: 5, padding: '8px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' });
const icone = (cor) => ({ background: 'none', border: 'none', color: cor, cursor: 'pointer', padding: 4, display: 'flex' });
const aviso = { background: 'rgba(236, 201, 75, 0.1)', border: '1px solid #ecc94b', borderRadius: 6, padding: 12, marginTop: 8, fontSize: '0.85rem' };

const titulo = (nome) => nome.charAt(0).toUpperCase() + nome.slice(1);

function descreverUso(c) {
    const partes = [];
    if (c.usuarios) partes.push(`${c.usuarios} usuário${c.usuarios > 1 ? 's' : ''}`);
    if (c.colaboradores) partes.push(`${c.colaboradores} colaborador${c.colaboradores > 1 ? 'es' : ''}`);
    return partes.length ? partes.join(' e ') : 'Ninguém neste cargo';
}

const plural = (c, um, varios) => (c.usuarios + c.colaboradores === 1 ? um : varios);

export default function ModalGerenciarCargos({ aberto, onFechar }) {
    const queryClient = useQueryClient();
    const { data: cargos = [], isLoading } = useQuery({
        queryKey: ['cargosResumo'],
        queryFn: async () => (await api.get('/usuarios/cargos/resumo')).data,
        enabled: aberto,
    });

    const [novoNome, setNovoNome] = useState('');
    const [editando, setEditando] = useState(null);   // { id, nome }
    const [excluindo, setExcluindo] = useState(null); // { cargo, destino }
    const [salvando, setSalvando] = useState(false);

    if (!aberto) return null;

    function atualizarTelas() {
        ['cargosResumo', 'cargos', 'permissoesMatriz', 'colaboradores', 'usuarios'].forEach(k =>
            queryClient.invalidateQueries({ queryKey: [k] }));
    }

    async function executar(acao, mensagem) {
        setSalvando(true);
        try {
            await acao();
            toast.success(mensagem);
            atualizarTelas();
            return true;
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Não foi possível concluir.');
            return false;
        } finally {
            setSalvando(false);
        }
    }

    async function criar(e) {
        e.preventDefault();
        if (!novoNome.trim()) return;
        if (await executar(() => api.post('/usuarios/cargos/', { nome: novoNome }), `Cargo "${novoNome.trim()}" criado!`)) setNovoNome('');
    }

    async function renomear(cargo) {
        const nome = editando.nome.trim();
        if (!nome || nome.toLowerCase() === cargo.nome) return setEditando(null);
        if (await executar(() => api.put(`/usuarios/cargos/${cargo.id}`, { nome }), 'Cargo renomeado!')) setEditando(null);
    }

    async function excluir() {
        const { cargo, destino } = excluindo;
        const emUso = cargo.usuarios + cargo.colaboradores > 0;
        if (emUso && !destino) return toast.error('Escolha para qual cargo mover as pessoas.');
        const url = `/usuarios/cargos/${cargo.id}` + (emUso ? `?mover_para=${destino}` : '');
        if (await executar(() => api.delete(url), 'Cargo excluído!')) setExcluindo(null);
    }

    return (
        <div style={fundo} onClick={onFechar}>
            <div style={caixa} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h2 style={{ margin: 0, color: '#8B5CF6' }}>Gerenciar Cargos</h2>
                    <button onClick={onFechar} style={icone('#e53e3e')} title="Fechar"><X size={22} /></button>
                </div>

                <form onSubmit={criar} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do novo cargo (ex.: Motorista)" maxLength={40} style={campo} />
                    <button type="submit" disabled={salvando || !novoNome.trim()} style={botao('#8B5CF6', salvando || !novoNome.trim())}><PlusCircle size={16} /> Adicionar</button>
                </form>

                {isLoading ? <p style={{ color: '#a0aec0' }}>Carregando...</p> : cargos.map(c => {
                    const emEdicao = editando?.id === c.id;
                    const emExclusao = excluindo?.cargo.id === c.id;
                    const emUso = c.usuarios + c.colaboradores > 0;
                    const destinos = cargos.filter(d => d.id !== c.id && d.nome !== 'admin');
                    return (
                        <div key={c.id} style={{ borderBottom: '1px solid #2d3748', padding: '10px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {emEdicao ? (
                                    <input autoFocus value={editando.nome} maxLength={40} style={campo}
                                        onChange={e => setEditando({ ...editando, nome: e.target.value })}
                                        onKeyDown={e => { if (e.key === 'Enter') renomear(c); if (e.key === 'Escape') setEditando(null); }} />
                                ) : (
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <strong>{titulo(c.nome)}</strong>
                                        {c.sistema && <span title="Cargo de sistema: não pode ser renomeado nem excluído" style={{ marginLeft: 8, fontSize: '0.7rem', color: '#a0aec0', border: '1px solid #4a5568', borderRadius: 10, padding: '1px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Lock size={10} /> Sistema</span>}
                                        <div style={{ color: '#a0aec0', fontSize: '0.8rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {descreverUso(c)}</div>
                                    </div>
                                )}
                                {!c.sistema && !emEdicao && !emExclusao && (
                                    <>
                                        <button onClick={() => { setExcluindo(null); setEditando({ id: c.id, nome: titulo(c.nome) }); }} style={icone('#63b3ed')} title="Renomear"><Pencil size={16} /></button>
                                        <button onClick={() => { setEditando(null); setExcluindo({ cargo: c, destino: '' }); }} style={icone('#fc8181')} title="Excluir"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>

                            {emEdicao && (
                                <div style={emUso ? aviso : { marginTop: 8 }}>
                                    {emUso && <p style={{ margin: '0 0 10px' }}><AlertTriangle size={14} style={{ verticalAlign: 'middle' }} /> {descreverUso(c)} {plural(c, 'passará', 'passarão')} a ter o novo nome de cargo. As permissões do cargo continuam as mesmas.</p>}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button onClick={() => setEditando(null)} style={botao('#4a5568')}>Cancelar</button>
                                        <button onClick={() => renomear(c)} disabled={salvando} style={botao('#3182ce', salvando)}>Salvar nome</button>
                                    </div>
                                </div>
                            )}

                            {emExclusao && (
                                <div style={aviso}>
                                    {emUso ? (
                                        <>
                                            <p style={{ margin: '0 0 10px' }}><AlertTriangle size={14} style={{ verticalAlign: 'middle' }} /> <strong>{descreverUso(c)}</strong> {plural(c, 'está', 'estão')} neste cargo. Para excluir, escolha para onde {plural(c, 'movê-lo', 'movê-los')}:</p>
                                            <select value={excluindo.destino} onChange={e => setExcluindo({ ...excluindo, destino: e.target.value })} style={{ ...campo, width: '100%', marginBottom: 10 }}>
                                                <option value="">Mover para...</option>
                                                {destinos.map(d => <option key={d.id} value={d.id}>{titulo(d.nome)}</option>)}
                                            </select>
                                            <p style={{ margin: '0 0 10px', color: '#a0aec0', fontSize: '0.8rem' }}>{plural(c, 'Passa', 'Passam')} a ter as permissões do novo cargo. Admin não aparece aqui: promova pessoas uma a uma em Usuários.</p>
                                        </>
                                    ) : (
                                        <p style={{ margin: '0 0 10px' }}>Excluir o cargo <strong>{titulo(c.nome)}</strong>? Ninguém está nele.</p>
                                    )}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button onClick={() => setExcluindo(null)} style={botao('#4a5568')}>Cancelar</button>
                                        <button onClick={excluir} disabled={salvando || (emUso && !excluindo.destino)} style={botao('#e53e3e', salvando || (emUso && !excluindo.destino))}>
                                            <Trash2 size={14} /> {emUso ? 'Mover e excluir' : 'Excluir'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

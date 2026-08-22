import { X, Settings, Check, Edit, Trash2 } from 'lucide-react';

export default function ModalGerenciarTipos({
    modalTiposAberto,
    setModalTiposAberto,
    tiposGasto,
    novoTipo,
    setNovoTipo,
    editandoTipoId,
    setEditandoTipoId,
    editandoTipoNome,
    setEditandoTipoNome,
    handleSalvarNovoTipo,
    handleSalvarEdicaoTipo,
    handleExcluirTipo
}) {
    if (!modalTiposAberto) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '15px' }}>
            <div className="modal-card" style={{ width: '100%', maxWidth: '600px', background: '#1a202c', border: '1px solid #4a5568', padding: '25px', borderRadius: '10px', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <button onClick={() => setModalTiposAberto(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                <h3 style={{ marginTop: 0, color: '#8B5CF6', borderBottom: '1px solid #2d3748', paddingBottom: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={20} /> Tipos de Gasto
                </h3>

                {/* Adicionar Novo */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input
                        value={novoTipo}
                        onChange={e => setNovoTipo(e.target.value)}
                        placeholder="Criar novo tipo (Ex: Hospedagem)"
                        style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', boxSizing: 'border-box' }}
                    />
                    <button onClick={handleSalvarNovoTipo} style={{ background: '#8B5CF6', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>Adicionar</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', overflowX: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {tiposGasto.map(t => {
                            const isEditing = editandoTipoId === t.id;
                            return (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', padding: '12px 5px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {isEditing ? (
                                            <input
                                                value={editandoTipoNome}
                                                onChange={e => setEditandoTipoNome(e.target.value)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #8B5CF6', background: '#1a202c', color: 'white', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                <span style={{ fontWeight: '500', wordBreak: 'break-word', color: 'white', fontSize: '0.95rem' }}>{t.nome}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => handleSalvarEdicaoTipo(t.id)} style={{ background: '#8B5CF6', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}><Check size={16} /></button>
                                                <button onClick={() => setEditandoTipoId(null)} style={{ background: '#e53e3e', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditandoTipoId(t.id); setEditandoTipoNome(t.nome); }} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }} title="Editar"><Edit size={18} /></button>
                                                <button onClick={() => handleExcluirTipo(t.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }} title="Excluir"><Trash2 size={18} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

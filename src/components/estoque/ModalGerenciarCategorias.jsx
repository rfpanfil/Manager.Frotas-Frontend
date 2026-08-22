import useCan from '../../hooks/useCan';
import React from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { inputStyle } from './estoqueConstants';

/**
 * Modal para CRUD de Categorias de Estoque.
 * Componente controlado — formulário gerenciado pelo Orquestrador.
 */
export default function ModalGerenciarCategorias({
    aberto, onFechar, categoriasBD, formCategoria, setFormCategoria, onSalvar, onExcluir
}) {
    if (!aberto) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-content" style={{ width: '650px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <h3>Gerenciar Categorias de Estoque</h3>
                    <button onClick={onFechar} className="btn-close-modal"><X /></button>
                </div>

                <form onSubmit={onSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 2 }}>
                            <label>Nome da Categoria</label>
                            <input required value={formCategoria.nome} onChange={e => setFormCategoria({ ...formCategoria, nome: e.target.value })} placeholder="Ex: FILTROS" style={inputStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Tipo de Controle</label>
                            <select value={formCategoria.tipo_padrao} onChange={e => setFormCategoria({ ...formCategoria, tipo_padrao: e.target.value })} style={inputStyle}>
                                <option value="LIVRE">Livre (Misto)</option>
                                <option value="QUANTIDADE">Sempre Volume</option>
                                <option value="SERIALIZADO">Sempre Serializado</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                        <button type="submit" className="btn-add" style={{ flex: 1 }}>{formCategoria.id ? 'Salvar Edição' : 'Adicionar'}</button>
                        {formCategoria.id && <button type="button" onClick={() => setFormCategoria({ id: null, nome: '', tipo_padrao: 'LIVRE' })} className="btn-close-modal" style={{ flex: 1, position: 'static' }}>Cancelar</button>}
                    </div>
                </form>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #4a5568', color: '#a0aec0' }}>
                                <th style={{ padding: '10px 0', textAlign: 'left' }}>Nome</th>
                                <th style={{ padding: '10px 0', textAlign: 'left' }}>Controle Obrigatório</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoriasBD.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #4a5568' }}>
                                    <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{c.nome}</td>
                                    <td style={{ color: c.tipo_padrao !== 'LIVRE' ? '#f6ad55' : '#a0aec0' }}>
                                        {c.tipo_padrao === 'QUANTIDADE' ? 'Volume Obrigatório' : c.tipo_padrao === 'SERIALIZADO' ? 'Serializado Obrigatório' : 'Livre (Misto)'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <>
                                            <button onClick={() => setFormCategoria(c)} style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer', marginRight: 15 }}><Edit size={16} /></button>
                                            <button onClick={() => onExcluir(c.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

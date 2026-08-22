import React from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { inputStyle } from '../../../utils/pneusUtils';

export default function ModalGerenciarMedidas({
    modalMedidas,
    setModalMedidas,
    medidas,
    medidaForm,
    setMedidaForm,
    handleSalvarMedida,
    handleExcluirMedida
}) {
    if (!modalMedidas) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-content" style={{ width: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <h3>Gerenciar Medidas</h3>
                    <button onClick={() => setModalMedidas(false)} className="btn-close-modal"><X /></button>
                </div>

                <form onSubmit={handleSalvarMedida} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <input required value={medidaForm.nome} onChange={e => setMedidaForm({ ...medidaForm, nome: e.target.value })} placeholder="Nome da Medida..." style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                    <button type="submit" className="btn-add">{medidaForm.id ? 'Salvar' : 'Adicionar'}</button>
                    {medidaForm.id && <button type="button" onClick={() => setMedidaForm({ id: null, nome: '' })} className="btn-close-modal" style={{ position: 'static' }}>Cancelar</button>}
                </form>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {medidas.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #4a5568' }}>
                                    <td style={{ padding: '10px 0' }}>{m.nome}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button onClick={() => setMedidaForm(m)} style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer', marginRight: 15 }}><Edit size={16} /></button>
                                        <button onClick={() => handleExcluirMedida(m.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {medidas.length === 0 && <tr><td colSpan="2" style={{ color: '#a0aec0', padding: 10 }}>Nenhuma medida cadastrada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

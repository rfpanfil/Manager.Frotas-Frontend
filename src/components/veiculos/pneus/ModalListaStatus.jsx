import React from 'react';
import { X, FileText, Edit, Trash2 } from 'lucide-react';
import { inputStyle, getTituloStatus } from '../../../utils/pneusUtils';

export default function ModalListaStatus({
    modalListaStatus,
    setModalListaStatus,
    buscaModalStatus,
    setBuscaModalStatus,
    pneus,
    abrirHistorico,
    abrirModalEdicao,
    excluirPneu,
    can
}) {
    if (!modalListaStatus) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, borderBottom: '1px solid #4a5568', paddingBottom: 10 }}>
                    <h3 style={{ margin: 0, color: '#00d68f' }}>{getTituloStatus(modalListaStatus)}</h3>
                    <button onClick={() => setModalListaStatus(null)} className="btn-close-modal"><X /></button>
                </div>

                <div style={{ marginBottom: 15 }}>
                    <input
                        placeholder={`Pesquisar pneus em ${getTituloStatus(modalListaStatus)}...`}
                        value={buscaModalStatus}
                        onChange={e => setBuscaModalStatus(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#2d3748', color: '#00d68f' }}>
                                <th style={{ textAlign: 'left', padding: 10 }}>Identificação</th>
                                <th style={{ textAlign: 'left', padding: 10 }}>Marca/Medida</th>
                                <th style={{ textAlign: 'center', padding: 10 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pneus.filter(p =>
                                p.status === modalListaStatus && (
                                    (p.dot || '').toLowerCase().includes(buscaModalStatus.toLowerCase()) ||
                                    (p.fogo || '').toLowerCase().includes(buscaModalStatus.toLowerCase()) ||
                                    (p.marca || '').toLowerCase().includes(buscaModalStatus.toLowerCase()) ||
                                    (p.medida || '').toLowerCase().includes(buscaModalStatus.toLowerCase())
                                )
                            ).map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #4a5568' }}>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                        DOT: {p.dot || '-'} <br />
                                        <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 'normal' }}>Fogo: {p.fogo || '-'}</span>
                                    </td>
                                    <td style={{ padding: '10px' }}>{p.marca} <br /><span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>{p.medida}</span></td>
                                    <td style={{ textAlign: 'center', padding: '10px' }}>
                                        <button onClick={() => abrirHistorico(p.id)} title="Ver Histórico" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer', marginRight: 15 }}><FileText size={18} /></button>
                                        {can('pneus.gerenciar') && (
                                            <button onClick={() => abrirModalEdicao(p)} title="Editar Dados" style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer', marginRight: 15 }}><Edit size={18} /></button>
                                        )}
                                        {can('pneus.gerenciar') && (
                                            <button onClick={() => excluirPneu(p.id)} title="Excluir Pneu" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {pneus.filter(p => p.status === modalListaStatus).length === 0 && (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhum pneu nesta categoria.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

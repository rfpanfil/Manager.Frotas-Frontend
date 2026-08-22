import React from 'react';
import { Clock, X, User } from 'lucide-react';

/**
 * Modal de timeline de movimentações — componente 100% presentacional.
 * Reutilizável para histórico geral (item pai) e individual (sub-item).
 */
export default function ModalHistorico({ aberto, onFechar, titulo, dados }) {
    if (!aberto) return null;

    return (
        <div className="modal-overlay" onClick={onFechar}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock color="#63b3ed" /> Histórico: {titulo}
                    </h3>
                    <button onClick={onFechar} className="btn-close-modal"><X /></button>
                </div>
                <div style={{ background: '#1a202c', padding: 15, borderRadius: 8, maxHeight: '400px', overflowY: 'auto' }}>
                    {dados.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {dados.map((h, idx) => (
                                <li key={idx} style={{ borderLeft: '2px solid #4a5568', paddingLeft: 15, position: 'relative', marginBottom: 20 }}>
                                    <div style={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', background: (h.tipo_evento === 'MONTAGEM' || h.tipo_evento.includes('Entrada')) ? '#8B5CF6' : '#f6ad55' }}></div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <strong style={{ color: (h.tipo_evento === 'MONTAGEM' || h.tipo_evento.includes('Entrada')) ? '#8B5CF6' : '#f6ad55' }}>
                                            {h.tipo_evento} (Qtd: {h.quantidade})
                                        </strong>
                                        <span style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Clock size={12} /> {new Date(h.data_evento || h.data).toLocaleString('pt-BR')}
                                        </span>
                                    </div>

                                    {(h.tipo_evento === 'MONTAGEM' || h.tipo_evento === 'DESMONTAGEM') && h.veiculo && h.veiculo !== '-' && (
                                        <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: 5 }}>
                                            {h.tipo_evento === 'MONTAGEM' ? 'Montado no veículo ' : 'Removido do veículo '}
                                            <strong style={{ color: h.tipo_evento === 'MONTAGEM' ? '#63b3ed' : '#e53e3e' }}>{h.veiculo}</strong>
                                            {h.km_veiculo ? ` (Km: ${h.km_veiculo})` : ''}
                                        </div>
                                    )}

                                    {h.descricao && (
                                        <div style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic', borderTop: '1px solid #4a5568', paddingTop: 5, marginTop: 5 }}>
                                            "{h.descricao}"
                                        </div>
                                    )}

                                    <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <User size={12} /> Resp: {h.responsavel_nome || h.usuario}
                                    </div>

                                    {h.numero_nf && <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: 2 }}><strong>NF:</strong> {h.numero_nf}</div>}
                                </li>
                            ))}
                        </ul>
                    ) : <p style={{ color: '#a0aec0', textAlign: 'center' }}>Nenhum registro encontrado.</p>}
                </div>
            </div>
        </div>
    );
}

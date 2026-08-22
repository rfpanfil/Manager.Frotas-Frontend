import React from 'react';
import { X } from 'lucide-react';

export default function ModalHistoricoPneu({ modalHistorico, setModalHistorico, historicoData }) {
    if (!modalHistorico) return null;

    return (
        <div className="modal-overlay" onClick={() => setModalHistorico(false)} style={{ zIndex: 2500 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}><h3>Histórico do Pneu</h3><button onClick={() => setModalHistorico(false)} className="btn-close-modal"><X /></button></div>
                {historicoData.length === 0 ? <p style={{ color: '#a0aec0' }}>Nenhum histórico encontrado.</p> : (
                    <ul style={{ padding: 0, listStyle: 'none' }}>
                        {historicoData.map((h, i) => (
                            <li key={i} style={{ background: '#2d3748', padding: 15, marginBottom: 10, borderRadius: 5, borderLeft: '4px solid #63b3ed' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <strong style={{ color: 'white' }}>{h.tipo}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{new Date(h.data).toLocaleString()}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Veículo: {h.veiculo || '-'} | Km do veículo: {h.km_veiculo || '-'} | Sulco: {h.sulco || '-'}mm</div>
                                {h.observacao && <div style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic', marginTop: 5 }}>"{h.observacao}"</div>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

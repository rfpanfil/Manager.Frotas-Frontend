import React from 'react';
import { X, Search } from 'lucide-react';

export default function PopoverSelecaoEstoque({
    popoverAberto,
    setPopoverAberto,
    posicaoAlvo,
    veiculoMontagem,
    buscaPopover,
    setBuscaPopover,
    pneus,
    handleMontarEstoque,
    abrirMontagemExpressa
}) {
    if (!popoverAberto) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 2100 }}>
            <div className="modal-content" style={{ width: '450px', background: '#1a202c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <h3>Montar em {posicaoAlvo} <br /><span style={{ fontSize: '0.8rem', color: '#00d68f' }}>{veiculoMontagem?.placa}</span></h3>
                    <button onClick={() => setPopoverAberto(false)} className="btn-close-modal"><X /></button>
                </div>

                <div style={{ background: '#2d3748', padding: '8px', borderRadius: 5, display: 'flex', alignItems: 'center', border: '1px solid #4a5568', marginBottom: 10 }}>
                    <Search size={16} color="#a0aec0" style={{ marginRight: 5 }} />
                    <input placeholder="Buscar no Estoque (DOT, Medida)..." autoFocus value={buscaPopover} onChange={e => setBuscaPopover(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
                </div>

                <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 15 }}>
                    {pneus.filter(p => p.status === 'ESTOQUE' && ((p.dot || '').includes(buscaPopover) || (p.fogo || '').includes(buscaPopover) || (p.medida || '').includes(buscaPopover))).map(p => (
                        <div key={p.id} onClick={() => handleMontarEstoque(p.id)} style={{ padding: 15, background: '#2d3748', marginBottom: 5, borderRadius: 5, cursor: 'pointer', border: '1px solid #4a5568', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#00d68f'} onMouseOut={e => e.currentTarget.style.borderColor = '#4a5568'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong style={{ color: '#00d68f', fontSize: '1.1rem' }}>{p.dot || p.fogo}</strong>
                                <span style={{ color: '#a0aec0' }}>{p.marca} {p.medida}</span>
                            </div>
                        </div>
                    ))}
                    {pneus.filter(p => p.status === 'ESTOQUE').length === 0 && <p style={{ color: '#718096', textAlign: 'center' }}>Nenhum pneu disponível no estoque.</p>}
                </div>

                <div style={{ borderTop: '1px solid #4a5568', paddingTop: 15, display: 'flex', gap: 10 }}>
                    <button onClick={() => abrirMontagemExpressa('NOVO')} className="btn-add" style={{ flex: 1, background: '#3182ce', fontSize: '0.8rem' }}>+ Pneu NOVO</button>
                    <button onClick={() => abrirMontagemExpressa('USADO')} className="btn-add" style={{ flex: 1, background: '#ecc94b', color: 'black', fontSize: '0.8rem' }}>+ Pneu USADO</button>
                </div>
            </div>
        </div>
    );
}

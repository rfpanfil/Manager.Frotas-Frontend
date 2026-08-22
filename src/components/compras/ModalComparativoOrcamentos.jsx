import { X, DollarSign, Calendar, Download, CheckCircle } from 'lucide-react';

export default function ModalComparativoOrcamentos({
    modalDetalhes,
    setModalDetalhes,
    orcamentos,
    bases,
    getNomeItem,
    formatarMoeda,
    can,
    onAprovar,
    baseURL
}) {
    if (!modalDetalhes) return null;

    return (
        <div className="modal-overlay" onClick={() => setModalDetalhes(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a202c', width: '100%', maxWidth: '1200px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: 15, marginBottom: 20 }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#63b3ed' }}>Comparativo de Cotações - {modalDetalhes.numero}</h2>
                        <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Data Necessidade: {modalDetalhes.data_necessidade ? new Date(modalDetalhes.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Indefinida'}</span>
                    </div>
                    <button onClick={() => setModalDetalhes(null)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, color: '#a0aec0', marginBottom: 20, background: '#2d3748', padding: 15, borderRadius: 8 }}>
                    <div>Solicitante: <strong style={{ color: 'white' }}>{modalDetalhes.solicitante?.nome || 'Sistema'}</strong></div>
                    <div>Local de Entrega: <strong style={{ color: 'white' }}>{modalDetalhes.local_entrega?.nome || bases.find(b => b.id === modalDetalhes.local_entrega_id)?.nome || '-'}</strong></div>
                    <div>Observação Geral: <strong style={{ color: '#ecc94b' }}>{modalDetalhes.observacoes || 'Nenhuma'}</strong></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
                    {orcamentos.filter(o => o.solicitacao_id === modalDetalhes.id).map((orc, idx) => (
                        <div key={orc.id} style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: orc.status === 'Aprovado' ? '2px solid #8B5CF6' : '1px solid #4a5568', position: 'relative' }}>
                            {orc.status === 'Aprovado' && <div style={{ position: 'absolute', top: -12, right: 10, background: '#8B5CF6', color: '#fff', padding: '2px 10px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 'bold' }}>VENCEDOR</div>}

                            <h3 style={{ margin: '0 0 15px 0', color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ background: '#4a5568', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>{idx + 1}</div>
                                {orc.fornecedor?.razao_social}
                            </h3>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 15, fontSize: '0.85rem', color: '#a0aec0' }}>
                                <div style={{ background: '#1a202c', padding: '5px 10px', borderRadius: 4 }}><DollarSign size={12} /> {orc.tipo_pagamento || 'N/I'}</div>
                                {orc.prazo_pagamento && <div style={{ background: '#1a202c', padding: '5px 10px', borderRadius: 4 }}><Calendar size={12} /> Pgmto: {new Date(orc.prazo_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</div>}
                            </div>

                            <div style={{ background: '#1a202c', borderRadius: 5, padding: 10, marginBottom: 15 }}>
                                {orc.itens.map(oi => {
                                    const scRef = modalDetalhes.itens.find(i => i.id === oi.solicitacao_item_id);
                                    const nome = getNomeItem(scRef || oi);
                                    const qtd = scRef ? scRef.quantidade : 1;
                                    return (
                                        <div key={oi.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px dashed #4a5568', padding: '5px 0' }}>
                                            <span style={{ color: '#e2e8f0' }}>{qtd}x {nome}</span>
                                            <span style={{ color: '#a0aec0' }}>{formatarMoeda(oi.valor_unitario)}</span>
                                        </div>
                                    );
                                })}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '5px' }}>
                                    <span style={{ color: '#e2e8f0' }}>Frete Estimado</span>
                                    <span style={{ color: '#a0aec0' }}>{formatarMoeda(orc.frete)}</span>
                                </div>
                            </div>

                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#8B5CF6', textAlign: 'center', marginBottom: 15 }}>
                                {formatarMoeda(orc.valor_total)}
                            </div>

                            <div style={{ background: '#1a202c', padding: '10px 15px', borderRadius: 5, marginBottom: 15 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, color: '#a0aec0', fontSize: '0.85rem' }}>
                                    <div>Prazo Entrega: <strong style={{ color: 'white' }}>{orc.prazo_entrega ? new Date(orc.prazo_entrega + 'T12:00:00').toLocaleDateString('pt-BR') : 'A Combinar'}</strong></div>
                                    <div>Obs / Link: <strong style={{ color: '#ecc94b' }}>{orc.observacoes || 'Nenhuma'}</strong></div>
                                </div>

                                {orc.anexo_path && (
                                    <div style={{ marginTop: 10 }}>
                                        <a href={`${baseURL}/files/${encodeURI(orc.anexo_path)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#63b3ed', textDecoration: 'none', background: '#2d3748', padding: '5px 10px', borderRadius: 4, border: '1px solid #63b3ed' }}>
                                            <Download size={14} /> Baixar Arquivo Anexo
                                        </a>
                                    </div>
                                )}
                            </div>

                            {modalDetalhes.status === 'Em Orçamento' && can('compras.orcamentos.aprovar') && (
                                <button onClick={() => { setModalDetalhes(null); onAprovar({ sc: modalDetalhes, orcamento: orc }); }} className="btn-add" style={{ width: '100%', background: '#ecc94b', color: 'black', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <CheckCircle size={18} style={{ marginRight: 5 }} /> Aprovar Esta Cotação
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

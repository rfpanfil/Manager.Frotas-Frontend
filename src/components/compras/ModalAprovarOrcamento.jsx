import { X, CheckCircle } from 'lucide-react';

export default function ModalAprovarOrcamento({
    modalAprovacao,
    setModalAprovacao,
    formAprovacao,
    setFormAprovacao,
    bases,
    salvarAprovacao,
    clearOrcAprovado
}) {
    if (!modalAprovacao) return null;

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };
    const inputDisabledStyle = { ...inputStyle, background: '#1a202c', color: '#a0aec0', cursor: 'not-allowed', border: '1px dashed #4a5568' };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '850px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                    <h3 style={{ color: '#00d68f', margin: 0 }}>Aprovar Orçamento (Ref. SC-{formAprovacao.solicitacao_numero}) e Emitir OC</h3>
                    <button onClick={() => { setModalAprovacao(false); if (clearOrcAprovado) clearOrcAprovado(); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                </div>

                <form onSubmit={salvarAprovacao} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label>Fornecedor (Vencedor)</label><input disabled value={formAprovacao.fornecedor_nome || ''} style={inputDisabledStyle} /></div>
                        <div><label>Tipo de Gasto Base</label><input disabled value={formAprovacao.tipo_gasto || 'Geral'} style={inputDisabledStyle} /></div>
                    </div>

                    <div style={{ background: '#2d3748', padding: 15, borderRadius: 5, border: '1px solid #4a5568' }}>
                        <label style={{ color: '#a0aec0', display: 'block', marginBottom: 5 }}>Resumo do Item Base</label>
                        <input disabled value={formAprovacao.nome_exibicao} style={{ ...inputDisabledStyle, marginBottom: 10 }} title="Exibindo o primeiro item como referência" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <div><label>Quantidade</label><input type="number" disabled value={formAprovacao.quantidade} style={inputDisabledStyle} /></div>
                            <div><label>Valor Unit. Base (R$)</label><input disabled value={formAprovacao.valor_unitario} style={inputDisabledStyle} /></div>
                            <div><label>Frete Total (R$)</label><input disabled value={formAprovacao.frete} style={inputDisabledStyle} /></div>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 214, 143, 0.1)', padding: 15, borderRadius: 5, border: '1px solid #00d68f' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#00d68f' }}>Dados de Faturamento e Negociação</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <div><label>Centro Custo (Base)*</label><select required value={formAprovacao.centro_custo_id} onChange={e => setFormAprovacao({ ...formAprovacao, centro_custo_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
                            <div><label>Prazo Pagamento</label><input type="date" value={formAprovacao.prazo_pagamento} onChange={e => setFormAprovacao({ ...formAprovacao, prazo_pagamento: e.target.value })} style={inputStyle} /></div>
                            <div><label>Desconto Extra na OC</label><input type="number" step="0.01" value={formAprovacao.desconto} onChange={e => setFormAprovacao({ ...formAprovacao, desconto: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '1.3rem', padding: '15px', background: '#2d3748', borderRadius: 5, border: '1px solid #4a5568', marginTop: 5 }}>
                        <span style={{ color: '#a0aec0', marginRight: 10 }}>Total Final da OC:</span>
                        <strong style={{ color: '#00d68f' }}>
                            R$ {(() => {
                                const parseMonetario = (val) => {
                                    if (!val) return 0;
                                    const v = String(val).replace('R$', '').trim();
                                    if (v.includes(',') && v.includes('.')) return parseFloat(v.replace(/\./g, '').replace(',', '.'));
                                    return parseFloat(v.replace(',', '.')) || 0;
                                };
                                const desc = parseMonetario(formAprovacao.desconto);
                                const total = formAprovacao.valor_total_original - desc;
                                return total > 0 ? total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
                            })()}
                        </strong>
                    </div>

                    <button type="submit" className="btn-add" style={{ padding: 15, background: '#00d68f', color: 'black', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={20} style={{ display: 'inline', marginRight: 5 }} /> Confirmar Orçamento e Emitir OC
                    </button>
                </form>
            </div>
        </div>
    );
}

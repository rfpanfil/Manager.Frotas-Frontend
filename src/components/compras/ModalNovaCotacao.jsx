import useCan from '../../hooks/useCan';
import { X, Calendar, Truck, Paperclip, PlusCircle, CheckCircle } from 'lucide-react';
import { baseURL } from '../../services/api';

const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };
const tableHeaderStyle = { padding: '10px', textAlign: 'left', color: 'white', fontSize: '0.9rem', borderBottom: '2px solid #4a5568' };

export default function ModalNovaCotacao({
    modalAberto,
    setModalAberto,
    isEditando,
    salvarOrcamentos,
    scSelecionadaId,
    abrirModalCotacao,
    scsPendentes,
    todasScs,
    bases,
    formOrcamentos,
    handleChange,
    handleItemChange,
    handleFileChange,
    excluirOrcamentoUnico,
    addNovaOpcaoCotacao,
    fornecedores,
    formatarMoeda,
    calcularTotalOrcamento
}) {
    if (!modalAberto) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '1200px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid #4a5568', paddingBottom: 15, marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>{isEditando ? 'Editar Orçamentos' : 'Registrar Novos Orçamentos'}</h2>
                    <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                </div>

                <form onSubmit={salvarOrcamentos} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ marginBottom: 10, background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <label style={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: '1.1rem', display: 'block', marginBottom: 10 }}>1. Selecione a Solicitação de Compra (SC):</label>
                        <select required value={scSelecionadaId} onChange={e => abrirModalCotacao(e.target.value)} disabled={isEditando} style={{ ...inputStyle, opacity: isEditando ? 0.7 : 1, fontSize: '1.1rem' }}>
                            <option value="">Selecione uma SC pendente...</option>
                            {scsPendentes.map(s => <option key={s.id} value={s.id}>SC-{s.numero} | Solicitante: {s.solicitante?.nome}</option>)}
                            {scSelecionadaId && !scsPendentes.some(s => s.id === parseInt(scSelecionadaId)) && (<option value={scSelecionadaId}>SC Editada ({todasScs.find(s => s.id === parseInt(scSelecionadaId))?.numero})</option>)}
                        </select>
                        {scSelecionadaId && (
                            (() => {
                                const scD = todasScs.find(s => s.id === parseInt(scSelecionadaId));
                                if (!scD) return null;
                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, color: '#a0aec0', marginTop: 15, background: '#1a202c', padding: 15, borderRadius: 8, border: '1px solid #444' }}>
                                        <div>Data Limite de Necessidade: <strong style={{ color: scD.data_necessidade ? '#ecc94b' : 'white' }}>{scD.data_necessidade ? new Date(scD.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data definida'}</strong></div>
                                        <div>Local Entrega (Base): <strong style={{ color: 'white' }}>{scD.local_entrega?.nome || bases.find(b => b.id === scD.local_entrega_id)?.nome || '-'}</strong></div>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    {scSelecionadaId && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
                            {formOrcamentos.map((orc, index) => (
                                <div key={index} style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: index === 0 ? '2px solid #8B5CF6' : '1px solid #4a5568', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: 10, marginBottom: 15 }}>
                                        <h3 style={{ margin: 0, color: index === 0 ? '#8B5CF6' : '#63b3ed' }}>
                                            {index === 0 ? 'Opção 1 (Principal)' : `Opção ${index + 1}`}
                                            {orc.id && <span style={{ fontSize: '0.7rem', color: '#ecc94b', marginLeft: 10 }}>(Editando)</span>}
                                        </h3>
                                        {index > 0 && (<button type="button" onClick={() => excluirOrcamentoUnico(orc.id, index)} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><X size={18} /></button>)}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 15 }}>
                                        <div><label style={{ display: 'block', marginBottom: 5 }}>Fornecedor Concorrente <span style={{ color: '#e53e3e' }}>*</span></label><select required={index === 0 || !!orc.id} value={orc.fornecedor_id} onChange={e => handleChange(index, 'fornecedor_id', e.target.value)} style={inputStyle}><option value="">Selecione...</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.razao_social}</option>)}</select></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Condição de Pagamento</label>
                                                <select value={orc.tipo_pagamento} onChange={e => handleChange(index, 'tipo_pagamento', e.target.value)} style={inputStyle}><option value="">Selecione...</option><option value="À Vista">À Vista</option><option value="Boleto Bancário">Boleto Bancário</option><option value="Pix">Pix</option><option value="Cartão de Crédito">Cartão de Crédito</option><option value="A Prazo / Faturado">A Prazo / Faturado</option></select>
                                            </div>
                                            <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}><Calendar size={12} style={{ display: 'inline' }} /> Vencimento</label><input type="date" value={orc.prazo_pagamento} onChange={e => handleChange(index, 'prazo_pagamento', e.target.value)} style={inputStyle} /></div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                                            <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}><Truck size={12} style={{ display: 'inline' }} /> Prazo Entrega</label><input type="date" value={orc.prazo_entrega} onChange={e => handleChange(index, 'prazo_entrega', e.target.value)} style={inputStyle} /></div>
                                            <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Frete (R$)</label><input type="number" step="0.01" placeholder="0.00" value={orc.frete} onChange={e => handleChange(index, 'frete', e.target.value)} style={inputStyle} /></div>
                                        </div>
                                    </div>

                                    <div style={{ background: '#1a202c', padding: 15, borderRadius: 8, marginBottom: 15, overflowX: 'auto' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '0.9rem' }}>Tabela de Preços Unitários</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '280px' }}>
                                            <thead><tr><th style={tableHeaderStyle}>Item</th><th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Qtd</th><th style={{ ...tableHeaderStyle, width: '110px' }}>V. Unit *</th></tr></thead>
                                            <tbody>
                                                {orc.itens.map((item, iIdx) => (
                                                    <tr key={iIdx} style={{ borderBottom: '1px solid #2d3748' }}>
                                                        <td style={{ padding: '8px 5px', fontSize: '0.8rem', color: '#e2e8f0' }}>{item.nome_exibicao}</td>
                                                        <td style={{ padding: '8px 5px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantidade}</td>
                                                        <td style={{ padding: '8px 5px' }}><input type="number" step="0.01" required={index === 0 || !!orc.id} placeholder="0.00" value={item.valor_unitario} onChange={e => handleItemChange(index, iIdx, e.target.value)} style={{ ...inputStyle, padding: '6px', fontSize: '0.85rem', minWidth: '80px' }} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div><label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Observação / Link</label><textarea rows="1" value={orc.obs} onChange={e => handleChange(index, 'obs', e.target.value)} style={inputStyle} /></div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}><Paperclip size={14} style={{ display: 'inline' }} /> Anexo {orc.id && "(Novo substitui)"}</label>
                                            <input type="file" onChange={e => handleFileChange(index, e.target.files[0])} style={{ ...inputStyle, padding: '6px', fontSize: '0.8rem' }} accept=".pdf,.jpg,.jpeg,.png" />
                                            {orc.arquivo_url && <a href={`${baseURL}/files/${orc.arquivo_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#63b3ed', display: 'block', marginTop: 5 }}>Ver arquivo salvo</a>}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 15, background: '#1a202c', padding: '10px 15px', borderRadius: 8, border: '1px solid #8B5CF6', textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase' }}>Total da Cotação</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffffff' }}>{formatarMoeda(calcularTotalOrcamento(orc))}</div>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                                <button type="button" onClick={addNovaOpcaoCotacao} style={{ background: 'transparent', border: '2px dashed #4a5568', color: '#a0aec0', padding: '20px', borderRadius: 8, cursor: 'pointer', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    <PlusCircle size={32} /><span>Adicionar Mais Opções</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {scSelecionadaId && (
                        <button type="submit" className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', background: '#8B5CF6', color: '#fff', fontWeight: 'bold', whiteSpace: 'normal', height: 'auto' }}>
                            <CheckCircle style={{ display: 'inline', marginRight: 10 }} />
                            {isEditando ? 'Salvar Alterações das Cotações' : 'Gravar Todas as Cotações'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}

import React from 'react';
import { X, FileText, Edit, Trash2 } from 'lucide-react';

export default function ModalFichaFornecedor({
    fornSelecionado,
    setFornSelecionado,
    ocs,
    baixarResumoPDF,
    prepararEdicao,
    excluirFornecedor,
    can
}) {
    if (!fornSelecionado) return null;

    return (
        <div className="modal-overlay" onClick={() => setFornSelecionado(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                    <h3>Ficha do Fornecedor: <span style={{ color: '#00d68f' }}>{fornSelecionado.razao_social}</span></h3>
                    <button onClick={() => setFornSelecionado(null)} className="btn-close-modal"><X /></button>
                </div>

                <div style={{ background: '#1a202c', padding: 15, borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    <div><small style={{ color: '#a0aec0' }}>CNPJ/CPF:</small><div style={{ fontWeight: 'bold' }}>{fornSelecionado.cnpj_cpf}</div></div>
                    <div><small style={{ color: '#a0aec0' }}>Status:</small><div style={{ color: fornSelecionado.status === 'Ativo' ? '#00d68f' : '#e53e3e' }}>{fornSelecionado.status}</div></div>
                    <div><small style={{ color: '#a0aec0' }}>Contato (Tel/Email):</small><div>{fornSelecionado.contato || 'Não informado'}</div></div>
                    <div><small style={{ color: '#a0aec0' }}>Tipo:</small><div>{fornSelecionado.tipo}</div></div>
                    <div style={{ gridColumn: 'span 2' }}><small style={{ color: '#a0aec0' }}>Endereço:</small><div>{fornSelecionado.endereco || 'Não informado'}</div></div>
                    <div style={{ gridColumn: 'span 2' }}><small style={{ color: '#a0aec0' }}>Observações:</small><div style={{ background: '#2d3748', padding: 10, borderRadius: 4 }}>{fornSelecionado.observacao || 'Sem observações.'}</div></div>
                </div>

                {/* HISTÓRICO DE OCs */}
                <div style={{ marginBottom: 20 }}>
                    <h4 style={{ borderBottom: '1px solid #444', paddingBottom: 5, color: '#f6ad55' }}>Histórico de Ordens de Compra (OC)</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#1a202c', padding: 10, borderRadius: 5 }}>
                        {ocs.filter(oc => oc.fornecedor_id === fornSelecionado.id).length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {ocs.filter(oc => oc.fornecedor_id === fornSelecionado.id).map(oc => (
                                    <li key={oc.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #444', padding: '5px 0' }}>
                                        <span style={{ color: '#63b3ed' }}>{oc.numero}</span>
                                        <span style={{ color: '#a0aec0' }}>{new Date(oc.data_emissao).toLocaleDateString()}</span>
                                        <span style={{ fontWeight: 'bold' }}>R$ {oc.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        <span style={{ fontSize: '0.8rem', color: oc.status === 'Cancelada' ? '#e53e3e' : '#00d68f' }}>{oc.status}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ color: '#a0aec0', fontSize: '0.9rem', textAlign: 'center' }}>Nenhuma Ordem de Compra registrada com este fornecedor.</div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button onClick={() => baixarResumoPDF(fornSelecionado)} style={{ flex: 1, background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                        <FileText size={16} /> Baixar PDF
                    </button>
                    
                    {can('compras.fornecedores.criar') && (
                        <button 
                            onClick={() => prepararEdicao(fornSelecionado)} 
                            title="Editar Fornecedor"
                            style={{ background: '#ecc94b', border: 'none', color: 'black', padding: '10px 15px', borderRadius: 5, cursor: 'pointer' }}
                        >
                            <Edit size={16} />
                        </button>
                    )}
                    
                    {can('compras.fornecedores.excluir') && (
                        <button 
                            onClick={() => excluirFornecedor(fornSelecionado.id)} 
                            title="Excluir Fornecedor"
                            style={{ background: '#e53e3e', border: 'none', color: 'white', padding: '10px 15px', borderRadius: 5, cursor: 'pointer' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

import { X, FileText, ShoppingCart, Edit, Trash2 } from 'lucide-react';

export default function ModalResumoSolicitacao({
    scSelecionada,
    setScSelecionada,
    bases,
    getNomeItem,
    baixarResumoPDF,
    onCriarOrcamento,
    abrirModalEdicao,
    handleDelete,
    can
}) {
    if (!scSelecionada) return null;

    return (
        <div className="modal-overlay" onClick={() => setScSelecionada(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a202c', width: '700px', padding: 30, borderRadius: 8, border: '1px solid #4a5568' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: 15, marginBottom: 20 }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#63b3ed' }}>Solicitação {scSelecionada.numero}</h2>
                        <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Emitida em {new Date(scSelecionada.data_criacao).toLocaleDateString('pt-BR')} por {scSelecionada.solicitante?.nome}</span>
                    </div>
                    <button onClick={() => setScSelecionada(null)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div style={{ background: '#2d3748', padding: 15, borderRadius: 8 }}>
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Data Limite de Necessidade</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: scSelecionada.data_necessidade ? '#ecc94b' : 'white' }}>{scSelecionada.data_necessidade ? new Date(scSelecionada.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data definida'}</div>
                    </div>
                    <div style={{ background: '#2d3748', padding: 15, borderRadius: 8 }}>
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Local de Entrega (Base)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{scSelecionada.local_entrega?.nome || bases.find(b => b.id == scSelecionada.local_entrega_id)?.nome || '-'}</div>
                    </div>
                </div>

                <h4 style={{ color: 'white', marginBottom: 10 }}>Itens Solicitados:</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #4a5568', textAlign: 'left', color: '#a0aec0' }}>
                                <th style={{ padding: 8 }}>Item</th>
                                <th style={{ padding: 8 }}>Categoria</th>
                                <th style={{ padding: 8, textAlign: 'center' }}>Qtd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scSelecionada.itens.map((i, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #2d3748' }}>
                                    <td style={{ padding: 8, color: 'white' }}>{getNomeItem(i)}</td>
                                    <td style={{ padding: 8, color: '#a0aec0', fontSize: '0.9rem' }}>{i.tipo_gasto}</td>
                                    <td style={{ padding: 8, textAlign: 'center', fontWeight: 'bold' }}>{i.quantidade}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {scSelecionada.observacoes && (
                    <div style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginTop: 10, marginBottom: 15 }}>
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: 5 }}>Observações Gerais:</div>
                        <div>{scSelecionada.observacoes}</div>
                    </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button onClick={() => baixarResumoPDF(scSelecionada)} style={{ flex: 1, background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                        <FileText size={16} /> Baixar PDF
                    </button>

                    {(scSelecionada.status === 'Em Análise' || scSelecionada.status === 'Em Orçamento') && can('compras.orcamentos.criar') && (
                        <button
                            onClick={() => {
                                onCriarOrcamento(scSelecionada.id);
                                setScSelecionada(null);
                            }}
                            style={{ flex: 1, background: '#00d68f', border: 'none', color: 'black', fontWeight: 'bold', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}
                        >
                            <ShoppingCart size={16} /> Criar Orçamento
                        </button>
                    )}

                    {can('compras.sc.editar') && (
                        <button onClick={() => abrirModalEdicao(scSelecionada)} title="Editar Solicitação" style={{ flex: 1, background: '#ecc94b', border: 'none', color: 'black', fontWeight: 'bold', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                            <Edit size={16} /> Editar
                        </button>
                    )}

                    {can('compras.sc.excluir') && (
                        <button onClick={() => { setScSelecionada(null); handleDelete(scSelecionada.id); }} title="Excluir Solicitação" style={{ flex: 1, background: '#e53e3e', border: 'none', color: 'white', fontWeight: 'bold', padding: 10, borderRadius: 5, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                            <Trash2 size={16} /> Excluir
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

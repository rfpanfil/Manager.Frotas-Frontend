import useCan from '../../hooks/useCan';
import { Eye, FileText, Edit, Trash2, FileDown } from 'lucide-react';

export default function TabelaSolicitacoes({
    dadosPaginados,
    dadosFiltrados,
    visibleCount,
    setVisibleCount,
    getNomeItem,
    setScSelecionada,
    baixarResumoPDF,
    abrirModalEdicao,
    handleDelete,
    onCriarOrcamento,
    can
}) {
    return (
        <>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Data Abertura</th>
                            <th>Data Limite</th>
                            <th>Itens Solicitados</th>
                            <th>Qtd. Total</th>
                            <th>Solicitante</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosPaginados.map(sc => (
                            <tr key={sc.id}>
                                <td style={{ fontWeight: 'bold', color: '#63b3ed' }}>{sc.numero}</td>
                                <td>{new Date(sc.data_criacao).toLocaleDateString('pt-BR')}</td>
                                <td style={{ color: sc.data_necessidade ? '#ecc94b' : '#a0aec0' }}>{sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                                <td>
                                    {sc.itens.length === 1 ? getNomeItem(sc.itens[0]) : `${sc.itens.length} itens (Lista)`}
                                </td>
                                <td style={{ fontWeight: 'bold' }}>{sc.itens.reduce((acc, i) => acc + i.quantidade, 0)}</td>
                                <td>{sc.solicitante?.nome}</td>
                                <td><span className={`tag ${sc.status.replace(' ', '_')}`}>{sc.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => setScSelecionada(sc)} title="Ver Detalhes" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}><Eye size={18} /></button>
                                        {can('compras.sc.baixar') && (
                                            <button onClick={() => baixarResumoPDF(sc)} title="Baixar PDF" style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}><FileText size={18} /></button>
                                        )}

                                        {can('compras.sc.editar') && <button onClick={() => abrirModalEdicao(sc)} title="Editar" style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer' }}><Edit size={18} /></button>}
                                        {can('compras.sc.excluir') && <button onClick={() => handleDelete(sc.id)} title="Excluir" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={18} /></button>}

                                        {(sc.status === 'Em Análise' || sc.status === 'Em Orçamento') && can('compras.orcamentos.criar') && (
                                            <button onClick={() => onCriarOrcamento(sc.id)} title="Lançar Orçamentos" style={{ background: '#3182ce', border: 'none', color: 'white', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                                                <FileDown size={14} style={{ marginRight: 5 }} /> Cotar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {dadosFiltrados.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', color: '#a0aec0' }}>Nenhuma solicitação encontrada.</td></tr>}
                    </tbody>
                </table>
            </div>

            {visibleCount < dadosFiltrados.length && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={() => setVisibleCount(v => v + 20)} style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '10px 30px', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>
                        Carregar + ({dadosFiltrados.length - visibleCount} restantes)
                    </button>
                </div>
            )}
        </>
    );
}

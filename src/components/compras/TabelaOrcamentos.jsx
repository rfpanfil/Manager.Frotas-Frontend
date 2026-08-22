import { Eye, FileText, Edit } from 'lucide-react';
import useCan from '../../hooks/useCan';

export default function TabelaOrcamentos({
    dadosFiltrados,
    orcamentos,
    setModalDetalhes,
    baixarComparativoPDF,
    abrirModalCotacao,
    can,
    bases
}) {
    return (
        <div style={{ marginBottom: 20 }}>
            <h2>Aprovar Cotações Lançadas</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Solicitação Origem</th>
                            <th>Local de Entrega</th>
                            <th>Data Limite</th>
                            <th>Nº de Cotações</th>
                            <th>Status da SC</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosFiltrados.map(sc => {
                            const orcsDesta = orcamentos.filter(o => o.solicitacao_id === sc.id);
                            return (
                                <tr key={sc.id}>
                                    <td style={{ fontWeight: 'bold', color: '#63b3ed' }}>{sc.numero}</td>
                                    <td>{sc.local_entrega?.nome || (bases && bases.find(b => b.id === sc.local_entrega_id)?.nome) || '-'}</td>
                                    <td style={{ color: sc.data_necessidade ? '#ecc94b' : '#a0aec0' }}>{sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data definida'}</td>
                                    <td><span style={{ background: '#4a5568', padding: '3px 8px', borderRadius: 10, fontSize: '0.8rem' }}>{orcsDesta.length} Fornecedores</span></td>
                                    <td><span className={`tag ${sc.status.replace(' ', '_')}`}>{sc.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button onClick={() => setModalDetalhes(sc)} title="Ver Cotações e Aprovar" className="btn-add" style={{ background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', padding: '5px 10px', fontSize: '0.8rem' }}>
                                                <Eye size={14} style={{ marginRight: 5 }} /> Ver Cotações
                                            </button>
                                            {can('compras.baixar') && ( <button onClick={() => baixarComparativoPDF(sc)} title="Baixar PDF" className="btn-add" style={{ background: 'transparent', border: '1px solid #a0aec0', color: '#a0aec0', padding: '5px 10px', fontSize: '0.8rem' }}>
                                                <FileText size={14} /> PDF
                                            </button> )}
                                            {can('compras.orcamentos.criar') && sc.status !== 'Orçamento Aprovado' && (
                                                <button onClick={() => abrirModalCotacao(sc.id)} title="Editar Grupo de Cotações" style={{ background: '#ecc94b', border: 'none', color: 'black', padding: '5px 10px', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Edit size={16} /> Editar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {dadosFiltrados.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhuma cotação lançada.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

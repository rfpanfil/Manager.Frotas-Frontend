import { CheckCircle, Edit, Trash2 } from 'lucide-react';

export default function TabelaRotas({ rotasFiltradas, can, abrirModalFinalizar, abrirModal, handleDelete }) {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Saída</th>
                        <th>Origem / Destino</th>
                        <th>Veículo</th>
                        <th>KM Saída</th>
                        <th>Retorno</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {rotasFiltradas.map((r) => (
                        <tr key={r.id} style={{ opacity: r.status === 'Finalizada' ? 0.6 : 1 }}>
                            <td>#{r.id}</td>
                            <td>
                                <span className={`status-badge ${r.status === 'Em Andamento' ? 'status-open' : 'status-closed'}`}>
                                    {r.status}
                                </span>
                            </td>

                            {/* Coluna Saída (Data) */}
                            <td>{new Date(r.data_inicio).toLocaleString('pt-BR')}</td>

                            {/* Origem/Destino */}
                            <td style={{ maxWidth: '300px', fontSize: '0.85rem', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                <strong style={{ color: '#fff' }}>{r.origem}</strong>
                                <div style={{ color: '#a0aec0' }}>➝ {r.destino}</div>
                            </td>

                            <td style={{ whiteSpace: 'normal', minWidth: '150px' }}>
                                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{r.veiculo?.identificacao}</strong>
                            </td>

                            <td>{r.km_inicial}</td>

                            <td style={{ whiteSpace: 'normal', minWidth: '140px' }}>
                                {r.status === 'Finalizada' ? (
                                    <div>
                                        <div>{r.data_retorno ? new Date(r.data_retorno).toLocaleString() : '-'}</div>
                                        <strong style={{ color: '#8B5CF6', fontSize: '0.8rem' }}>
                                            Total: {r.km_final - r.km_inicial} km
                                        </strong>
                                    </div>
                                ) : '-'}
                            </td>

                            <td>
                                {r.status !== 'Finalizada' && can('rotas.criar') && (
                                    <button className="btn-finish" onClick={() => abrirModalFinalizar(r)} title="Finalizar Viagem">
                                        <CheckCircle size={18} />
                                    </button>
                                )}
                                {can('rotas.criar') && (
                                    <button onClick={() => abrirModal(r)} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }} title="Editar">
                                        <Edit size={18} />
                                    </button>
                                )}
                                {can('rotas.excluir') && (
                                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }} title="Excluir">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

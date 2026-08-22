import { Eye, Edit, Trash2, Download, MoreVertical } from 'lucide-react';
import useCan from '../../hooks/useCan';

export default function TabelaGastos({
    gastosFiltrados,
    menuAcaoAberto,
    setMenuAcaoAberto,
    setGastoDetalhe,
    abrirModal,
    handleDelete,
    can,
    handleDownload,
    verificarSeTemAnexos
}) {
    return (
        <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                    <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Data</th>
                        <th>Base (C. Custo)</th>
                        <th>Tipo</th>
                        <th>Veículo</th>
                        <th>Solicitante</th>
                        <th>KM</th>
                        <th>Valor</th>
                        <th>Detalhes</th>
                        <th>Anexos</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {gastosFiltrados.map((g) => (
                        <tr key={g.id}>
                            {/* 1. Data */}
                            <td>{new Date(g.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>

                            {/* 2. Base (C. Custo) */}
                            <td><span style={{ color: '#a0aec0' }}>🏢 {g.centro_custo?.nome || g.veiculo?.base || 'Geral'}</span></td>

                            {/* 3. Tipo */}
                            <td><span style={{ color: '#f6ad55', fontWeight: 'bold' }}>{g.tipo_gasto || g.tipo}</span></td>

                            {/* 4. Veículo */}
                            <td>
                                {g.veiculo ? (
                                    <span style={{ fontWeight: 'bold', color: '#cbd5e0' }}>🚛 {g.veiculo.placa}</span>
                                ) : (
                                    <span style={{ color: '#718096' }}>-</span>
                                )}
                            </td>

                            {/* 5. Solicitante Inteligente */}
                            <td style={{ color: '#63b3ed', fontWeight: 'bold' }}>
                                {g.colaborador ? (
                                    g.colaborador.nome
                                ) : (
                                    g.descricao?.includes('Solicitante:')
                                        ? g.descricao.match(/Solicitante:\s*([^)|]+)/)?.[1]?.trim() || '-'
                                        : '-'
                                )}
                            </td>

                            {/* 6. KM */}
                            <td>{g.km_registro ? `${g.km_registro} km` : '-'}</td>

                            {/* 7. Valor */}
                            <td style={{ color: '#8B5CF6', fontWeight: 'bold' }}>R$ {parseFloat(g.valor).toFixed(2)}</td>

                            {/* 8. Detalhes da Nota */}
                            <td style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                                {g.combustivel && <div style={{ marginBottom: '2px', color: '#63b3ed' }}>⛽ {g.combustivel}</div>}
                                {g.tipo_manutencao && <div style={{ marginBottom: '2px', color: '#f6ad55' }}>🔧 {g.tipo_manutencao} ({g.status_manutencao})</div>}
                                {!g.combustivel && !g.tipo_manutencao && <strong style={{ display: 'block', color: '#e2e8f0', marginBottom: '2px' }}>{g.tipo_gasto || g.tipo}</strong>}

                                {g.descricao && (
                                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={g.descricao}>
                                        {g.descricao}
                                    </div>
                                )}
                            </td>

                            {/* 9. Anexos */}
                            <td style={{ textAlign: 'center' }}>
                                {verificarSeTemAnexos(g.comprovante) ? (
                                    can('gastos.baixar') && ( <button onClick={() => handleDownload(g.id)} style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer', padding: '5px' }} title="Baixar anexos">
                                        <Download size={20} />
                                    </button> )
                                ) : (
                                    <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>-</span>
                                )}
                            </td>

                            {/* 10. Ações */}
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap', position: 'relative' }}>
                                <button onClick={() => setMenuAcaoAberto(menuAcaoAberto === g.id ? null : g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: '5px' }} title="Ações">
                                    <MoreVertical size={20} />
                                </button>

                                {/* Overlay invisível: Cobre a tela toda e fecha o menu ao clicar fora */}
                                {menuAcaoAberto === g.id && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} onClick={() => setMenuAcaoAberto(null)} />
                                )}

                                {menuAcaoAberto === g.id && (
                                    <div style={{ position: 'absolute', right: '35px', top: '50%', transform: 'translateY(-50%)', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', display: 'flex', gap: '8px', padding: '8px', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.4)' }}>
                                        <button onClick={() => { setGastoDetalhe(g); setMenuAcaoAberto(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B5CF6', display: 'flex', alignItems: 'center' }} title="Ver Detalhes">
                                            <Eye size={18} />
                                        </button>
                                        {can('gastos.editar') && (
                                            <button onClick={() => { abrirModal(g); setMenuAcaoAberto(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3182ce', display: 'flex', alignItems: 'center' }} title="Editar">
                                                <Edit size={18} />
                                            </button>
                                        )}
                                        {can('gastos.excluir') && (
                                            <button onClick={() => { handleDelete(g.id); setMenuAcaoAberto(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', display: 'flex', alignItems: 'center' }} title="Excluir">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

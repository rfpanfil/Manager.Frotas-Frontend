import React from 'react';
import {
    ChevronDown, ChevronRight, ArrowUpCircle, ArrowDownCircle,
    Edit, Clock, Trash2, FileText
} from 'lucide-react';

/**
 * Tabela principal de itens em estoque com área expandida para sub-itens.
 * Componente 100% presentacional — "burro" — sem estados de formulário.
 */
export default function EstoqueTabelaPrincipal({
    itensFiltrados, expandedItem, subItens, loadingSub,
    onToggleExpand, onEntrada, onSaida, onEditarMolde, onExcluirMolde,
    onVerHistoricoGeral, onVerHistoricoFisico, onEditarFisico, onExcluirFisico,
    can
}) {
    return (
        <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th style={{ whiteSpace: 'nowrap' }}>Código</th>
                        <th>Modelo/Item</th>
                        <th style={{ textAlign: 'center' }}>Categoria</th>
                        <th style={{ textAlign: 'center' }}>Controle</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Saldo UND</th>
                        <th style={{ textAlign: 'center', width: '140px' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {itensFiltrados.map(item => (
                        <React.Fragment key={item.id}>
                            {/* --- LINHA DO ITEM PAI --- */}
                            <tr style={{ background: expandedItem === item.id ? '#2d3748' : 'transparent' }}>
                                <td>
                                    {item.tipo_controle === 'SERIALIZADO' && (
                                        <button onClick={() => onToggleExpand(item)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                            {expandedItem === item.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                    )}
                                </td>
                                <td>{item.codigo_referencia}</td>
                                <td style={{ fontWeight: expandedItem === item.id ? 'bold' : 'normal' }}>{item.nome}</td>
                                <td style={{ textAlign: 'center' }}><span className="tag" style={{ display: 'inline-block' }}>{item.categoria}</span></td>
                                <td style={{ textAlign: 'center' }}>{item.tipo_controle === 'QUANTIDADE' ? 'Volume' : 'Unitário'}</td>
                                <td style={{
                                    color: item.estoque_minimo > 0 && item.saldo_atual <= item.estoque_minimo ? '#e53e3e' : (item.saldo_atual === 0 ? '#a0aec0' : '#8B5CF6'),
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    {item.tipo_controle === 'SERIALIZADO' && item.saldo_atual === 0
                                        ? <span style={{ opacity: 0.6 }}>0 (Molde)</span>
                                        : <>{item.saldo_atual} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{item.unidade_medida === 'UNIDADE' ? 'UND' : item.unidade_medida}</span></>}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                        {can('estoque.movimentar') && (
                                            <>
                                                <button onClick={() => onEntrada(item.id)} title="Dar Entrada" style={{ background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer' }}><ArrowUpCircle size={16} /></button>
                                                <button onClick={() => onSaida(item.id)} title="Dar Saída" style={{ background: 'none', border: 'none', color: '#f6ad55', cursor: 'pointer' }}><ArrowDownCircle size={16} /></button>
                                            </>
                                        )}
                                        {can('estoque.editar') && (
                                            <button onClick={() => onEditarMolde(item)} title="Editar Cadastro (Molde)" style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer' }}><Edit size={16} /></button>
                                        )}
                                        {can('estoque.historico') && (
                                            <button onClick={() => onVerHistoricoGeral(item)} title="Histórico Geral" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}><Clock size={16} /></button>
                                        )}
                                        {can('estoque.excluir') && (
                                            <button onClick={() => onExcluirMolde(item)} title="Excluir Molde" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>

                            {/* --- ÁREA EXPANDIDA (SUB-ITENS FÍSICOS) --- */}
                            {expandedItem === item.id && (
                                <tr>
                                    <td colSpan="7" style={{ background: '#1a202c', padding: '10px 20px' }}>
                                        <div style={{ borderLeft: '3px solid #63b3ed', paddingLeft: 15 }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#63b3ed' }}>
                                                Itens Individuais ({subItens.length})
                                                <span style={{ fontSize: '0.8rem', color: '#a0aec0', marginLeft: 10, fontWeight: 'normal' }}>
                                                    (Estes são os itens físicos reais atrelados ao modelo acima)
                                                </span>
                                            </h4>

                                            {loadingSub ? <p style={{ color: '#a0aec0' }}>Carregando...</p> : (
                                                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: '#2d3748', color: '#a0aec0' }}>
                                                            {item.categoria === 'PNEUS' ? (
                                                                <>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>DOT (Principal)</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Fogo (Opcional)</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Medida</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Marca</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Sulco</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                                                                    <th style={{ textAlign: 'center', padding: '8px' }}>Ações</th>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Serial (Principal)</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Patrimônio</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Marca/Modelo</th>
                                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                                                                    <th style={{ textAlign: 'center', padding: '8px' }}>Ações</th>
                                                                </>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {subItens.map(sub => (
                                                            <tr key={sub.id} style={{ borderBottom: '1px solid #444' }}>
                                                                {sub.tipo === 'PNEU' ? (
                                                                    <>
                                                                        <td style={{ fontWeight: 'bold', color: '#8B5CF6', textAlign: 'left', padding: '8px' }}>{sub.dot || '-'}</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>{sub.fogo || <span style={{ opacity: 0.5 }}>S/N</span>}</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>{sub.medida}</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>{sub.marca}</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>{sub.sulco_novo} mm</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>
                                                                            {sub.status?.replace('_', ' ')}
                                                                            {sub.status === 'EM_USO' && sub.placa_veiculo && (
                                                                                <span style={{ color: '#63b3ed', fontSize: '0.8rem', marginLeft: 6, fontWeight: 'bold' }}>
                                                                                    ({sub.placa_veiculo})
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td style={{ fontWeight: 'bold', color: '#8B5CF6', textAlign: 'left', padding: '8px' }}>{sub.serial}</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>{sub.patrimonio || '-'}</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>{sub.marca || '-'}</td>
                                                                        <td style={{ textAlign: 'left', padding: '8px' }}>
                                                                            {sub.status?.replace('_', ' ')}
                                                                            {sub.status === 'EM_USO' && sub.placa_veiculo && (
                                                                                <span style={{ color: '#63b3ed', fontSize: '0.8rem', marginLeft: 6, fontWeight: 'bold' }}>
                                                                                    ({sub.placa_veiculo})
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </>
                                                                )}

                                                                <td style={{ textAlign: 'center', padding: '8px' }}>
                                                                    {can('estoque.historico') && (
                                                                        <button onClick={() => onVerHistoricoFisico(sub)} title="Ver Histórico Deste Item" style={{ marginRight: 10, background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}>
                                                                            <FileText size={14} />
                                                                        </button>
                                                                    )}
                                                                    {can('estoque.editar') && (
                                                                        <button onClick={() => onEditarFisico(sub)} title="Editar" style={{ marginRight: 10, background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer' }}><Edit size={14} /></button>
                                                                    )}
                                                                    {can('estoque.excluir') && (
                                                                        <button onClick={() => onExcluirFisico(sub.id, sub.tipo)} title="Excluir" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {subItens.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', color: '#718096', padding: 20 }}>Nenhum item físico cadastrado neste modelo. Use o botão "Entrada" acima para adicionar.</td></tr>}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

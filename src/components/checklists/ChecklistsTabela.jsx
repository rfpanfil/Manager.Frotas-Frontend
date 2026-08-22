import React from 'react';
import { CheckCircle, AlertCircle, Eye, Trash2, X, FileText, Clock } from 'lucide-react';

export default function ChecklistsTabela({
    veiculosFiltrados,
    podeExcluir, podeBaixar, podeRealizar,
    handleExcluirChecklist, handleExportarIndividual, handleVerChecklist, handleOpenChecklist
}) {
    return (
        <div className="table-container">
            <table className="table-mobile-fit">
                <thead>
                    <tr>
                        <th>Placa</th>
                        <th className="hide-mobile">Veículo</th>
                        <th>Status</th>
                        <th className="hide-mobile">Responsável</th>
                        <th className="hide-mobile">Data</th>
                        <th style={{ textAlign: 'right' }}>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {veiculosFiltrados.map(v => (
                        <tr key={v.id}>
                            <td><strong style={{ color: '#8B5CF6' }}>{v.placa}</strong></td>
                            <td className="hide-mobile">{v.marca} {v.modelo}</td>
                            <td>
                                {v.status_checklist === 'APROVADO' && <span style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={16} /> Aprovado</span>}
                                {v.status_checklist === 'REPROVADO' && <span style={{ color: '#e53e3e', display: 'flex', alignItems: 'center', gap: 5 }}><X size={16} /> Reprovado</span>}
                                {v.status_checklist === 'FINALIZADO' && <span style={{ color: '#3182ce', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={16} /> Aguardando Aprovação</span>}
                                {v.status_checklist === 'PENDENTE' && <span style={{ color: '#ecc94b', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={16} /> Pendente</span>}
                                {(v.status_checklist === 'NAO_REALIZADO' || !v.status_checklist) && <span style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={16} /> Não Realizado</span>}
                            </td>
                            <td className="hide-mobile">{v.responsavel_nome || '-'}</td>
                            <td className="hide-mobile">{v.data_checklist ? new Date(v.data_checklist).toLocaleDateString() : '-'}</td>
                            <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>

                                {/* Botão de Excluir */}
                                {v.checklist_id && podeExcluir && (
                                    <button
                                        onClick={() => handleExcluirChecklist(v.checklist_id)}
                                        style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer' }}
                                        title="Excluir Rascunho"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                {/* Botão de PDF Individual */}
                                {v.checklist_id && podeBaixar && (
                                    <button
                                        onClick={() => handleExportarIndividual(v)}
                                        style={{ background: '#3182ce', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer' }}
                                        title="Baixar PDF deste veículo"
                                    >
                                        <FileText size={16} />
                                    </button>
                                )}

                                {/* Botão de Ver (Leitura) */}
                                {(v.status_checklist === 'FINALIZADO' || v.status_checklist === 'APROVADO' || v.status_checklist === 'REPROVADO') && (
                                    <button
                                        onClick={() => handleVerChecklist(v)}
                                        style={{ background: '#4a5568', color: 'white', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer' }}
                                        title="Visualizar"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )}

                                {/* Botão Realizar/Continuar/Refazer (Edição) */}
                                {podeRealizar && (v.status_checklist === 'NAO_REALIZADO' || !v.status_checklist || v.status_checklist === 'PENDENTE' || v.status_checklist === 'REPROVADO') && (
                                    <button
                                        className="btn-add"
                                        style={{
                                            padding: '5px 10px', fontSize: '0.8rem', border: 'none', borderRadius: 4, cursor: 'pointer',
                                            background: v.status_checklist === 'REPROVADO' ? '#e53e3e' : (v.status_checklist === 'PENDENTE' ? '#ecc94b' : '#8B5CF6'),
                                            color: v.status_checklist === 'PENDENTE' ? 'black' : 'white'
                                        }}
                                        onClick={() => handleOpenChecklist(v)}
                                    >
                                        {v.status_checklist === 'PENDENTE' ? 'Continuar' : (v.status_checklist === 'REPROVADO' ? 'Refazer' : 'Realizar')}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {veiculosFiltrados.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#a0aec0' }}>Nenhum veículo encontrado.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

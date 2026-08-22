import usePersistedTab from '../hooks/usePersistedTab';
import useCan from '../hooks/useCan';
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ShieldAlert, Search, Filter, FileText, Download, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- COMPONENTE AUXILIAR PARA RENDERIZAR OS DADOS MUDADOS (JSON) ---
function RenderJSON({ str }) {
    if (!str || str === 'null') return <span style={{ color: '#718096' }}>-</span>;
    try {
        const obj = JSON.parse(str);
        return (
            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '4px' }}>
                {Object.entries(obj)
                    .filter(([key]) => key !== 'senha_hash') // <--- FILTRO: Ignora a senha_hash
                    .map(([key, val]) => (
                        <div key={key} style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}> {/* <--- QUEBRA DE TEXTO AQUI */}
                            <strong style={{ color: '#a0aec0' }}>{key}:</strong> {String(val)}
                        </div>
                    ))}
            </div>
        );
    } catch (e) {
        return <span style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{str}</span>;
    }
}

export default function Auditoria() {
    const can = useCan();
    const [abaAtiva, setAbaAtiva] = usePersistedTab('geral', 'auditoria');
    const queryClient = useQueryClient();
    const [filtros, setFiltros] = useState({
        busca: '', usuario: '', tabela: '', acao: '', data_inicio: '', data_fim: ''
    });
    const [limite, setLimite] = useState(50);
    const [page, setPage] = useState(1);

    const { data: opcoes = { usuarios: [], tabelas: [], acoes: [] } } = useQuery({
        queryKey: ['auditoriaOpcoes'],
        queryFn: async () => (await api.get('/auditoria/filtros')).data
    });

    const { data: logsData, isLoading: carregando, refetch: carregarLogs } = useQuery({
        queryKey: ['auditoriaLogs', filtros.usuario, filtros.tabela, filtros.acao, filtros.data_inicio, filtros.data_fim, limite, page],
        queryFn: async () => {
            const params = {
                page, limit: limite,
                busca: filtros.busca || undefined,
                usuario_nome: filtros.usuario || undefined,
                tabela: filtros.tabela || undefined,
                acao: filtros.acao || undefined,
                data_inicio: filtros.data_inicio || undefined,
                data_fim: filtros.data_fim || undefined
            };
            return (await api.get('/auditoria/', { params })).data;
        }
    });

    const logs = logsData?.items || [];
    const total = logsData?.total || 0;





    function handleBuscaTextual(e) {
        e.preventDefault();
        if (page !== 1) setPage(1);
        else carregarLogs();
    }

    // --- EXPORTAÇÕES ---
    function exportarExcel() {
        const wsData = logs.map(l => ({
            "Data/Hora": new Date(l.data_hora).toLocaleString('pt-BR'),
            "Usuário": l.usuario_nome || 'Sistema',
            "Ação": l.acao,
            "Módulo (Tabela)": l.tabela,
            "ID Registro": l.registro_id || '-',
            "Dados Antigos": l.dados_antigos,
            "Dados Novos": l.dados_novos
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Log_Auditoria");
        XLSX.writeFile(wb, `Auditoria_${new Date().getTime()}.xlsx`);
    }

    function exportarPDF() {
        const doc = new jsPDF('landscape');
        doc.text("Relatório de Auditoria do Sistema", 14, 10);
        const tableRows = logs.map(l => [
            new Date(l.data_hora).toLocaleString('pt-BR'),
            l.usuario_nome || 'Sistema',
            l.acao,
            l.tabela,
            l.registro_id || '-',
            l.dados_antigos && l.dados_antigos !== 'null' ? "Sim (Ver Excel)" : "-",
            l.dados_novos && l.dados_novos !== 'null' ? "Sim (Ver Excel)" : "-"
        ]);
        autoTable(doc, {
            head: [["Data/Hora", "Usuário", "Ação", "Tabela", "ID", "Tinha Dados Antigos", "Tinha Dados Novos"]],
            body: tableRows, startY: 15, styles: { fontSize: 8 }
        });
        doc.save(`Auditoria_${new Date().getTime()}.pdf`);
    }

    return (
        <div>
            <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1>Auditoria (Log de Atividades)</h1>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={limite} onChange={e => setLimite(parseInt(e.target.value))} style={{ background: '#2d3748', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '5px', outline: 'none', cursor: 'pointer' }}>
                        <option value="100">100 Registros</option>
                        <option value="500">500 Registros</option>
                        <option value="1000">1.000 Registros</option>
                        <option value="2000">2.000 Registros</option>
                        <option value="999999">Mostrar Tudo</option>
                    </select>

                    {can('relatorios.baixar') && ( <button onClick={exportarExcel} className="btn-add" style={{ backgroundColor: '#3182ce', color: 'white', height: '40px' }} title="Baixar Planilha">
                        <Download size={18} style={{ marginRight: 5 }} /> Excel
                    </button> )}

                    {can('relatorios.baixar') && ( <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px' }}>
                        <FileText size={18} style={{ marginRight: 5 }} /> PDF
                    </button> )}
                </div>
            </div>

            {/* --- BARRA DE FILTROS --- */}
            <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: '#1a202c', padding: '15px', borderRadius: '8px', border: '1px solid #2d3748', marginBottom: '20px' }}>

                <form onSubmit={handleBuscaTextual} style={{ display: 'flex', alignItems: 'center', background: '#2d3748', borderRadius: '5px', padding: '0 10px', flex: '1 1 200px' }}>
                    <Search size={18} color="#a0aec0" />
                    <input
                        placeholder="Buscar em dados ou usuário (Enter para buscar)..."
                        value={filtros.busca}
                        onChange={e => setFiltros({ ...filtros, busca: e.target.value })}
                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', outline: 'none', width: '100%' }}
                    />
                </form>

                <div className="filter-item" style={{ flex: '1 1 150px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'block', marginBottom: '3px' }}>Usuário</label>
                    <select value={filtros.usuario} onChange={e => setFiltros({ ...filtros, usuario: e.target.value })} style={{ width: '100%', padding: '8px', background: '#2d3748', color: 'white', border: '1px solid #4a5568', borderRadius: '4px' }}>
                        <option value="">Todos</option>
                        {opcoes.usuarios.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>

                <div className="filter-item" style={{ flex: '1 1 150px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'block', marginBottom: '3px' }}>Módulo (Tabela)</label>
                    <select value={filtros.tabela} onChange={e => setFiltros({ ...filtros, tabela: e.target.value })} style={{ width: '100%', padding: '8px', background: '#2d3748', color: 'white', border: '1px solid #4a5568', borderRadius: '4px' }}>
                        <option value="">Todas</option>
                        {opcoes.tabelas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="filter-item" style={{ flex: '1 1 120px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'block', marginBottom: '3px' }}>Tipo Ação</label>
                    <select value={filtros.acao} onChange={e => setFiltros({ ...filtros, acao: e.target.value })} style={{ width: '100%', padding: '8px', background: '#2d3748', color: 'white', border: '1px solid #4a5568', borderRadius: '4px' }}>
                        <option value="">Todas</option>
                        {opcoes.acoes.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div className="filter-item" style={{ display: 'flex', gap: '5px', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'block', marginBottom: '3px' }}>Início</label>
                        <input type="date" value={filtros.data_inicio} onChange={e => setFiltros({ ...filtros, data_inicio: e.target.value })} style={{ padding: '7px', background: '#2d3748', color: 'white', border: '1px solid #4a5568', borderRadius: '4px' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'block', marginBottom: '3px' }}>Fim</label>
                        <input type="date" value={filtros.data_fim} onChange={e => setFiltros({ ...filtros, data_fim: e.target.value })} style={{ padding: '7px', background: '#2d3748', color: 'white', border: '1px solid #4a5568', borderRadius: '4px' }} />
                    </div>
                </div>
            </div>

            {/* --- TABELA DE LOGS --- */}
            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                {carregando ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#8B5CF6' }}> <Activity size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> <p>Buscando no banco...</p> </div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
                        <thead style={{ background: '#2d3748' }}>
                            <tr>
                                <th style={{ whiteSpace: 'nowrap', width: '15%' }}>Data / Hora</th>
                                <th style={{ width: '15%' }}>Usuário</th>
                                <th style={{ width: '10%' }}>Ação</th>
                                <th style={{ width: '15%' }}>Tabela (Módulo)</th>
                                <th style={{ width: '5%' }}>ID</th>
                                <th style={{ width: '20%' }}>Dados Anteriores</th>
                                <th style={{ width: '20%' }}>Dados Novos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((l) => (
                                <tr key={l.id}>
                                    <td style={{ whiteSpace: 'nowrap', color: '#a0aec0' }}>
                                        {new Date(l.data_hora).toLocaleString('pt-BR')}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: '#63b3ed' }}>{l.usuario_nome || 'Sistema'}</td>
                                    <td>
                                        <span style={{
                                            background: l.acao === 'CRIAR' ? 'rgba(139, 92, 246, 0.1)' : l.acao === 'EXCLUIR' ? 'rgba(229, 62, 62, 0.1)' : 'rgba(246, 173, 85, 0.1)',
                                            color: l.acao === 'CRIAR' ? '#8B5CF6' : l.acao === 'EXCLUIR' ? '#e53e3e' : '#f6ad55',
                                            padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem'
                                        }}>
                                            {l.acao}
                                        </span>
                                    </td>
                                    <td style={{ textTransform: 'uppercase' }}>{l.tabela}</td>
                                    <td>{l.registro_id || '-'}</td>
                                    <td style={{ maxWidth: '300px', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}><RenderJSON str={l.dados_antigos} /></td>
                                    <td style={{ maxWidth: '300px', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}><RenderJSON str={l.dados_novos} /></td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#a0aec0' }}>Nenhum log encontrado para estes filtros.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* CONTROLES DE PAGINAÇÃO SERVER-SIDE */}
            {!carregando && total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '20px', marginBottom: '20px', background: '#1a202c', padding: '15px', borderRadius: '8px', border: '1px solid #2d3748' }}>
                    <div style={{ color: '#a0aec0', fontSize: '0.9rem' }}>
                        Mostrando {(page - 1) * limite + 1} a {Math.min(page * limite, total)} de <strong style={{color: 'white'}}>{total}</strong> registros
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{ background: page === 1 ? '#2d3748' : '#3182ce', color: page === 1 ? '#718096' : 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            Anterior
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2d3748', color: 'white', padding: '0 15px', borderRadius: '5px', fontWeight: 'bold' }}>
                            Página {page}
                        </div>
                        
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * limite >= total}
                            style={{ background: page * limite >= total ? '#2d3748' : '#3182ce', color: page * limite >= total ? '#718096' : 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: page * limite >= total ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}





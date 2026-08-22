import usePersistedTab from '../hooks/usePersistedTab';
import useCan from '../hooks/useCan';
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Truck, FileText, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select';
import toast from 'react-hot-toast';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#444',
        color: 'white',
        minHeight: '38px',
        boxShadow: state.isFocused ? '0 0 0 1px #8B5CF6' : 'none',
        '&:hover': { borderColor: '#8B5CF6' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#8B5CF6' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#4a5568' }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#e53e3e' } })
};

export default function DashboardVeiculos() {
    const can = useCan();
    const [abaAtiva, setAbaAtiva] = usePersistedTab('geral', 'dashboardveiculos');
    const queryClient = useQueryClient();
    const { data: veiculos = [] } = useQuery({ queryKey: ['veiculosResumo'], queryFn: async () => (await api.get('/veiculos/resumo')).data , staleTime: 1000 * 60 * 5 });
    const { data: anosDisponiveis = [] } = useQuery({ queryKey: ['anosDashboard'], queryFn: async () => (await api.get('/dashboard/anos')).data , staleTime: 1000 * 60 * 5 });
    const { data: tiposGasto = [] } = useQuery({ queryKey: ['tiposGasto'], queryFn: async () => (await api.get('/opcoes/tipos-gasto')).data , staleTime: 1000 * 60 * 5 });

    // --- ESTADOS DO FILTRO ---
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '', label: 'Últimos 12 meses' });
    const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);
    const [usarFiltroPeriodo, setUsarFiltroPeriodo] = useState(false);
    const [filtros, setFiltros] = useState({
        ano: new Date().getFullYear(),
        mes: '',
        veiculo_ids: [],
        tipo_gasto: ''
    });

    const [gerandoPDF, setGerandoPDF] = useState(false);
    // --- NOVO ESTADO: Linhas Expandidas ---
    const [linhasExpandidas, setLinhasExpandidas] = useState({});
    const [modoPR, setModoPR] = useState('acumulado');


    const toggleLinha = (idx) => {
        setLinhasExpandidas(prev => ({ ...prev, [idx]: !prev[idx] }));
    };




    function selecionarPeriodo(tipo) {
        const hoje = new Date();
        let inicio = new Date(), fim = new Date();
        let label = "";

        if (tipo === '7d') { inicio.setDate(hoje.getDate() - 7); label = "Últimos 7 dias"; }
        else if (tipo === '30d') { inicio.setDate(hoje.getDate() - 30); label = "Últimos 30 dias"; }
        else if (tipo === '90d') { inicio.setDate(hoje.getDate() - 90); label = "Últimos 3 meses"; }
        else if (tipo === '12m') { inicio.setFullYear(hoje.getFullYear() - 1); label = "Últimos 12 meses"; }
        else if (tipo === 'mes_atual') {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            label = "Este Mês";
        }

        setPeriodo({
            inicio: inicio.toISOString().split('T')[0],
            fim: fim.toISOString().split('T')[0],
            label
        });
        setUsarFiltroPeriodo(true);
        setMenuPeriodoAberto(false);
    }

    const opcoesVeiculos = veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.marca} - ${v.modelo}`.toUpperCase() }));

    const { data: dados, isLoading: loadingDashboard } = useQuery({
        queryKey: ['dashboardFrota', filtros, periodo, usarFiltroPeriodo],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filtros.veiculo_ids && filtros.veiculo_ids.length > 0) {
                filtros.veiculo_ids.forEach(v => params.append('veiculos_ids', v.value));
            }
            if (usarFiltroPeriodo && periodo.inicio && periodo.fim) {
                params.append('data_inicio', periodo.inicio);
                params.append('data_fim', periodo.fim);
                if (filtros.tipo_gasto) params.append('tipo_gasto', filtros.tipo_gasto);
            } else {
                params.append('ano', filtros.ano);
                if (filtros.mes) params.append('mes', filtros.mes);
                if (filtros.tipo_gasto) params.append('tipo_gasto', filtros.tipo_gasto);
            }
            const response = await api.get('/dashboard/veiculos', { params });
            return response.data;
        }
    });

    // ===== EXPORTAR PDF CORRIGIDO (COM COMBUSTÍVEL) =====
    function exportarPDF() {
        if (!dados || dados.length === 0) {
            toast.error("Não há dados para exportar.");
            return;
        }
        setGerandoPDF(true);

        try {
            const doc = new jsPDF('landscape', 'mm', 'a4');

            doc.setFontSize(18);
            doc.text(`Análise de Performance da Frota`, 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            const filtroTexto = usarFiltroPeriodo ? periodo.label : `${filtros.mes ? filtros.mes + '/' : ''}${filtros.ano}`;
            doc.text(`Período: ${filtroTexto} | Gerado em: ${new Date().toLocaleDateString()}`, 14, 22);

            const tableRows = [];

            dados.forEach((d) => {
                // Determina qual valor de performance usar baseado no State modoPR
                const valorPerformance = modoPR === 'evento'
                    ? (d.pr_evento_medio || 0)
                    : (d.pr_acumulado || 0);

                // 1. LINHA PRINCIPAL
                tableRows.push([
                    d.veiculo,
                    `R$ ${(d.total_gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,

                    // --- ADICIONADO AQUI: COMBUSTÍVEL ---
                    `R$ ${(d.gastos_abastecimento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,

                    `R$ ${(d.gastos_revisoes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    `${(d.km_rodado || 0).toLocaleString('pt-BR')} km`,
                    `${(d.media_consumo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} km/l`,
                    `R$ ${valorPerformance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /km`
                ]);

                // 2. LINHA DE DETALHES (EXPANDIDA AUTOMATICAMENTE)
                const textoDetalhes = Object.entries(d.detalhamento)
                    .map(([tipo, valor]) => `${tipo}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
                    .join('    |    ');

                if (textoDetalhes) {
                    tableRows.push([
                        {
                            content: `   >> ${textoDetalhes}`,
                            colSpan: 7, // AUMENTADO PARA 7 COLUNAS
                            styles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontStyle: 'italic', fontSize: 8 }
                        }
                    ]);
                } else {
                    tableRows.push([
                        {
                            content: `   >> Sem detalhamento de gastos no período.`,
                            colSpan: 7, // AUMENTADO PARA 7 COLUNAS
                            styles: { fillColor: [240, 240, 240], textColor: [150, 150, 150], fontStyle: 'italic', fontSize: 8 }
                        }
                    ]);
                }
            });

            autoTable(doc, {
                // CABEÇALHO COM 'COMBUSTÍVEL' ADICIONADO
                head: [['Veículo', 'Total Gasto', 'Combustível', 'Revisões', 'KM Rodado', 'Média Consumo', 'Perf. (KM/R$)']],
                body: tableRows,
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [0, 214, 143], textColor: [0, 0, 0], fontStyle: 'bold' },
                styles: { fontSize: 9 },
                columnStyles: {
                    1: { textColor: [229, 62, 62], fontStyle: 'bold' }, // Total Gasto (Vermelho)
                    6: { textColor: [49, 130, 206], fontStyle: 'bold' } // Performance (Azul) - Índice mudou para 6
                }
            });

            doc.save(`Performance_Frota_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("Erro PDF:", error);
            toast.error("Erro ao gerar PDF: " + error.message);
        } finally {
            setGerandoPDF(false);
        }
    }

    function handleFiltro(e) {
        setUsarFiltroPeriodo(false);
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    }

    if (loadingDashboard || !dados) return <div style={{ padding: '30px', color: 'white' }}>Carregando dados da frota...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <h1>Dashboard Frota (Analítico)</h1>
                {can('relatorios.baixar') && ( <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px' }} disabled={gerandoPDF}>
                    <FileText size={18} style={{ marginRight: 5 }} /> {gerandoPDF ? 'Gerando...' : 'Exportar PDF'}
                </button> )}
            </div>

            {/* BARRA DE FILTROS MANTIDA IDENTICA */}
            <div className="filter-bar">
                <div className="filter-item">
                    <label>Ano</label>
                    <select name="ano" value={filtros.ano} onChange={handleFiltro}>
                        {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                    </select>
                </div>
                <div className="filter-item">
                    <label>Mês</label>
                    <select name="mes" value={filtros.mes} onChange={handleFiltro}>
                        <option value="">Todos</option>
                        <option value="1">Janeiro</option>
                        <option value="2">Fevereiro</option>
                        <option value="3">Março</option>
                        <option value="4">Abril</option>
                        <option value="5">Maio</option>
                        <option value="6">Junho</option>
                        <option value="7">Julho</option>
                        <option value="8">Agosto</option>
                        <option value="9">Setembro</option>
                        <option value="10">Outubro</option>
                        <option value="11">Novembro</option>
                        <option value="12">Dezembro</option>
                    </select>
                </div>

                <div style={{ alignSelf: 'center', color: '#4a5568', fontSize: '1.2rem', margin: '0 5px', fontWeight: 'bold' }}>|</div>

                <div className="filter-item" style={{ position: 'relative' }}>
                    <label style={{ color: usarFiltroPeriodo ? '#8B5CF6' : '#a0aec0' }}>Período Rápido</label>
                    <button onClick={() => setMenuPeriodoAberto(!menuPeriodoAberto)} style={{ background: usarFiltroPeriodo ? '#1a202c' : '#151821', color: 'white', border: usarFiltroPeriodo ? '1px solid #8B5CF6' : '1px solid #444', padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', minWidth: '180px', justifyContent: 'space-between' }}>
                        {usarFiltroPeriodo ? periodo.label : "Selecionar..."} <Filter size={14} />
                    </button>
                    {menuPeriodoAberto && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', padding: '10px', zIndex: 100, width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <button onClick={() => selecionarPeriodo('7d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 7 dias</button>
                                <button onClick={() => selecionarPeriodo('30d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 30 dias</button>
                                <button onClick={() => selecionarPeriodo('mes_atual')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Este Mês</button>
                                <button onClick={() => selecionarPeriodo('90d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 3 meses</button>
                                <button onClick={() => selecionarPeriodo('12m')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 12 meses</button>

                                <hr style={{ borderColor: '#444', margin: '5px 0' }} />

                                <div style={{ fontSize: '0.8rem', color: '#8B5CF6', marginBottom: '5px' }}>Personalizado:</div>

                                <input
                                    type="date"
                                    value={periodo.inicio}
                                    onChange={e => setPeriodo({ ...periodo, inicio: e.target.value })}
                                    style={{ width: '100%', marginBottom: '5px', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }}
                                />
                                <input
                                    type="date"
                                    value={periodo.fim}
                                    onChange={e => setPeriodo({ ...periodo, fim: e.target.value })}
                                    style={{ width: '100%', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }}
                                />

                                <button
                                    onClick={() => {
                                        if (periodo.inicio && periodo.fim) {
                                            setPeriodo({ ...periodo, label: 'Personalizado' });
                                            setUsarFiltroPeriodo(true);
                                            setMenuPeriodoAberto(false);
                                        } else {
                                            toast.error("Selecione data inicial e final");
                                        }
                                    }}
                                    style={{
                                        marginTop: '10px', width: '100%', padding: '8px',
                                        background: '#8B5CF6', color: '#fff', border: 'none',
                                        borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    Aplicar Filtro
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="filter-item">
                    <label>Performance</label>
                    <select value={modoPR} onChange={e => setModoPR(e.target.value)}>
                        <option value="acumulado">PR Acumulado (Média Global)</option>
                        <option value="evento">PR por Evento (Média dos Trechos)</option>
                    </select>
                </div>


                <div className="filter-item" style={{ marginLeft: 'auto', minWidth: '300px' }}>
                    <label>Veículos</label>
                    <Select
                        isMulti
                        options={opcoesVeiculos}
                        value={filtros.veiculo_ids}
                        onChange={val => setFiltros({ ...filtros, veiculo_ids: val })}
                        placeholder="Selecione veículos..."
                        styles={customSelectStyles}
                        closeMenuOnSelect={false}
                    />
                </div>

                <div className="filter-item">
                    <label>Tipo de Gasto</label>
                    <select name="tipo_gasto" value={filtros.tipo_gasto} onChange={handleFiltro}>
                        <option value="">Todos</option>
                        {tiposGasto.map(t => (
                            <option key={t.id} value={t.nome}>{t.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- NOVA TABELA ANALÍTICA COM EXPANSÃO --- */}
            <div className="table-container" style={{ marginTop: '20px' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#2d3748', color: '#a0aec0', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        <tr>
                            {/* 1. Coluna da Setinha (Vazia no cabeçalho) */}
                            <th style={{ width: '50px', padding: '15px' }}></th>

                            <th>Veículo</th>
                            <th style={{ textAlign: 'right' }}>Total Geral</th>

                            <th style={{ textAlign: 'right' }}>Combustível</th>
                            <th style={{ textAlign: 'right' }}>Revisões</th>

                            <th style={{ textAlign: 'center' }}>KM Rodado</th>
                            <th style={{ textAlign: 'center' }}>Média (KM/L)</th>
                            <th style={{ textAlign: 'center' }}>Performance (R$/KM)</th>
                        </tr>
                    </thead>
                    <tbody style={{ color: 'white', fontSize: '0.9rem' }}>
                        {dados && dados.length > 0 ? (
                            dados.map((linha, index) => (
                                <React.Fragment key={index}>
                                    <tr style={{ borderBottom: '1px solid #2d3748' }}>

                                        {/* 3. SETINHA NA ESQUERDA (Primeira Coluna) */}
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => toggleLinha(index)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#8B5CF6', // Cor padrão do sistema (verde loop)
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {/* Correção do erro de variável: linhasExpandidas[index] */}
                                                {linhasExpandidas[index] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </button>
                                        </td>

                                        <td style={{ fontWeight: 'bold' }}>{linha.veiculo}</td>

                                        {/* TOTAL GERAL */}
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#8B5CF6' }}>
                                            R$ {linha.total_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>

                                        {/* COLUNA COMBUSTÍVEL LIMPA */}
                                        <td style={{ textAlign: 'right', color: '#a0aec0' }}>
                                            R$ {(linha.gastos_abastecimento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>

                                        {/* COLUNA REVISÕES */}
                                        <td style={{ textAlign: 'right', color: '#a0aec0' }}>
                                            R$ {linha.gastos_revisoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>

                                        {/* KM RODADO */}
                                        <td style={{ textAlign: 'center' }}>{linha.km_rodado} km</td>

                                        {/* MÉDIA KM/L */}
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                color: linha.media_consumo < 5 ? '#f6ad55' : 'white', // Mantém alerta visual só no valor
                                                fontWeight: linha.media_consumo < 5 ? 'bold' : 'normal'
                                            }}>
                                                {linha.media_consumo} km/l
                                            </span>
                                        </td>

                                        {/* PERFORMANCE R$/KM */}
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                // Define a cor baseada no valor (maior que 2 fica vermelho) garantindo fallback para 0
                                                background: ((modoPR === 'acumulado' ? linha.pr_acumulado : linha.pr_evento_medio) || 0) > 2 ? 'rgba(229, 62, 62, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                                                color: ((modoPR === 'acumulado' ? linha.pr_acumulado : linha.pr_evento_medio) || 0) > 2 ? '#e53e3e' : '#8B5CF6',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem'
                                            }}>
                                                {/* Alterna o VALOR exibido na tela garantindo fallback */}
                                                R$ {modoPR === 'acumulado'
                                                    ? (linha.pr_acumulado ? Number(linha.pr_acumulado).toFixed(2) : '0.00')
                                                    : (linha.pr_evento_medio ? Number(linha.pr_evento_medio).toFixed(2) : '0.00')
                                                } /km
                                            </span>

                                            <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '2px' }}>
                                                {modoPR === 'acumulado' ? '(Média Geral)' : '(Média Eventos)'}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* LINHA EXPANDIDA (DETALHES) */}
                                    {linhasExpandidas[index] && (
                                        <tr style={{ background: '#1a202c' }}>
                                            <td colSpan="8" style={{ padding: '15px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', paddingLeft: '40px', borderLeft: '4px solid #8B5CF6' }}>
                                                    <strong style={{ color: '#fff', gridColumn: '1 / -1', marginBottom: '5px' }}>
                                                        Detalhamento Completo (Combustível, Manutenção, etc.):
                                                    </strong>
                                                    {/* Lista todos os itens do dicionário, inclusive Abastecimento */}
                                                    {Object.entries(linha.detalhamento).map(([tipo, valor]) => (
                                                        <div key={tipo} style={{ background: '#2d3748', padding: '8px', borderRadius: '4px', border: '1px solid #4a5568' }}>
                                                            <div style={{ fontSize: '0.75rem', color: '#a0aec0', textTransform: 'uppercase' }}>{tipo}</div>
                                                            <div style={{ color: '#8B5CF6', fontWeight: 'bold' }}>
                                                                R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#a0aec0' }}>
                                    Nenhum dado encontrado para os filtros selecionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
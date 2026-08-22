import usePersistedTab from '../hooks/usePersistedTab';
import useCan from '../hooks/useCan';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { LayoutDashboard, FileText } from 'lucide-react';
import { exportarPDFDashboardGastos } from '../utils/pdfDashboardGastos';

import FiltrosDashboardGastos from '../components/dashboards/gastos/FiltrosDashboardGastos';
import CardsResumoGastos from '../components/dashboards/gastos/CardsResumoGastos';
import GraficoEvolucaoSemanal from '../components/dashboards/gastos/GraficoEvolucaoSemanal';
import GraficoDistribuicaoCustos from '../components/dashboards/gastos/GraficoDistribuicaoCustos';
import GraficoEvolucaoAnual from '../components/dashboards/gastos/GraficoEvolucaoAnual';

export default function DashboardGastos() {
    const can = useCan();
    const [abaAtiva, setAbaAtiva] = usePersistedTab('geral', 'dashboardgastos');
    const queryClient = useQueryClient();
    const { data: veiculos = [] } = useQuery({ queryKey: ['veiculos'], queryFn: async () => (await api.get('/veiculos/')).data });
    const { data: anosDisponiveis = [] } = useQuery({ queryKey: ['anosDashboard'], queryFn: async () => (await api.get('/dashboard/anos')).data });
    const { data: tiposGasto = [] } = useQuery({ queryKey: ['tiposGasto'], queryFn: async () => (await api.get('/opcoes/tipos-gasto')).data });

    const chartSemanalRef = useRef(null);
    const chartPizzaRef = useRef(null);
    const chartAnualRef = useRef(null);

    const pdfSemanalRef = useRef(null);
    const pdfPizzaRef = useRef(null);
    const pdfAnualRef = useRef(null);

    const [gerandoPDF, setGerandoPDF] = useState(false);
    const [renderPDFCharts, setRenderPDFCharts] = useState(false);
    const [incluirSemanalPdf, setIncluirSemanalPdf] = useState(true);

    const [periodo, setPeriodo] = useState({ inicio: '', fim: '', label: 'Período Personalizado' });
    const [usarFiltroPeriodo, setUsarFiltroPeriodo] = useState(false);

    const [filtros, setFiltros] = useState({
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        veiculos_ids: [],
        tipos_gasto: []
    });


    const { data: dados, isLoading: loadingDashboard } = useQuery({
        queryKey: ['dashboardFinanceiro', filtros, periodo, usarFiltroPeriodo],
        queryFn: async () => {
            let params = {};
            if (filtros.tipos_gasto && filtros.tipos_gasto.length > 0) {
                params.tipos_gasto = filtros.tipos_gasto.map(t => t.value);
            }
            params.ano = filtros.ano;
            if (filtros.veiculos_ids && filtros.veiculos_ids.length > 0) {
                params.veiculos_ids = filtros.veiculos_ids.map(v => v.value);
            }
            if (usarFiltroPeriodo && periodo.inicio && periodo.fim) {
                params.data_inicio = periodo.inicio;
                params.data_fim = periodo.fim;
            } else {
                params.mes = filtros.mes || null;
            }
            const response = await api.get('/dashboard/gastos', {
                params,
                paramsSerializer: p => {
                    const searchParams = new URLSearchParams();
                    Object.keys(p).forEach(key => {
                        const val = p[key];
                        if (val === null || val === undefined) return;
                        if (Array.isArray(val)) {
                            val.forEach(v => searchParams.append(key, v));
                        } else {
                            searchParams.append(key, val);
                        }
                    });
                    return searchParams.toString();
                }
            });
            return response.data;
        }
    });

    const handleExportarPDF = () => {
        exportarPDFDashboardGastos({
            dados,
            filtros,
            periodo,
            usarFiltroPeriodo,
            veiculos,
            incluirSemanalPdf,
            pdfSemanalRef,
            pdfPizzaRef,
            pdfAnualRef,
            setGerandoPDF,
            setRenderPDFCharts
        });
    };

    if (loadingDashboard || !dados) return <div style={{ padding: '30px' }}>Carregando Dashboard...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <h1>Dashboard Gastos</h1>
                {can('relatorios.baixar') && ( <button onClick={handleExportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px' }} disabled={gerandoPDF}>
                    <FileText size={18} style={{ marginRight: '5px' }} /> {gerandoPDF ? 'Gerando...' : 'PDF'}
                </button> )}
            </div>

            <FiltrosDashboardGastos 
                filtros={filtros}
                setFiltros={setFiltros}
                anosDisponiveis={anosDisponiveis}
                veiculos={veiculos}
                tiposGasto={tiposGasto}
                periodo={periodo}
                setPeriodo={setPeriodo}
                usarFiltroPeriodo={usarFiltroPeriodo}
                setUsarFiltroPeriodo={setUsarFiltroPeriodo}
            />

            <CardsResumoGastos 
                cards={dados.cards} 
                anoSelecionado={filtros.ano} 
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <GraficoEvolucaoSemanal 
                    dados={dados.grafico_semanal}
                    incluirNoPdf={incluirSemanalPdf}
                    onTogglePdf={setIncluirSemanalPdf}
                    visibleRef={chartSemanalRef}
                    pdfRef={pdfSemanalRef}
                    isPdfRendering={renderPDFCharts}
                />

                <GraficoDistribuicaoCustos 
                    dados={dados.grafico_pizza}
                    visibleRef={chartPizzaRef}
                    pdfRef={pdfPizzaRef}
                    isPdfRendering={renderPDFCharts}
                />

                <GraficoEvolucaoAnual 
                    dados={dados.grafico_anual}
                    ano={filtros.ano}
                    visibleRef={chartAnualRef}
                    pdfRef={pdfAnualRef}
                    isPdfRendering={renderPDFCharts}
                />
            </div>
        </div>
    );
}
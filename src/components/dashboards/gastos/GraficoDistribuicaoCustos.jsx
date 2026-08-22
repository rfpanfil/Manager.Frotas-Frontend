import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const PDF_W = 900;
const PDF_H = 350;
const CORES_PIZZA = ['#00d68f', '#3182ce', '#f6ad55', '#e53e3e', '#805ad5', '#d69e2e'];

export default function GraficoDistribuicaoCustos({
    dados,
    visibleRef,
    pdfRef,
    isPdfRendering
}) {
    const { pizzaLimpa, itensOutros, itensPrincipais } = useMemo(() => {
        if (!dados) return { pizzaLimpa: [], itensOutros: [], itensPrincipais: [] };

        const totalPizza = dados.reduce((acc, curr) => acc + (curr.value || 0), 0);
        const _pizzaLimpa = [];
        let valorOutros = 0;
        const _itensOutros = [];
        const _itensPrincipais = [];

        const dadosOrdenados = [...dados].filter(d => d.value > 0).sort((a, b) => b.value - a.value);

        dadosOrdenados.forEach(item => {
            const percent = totalPizza > 0 ? item.value / totalPizza : 0;
            if (percent < 0.025) {
                valorOutros += item.value;
                _itensOutros.push({ ...item, percentual: percent * 100 }); 
            } else {
                _pizzaLimpa.push(item);
                _itensPrincipais.push({ ...item, percentual: percent * 100 });
            }
        });

        if (valorOutros > 0) {
            _pizzaLimpa.push({ name: 'Outros (< 2,5%)', value: valorOutros });
        }

        return { pizzaLimpa: _pizzaLimpa, itensOutros: _itensOutros, itensPrincipais: _itensPrincipais };
    }, [dados]);

    const echartsOptions = {
        animation: true,
        animationDuration: 1000,
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1a1e29',
            borderColor: '#4a5568',
            textStyle: { color: '#e2e8f0', fontWeight: 'bold' },
            formatter: function (info) {
                const valor = Number(info.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return `${info.name}<br/>R$ ${valor} (${info.percent}%)`;
            }
        },
        color: CORES_PIZZA,
        series: [
            {
                type: 'pie',
                radius: '80%',
                center: ['50%', '50%'],
                avoidLabelOverlap: true,
                label: {
                    show: true,
                    formatter: '{b}: {d}%',
                    color: '#e2e8f0',
                    fontSize: 11
                },
                labelLine: {
                    show: true,
                    length: 15,
                    length2: 25,
                    smooth: true,
                    lineStyle: { color: '#a0aec0' }
                },
                data: pizzaLimpa
            }
        ]
    };

    const echartsOptionsPDF = {
        ...echartsOptions,
        animation: false
    };

    return (
        <>
            {/* GRÁFICO OFFSCREEN (Invisível para o PDF) */}
            {isPdfRendering && (
                <div style={{ position: 'fixed', left: -10000, top: 0 }}>
                    <div ref={pdfRef} style={{ width: PDF_W, height: PDF_H, background: '#1a202c', padding: 20, display: 'flex', alignItems: 'center' }}>
                        
                        <div style={{ width: 550, height: PDF_H }}>
                            <ReactECharts 
                                option={echartsOptionsPDF} 
                                style={{ height: PDF_H, width: 550 }} 
                                opts={{ renderer: 'canvas' }} 
                            />
                        </div>
                        
                        <div style={{ width: 310, marginLeft: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h4 style={{ fontSize: '14px', color: '#3182ce', marginBottom: '10px', marginTop: 0, borderBottom: '1px solid #2d3748', paddingBottom: '8px' }}>
                                    Principais Gastos
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {itensPrincipais.map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px', color: '#a0aec0', fontSize: '11px' }}>
                                            {item.name} - <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> - <span style={{ color: '#3182ce' }}>{item.percentual.toFixed(1).replace('.0', '')}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {itensOutros.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '14px', color: '#00d68f', marginBottom: '10px', marginTop: 0, borderBottom: '1px solid #2d3748', paddingBottom: '8px' }}>
                                        Detalhamento "Outros"
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {itensOutros.map((item, idx) => (
                                            <li key={idx} style={{ marginBottom: '8px', color: '#a0aec0', fontSize: '11px' }}>
                                                {item.name} - <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> - <span style={{ color: '#f6ad55' }}>{item.percentual.toFixed(1).replace('.0', '')}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                    </div>
                </div>
            )}

            {/* GRÁFICO VISÍVEL */}
            <div className="chart-section" ref={visibleRef}>
                <h3>Distribuição de Custos</h3>
                <div style={{ display: 'flex', width: '100%', height: 300, alignItems: 'center' }}>
                    
                    {pizzaLimpa.length > 0 ? (
                        <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
                            <ReactECharts 
                                option={echartsOptions} 
                                style={{ height: '300px', width: '100%' }} 
                                opts={{ renderer: 'canvas' }} 
                            />
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#a0aec0', height: '100%' }}>
                            Sem lançamentos registrados no período.
                        </div>
                    )}

                    {itensOutros.length > 0 && (
                        <div style={{ width: '300px', height: '100%', overflowY: 'auto', background: '#1a202c', padding: '10px', borderRadius: '8px', border: '1px solid #2d3748', marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ fontSize: '0.85rem', color: '#00d68f', marginBottom: '10px', marginTop: 0, borderBottom: '1px solid #2d3748', paddingBottom: '8px', textAlign: 'center' }}>
                                Detalhamento "Outros"
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
                                {itensOutros.map((item, idx) => (
                                    <li key={idx} style={{ marginBottom: '8px', borderBottom: '1px dashed #2d3748', paddingBottom: '6px', color: '#a0aec0', fontSize: '0.85rem' }}>
                                        {item.name} - <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> - <span style={{ color: '#f6ad55' }}>{item.percentual.toFixed(1).replace('.0', '')}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}

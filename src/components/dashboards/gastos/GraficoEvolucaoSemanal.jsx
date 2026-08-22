import React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PDF_W = 900;
const PDF_H = 350;

export default function GraficoEvolucaoSemanal({
    dados,
    incluirNoPdf,
    onTogglePdf,
    visibleRef,
    pdfRef,
    isPdfRendering
}) {
    return (
        <>
            {/* GRÁFICO OFFSCREEN (Invisível para o PDF) */}
            {isPdfRendering && (
                <div style={{ position: 'fixed', left: -10000, top: 0 }}>
                    <div ref={pdfRef} style={{ width: PDF_W, height: PDF_H, background: '#1a202c', padding: 20 }}>
                        <AreaChart width={PDF_W} height={PDF_H} data={dados || []}>
                            <defs>
                                <linearGradient id="pdfColorValor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="dia" stroke="#a0aec0" />
                            <YAxis stroke="#a0aec0" />
                            <Area type="monotone" dataKey="valor" stroke="#8B5CF6" fillOpacity={1} fill="url(#pdfColorValor)" isAnimationActive={false} />
                        </AreaChart>
                    </div>
                </div>
            )}

            {/* GRÁFICO VISÍVEL */}
            <div className="chart-section" ref={visibleRef}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Últimos 7 Dias</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0aec0', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={incluirNoPdf} 
                            onChange={(e) => onTogglePdf(e.target.checked)} 
                            style={{ cursor: 'pointer' }}
                        />
                        Incluir no PDF
                    </label>
                </div>
                <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={dados || []}>
                            <defs>
                                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="dia" stroke="#a0aec0" />
                            <YAxis stroke="#a0aec0" />
                            <Tooltip 
                                formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                cursor={{ fill: 'transparent' }} 
                                contentStyle={{ backgroundColor: '#1a1e29', border: '1px solid #333', color: '#e2e8f0' }} 
                                itemStyle={{ color: '#8B5CF6', fontWeight: 'bold' }} 
                            />
                            <Area type="monotone" dataKey="valor" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorValor)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}

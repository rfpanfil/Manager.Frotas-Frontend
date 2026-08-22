import React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const PDF_W = 900;
const PDF_H = 350;

export default function GraficoEvolucaoAnual({
    dados,
    ano,
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
                        <BarChart width={PDF_W} height={PDF_H} data={dados || []} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="nome" stroke="#a0aec0" />
                            <YAxis stroke="#a0aec0" />
                            <Bar dataKey="total" fill="#3182ce" barSize={40} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                <LabelList 
                                    dataKey="total" 
                                    position="top" 
                                    fill="#8B5CF6" 
                                    fontSize={12} 
                                    fontWeight="bold"
                                    formatter={(val) => val > 0 ? `R$ ${val.toFixed(2)}` : ''} 
                                />
                            </Bar>
                        </BarChart>
                    </div>
                </div>
            )}

            {/* GRÁFICO VISÍVEL */}
            <div className="chart-section" ref={visibleRef} style={{ gridColumn: '1 / -1' }}>
                <h3>Evolução em {ano}</h3>
                <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={dados || []} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="nome" stroke="#a0aec0" />
                            <YAxis stroke="#a0aec0" />
                            <Tooltip 
                                formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                contentStyle={{ backgroundColor: '#1a1e29', border: '1px solid #333', color: '#e2e8f0' }} 
                                itemStyle={{ color: '#3182ce', fontWeight: 'bold' }} 
                            />
                            
                            <Bar dataKey="total" fill="#3182ce" barSize={40} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                <LabelList 
                                    dataKey="total" 
                                    position="top" 
                                    fill="#8B5CF6" 
                                    fontSize={12} 
                                    fontWeight="bold"
                                    formatter={(val) => val > 0 ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}

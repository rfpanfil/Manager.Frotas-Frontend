import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import CarroEixosVisual from './CarroEixosVisual';

export default function TabelaVeiculosPneus({
    veiculosFiltrados,
    expandedVeiculo,
    setExpandedVeiculo,
    calcularStatusPneu,
    can,
    setVeiculoMontagem,
    setPosicaoAlvo,
    setBuscaPopover,
    setPopoverAberto,
    abrirModalEdicao,
    handleDesmontar
}) {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Veículo (Placa - Modelo)</th>
                        <th>Status dos Pneus</th>
                    </tr>
                </thead>
                <tbody>
                    {veiculosFiltrados.map(v => (
                        <React.Fragment key={v.id}>
                            <tr onClick={() => setExpandedVeiculo(expandedVeiculo === v.id ? null : v.id)} style={{ cursor: 'pointer', background: expandedVeiculo === v.id ? '#2d3748' : 'transparent' }}>
                                <td style={{ fontWeight: 'bold', color: 'white' }}>{v.placa} - {v.modelo}</td>
                                <td>
                                    {v.statusFarol === 'vazio' && <span style={{ color: '#a0aec0' }}>Sem pneus montados</span>}
                                    {v.statusFarol === 'verde' && <span style={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={14} /> Todos os {v.pneusMontados.length} pneus OK</span>}
                                    {v.statusFarol === 'amarelo' && <span style={{ color: '#ecc94b', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={14} /> {v.contagens.amarelo} pneu(s) próximo(s) do vencimento</span>}
                                    {v.statusFarol === 'vermelho' && <span style={{ color: '#e53e3e', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={14} /> {v.contagens.vermelho} pneu(s) com vida útil vencida!</span>}
                                </td>
                            </tr>

                            {/* LINHA EXPANDIDA: VISUAL E LISTAGEM */}
                            {expandedVeiculo === v.id && (
                                <tr>
                                    <td colSpan="2" style={{ background: '#1a202c', padding: 20 }}>
                                        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>

                                            {/* DESENHO DO CARRO */}
                                            <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, minWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: 15 }}>Clique no espaço vazio para montar</div>
                                                
                                                <CarroEixosVisual 
                                                    veiculoReferencia={v}
                                                    can={can}
                                                    setVeiculoMontagem={setVeiculoMontagem}
                                                    setPosicaoAlvo={setPosicaoAlvo}
                                                    setBuscaPopover={setBuscaPopover}
                                                    setPopoverAberto={setPopoverAberto}
                                                    abrirModalEdicao={abrirModalEdicao}
                                                    handleDesmontar={handleDesmontar}
                                                />
                                                
                                            </div>

                                            {/* LISTA DE PNEUS INSTALADOS */}
                                            <div style={{ flex: 1, minWidth: 400 }}>
                                                <h4 style={{ color: '#a0aec0', marginTop: 0 }}>Pneus Montados Detalhados ({v.pneusMontados.length})</h4>
                                                {v.pneusMontados.length === 0 ? <p style={{ color: '#718096' }}>Nenhum pneu montado neste veículo.</p> : (
                                                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                                        <thead>
                                                            <tr style={{ color: '#a0aec0', textAlign: 'left', borderBottom: '1px solid #4a5568' }}>
                                                                <th style={{ paddingBottom: 8 }}>Posição</th><th style={{ paddingBottom: 8 }}>DOT/Fogo</th><th style={{ paddingBottom: 8 }}>Marca/Medida</th><th style={{ paddingBottom: 8 }}>Km Faltante</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {v.pneusMontados.map(p => {
                                                                const statusCalc = calcularStatusPneu(p, v.km_atual);
                                                                return (
                                                                    <tr key={p.id} style={{ borderBottom: '1px solid #2d3748' }}>
                                                                        <td style={{ padding: '8px 0' }}>{p.posicao}</td>
                                                                        <td style={{ fontWeight: 'bold' }}>{p.dot || p.fogo}</td>
                                                                        <td>{p.marca} {p.medida}</td>
                                                                        <td style={{ color: statusCalc.cor, fontWeight: 'bold' }}>
                                                                            {statusCalc.kmFaltante ? `${statusCalc.kmFaltante.toLocaleString()} km` : statusCalc.msg}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
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

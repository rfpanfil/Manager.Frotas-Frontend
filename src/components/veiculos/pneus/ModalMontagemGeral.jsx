import React from 'react';
import { X } from 'lucide-react';
import Select from 'react-select';
import { customSelectStyles } from '../../../utils/pneusUtils';
import CarroEixosVisual from './CarroEixosVisual';

export default function ModalMontagemGeral({
    modalMontagem,
    setModalMontagem,
    veiculosProcessados,
    veiculoMontagem,
    setVeiculoMontagem,
    kmMontagemGlobal,
    setKmMontagemGlobal,
    can,
    setPosicaoAlvo,
    setBuscaPopover,
    setPopoverAberto,
    abrirModalEdicao,
    handleDesmontar
}) {
    if (!modalMontagem) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1000, overflowY: 'auto' }}>
            <div className="modal-content" style={{ width: '800px', minHeight: '500px', background: '#1a202c', overflow: 'visible' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3>Nova Montagem Geral</h3>
                    <button onClick={() => setModalMontagem(false)} className="btn-close-modal"><X /></button>
                </div>

                <div style={{ position: 'relative', zIndex: 9999 }}>
                    <Select
                        styles={customSelectStyles}
                        options={veiculosProcessados.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))}
                        onChange={sel => setVeiculoMontagem(veiculosProcessados.find(v => v.id === sel?.value))}
                        placeholder="Selecione o Veículo primeiro..."
                    />
                </div>

                {veiculoMontagem && (
                    <div style={{ marginTop: 20, padding: 30, background: '#2d3748', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

                        {/* PASSO 2: Inserir a kilometragem global da montagem */}
                        <div style={{ marginBottom: 20, width: '100%', textAlign: 'center', background: '#1a202c', padding: '15px', borderRadius: '8px', border: '1px solid #4a5568' }}>
                            <label style={{ color: '#00d68f', fontWeight: 'bold', display: 'block', marginBottom: 5 }}>KM do Veículo no Momento da Montagem (Histórico)</label>
                            <input
                                type="number"
                                placeholder="Ex: 150000"
                                value={kmMontagemGlobal}
                                onChange={e => setKmMontagemGlobal(e.target.value)}
                                style={{ width: '200px', padding: '10px', textAlign: 'center', borderRadius: '5px', border: '1px solid #00d68f', background: '#2d3748', color: 'white', fontSize: '1.1rem' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: 5 }}>Este KM será usado apenas para o rastreio da vida do pneu (não atualiza o KM do painel do veículo).</p>
                        </div>

                        <p style={{ color: '#a0aec0', marginBottom: 20, fontSize: '1.1rem' }}>Clique em um espaço vazio para montar ou no pneu para editar:</p>

                        <CarroEixosVisual 
                            veiculoReferencia={veiculoMontagem}
                            can={can}
                            setVeiculoMontagem={setVeiculoMontagem}
                            setPosicaoAlvo={setPosicaoAlvo}
                            setBuscaPopover={setBuscaPopover}
                            setPopoverAberto={setPopoverAberto}
                            abrirModalEdicao={abrirModalEdicao}
                            handleDesmontar={handleDesmontar}
                        />

                        {/* Botão Estético para Finalizar */}
                        <div style={{ width: '100%', marginTop: 30, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #4a5568', paddingTop: 20 }}>
                            <button onClick={() => { setModalMontagem(false); setKmMontagemGlobal(''); }} className="btn-add" style={{ background: '#3182ce', color: 'white' }}>
                                Finalizar Montagem Geral
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

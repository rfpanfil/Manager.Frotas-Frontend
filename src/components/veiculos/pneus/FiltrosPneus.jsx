import React from 'react';
import { Search, Truck } from 'lucide-react';

export default function FiltrosPneus({
    buscaVeiculo,
    setBuscaVeiculo,
    filtroStatusVeiculo,
    setFiltroStatusVeiculo,
    setVeiculoMontagem,
    setModalMontagem,
    can
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 15 }}>
            <div style={{ display: 'flex', gap: 15, flex: 1, minWidth: '300px' }}>
                <div style={{ background: '#2d3748', padding: '8px 15px', borderRadius: 5, display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                    <input 
                        placeholder="Buscar veículo (Placa/Modelo)..." 
                        value={buscaVeiculo} 
                        onChange={e => setBuscaVeiculo(e.target.value)} 
                        style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} 
                    />
                </div>
                <select
                    value={filtroStatusVeiculo}
                    onChange={e => setFiltroStatusVeiculo(e.target.value)}
                    style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '0 15px', borderRadius: 5, outline: 'none' }}
                >
                    <option value="">Todos os Status</option>
                    <option value="vermelho">Crítico (Vida Útil Vencida)</option>
                    <option value="amarelo">Atenção (Próximo de Vencer)</option>
                    <option value="verde">OK (Pneus em Dia)</option>
                    <option value="vazio">Sem Pneus Montados</option>
                </select>
            </div>
            {can('pneus.movimentar') && (
                <button onClick={() => { setVeiculoMontagem(null); setModalMontagem(true); }} className="btn-add" style={{ background: '#00d68f', color: 'black', fontWeight: 'bold' }}>
                    <Truck size={18} style={{ marginRight: 5 }} /> Nova Montagem
                </button>
            )}
        </div>
    );
}

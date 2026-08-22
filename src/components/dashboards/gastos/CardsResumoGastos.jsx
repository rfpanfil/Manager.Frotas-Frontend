import React from 'react';

function safeNumber(v) { return Number(v) || 0; }

export default function CardsResumoGastos({ cards, anoSelecionado }) {
    if (!cards) return null;

    return (
        <div className="dashboard-grid">
            <div className="card">
                <div className="card-header"><span>Gasto Hoje</span></div>
                <div className="card-value">
                    R$ {safeNumber(cards.hoje).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
            <div className="card">
                <div className="card-header"><span>Em {cards.mes_referencia}</span></div>
                <div className="card-value">
                    R$ {safeNumber(cards.mes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
            <div className="card">
                <div className="card-header"><span>Total {anoSelecionado}</span></div>
                <div className="card-value">
                    R$ {safeNumber(cards.ano).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>
        </div>
    );
}

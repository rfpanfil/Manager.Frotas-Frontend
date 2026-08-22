import React from 'react';
import { X } from 'lucide-react';
import { getSigla } from '../../../utils/pneusUtils';

const SvgCarro = () => (
    <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 95, height: 210, zIndex: 1, pointerEvents: 'none' }}>
        <svg viewBox="0 0 100 220" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 5px 10px rgba(0,0,0,0.5))' }}>
            {/* Retrovisores */}
            <path d="M 12 80 L 2 82 L 2 95 L 15 92 Z" fill="#1a202c" />
            <path d="M 88 80 L 98 82 L 98 95 L 85 92 Z" fill="#1a202c" />

            {/* Corpo do Carro (Aerodinâmico) */}
            <rect x="12" y="10" width="76" height="200" rx="22" fill="#313b4d" stroke="#1a202c" strokeWidth="2" />

            {/* Capô Frontal */}
            <path d="M 14 55 Q 50 40 86 55 L 84 25 Q 50 5 16 25 Z" fill="#3b4456" />

            {/* Para-brisa Dianteiro (Curvado) */}
            <path d="M 22 75 Q 50 60 78 75 L 72 105 Q 50 100 28 105 Z" fill="#11151c" stroke="#1a202c" strokeWidth="2" />

            {/* Teto do Carro */}
            <rect x="28" y="105" width="44" height="45" fill="#4a5568" />

            {/* Para-brisa Traseiro */}
            <path d="M 28 150 Q 50 155 72 150 L 78 175 Q 50 185 22 175 Z" fill="#11151c" stroke="#1a202c" strokeWidth="2" />

            {/* Faróis Dianteiros */}
            <rect x="20" y="12" width="14" height="6" rx="3" fill="#f6e05e" opacity="0.9" />
            <rect x="66" y="12" width="14" height="6" rx="3" fill="#f6e05e" opacity="0.9" />

            {/* Lanternas Traseiras */}
            <rect x="20" y="202" width="16" height="5" rx="2" fill="#e53e3e" opacity="0.9" />
            <rect x="64" y="202" width="16" height="5" rx="2" fill="#e53e3e" opacity="0.9" />

            {/* Vidros Laterais Escuros */}
            <path d="M 20 80 Q 24 110 24 140 L 28 140 L 28 80 Z" fill="#11151c" />
            <path d="M 80 80 Q 76 110 76 140 L 72 140 L 72 80 Z" fill="#11151c" />
        </svg>
    </div>
);

const RenderPosicao = ({ posicao, label, veiculoReferencia, can, setVeiculoMontagem, setPosicaoAlvo, setBuscaPopover, setPopoverAberto, abrirModalEdicao, handleDesmontar }) => {
    const pneu = veiculoReferencia?.pneusMontados?.find(p => p.posicao === posicao);
    return (
        <div
            onClick={() => {
                if (!pneu && veiculoReferencia) {
                    setVeiculoMontagem(veiculoReferencia);
                    setPosicaoAlvo(posicao);
                    setBuscaPopover('');
                    setPopoverAberto(true);
                } else if (pneu && can('pneus.gerenciar')) {
                    abrirModalEdicao(pneu);
                }
            }}
            style={{
                position: 'relative', width: 60, height: 80, border: '2px dashed #4a5568', borderRadius: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 5,
                background: pneu ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.2)', borderColor: pneu ? '#8B5CF6' : '#4a5568',
                cursor: (!pneu && veiculoReferencia) ? 'pointer' : 'default', transition: '0.2s'
            }}
            title={pneu ? `Montado: ${pneu.dot || pneu.fogo}` : "Clique para montar pneu nesta posição"}
        >
            {pneu && can('pneus.movimentar') && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleDesmontar(pneu); }}
                    title="Desmontar Pneu"
                    style={{ position: 'absolute', top: -8, right: -8, background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                    <X size={14} />
                </button>
            )}

            {pneu ? (
                <>
                    <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-all', padding: '0 2px' }}>
                        {pneu.dot || pneu.fogo}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: '#8B5CF6', marginTop: 2 }}>{pneu.medida}</span>
                </>
            ) : (
                <>
                    <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 'bold' }}>{getSigla(posicao)}</span>
                    <span style={{ fontSize: '0.5rem', color: '#718096', marginTop: 2 }}>Vazio</span>
                </>
            )}
        </div>
    );
};

export default function CarroEixosVisual({
    veiculoReferencia,
    can,
    setVeiculoMontagem,
    setPosicaoAlvo,
    setBuscaPopover,
    setPopoverAberto,
    abrirModalEdicao,
    handleDesmontar
}) {
    const propsParaPosicao = { veiculoReferencia, can, setVeiculoMontagem, setPosicaoAlvo, setBuscaPopover, setPopoverAberto, abrirModalEdicao, handleDesmontar };
    
    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10 }}>
            {/* Eixo Dianteiro */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 120, width: '100%', position: 'relative', zIndex: 2 }}>
                <RenderPosicao posicao="DIANT_ESQ" label="Diant. Esq" {...propsParaPosicao} />
                <RenderPosicao posicao="DIANT_DIR" label="Diant. Dir" {...propsParaPosicao} />
            </div>

            {/* SVG do Carro Realista */}
            <SvgCarro />

            {/* Eixo Traseiro */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 120, width: '100%', marginTop: 30, position: 'relative', zIndex: 2 }}>
                <RenderPosicao posicao="TRAC_ESQ_EXT" label="Tras. Esq" {...propsParaPosicao} />
                <RenderPosicao posicao="TRAC_DIR_EXT" label="Tras. Dir" {...propsParaPosicao} />
            </div>
            
            {/* Estepes */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, width: '100%', marginTop: 40, paddingTop: 20, borderTop: '2px dashed #4a5568' }}>
                <RenderPosicao posicao="ESTEPE_1" label="Estepe 1" {...propsParaPosicao} />
                <RenderPosicao posicao="ESTEPE_2" label="Estepe 2" {...propsParaPosicao} />
            </div>
        </div>
    );
}

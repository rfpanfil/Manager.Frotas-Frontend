import usePersistedTab from '../hooks/usePersistedTab';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardCheck, ShoppingCart, Truck, FileText } from 'lucide-react';
import TabSolicitacoes from './compras/TabSolicitacoes';
import TabFornecedores from './compras/TabFornecedores';
import TabOrcamentos from './compras/TabOrcamentos';
import TabOrdensCompra from './compras/TabOrdensCompra';

export default function Compras() {
    const { can } = useAuth();
    const [abaAtiva, setAbaAtiva] = usePersistedTab(null, 'compras');
    const [scPreSelecionada, setScPreSelecionada] = useState(null);

    // --- NOVA PONTE PARA OC ---
    const [orcAprovado, setOrcAprovado] = useState(null);

    useEffect(() => {
        if (!abaAtiva) {
            if (can('compras.sc.ver')) setAbaAtiva('sc');
            else if (can('compras.orcamentos.ver')) setAbaAtiva('orcamentos');
            else if (can('compras.oc.ver')) setAbaAtiva('oc');
            else if (can('compras.fornecedores.ver')) setAbaAtiva('fornecedores');
        }
    }, [can, abaAtiva]);

    const estiloBotao = (ativo) => ({
        background: ativo ? '#8B5CF6' : 'transparent',
        color: ativo ? 'black' : '#a0aec0',
        border: '1px solid #8B5CF6',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap'
    });

    if (!abaAtiva) return <div style={{ padding: 20, color: 'white' }}>Carregando acesso ou sem permissão...</div>;

    return (
        <div>
            <h1>Módulo de Compras</h1>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {can('compras.sc.ver') && (
                    <button onClick={() => setAbaAtiva('sc')} style={estiloBotao(abaAtiva === 'sc')}>
                        <ClipboardCheck size={18} /> Solicitações (SC)
                    </button>
                )}
                {can('compras.orcamentos.ver') && (
                    <button onClick={() => setAbaAtiva('orcamentos')} style={estiloBotao(abaAtiva === 'orcamentos')}>
                        <FileText size={18} /> Orçamentos
                    </button>
                )}
                {can('compras.oc.ver') && (
                    <button onClick={() => setAbaAtiva('oc')} style={estiloBotao(abaAtiva === 'oc')}>
                        <ShoppingCart size={18} /> Ordens de Compra
                    </button>
                )}
                {can('compras.fornecedores.ver') && (
                    <button onClick={() => setAbaAtiva('fornecedores')} style={estiloBotao(abaAtiva === 'fornecedores')}>
                        <Truck size={18} /> Fornecedores
                    </button>
                )}
            </div>

            <div className="tab-content" style={{ background: '#242936', padding: 20, borderRadius: 8, minHeight: '60vh' }}>
                {abaAtiva === 'sc' && (
                    <TabSolicitacoes
                        onCriarOrcamento={(id) => {
                            setScPreSelecionada(id);
                            setAbaAtiva('orcamentos');
                        }}
                    />
                )}
                {abaAtiva === 'orcamentos' && (
                    <TabOrcamentos
                        scPreSelecionada={scPreSelecionada}
                        clearScPreSelecionada={() => setScPreSelecionada(null)}
                        onAprovar={(dados) => {
                            setOrcAprovado(dados);
                            setAbaAtiva('oc');
                        }}
                    />
                )}
                {abaAtiva === 'oc' && (
                    <TabOrdensCompra
                        orcAprovado={orcAprovado}
                        clearOrcAprovado={() => setOrcAprovado(null)}
                    />
                )}
                {abaAtiva === 'fornecedores' && <TabFornecedores />}
            </div>
        </div>
    );
}
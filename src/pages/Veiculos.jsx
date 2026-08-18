// Arquivo: frontend/src/pages/Veiculos.jsx
import React, { useState, useEffect } from 'react';
import { Truck, ClipboardCheck, Wrench, Disc } from 'lucide-react';
// IMPORTAR O USEAUTH PARA VERIFICAR PERMISSÕES
import { useAuth } from '../contexts/AuthContext';

import TabFrota from './veiculos/TabFrota';
import TabRevisoes from './veiculos/TabRevisoes';
import TabChecklist from './veiculos/TabChecklist';
import TabPneus from './veiculos/TabPneus';

export default function VeiculosPage() {
    const { can, user } = useAuth(); // Hook de permissão
    const [abaAtiva, setAbaAtiva] = useState('frota');

    // Efeito para garantir que se o usuário não pode ver 'frota', ele vá para a primeira aba permitida
    useEffect(() => {
        // Lógica dinâmica para TODOS os cargos, baseada APENAS nas permissões
        if (abaAtiva === 'frota' && !can('veiculos.ver')) {
            if (can('checklist.realizar') || can('checklist.ver')) setAbaAtiva('checklist');
            else if (can('revisoes.ver')) setAbaAtiva('revisoes');
            else if (can('pneus.ver')) setAbaAtiva('pneus');
        }
    }, [can, abaAtiva]);

    const estiloBotao = (ativo) => ({
        padding: '10px 20px',
        border: 'none',
        background: 'transparent',
        color: ativo ? '#00d68f' : '#a0aec0',
        borderBottom: ativo ? '2px solid #00d68f' : '2px solid transparent',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '1rem',
        transition: 'all 0.2s'
    });

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={28} /> Gestão da Frota
            </h1>

            {/* NAVEGAÇÃO DE ABAS COM PROTEÇÃO */}
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #4a5568', marginBottom: 20, overflowX: 'auto' }}>

                {can('veiculos.ver') && (
                    <button onClick={() => setAbaAtiva('frota')} style={estiloBotao(abaAtiva === 'frota')}>
                        <Truck size={18} /> Veículos
                    </button>
                )}

                {can('revisoes.ver') && (
                    <button onClick={() => setAbaAtiva('revisoes')} style={estiloBotao(abaAtiva === 'revisoes')}>
                        <Wrench size={18} /> Revisões
                    </button>
                )}

                {(can('checklist.ver') || can('checklist.realizar')) && (
                    <button onClick={() => setAbaAtiva('checklist')} style={estiloBotao(abaAtiva === 'checklist')}>
                        <ClipboardCheck size={18} /> Checklist
                    </button>
                )}

                {can('pneus.ver') && (
                    <button onClick={() => setAbaAtiva('pneus')} style={estiloBotao(abaAtiva === 'pneus')}>
                        <Disc size={18} /> Gestão de Pneus
                    </button>
                )}
            </div>

            <div className="tab-content">
                {abaAtiva === 'frota' && can('veiculos.ver') && <TabFrota />}
                {abaAtiva === 'revisoes' && can('revisoes.ver') && <TabRevisoes />}
                {abaAtiva === 'checklist' && (can('checklist.ver') || can('checklist.realizar')) && <TabChecklist />}
                {abaAtiva === 'pneus' && can('pneus.ver') && <TabPneus />}
            </div>
        </div>
    );
}
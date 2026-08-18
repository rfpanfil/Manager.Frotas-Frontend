// Arquivo: frontend/src/pages/Colaboradores.jsx
import React, { useState } from 'react';
import { Users, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import TabEquipe from './colaboradores/TabEquipe';
import TabChecklistColab from './colaboradores/TabChecklistColab';

export default function ColaboradoresPage() {
    const { can } = useAuth();
    const [abaAtiva, setAbaAtiva] = useState('equipe');

    // --- ESTILO DE ABA IDENTICO AO VEICULOS.JSX ---
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
            {/* TÍTULO NO TOPO (IGUAL VEÍCULOS) */}
            <h1 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={28} /> Colaboradores
            </h1>

            {/* BARRA DE ABAS SUBLINHADA (IGUAL VEÍCULOS) */}
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #4a5568', marginBottom: 20, overflowX: 'auto' }}>
                <button onClick={() => setAbaAtiva('equipe')} style={estiloBotao(abaAtiva === 'equipe')}>
                    <Users size={18} /> Equipe
                </button>

                {(can('checklist_colab.ver') || can('checklist_colab.realizar') || can('checklist_colab.gerenciar')) && (
                    <button onClick={() => setAbaAtiva('checklist')} style={estiloBotao(abaAtiva === 'checklist')}>
                        <ClipboardCheck size={18} /> Checklist Operacional
                    </button>
                )}
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="tab-content">
                {abaAtiva === 'equipe' && <TabEquipe />}
                {abaAtiva === 'checklist' && <TabChecklistColab />}
            </div>
        </div>
    );
}
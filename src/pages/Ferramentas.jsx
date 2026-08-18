// Arquivo: frontend/src/pages/Ferramentas.jsx
import React from 'react';
import TabEstoque from './ferramentas/TabEstoque';
import { Box } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // <--- Importado

export default function Ferramentas() {
    const { can } = useAuth(); // <--- Hook

    if (!can('estoque.ver')) {
        return <div style={{ padding: 20, color: 'white' }}>Você não tem permissão para acessar o Estoque.</div>;
    }

    return (
        <div>
            <h1><Box style={{ marginRight: 10 }} /> Estoque</h1>
            <div style={{ marginTop: 20, background: '#1a202c', padding: 20, borderRadius: 8 }}>
                <TabEstoque />
            </div>
        </div>
    );
}
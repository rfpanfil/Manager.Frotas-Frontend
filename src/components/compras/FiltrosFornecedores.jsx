import React from 'react';
import useCan from '../../hooks/useCan';
import { Search, FileDown, Plus } from 'lucide-react';

export default function FiltrosFornecedores({
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    baixarListaPDF,
    abrirModalNovo,
    can
}) {
    return (
        <div className="filter-bar" style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568', width: '400px' }}>
                    <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                    <input 
                        value={busca} 
                        onChange={e => setBusca(e.target.value)} 
                        placeholder="Filtrar por nome, CNPJ ou tipo..." 
                        style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, minWidth: '150px' }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {can('compras.baixar') && ( <button onClick={baixarListaPDF} className="btn-add" style={{ background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FileDown size={16} /> Baixar PDF
                    </button> )}
                    {can('compras.fornecedores.criar') && (
                        <button className="btn-add" 
                            onClick={abrirModalNovo} 
                            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Plus size={16} /> Novo Fornecedor
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setFiltroStatus('')} style={{ padding: '5px 15px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: filtroStatus === '' ? '#8B5CF6' : '#1a202c', color: filtroStatus === '' ? '#000' : '#a0aec0' }}>Todos</button>
                <button onClick={() => setFiltroStatus('Ativo')} style={{ padding: '5px 15px', borderRadius: 20, border: '1px solid #4a5568', cursor: 'pointer', background: filtroStatus === 'Ativo' ? '#63b3ed' : 'transparent', color: filtroStatus === 'Ativo' ? '#000' : '#a0aec0' }}>Ativos</button>
                <button onClick={() => setFiltroStatus('Inativo')} style={{ padding: '5px 15px', borderRadius: 20, border: '1px solid #4a5568', cursor: 'pointer', background: filtroStatus === 'Inativo' ? '#e53e3e' : 'transparent', color: filtroStatus === 'Inativo' ? '#fff' : '#a0aec0' }}>Inativos</button>
            </div>
        </div>
    );
}

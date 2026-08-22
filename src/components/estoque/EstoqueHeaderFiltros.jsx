// Arquivo: frontend/src/components/estoque/EstoqueHeaderFiltros.jsx
import React from 'react';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';

/**
 * Barra de busca, filtros de categoria/tipo e botões de ação.
 * Componente presentacional puro — sem estado interno.
 */
export default function EstoqueHeaderFiltros({
    busca, setBusca, filtroCategoria, setFiltroCategoria,
    filtroControle, setFiltroControle, categoriasDisponiveis,
    onExportarPDF, onAbrirEntrada, onAbrirSaida, onNovoModelo, can
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', gap: 15, flex: 1, minWidth: '300px' }}>
                <div className="search-box" style={{ display: 'flex', alignItems: 'center', background: '#2d3748', padding: '8px 15px', borderRadius: 5, flex: 1 }}>
                    <Search size={16} color="#a0aec0" style={{ marginRight: 5 }} />
                    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, código, categoria..." style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
                </div>

                <select
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value)}
                    style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '0 15px', borderRadius: 5, outline: 'none' }}
                >
                    <option value="">Todas as Categorias</option>
                    {categoriasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    value={filtroControle}
                    onChange={e => setFiltroControle(e.target.value)}
                    style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '0 15px', borderRadius: 5, outline: 'none' }}
                >
                    <option value="">Todos os Tipos</option>
                    <option value="QUANTIDADE">Quantidade / Volume</option>
                    <option value="SERIALIZADO">Unitário / Serializado</option>
                </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onExportarPDF} className="btn-add" style={{ background: '#e53e3e', border: 'none', color: 'white', padding: '0 15px' }} title="Baixar Relatório">
                    <FileText size={16} style={{ marginRight: 5 }} /> PDF
                </button>

                {can('estoque.movimentar') && (
                    <>
                        <button className="btn-add" style={{ background: '#2d3748', border: '1px solid #48bb78', color: '#48bb78' }} onClick={onAbrirEntrada}>
                            <ArrowUpCircle size={16} /> Entrada
                        </button>
                        <button className="btn-add" style={{ background: '#2d3748', border: '1px solid #e53e3e', color: '#e53e3e' }} onClick={onAbrirSaida}>
                            <ArrowDownCircle size={16} /> Saída
                        </button>
                    </>
                )}
                {can('estoque.cadastrar') && (
                    <button className="btn-add" onClick={onNovoModelo}>
                        <Plus size={16} /> Novo Modelo de Item
                    </button>
                )}
            </div>
        </div>
    );
}

import { Calendar, Search, FileDown, Plus } from 'lucide-react';
import useCan from '../../hooks/useCan';

export default function FiltrosOrcamentos({
    busca,
    setBusca,
    filtroData,
    setFiltroData,
    filtroStatus,
    setFiltroStatus,
    statusList,
    baixarListaPDF,
    can,
    abrirModalNovaCotacao
}) {
    return (
        <div className="filter-bar" style={{ background: '#2d3748', padding: 15, borderRadius: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'center', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}>
                    <Calendar size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                    <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, minWidth: '150px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#1a202c', padding: '5px 10px', borderRadius: 5, border: '1px solid #4a5568' }}>
                    <Search size={18} color="#a0aec0" style={{ marginRight: 10 }} />
                    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filtrar por Nº SC, Local..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, minWidth: '150px' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {can('compras.baixar') && ( <button onClick={baixarListaPDF} className="btn-add" style={{  background: 'transparent', border: '1px solid #63b3ed', color: '#63b3ed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <FileDown size={16} /> Baixar PDF
                    </button> )}
                    {can('compras.orcamentos.criar') && (
                        <button onClick={abrirModalNovaCotacao} className="btn-add" style={{  background: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <Plus size={18} /> Registrar Cotações (Múltiplas)
                        </button>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 5 }}>
                <button onClick={() => setFiltroStatus('')} style={{ padding: '5px 15px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 'bold', background: filtroStatus === '' ? '#8B5CF6' : '#1a202c', color: filtroStatus === '' ? '#000' : '#a0aec0', whiteSpace: 'nowrap' }}>
                    Todos
                </button>
                {statusList.map(s => (
                    <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: '5px 15px', borderRadius: 20, border: '1px solid #4a5568', cursor: 'pointer', background: filtroStatus === s ? '#63b3ed' : 'transparent', color: filtroStatus === s ? '#000' : '#a0aec0', whiteSpace: 'nowrap' }}>
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}

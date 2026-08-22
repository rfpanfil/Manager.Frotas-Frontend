import React, { useState } from 'react';
import useCan from '../../hooks/useCan';
import { Search, Filter, Settings, FileText, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GastosHeaderFiltros({
    busca, setBusca,
    tipoFiltro, setTipoFiltro, tiposGasto,
    limite, handleMudarLimite,
    periodo, setPeriodo,
    usarFiltroPeriodo, setUsarFiltroPeriodo,
    exportarPDF, can, abrirModal, setModalTiposAberto
}) {
    const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);

    function selecionarPeriodo(tipo) {
        if (tipo === 'tudo') {
            setPeriodo({ inicio: '', fim: '', label: 'Desde o Início' });
            setUsarFiltroPeriodo(true);
            setMenuPeriodoAberto(false);
            return;
        }

        const hoje = new Date();
        let inicio = new Date();
        let fim = new Date();
        let label = "";

        if (tipo === 'hoje') label = "Hoje";
        else if (tipo === '7d') { inicio.setDate(hoje.getDate() - 7); label = "Últimos 7 dias"; }
        else if (tipo === '30d') { inicio.setDate(hoje.getDate() - 30); label = "Últimos 30 dias"; }
        else if (tipo === '90d') { inicio.setDate(hoje.getDate() - 90); label = "Últimos 3 meses"; }
        else if (tipo === '12m') { inicio.setFullYear(hoje.getFullYear() - 1); label = "Últimos 12 meses"; }
        else if (tipo === 'mes_atual') {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            label = "Este Mês";
        }

        setPeriodo({
            inicio: inicio.toISOString().split('T')[0],
            fim: fim.toISOString().split('T')[0],
            label: label
        });
        setUsarFiltroPeriodo(true);
        setMenuPeriodoAberto(false);
    }

    return (
        <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
            <h1>Gastos</h1>

            <div className="header-actions filter-bar" style={{width: "100%", justifyContent: "flex-start"}}>
                <div className="search-box" style={{ display: 'flex', alignItems: 'center', background: '#2d3748', borderRadius: '5px', padding: '0 10px' }}>
                    <Search size={18} color="#a0aec0" />
                    <input
                        placeholder="Buscar gasto..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', outline: 'none', width: '100%' }}
                    />
                </div>

                <select
                    value={tipoFiltro}
                    onChange={e => setTipoFiltro(e.target.value)}
                    style={{ background: '#2d3748', color: 'white', border: '1px solid #444', padding: '0 10px', borderRadius: '5px', outline: 'none', cursor: 'pointer', height: '40px' }}
                >
                    <option value="">Todos os Tipos</option>
                    {tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                </select>

                <select
                    value={limite}
                    onChange={e => handleMudarLimite(e.target.value)}
                    style={{ background: '#2d3748', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '5px', outline: 'none', cursor: 'pointer' }}
                >
                    <option value="100">100 Lançamentos</option>
                    <option value="500">500 Lançamentos</option>
                    <option value="1000">1000 Lançamentos</option>
                    <option value="2000">2000 Lançamentos</option>
                    <option value="999999">Mostrar Tudo</option>
                </select>

                <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button onClick={() => setMenuPeriodoAberto(!menuPeriodoAberto)} style={{ background: usarFiltroPeriodo ? '#1a202c' : '#2d3748', color: 'white', border: usarFiltroPeriodo ? '1px solid #8B5CF6' : '1px solid #444', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', minWidth: '160px', justifyContent: 'space-between' }}>
                        {usarFiltroPeriodo ? periodo.label : "Selecionar..."} <Filter size={16} />
                    </button>

                    {menuPeriodoAberto && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setMenuPeriodoAberto(false)} />
                    )}

                    {menuPeriodoAberto && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', padding: '10px', zIndex: 9999, width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <button onClick={() => selecionarPeriodo('7d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 7 dias</button>
                                <button onClick={() => selecionarPeriodo('30d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 30 dias</button>
                                <button onClick={() => selecionarPeriodo('mes_atual')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Este Mês</button>
                                <button onClick={() => selecionarPeriodo('90d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 3 meses</button>
                                <button onClick={() => selecionarPeriodo('12m')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer' }}>Últimos 12 meses</button>
                                <button onClick={() => selecionarPeriodo('tudo')} style={{ background: 'transparent', border: 'none', color: '#8B5CF6', textAlign: 'left', padding: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Desde o Início</button>
                                <hr style={{ borderColor: '#444', margin: '5px 0' }} />
                                <div style={{ fontSize: '0.8rem', color: '#8B5CF6', marginBottom: '5px' }}>Personalizado:</div>
                                <input type="date" value={periodo.inicio} onChange={e => { setPeriodo({ ...periodo, inicio: e.target.value }); setUsarFiltroPeriodo(false); }} style={{ width: '100%', marginBottom: '5px', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }} />
                                <input type="date" value={periodo.fim} onChange={e => { setPeriodo({ ...periodo, fim: e.target.value }); setUsarFiltroPeriodo(false); }} style={{ width: '100%', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }} />
                                <button onClick={() => { if (periodo.inicio && periodo.fim) { setPeriodo({ ...periodo, label: 'Personalizado' }); setUsarFiltroPeriodo(true); setMenuPeriodoAberto(false); } else { toast.error("Selecione a data inicial e final."); } }} style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Aplicar Filtro
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {can('gastos.baixar') && ( <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px', marginRight: '8px' }}>
                    <FileText size={18} style={{ marginRight: 5 }} /> PDF
                </button> )}

                {can('gastos.tipos.gerenciar') && (
                    <button onClick={() => setModalTiposAberto(true)} className="btn-add" style={{ backgroundColor: '#4a5568', color: 'white', height: '40px', marginRight: '8px' }} title="Gerenciar Tipos de Gasto">
                        <Settings size={18} />
                    </button>
                )}

                {can('gastos.criar') && (
                    <button onClick={() => abrirModal()} className="btn-add" style={{ backgroundColor: '#8B5CF6', color: '#fff', height: '40px' }}>
                        <PlusCircle size={18} style={{ marginRight: 5 }} /> Novo Gasto
                    </button>
                )}
            </div>
        </div>
    );
}

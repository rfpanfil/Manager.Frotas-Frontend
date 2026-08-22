import React, { useState } from 'react';
import Select from 'react-select';
import { Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#444',
        color: 'white',
        minHeight: '38px',
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none',
        '&:hover': { borderColor: '#00d68f' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#00d68f' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#4a5568' }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#e53e3e' } })
};

export default function FiltrosDashboardGastos({
    filtros,
    setFiltros,
    anosDisponiveis,
    veiculos,
    tiposGasto,
    periodo,
    setPeriodo,
    usarFiltroPeriodo,
    setUsarFiltroPeriodo
}) {
    const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);

    function handleFiltroChange(e) {
        setUsarFiltroPeriodo(false);
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    }

    function selecionarPeriodo(tipo) {
        const hoje = new Date();
        let inicio = new Date(), fim = new Date();
        let label = "";

        if (tipo === '7d') {
            inicio.setDate(hoje.getDate() - 7);
            label = "Últimos 7 dias";
        } else if (tipo === '30d') {
            inicio.setDate(hoje.getDate() - 30);
            label = "Últimos 30 dias";
        } else if (tipo === '90d') {
            inicio.setDate(hoje.getDate() - 90);
            label = "Últimos 3 meses";
        } else if (tipo === '12m') {
            inicio.setFullYear(hoje.getFullYear() - 1);
            label = "Últimos 12 meses";
        } else if (tipo === 'mes_atual') {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            label = "Este Mês";
        }

        setPeriodo({
            inicio: inicio.toISOString().split('T')[0],
            fim: fim.toISOString().split('T')[0],
            label
        });

        setUsarFiltroPeriodo(true);
        setMenuPeriodoAberto(false);
    }

    const opcoesTiposGasto = tiposGasto.map(t => ({ value: t.nome, label: t.nome }));

    return (
        <div className="filter-bar">
            <div className="filter-item">
                <label>Ano</label>
                <select name="ano" value={filtros.ano} onChange={handleFiltroChange}>
                    {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                </select>
            </div>
            
            <div className="filter-item">
                <label>Mês</label>
                <select name="mes" value={filtros.mes} onChange={handleFiltroChange}>
                    <option value="">Todos</option>
                    <option value="1">Janeiro</option>
                    <option value="2">Fevereiro</option>
                    <option value="3">Março</option>
                    <option value="4">Abril</option>
                    <option value="5">Maio</option>
                    <option value="6">Junho</option>
                    <option value="7">Julho</option>
                    <option value="8">Agosto</option>
                    <option value="9">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                </select>
            </div>
            
            <div style={{ alignSelf: 'center', color: '#a0aec0', fontSize: '0.8rem', margin: '0 10px' }}>OU</div>

            <div className="filter-item" style={{ position: 'relative' }}>
                <label style={{ color: usarFiltroPeriodo ? '#00d68f' : '#a0aec0' }}>Período Rápido</label>
                <button onClick={() => setMenuPeriodoAberto(!menuPeriodoAberto)} style={{
                    background: usarFiltroPeriodo ? '#1a202c' : '#151821',
                    color: 'white',
                    border: usarFiltroPeriodo ? '1px solid #00d68f' : '1px solid #444',
                    padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, minWidth: '180px', justifyContent: 'space-between'
                }}>
                    {usarFiltroPeriodo ? periodo.label : "Selecionar..."} <Filter size={14} />
                </button>

                {menuPeriodoAberto && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', padding: '10px', zIndex: 100, width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <button onClick={() => selecionarPeriodo('7d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 7 dias</button>
                            <button onClick={() => selecionarPeriodo('30d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 30 dias</button>
                            <button onClick={() => selecionarPeriodo('mes_atual')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Este Mês</button>
                            <button onClick={() => selecionarPeriodo('90d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 3 meses</button>
                            <button onClick={() => selecionarPeriodo('12m')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 12 meses</button>

                            <hr style={{ borderColor: '#444', margin: '5px 0' }} />

                            <div style={{ fontSize: '0.8rem', color: '#00d68f', marginBottom: '5px' }}>Personalizado:</div>

                            <input
                                type="date"
                                value={periodo.inicio}
                                onChange={e => setPeriodo({ ...periodo, inicio: e.target.value })}
                                style={{ width: '100%', marginBottom: '5px', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }}
                            />
                            <input
                                type="date"
                                value={periodo.fim}
                                onChange={e => setPeriodo({ ...periodo, fim: e.target.value })}
                                style={{ width: '100%', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }}
                            />

                            <button
                                onClick={() => {
                                    if (periodo.inicio && periodo.fim) {
                                        setPeriodo({ ...periodo, label: 'Personalizado' });
                                        setUsarFiltroPeriodo(true);
                                        setMenuPeriodoAberto(false);
                                    } else {
                                        toast.error("Selecione data inicial e final");
                                    }
                                }}
                                style={{
                                    marginTop: '10px', width: '100%', padding: '8px',
                                    background: '#00d68f', color: 'black', border: 'none',
                                    borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                Aplicar Filtro
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="filter-item" style={{ minWidth: '300px' }}>
                <label>Veículos</label>
                <Select
                    isMulti
                    options={veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.marca} - ${v.modelo}`.toUpperCase() }))}
                    value={filtros.veiculos_ids}
                    onChange={val => setFiltros({ ...filtros, veiculos_ids: val })}
                    placeholder="Todos os Veículos"
                    styles={customSelectStyles}
                    closeMenuOnSelect={false}
                />
            </div>

            <div className="filter-item" style={{ minWidth: '250px' }}>
                <label>Tipos de Gasto</label>
                <Select
                    isMulti
                    options={opcoesTiposGasto}
                    value={filtros.tipos_gasto}
                    onChange={val => setFiltros({ ...filtros, tipos_gasto: val })}
                    placeholder="Selecione..."
                    styles={customSelectStyles}
                    closeMenuOnSelect={false}
                />
            </div>
        </div>
    );
}

import React from 'react';
import DatePicker from "react-datepicker";
import Select from 'react-select';
import { Settings, FileText } from 'lucide-react';
import { MonthInput, customSelectStyles, ymToDate, dateToYm } from '../../utils/checklistHelpers.jsx';

export default function ChecklistsHeaderFiltros({
    filtroData, setFiltroData,
    filtroStatus, setFiltroStatus,
    filtroBase, setFiltroBase, uniqueBases,
    filtroResponsavel, setFiltroResponsavel, uniqueResponsaveis,
    busca, setBusca,
    podeBaixar, exportarPDFResumido, handleExportarDetalhado,
    podeGerenciar, setShowModalGerenciar
}) {
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Filtro de Data (Mês) */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Período</label>
                        <DatePicker
                            selected={ymToDate(filtroData)}
                            onChange={(date) => setFiltroData(dateToYm(date))}
                            showMonthYearPicker
                            dateFormat="yyyy-MM"
                            locale="pt-BR"
                            customInput={<MonthInput />}
                            popperPlacement="bottom-start"
                        />
                    </div>

                    {/* Filtro de Status */}
                    <div style={{ minWidth: '160px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Status</label>
                        <select
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: 5, border: '1px solid #444', background: '#2d3748', color: 'white', height: '38px' }}
                        >
                            <option value="Todos">Todos os Status</option>
                            <option value="Realizado">Realizados</option>
                            <option value="Pendente">Pendentes (Rascunho)</option>
                            <option value="NaoRealizado">Não Realizados</option>
                            <option value="Aprovado">Aprovados</option>
                            <option value="Reprovado">Reprovados</option>
                        </select>
                    </div>

                    {/* Filtro de Base */}
                    <div style={{ minWidth: '160px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Base</label>
                        <Select
                            styles={customSelectStyles}
                            options={uniqueBases}
                            placeholder="Todas"
                            isClearable
                            onChange={setFiltroBase}
                            value={filtroBase}
                        />
                    </div>

                    {/* Filtro de Responsável */}
                    <div style={{ minWidth: '160px' }}>
                        <label style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 2 }}>Responsável</label>
                        <Select
                            styles={customSelectStyles}
                            options={uniqueResponsaveis}
                            placeholder="Todos"
                            isClearable
                            onChange={setFiltroResponsavel}
                            value={filtroResponsavel}
                        />
                    </div>

                    {/* Botões PDF */}
                    {podeBaixar && (
                        <div style={{ display: 'flex', gap: 5, alignSelf: 'flex-end' }}>
                            <button onClick={exportarPDFResumido} className="btn-secondary" style={{ background: '#4a5568', color: 'white', height: '38px', padding: '0 15px', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                                Resumido
                            </button>
                            <button onClick={handleExportarDetalhado} className="btn-add" style={{ background: '#e53e3e', color: 'white', height: '38px' }}>
                                <FileText size={18} style={{ marginRight: 5 }} /> Completo
                            </button>
                        </div>
                    )}
                </div>

                {/* Botão Admin */}
                {podeGerenciar && (
                    <button
                        onClick={() => setShowModalGerenciar(true)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#4a5568', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 5, cursor: 'pointer' }}
                    >
                        <Settings size={16} /> Gerenciar Itens
                    </button>
                )}
            </div>

            {/* Barra de Busca */}
            <div className="search-bar" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', background: '#2d3748', padding: '10px', borderRadius: '8px' }}>
                <div style={{ marginRight: 10 }}><Settings size={20} color="#a0aec0" style={{ opacity: 0 }} /></div>
                <input
                    type="text"
                    placeholder="Buscar veículo por placa ou modelo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                />
            </div>
        </>
    );
}

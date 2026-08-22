import { X, QrCode, Info, Paperclip, Trash2 } from 'lucide-react';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: state.isDisabled ? '#2d3748' : '#1a1e29',
        borderColor: state.isFocused ? '#00d68f' : '#444',
        color: 'white',
        minHeight: '42px',
        opacity: state.isDisabled ? 0.7 : 1,
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none',
        '&:hover': {
            borderColor: '#00d68f'
        }
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#00d68f' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#4a5568' }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#e53e3e', color: 'white' } })
};

export default function ModalGastoForm({
    editandoId,
    fecharModal,
    handleSubmit,
    form,
    setForm,
    tiposGasto,
    tiposCombustivel,
    opcoesVeiculos,
    opcoesSolicitantes,
    opcoesBases,
    tiposManutencao,
    statusManutencao,
    rotasDoDia,
    can,
    user,
    handleSelectChange,
    handleKmChange,
    handleRotaChange,
    setLendoQR,
    linkQrProtegido,
    setLinkQrProtegido,
    anexosExistentes,
    handleDeleteAnexo,
    arquivos,
    setArquivos
}) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '10px' }}>
            <div className="modal-card" style={{
                position: 'relative',
                width: '95%',
                maxWidth: '800px',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: '#1a202c',
                border: '1px solid #4a5568',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <button onClick={fecharModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>

                <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#f6ad55', fontSize: '1.5rem' }}>{editandoId ? 'Editar Gasto' : 'Novo Gasto'}</h3>

                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    flex: 1
                }}>

                    {/* Botão para Ler QR Code */}
                    <div style={{ background: 'rgba(0, 214, 143, 0.1)', border: '1px dashed #00d68f', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#00d68f', fontSize: '0.9rem' }}>Tem Nota Fiscal (NFC-e)?</span>
                        <button
                            type="button"
                            onClick={() => setLendoQR(true)}
                            style={{ background: '#00d68f', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}
                        >
                            <QrCode size={18} /> Ler QR Code
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div className="input-group"><label>Data</label><input type="datetime-local" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required /></div>

                        <div className="input-group">
                            <label>Tipo de Gasto</label>
                            <select value={form.tipo_gasto} onChange={(e) => handleSelectChange(e, '/opcoes/tipos-gasto', null, 'tipo_gasto')} required>
                                <option value="">Selecione...</option>
                                {tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#f6ad55' }}>+ Novo...</option>
                            </select>
                        </div>

                        <div className="input-group"><label>Valor (R$)</label><input type="text" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required placeholder="0,00" /></div>
                    </div>

                    {/* --- CAMPOS DINÂMICOS PARA COMBUSTÍVEL --- */}
                    {form.tipo_gasto === 'Combustível' && (
                        <div style={{ background: 'rgba(246, 173, 85, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid #f6ad55', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                            <div style={{ background: 'rgba(56, 178, 172, 0.15)', border: '1px solid #319795', color: '#81E6D9', padding: '10px', borderRadius: '5px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={20} style={{ flexShrink: 0 }} />
                                Insira os valores de Litros e Preço Litro (R$) para calcular automaticamente o Valor (R$) da nota.
                            </div>

                            <div style={{ color: '#f6ad55', fontWeight: 'bold', fontSize: '0.9rem' }}>DADOS DE ABASTECIMENTO (Obrigatório)</div>

                            <div className="input-group">
                                <label style={{ color: '#f6ad55' }}>Combustível</label>
                                <select value={form.combustivel} onChange={(e) => handleSelectChange(e, '/opcoes/tipos-combustivel', null, 'combustivel')} required>
                                    <option value="">Selecione...</option>
                                    {tiposCombustivel.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#f6ad55' }}>+ Novo...</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="input-group">
                                    <label style={{ color: '#f6ad55' }}>Litros</label>
                                    <input type="text" value={form.litros} onChange={e => setForm({ ...form, litros: e.target.value })} placeholder="Ex: 50,5" required style={{ border: '1px solid #f6ad55' }} />
                                </div>
                                <div className="input-group">
                                    <label style={{ color: '#f6ad55' }}>Preço Litro (R$)</label>
                                    <input type="text" value={form.preco_litro} onChange={e => setForm({ ...form, preco_litro: e.target.value })} placeholder="Ex: 5,89" required style={{ border: '1px solid #f6ad55' }} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ color: '#f6ad55' }}>KM Atual (Odômetro)</label>
                                <input
                                    type="text"
                                    value={form.km_registro}
                                    onChange={handleKmChange}
                                    placeholder="Ex: 123.456"
                                    required
                                    style={{ fontSize: '1.1rem', fontWeight: 'bold', background: '#1a202c', border: '1px solid #f6ad55' }}
                                />
                                <small style={{ color: '#a0aec0' }}>Use ponto para separar milhar (Ex: 150.000 ou 150000)</small>
                            </div>
                        </div>
                    )}

                    {/* --- SELEÇÃO DE VEÍCULO E MOTORISTA (COM BUSCA) --- */}
                    {[
                        'Borracharia', 'Combustível', 'Estacionamento', 'Lava Car',
                        'Manutenção', 'Mão de obra', 'Multa', 'Pedágio',
                        'Revisão', 'Seguro veículos'
                    ].includes(form.tipo_gasto) ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div className="input-group">
                                <label>Veículo <span style={{ color: 'red' }}>*</span></label>
                                <Select
                                    value={form.veiculo_id}
                                    onChange={opt => setForm({ ...form, veiculo_id: opt })}
                                    options={opcoesVeiculos}
                                    placeholder="Pesquisar veículo..."
                                    styles={customSelectStyles}
                                    isClearable
                                />
                            </div>

                            <div className="input-group">
                                <label>Solicitante / Colaborador <span style={{ color: 'red' }}>*</span></label>
                                <Select
                                    value={form.colaborador_id}
                                    onChange={opt => setForm({ ...form, colaborador_id: opt })}
                                    options={opcoesSolicitantes}
                                    placeholder="Pesquisar solicitante..."
                                    styles={customSelectStyles}
                                    isClearable
                                    isDisabled={!can('gastos.visao_global')}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="input-group">
                            <label>Centro de Custo / Base <span style={{ color: 'red' }}>*</span></label>
                            <Select
                                value={opcoesBases.find(b => b.value === form.centro_custo_id) || null}
                                onChange={opt => setForm({ ...form, centro_custo_id: opt ? opt.value : null })}
                                options={opcoesBases}
                                placeholder="Selecione o local..."
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>
                    )}

                    {form.tipo_gasto === 'Manutenção' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#2d3748', padding: '15px', borderRadius: '5px', border: '1px dashed #e53e3e' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label style={{ color: '#e53e3e' }}>Tipo Manutenção</label>
                                    <select value={form.tipo_manutencao} onChange={(e) => handleSelectChange(e, '/opcoes/tipos-manutencao', null, 'tipo_manutencao')} required>
                                        <option value="">Selecione...</option>
                                        {tiposManutencao.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#e53e3e' }}>+ Novo...</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ color: '#e53e3e' }}>Status</label>
                                    <select value={form.status_manutencao} onChange={(e) => handleSelectChange(e, '/opcoes/status-manutencao', null, 'status_manutencao')} required>
                                        <option value="">Selecione...</option>
                                        {statusManutencao.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                        <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#e53e3e' }}>+ Novo...</option>
                                    </select>
                                </div>
                            </div>

                            {form.tipo_manutencao === 'Troca de pneu' && (
                                <div style={{ background: 'rgba(229, 62, 62, 0.1)', padding: '10px', borderRadius: '5px', border: '1px solid #e53e3e', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ color: '#e53e3e', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>DADOS DOS PNEUS (Obrigatório)</div>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: '#e53e3e' }}>KM da Troca</label>
                                        <input
                                            type="number"
                                            value={form.km_registro}
                                            onChange={e => {
                                                const km = e.target.value;
                                                setForm(prev => ({
                                                    ...prev,
                                                    km_registro: km,
                                                    proxima_troca_km: km ? String(parseInt(km) + 40000) : ''
                                                }))
                                            }}
                                            required
                                            placeholder="Ex: 50000"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: '#e53e3e' }}>DOT</label>
                                        <input
                                            value={form.dot}
                                            onChange={e => setForm({ ...form, dot: e.target.value })}
                                            placeholder="Ex: 3524"
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label style={{ color: '#e53e3e' }}>Próxima Troca (40k)</label>
                                        <input
                                            type="number"
                                            value={form.proxima_troca_km}
                                            onChange={e => setForm({ ...form, proxima_troca_km: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="input-group"><label>Vincular Rota (Opcional)</label><select value={form.rota_id} onChange={handleRotaChange}><option value="">-- Avulso --</option>{rotasDoDia.map(r => <option key={r.id} value={r.id}>#{r.id} | {r.motorista?.nome || 'S/ Mot'} - {r.veiculo?.identificacao || 'S/ Veic'}</option>)}</select></div>

                    {linkQrProtegido && (
                        <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(0, 214, 143, 0.1)', borderRadius: '5px', border: '1px solid #00d68f' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <label style={{ color: '#00d68f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}>
                                    <QrCode size={14} /> Link da Nota (Protegido)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setLinkQrProtegido('')}
                                    style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                                >
                                    Remover Link
                                </button>
                            </div>
                            <input
                                value={linkQrProtegido}
                                readOnly // O usuário vê, mas não toca
                                style={{
                                    width: '100%',
                                    background: '#1a202c',
                                    border: '1px solid #2d3748',
                                    color: '#a0aec0',
                                    fontStyle: 'italic',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label>Descrição / Observação</label>
                        <input
                            placeholder={linkQrProtegido ? "Adicione observações extras aqui..." : "Detalhes..."}
                            value={form.descricao}
                            onChange={e => setForm({ ...form, descricao: e.target.value })}
                        />
                    </div>

                    {anexosExistentes.length > 0 && (
                        <div style={{ background: '#2d3748', padding: '10px', borderRadius: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Arquivos salvos:</label>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '5px 0' }}>
                                {anexosExistentes.map((nome, i) => (
                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #444' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#63b3ed', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</span>
                                        <button type="button" onClick={() => handleDeleteAnexo(nome)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="input-group" style={{ border: '1px dashed #4a5568', padding: '10px', borderRadius: '5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#a0aec0' }}>
                            <Paperclip size={16} />
                            {form.tipo_gasto === 'Combustível' ?
                                <span style={{ color: '#f6ad55', fontWeight: 'bold' }}>FOTO DO ODÔMETRO + COMPROVANTE</span> :
                                "Anexar Comprovantes (Pode selecionar vários)"
                            }
                        </label>
                        <input
                            type="file"
                            multiple
                            onChange={e => setArquivos(Array.from(e.target.files || []))}
                            style={{ marginTop: '10px', width: '100%' }}
                        />
                        {arquivos.length > 0 && <small style={{ color: '#00d68f' }}>{arquivos.length} novo(s) arquivo(s) selecionado(s)</small>}
                    </div>

                    {/* RODAPÉ DO MODAL */}
                    <div className="modal-footer">
                        <button type="button" onClick={fecharModal} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white' }}>Cancelar</button>
                        <button type="submit" className="btn-add" style={{ backgroundColor: '#f6ad55', color: '#000' }}>Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

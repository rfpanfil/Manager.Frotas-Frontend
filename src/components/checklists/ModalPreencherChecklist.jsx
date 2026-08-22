import React from 'react';
import { X, Camera, Save, CheckCircle } from 'lucide-react';
import Select from 'react-select';
import { customSelectStyles } from '../../utils/checklistHelpers.jsx';

export default function ModalPreencherChecklist({
    isOpen, setShowModalChecklist, isReadOnly,
    veiculoSelecionado, formData, setFormData,
    podeGerenciar, podeAprovar, usuariosFiltrados,
    itensPorCategoria,
    handleRespostaChange, handleFileChange, handleSubmitChecklist, handleStatusChange
}) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
            <div className="modal-content-responsivo" style={{ background: '#1a202c', width: '100%', maxWidth: '900px', borderRadius: 8, padding: 20, height: 'fit-content', margin: 'auto' }}>
                <form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* CABEÇALHO */}
                    <div style={{ background: '#2d3748', padding: '10px', borderRadius: 5, marginBottom: 10, border: '1px solid #4a5568' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h3 style={{ margin: 0, color: '#ecc94b', fontSize: '1rem' }}>
                                {isReadOnly ? 'Vistoria:' : 'Preencher:'} {veiculoSelecionado?.placa}
                            </h3>
                            <button type="button" onClick={() => setShowModalChecklist(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', padding: 0 }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#a0aec0', marginBottom: 2 }}>Data</label>
                                <input 
                                    type="date" 
                                    disabled={isReadOnly} 
                                    value={formData.data_verificacao} 
                                    onChange={e => setFormData({ ...formData, data_verificacao: e.target.value })} 
                                    required 
                                    style={{ width: '100%', padding: '5px', borderRadius: 4, border: '1px solid #444', background: '#1a202c', color: 'white', fontSize: '0.85rem' }} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#a0aec0', marginBottom: 2 }}>Responsável</label>
                                <Select
                                    isDisabled={isReadOnly || (!podeGerenciar && !podeAprovar)}
                                    value={usuariosFiltrados.map(u => ({ value: u.id, label: `${u.nome} ${u.sobrenome || ''}` })).find(o => o.value === formData.usuario_id) || null}
                                    onChange={v => setFormData({ ...formData, usuario_id: v ? v.value : '' })}
                                    options={usuariosFiltrados.map(u => ({ value: u.id, label: `${u.nome} ${u.sobrenome || ''}` }))}
                                    placeholder="Selecione..."
                                    styles={{ ...customSelectStyles, control: (b, s) => ({ ...customSelectStyles.control(b, s), minHeight: '32px', height: '32px' }), valueContainer: (b) => ({ ...b, padding: '0 8px' }) }}
                                    menuPlacement="auto"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ITENS DO CHECKLIST */}
                    <div className="checklist-scroll-area" style={{ maxHeight: '75vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', paddingRight: 5, paddingBottom: '15px' }}>
                        {Object.keys(itensPorCategoria).map(categoria => (
                            <div key={categoria} style={{ marginBottom: 20 }}>
                                <h3 style={{ borderBottom: '1px solid #444', color: '#00d68f', fontSize: '1rem', marginBottom: '10px' }}>{categoria}</h3>
                                {itensPorCategoria[categoria].map((def) => {
                                    const indice = 1;
                                    const chave = `${def.nome_item}_${indice}`;
                                    const dados = formData.respostas[chave] || { status: '', observacao: '', foto: null };
                                    const temFoto = dados.foto || dados.foto_path;
                                    const qtd = def.quantidade_padrao || 1;

                                    return (
                                        <div key={chave} className="checklist-item-grid" style={{ border: '1px solid #4a5568', borderRadius: '8px', padding: '12px', marginBottom: '15px', boxSizing: 'border-box', width: '100%' }}>
                                            
                                            <div className="chk-area-name" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '28px', height: '28px', borderRadius: '50%',
                                                    backgroundColor: qtd > 1 ? '#000000' : '#000000',
                                                    color: 'white', fontWeight: 'bold', fontSize: '0.85rem',
                                                    border: '1px solid #00d68f', flexShrink: 0
                                                }} title={`Quantidade exigida: ${qtd}`}>
                                                    {qtd}x
                                                </span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '500', lineHeight: '1.2' }}>
                                                    {def.nome_item}
                                                </span>
                                            </div>

                                            <select
                                                className="chk-area-status"
                                                disabled={isReadOnly}
                                                value={dados.status}
                                                onChange={e => handleRespostaChange(chave, 'status', e.target.value)}
                                                style={{ width: '100%', padding: 8, borderRadius: 4, background: dados.status === 'OK' ? '#00d68f' : dados.status === 'RUIM' ? '#e53e3e' : dados.status === 'FALTANTE' ? '#ecc94b' : '#4a5568', color: 'white', border: '1px solid #555' }}
                                            >
                                                <option value="" disabled>Status...</option>
                                                <option value="OK">OK</option>
                                                <option value="RUIM">RUIM</option>
                                                <option value="FALTANTE">FALTANTE</option>
                                                <option value="N/A">N/A</option>
                                            </select>

                                            <input
                                                className="chk-area-obs"
                                                type="text"
                                                disabled={isReadOnly}
                                                placeholder="Obs..."
                                                value={dados.observacao}
                                                onChange={e => handleRespostaChange(chave, 'observacao', e.target.value)}
                                                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#1a202c', color: 'white', boxSizing: 'border-box' }}
                                            />

                                            <div className="chk-area-foto" style={{ display: 'flex', alignItems: 'center' }}>
                                                {isReadOnly ? (
                                                    dados.foto_path ?
                                                        <span style={{ color: '#00d68f', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}><Camera size={16} /> Com Foto</span> :
                                                        <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Sem Foto</span>
                                                ) : (
                                                    <label style={{ cursor: 'pointer', background: temFoto ? '#00d68f' : '#4a5568', padding: '8px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', transition: 'background 0.2s' }}>
                                                        <Camera size={16} color="white" />
                                                        <span style={{ marginLeft: 5, fontSize: '0.8rem', color: 'white', fontWeight: 'bold' }}>{temFoto ? 'Alterar' : 'Foto'}</span>
                                                        <input type="file" accept="image/*" onChange={e => handleFileChange(chave, e)} style={{ display: 'none' }} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* BOTÕES NO RODAPÉ */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'flex-end', marginTop: 20, paddingTop: 15, borderTop: '1px solid #444', width: '100%', boxSizing: 'border-box' }}>
                        {!isReadOnly ? (
                            <>
                                <button type="button" onClick={e => handleSubmitChecklist(e, 'PENDENTE')} style={{ background: '#b45309', padding: '10px 20px', borderRadius: 4, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Save size={18} /> Rascunho
                                </button>
                                <button type="button" onClick={e => handleSubmitChecklist(e, 'FINALIZADO')} style={{ background: '#3182ce', padding: '10px 20px', borderRadius: 4, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle size={18} /> Finalizar e Enviar
                                </button>
                            </>
                        ) : (
                            podeAprovar && formData.status !== 'PENDENTE' && (
                                <>
                                    <button type="button" onClick={() => handleStatusChange('REPROVADO')} style={{ background: '#b91c1c', padding: '10px 20px', borderRadius: 4, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <X size={18} /> Reprovar
                                    </button>
                                    <button type="button" onClick={() => handleStatusChange('APROVADO')} style={{ background: '#047857', padding: '10px 20px', borderRadius: 4, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle size={18} /> Aprovar
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

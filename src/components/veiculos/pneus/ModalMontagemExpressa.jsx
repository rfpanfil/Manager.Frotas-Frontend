import React from 'react';
import Select from 'react-select';
import { Save, Settings } from 'lucide-react';
import { customSelectStyles, inputStyle } from '../../../utils/pneusUtils';

export default function ModalMontagemExpressa({
    modalExpresso,
    setModalExpresso,
    formExpresso,
    setFormExpresso,
    handleMontagemExpressa,
    medidasDisponiveis,
    handleNovaMedida,
    setModalMedidas
}) {
    if (!modalExpresso) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 2200 }}>
            <div className="modal-content" style={{ width: '500px' }}>
                <h3>Cadastrar e Montar Pneu {formExpresso.condicao}</h3>
                <form onSubmit={handleMontagemExpressa} style={{ display: 'grid', gap: 10, marginTop: 15 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                        <div><label>Data da Montagem*</label><input type="date" required value={formExpresso.data_montagem} onChange={e => setFormExpresso({ ...formExpresso, data_montagem: e.target.value })} style={inputStyle} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label>DOT*</label><input required value={formExpresso.dot} onChange={e => setFormExpresso({ ...formExpresso, dot: e.target.value })} style={inputStyle} /></div>
                        <div><label>Fogo (Opcional)</label><input value={formExpresso.fogo} onChange={e => setFormExpresso({ ...formExpresso, fogo: e.target.value })} style={inputStyle} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label>Marca (Opcional)</label><input value={formExpresso.marca} onChange={e => setFormExpresso({ ...formExpresso, marca: e.target.value })} style={inputStyle} /></div>
                        <div style={{ position: 'relative', zIndex: 100 }}>
                            <label>Medida*</label>
                            <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                                <div style={{ flex: 1 }}>
                                    <Select
                                        styles={customSelectStyles}
                                        placeholder="Selecione..."
                                        options={[{ value: 'NOVA', label: '+ Nova medida' }, ...medidasDisponiveis.map(m => ({ value: m, label: m }))]}
                                        value={formExpresso.medida ? { value: formExpresso.medida, label: formExpresso.medida } : null}
                                        onChange={async (sel) => {
                                            if (sel?.value === 'NOVA') {
                                                const nome = prompt("Digite a nova medida:");
                                                if (nome) {
                                                    const criada = await handleNovaMedida(nome);
                                                    if (criada) setFormExpresso({ ...formExpresso, medida: criada.nome });
                                                }
                                            } else {
                                                setFormExpresso({ ...formExpresso, medida: sel?.value || '' });
                                            }
                                        }}
                                    />
                                </div>
                                <button type="button" onClick={() => setModalMedidas(true)} title="Gerenciar Medidas" style={{ background: '#2d3748', border: '1px solid #4a5568', color: '#a0aec0', borderRadius: 4, padding: '0 10px', cursor: 'pointer' }}><Settings size={18} /></button>
                            </div>
                        </div>
                    </div>
                    <div><label>Sulco Novo (mm) (Opcional)</label><input type="number" value={formExpresso.sulco_novo} onChange={e => setFormExpresso({ ...formExpresso, sulco_novo: e.target.value })} style={inputStyle} /></div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 5, fontSize: '0.85rem', color: '#a0aec0' }}>
                        A vida útil esperada configurada para este pneu será de <strong>{formExpresso.vida_util_km.toLocaleString()} km</strong>.
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button type="submit" className="btn-add" style={{ flex: 1, background: '#8B5CF6', color: '#fff' }}><Save size={16} /> Salvar e Montar</button>
                        <button type="button" onClick={() => setModalExpresso(false)} className="btn-close-modal" style={{ flex: 1, position: 'static' }}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

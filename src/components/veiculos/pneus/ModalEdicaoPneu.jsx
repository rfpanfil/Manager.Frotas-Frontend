import React from 'react';
import { X, Save, Settings } from 'lucide-react';
import Select from 'react-select';
import { customSelectStyles, inputStyle } from '../../../utils/pneusUtils';

export default function ModalEdicaoPneu({
    modalEdicao,
    setModalEdicao,
    pneuEditando,
    setPneuEditando,
    salvarEdicao,
    medidasDisponiveis,
    handleNovaMedida,
    setModalMedidas
}) {
    if (!modalEdicao) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 2300 }}>
            <div className="modal-content" style={{ width: '550px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <h3>Editar Pneu</h3>
                    <button onClick={() => setModalEdicao(false)} className="btn-close-modal"><X /></button>
                </div>
                <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label>DOT</label><input value={pneuEditando.dot || ''} onChange={e => setPneuEditando({ ...pneuEditando, dot: e.target.value })} style={inputStyle} />
                    <label>Fogo</label><input value={pneuEditando.fogo || ''} onChange={e => setPneuEditando({ ...pneuEditando, fogo: e.target.value })} style={inputStyle} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label>Marca</label><input value={pneuEditando.marca || ''} onChange={e => setPneuEditando({ ...pneuEditando, marca: e.target.value })} style={inputStyle} /></div>
                        <div style={{ position: 'relative', zIndex: 100 }}>
                            <label>Medida</label>
                            <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                                <div style={{ flex: 1 }}>
                                    <Select
                                        styles={customSelectStyles}
                                        options={[{ value: 'NOVA', label: '+ Nova medida' }, ...medidasDisponiveis.map(m => ({ value: m, label: m }))]}
                                        value={pneuEditando.medida ? { value: pneuEditando.medida, label: pneuEditando.medida } : null}
                                        onChange={async (sel) => {
                                            if (sel?.value === 'NOVA') {
                                                const nome = prompt("Digite a nova medida:");
                                                if (nome) {
                                                    const criada = await handleNovaMedida(nome);
                                                    if (criada) setPneuEditando({ ...pneuEditando, medida: criada.nome });
                                                }
                                            } else {
                                                setPneuEditando({ ...pneuEditando, medida: sel?.value || '' });
                                            }
                                        }}
                                    />
                                </div>
                                <button type="button" onClick={() => setModalMedidas(true)} title="Gerenciar Medidas" style={{ background: '#2d3748', border: '1px solid #4a5568', color: '#a0aec0', borderRadius: 4, padding: '0 10px', cursor: 'pointer' }}><Settings size={18} /></button>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label>Sulco Novo</label><input type="number" step="0.1" value={pneuEditando.sulco_novo} onChange={e => setPneuEditando({ ...pneuEditando, sulco_novo: e.target.value })} style={inputStyle} /></div>
                        <div><label>Sulco Atual</label><input type="number" step="0.1" value={pneuEditando.sulco_atual} onChange={e => setPneuEditando({ ...pneuEditando, sulco_atual: e.target.value })} style={inputStyle} /></div>
                    </div>

                    <div style={{ background: '#2d3748', padding: 10, borderRadius: 5, border: '1px solid #4a5568' }}>
                        <label style={{ color: '#00d68f', fontWeight: 'bold' }}>Vida Útil Esperada (Km)</label>
                        <input type="number" value={pneuEditando.vida_util_km || ''} placeholder="Ex: 40000" onChange={e => setPneuEditando({ ...pneuEditando, vida_util_km: e.target.value })} style={inputStyle} />
                        <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Preencha este campo para habilitar o status Verde/Amarelo/Vermelho na tabela.</span>
                    </div>

                    <label>Status Físico</label>
                    <select value={pneuEditando.status} onChange={e => setPneuEditando({ ...pneuEditando, status: e.target.value })} style={inputStyle}>
                        <option value="ESTOQUE">Estoque</option>
                        <option value="EM_USO">Em Uso</option>
                        <option value="MANUTENCAO">Manutenção</option>
                        <option value="SUCATA">Sucata</option>
                    </select>
                    <button type="submit" className="btn-add" style={{ marginTop: 15, background: '#ecc94b', color: 'black' }}><Save size={16} /> Salvar Alterações</button>
                </form>
            </div>
        </div>
    );
}

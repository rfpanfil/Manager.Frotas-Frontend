// Arquivo: frontend/src/components/estoque/ModalEdicaoFisica.jsx
import React from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { inputStyle } from './estoqueConstants';

/**
 * Modal para edição de um sub-item individual (Pneu ou Equipamento Serializado).
 * Componente controlado — todos os estados vêm do Orquestrador via props.
 */
export default function ModalEdicaoFisica({
    aberto, onFechar, formFisico, setFormFisico, onSalvar,
    serialEdicaoDuplicado, patriEdicaoDuplicado, erroEdicaoItem
}) {
    if (!aberto) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <h3>Editar Item Individual</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>

                    {/* CAMPOS SE FOR PNEU */}
                    {formFisico.tipo === 'PNEU' ? (
                        <>
                            <label>DOT (Identificador Principal)</label>
                            <input value={formFisico.dot || ''} onChange={e => setFormFisico({ ...formFisico, dot: e.target.value })} style={inputStyle} />

                            <label>Fogo (Opcional)</label>
                            <input value={formFisico.fogo || ''} onChange={e => setFormFisico({ ...formFisico, fogo: e.target.value })} style={inputStyle} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label>Marca</label>
                                    <input value={formFisico.marca || ''} onChange={e => setFormFisico({ ...formFisico, marca: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label>Medida</label>
                                    <input value={formFisico.medida || ''} onChange={e => setFormFisico({ ...formFisico, medida: e.target.value })} style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label>Sulco Novo (mm)</label>
                                    <input type="number" value={formFisico.sulco_novo || ''} onChange={e => setFormFisico({ ...formFisico, sulco_novo: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label>Sulco Atual (mm)</label>
                                    <input type="number" value={formFisico.sulco_atual || ''} onChange={e => setFormFisico({ ...formFisico, sulco_atual: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                        </>
                    ) : (
                        // CAMPOS SE FOR OUTRO EQUIPAMENTO
                        <>
                            <div>
                                <label>Serial</label>
                                <input value={formFisico.serial || ''} onChange={e => setFormFisico({ ...formFisico, serial: e.target.value })} style={inputStyle} />
                                {serialEdicaoDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Serial já em uso!</span>}
                            </div>

                            <div>
                                <label>Patrimônio</label>
                                <input value={formFisico.patrimonio || ''} onChange={e => setFormFisico({ ...formFisico, patrimonio: e.target.value })} style={inputStyle} />
                                {patriEdicaoDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Patrimônio já em uso!</span>}
                            </div>

                            {erroEdicaoItem && <div style={{ color: '#fc8181', fontSize: '0.85rem' }}>{erroEdicaoItem}</div>}
                        </>
                    )}

                    <label>Status</label>
                    <select value={formFisico.status} onChange={e => setFormFisico({ ...formFisico, status: e.target.value })} style={inputStyle}>
                        <option value="ESTOQUE">Estoque (Disponível)</option>
                        <option value="SUCATA">Sucata (Descarte)</option>
                        <option value="EM_USO">Em Uso (Montado)</option>
                        <option value="MANUTENCAO">Em Manutenção</option>
                    </select>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button onClick={onSalvar} disabled={serialEdicaoDuplicado || patriEdicaoDuplicado} className="btn-add" style={{ flex: 1, opacity: (serialEdicaoDuplicado || patriEdicaoDuplicado) ? 0.5 : 1 }}><Save size={16} /> Salvar</button>
                        <button onClick={onFechar} className="btn-close-modal" style={{ flex: 1, position: 'static' }}>Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

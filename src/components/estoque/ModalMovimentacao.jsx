import React, { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import Select from 'react-select';
import { customSelectStyles, inputStyle } from './estoqueConstants';

/**
 * Modal de Entrada/Saída de Estoque com campos condicionais.
 * Estado interno: apenas filtroCategoriaMov (UI do dropdown).
 */
export default function ModalMovimentacao({
    aberto, onFechar, tipoMov, formMov, setFormMov, onSubmit,
    itens, itemSelecionado, bases, usuarios, categoriasDisponiveis,
    serialMovDuplicado, patriMovDuplicado, erroMovimentacao
}) {
    const [filtroCategoriaMov, setFiltroCategoriaMov] = useState('');

    if (!aberto) return null;

    return (
        <div className="modal-overlay" onClick={onFechar}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <form onSubmit={onSubmit} style={{ display: 'grid', gap: 15 }}>
                    {/* SELEÇÃO COM FILTRO E BUSCA */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                        <div>
                            <label>Filtrar Categoria</label>
                            <select
                                value={filtroCategoriaMov}
                                onChange={e => {
                                    setFiltroCategoriaMov(e.target.value);
                                    setFormMov({ ...formMov, estoque_item_id: '' });
                                }}
                                style={inputStyle}
                            >
                                <option value="">Todas</option>
                                {categoriasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label>Selecione o Modelo ou Item</label>
                            <Select
                                styles={customSelectStyles}
                                placeholder="Digite para buscar..."
                                value={
                                    formMov.estoque_item_id
                                        ? {
                                            value: formMov.estoque_item_id,
                                            label: itens.find(i => i.id == formMov.estoque_item_id)
                                                ? `${itens.find(i => i.id == formMov.estoque_item_id).nome} (${itens.find(i => i.id == formMov.estoque_item_id).codigo_referencia})`
                                                : 'Selecionado'
                                        }
                                        : null
                                }
                                onChange={selected => setFormMov({ ...formMov, estoque_item_id: selected ? selected.value : '' })}
                                options={
                                    itens
                                        .filter(i => tipoMov === 'ENTRADA' ? true : i.tipo_controle === 'QUANTIDADE')
                                        .filter(i => filtroCategoriaMov ? i.categoria === filtroCategoriaMov : true)
                                        .map(i => ({ value: i.id, label: `${i.nome} (${i.codigo_referencia})` }))
                                }
                                isClearable
                                noOptionsMessage={() => "Nenhum item encontrado"}
                            />
                        </div>
                    </div>

                    {/* CAMPOS CONDICIONAIS DE ENTRADA/SAÍDA */}
                    {tipoMov === 'ENTRADA' ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><label>Quantidade</label><input type="number" min="1" required placeholder="Ex: 50" onChange={e => setFormMov({ ...formMov, quantidade: e.target.value })} style={inputStyle} /></div>
                                <div><label>Valor Unitário (R$)</label><input type="number" step="0.01" placeholder="R$ 0,00" onChange={e => setFormMov({ ...formMov, valor_aquisicao: e.target.value })} style={inputStyle} /></div>
                            </div>

                            {/* CÁLCULO VISUAL DO TOTAL */}
                            <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#8B5CF6', fontWeight: 'bold' }}>
                                Custo Total: R$ {((formMov.quantidade || 0) * (formMov.valor_aquisicao || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>

                            <div><label>Número da NF (Opcional)</label><input placeholder="Série e Número" onChange={e => setFormMov({ ...formMov, numero_nf: e.target.value })} style={inputStyle} /></div>

                            {/* CAMPOS ESPECÍFICOS PARA SERIALIZADOS */}
                            {itemSelecionado?.tipo_controle === 'SERIALIZADO' && (
                                <div style={{ background: 'rgba(246, 173, 85, 0.1)', padding: 10, borderRadius: 5, border: '1px dashed #f6ad55', marginTop: 10 }}>
                                    <h5 style={{ color: '#f6ad55', margin: '0 0 10px 0' }}>Dados do Item Serializado</h5>

                                    {itemSelecionado?.categoria === 'PNEUS' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <div><label>DOT (Obrigatório)</label><input required onChange={e => setFormMov({ ...formMov, dot: e.target.value })} style={inputStyle} /></div>
                                                <div><label>Nº de Fogo (Opcional)</label><input onChange={e => setFormMov({ ...formMov, fogo: e.target.value })} style={{ ...inputStyle, borderColor: '#a0aec0' }} /></div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                                <div><label>Marca (Opcional)</label><input placeholder="Ex: Michelin" onChange={e => setFormMov({ ...formMov, marca: e.target.value })} style={inputStyle} /></div>
                                                <div><label>Medida</label><input required placeholder="Ex: 295/80" onChange={e => setFormMov({ ...formMov, medida: e.target.value })} style={inputStyle} /></div>
                                                <div><label>Sulco Novo (Opcional)</label><input type="number" placeholder="Ex: 18.0" onChange={e => setFormMov({ ...formMov, sulco_novo: e.target.value })} style={inputStyle} /></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div>
                                                <label>Número Serial</label>
                                                <input required placeholder="S/N (Obrigatório)" value={formMov.serial || ''} onChange={e => setFormMov({ ...formMov, serial: e.target.value })} style={inputStyle} />
                                                {serialMovDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Serial já em uso!</span>}
                                            </div>
                                            <div>
                                                <label>Nº Patrimônio</label>
                                                <input placeholder="Opcional" value={formMov.patrimonio || ''} onChange={e => setFormMov({ ...formMov, patrimonio: e.target.value })} style={inputStyle} />
                                                {patriMovDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Patrimônio já em uso!</span>}
                                            </div>
                                            {erroMovimentacao && <div style={{ gridColumn: '1 / -1', color: '#fc8181', fontSize: '0.85rem' }}>{erroMovimentacao}</div>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* SAÍDA */}
                            <div><label>Qtd. a Retirar</label><input type="number" required placeholder="Ex: 2" onChange={e => setFormMov({ ...formMov, quantidade: e.target.value })} style={inputStyle} /></div>
                            <div>
                                <label>Centro de Custo / Base</label>
                                <select required onChange={e => setFormMov({ ...formMov, base_id: e.target.value })} style={inputStyle}>
                                    <option value="">Selecione...</option>
                                    {bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label>Quem Autorizou?</label>
                                    <select required onChange={e => setFormMov({ ...formMov, solicitante_id: e.target.value })} style={inputStyle}>
                                        <option value="">Selecione...</option>
                                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Quem Retirou?</label>
                                    <select required onChange={e => setFormMov({ ...formMov, responsavel_id: e.target.value })} style={inputStyle}>
                                        <option value="">Selecione...</option>
                                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                    <div><label>Observação (Obrigatória)</label><input required placeholder="Justificativa" onChange={e => setFormMov({ ...formMov, observacao: e.target.value })} style={inputStyle} /></div>

                    {/* AVISO DE GASTOS */}
                    {tipoMov === 'ENTRADA' && (
                        <div style={{ background: 'rgba(229, 62, 62, 0.2)', padding: '10px', borderRadius: '5px', border: '1px solid #e53e3e', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Info size={24} color="#e53e3e" />
                            <span style={{ color: '#feb2b2', fontSize: '0.85rem' }}><strong>Atenção:</strong> Para itens adicionados diretamente no estoque, é obrigatório fazer o lançamento manual no menu <strong>GASTOS</strong> para controle financeiro.</span>
                        </div>
                    )}

                    <button type="submit" disabled={serialMovDuplicado || patriMovDuplicado} className="btn-add" style={{ background: tipoMov === 'ENTRADA' ? '#8B5CF6' : '#f6ad55', color: '#fff', padding: 15, marginTop: 10, fontWeight: 'bold', opacity: (serialMovDuplicado || patriMovDuplicado) ? 0.5 : 1 }}>
                        Confirmar {tipoMov}
                    </button>
                </form>
            </div>
        </div>
    );
}

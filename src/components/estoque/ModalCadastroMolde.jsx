// Arquivo: frontend/src/components/estoque/ModalCadastroMolde.jsx
import React from 'react';
import { Package, X, AlertTriangle, Settings } from 'lucide-react';
import { inputStyle } from './estoqueConstants';

/**
 * Modal de criação/edição de item de estoque (Molde) — formulário de 2 passos.
 * Componente controlado — form gerenciado pelo Orquestrador.
 */
export default function ModalCadastroMolde({
    aberto, onFechar, form, setForm, onSubmit, codigoExiste,
    categoriasBD, categoriasDisponiveis, unidadesBD, onNovaUnidade,
    onAbrirGerenciarCategorias
}) {
    if (!aberto) return null;

    return (
        <div className="modal-overlay" onClick={onFechar}>
            <div className="modal-content" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Package color="#00d68f" /> {form.id ? 'Editar Molde' : 'Novo Modelo/Item de Estoque'}
                    </h3>
                    <button onClick={onFechar} className="btn-close-modal"><X /></button>
                </div>
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {/* --- PASSO 1: IDENTIFICAÇÃO BÁSICA --- */}
                    <div style={{ background: '#1a202c', padding: 15, borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#00d68f' }}>Passo 1: Identificação Básica</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 15, marginBottom: 15 }}>
                            <div>
                                <label>Código de Referência</label>
                                <input
                                    required
                                    value={form.codigo_referencia}
                                    onChange={e => setForm({ ...form, codigo_referencia: e.target.value })}
                                    disabled={!form.id}
                                    style={{
                                        ...inputStyle,
                                        opacity: !form.id ? 0.7 : 1,
                                        cursor: !form.id ? 'not-allowed' : 'text',
                                        color: !form.id ? '#00d68f' : 'white',
                                        fontWeight: !form.id ? 'bold' : 'normal'
                                    }}
                                />
                                {codigoExiste && form.id && <span style={{ color: '#e53e3e', fontSize: '0.8rem', display: 'block', marginTop: 5 }}><AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Código já em uso!</span>}
                            </div>
                            <div>
                                <label>Categoria</label>
                                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 5 }}>
                                    <select required value={form.categoria} onChange={e => {
                                        const catNome = e.target.value;
                                        const catObj = categoriasBD.find(c => c.nome === catNome);
                                        let tipoAuto = form.tipo_controle;
                                        if (catObj && catObj.tipo_padrao !== 'LIVRE') tipoAuto = catObj.tipo_padrao;
                                        setForm({ ...form, categoria: catNome, tipo_controle: tipoAuto });
                                    }} style={{ ...inputStyle, marginTop: 0 }}>
                                        <option value="">Selecione...</option>
                                        {(categoriasBD.length > 0 ? categoriasBD : categoriasDisponiveis.map(c => ({ id: c, nome: c }))).map(c => <option key={c.id ?? c.nome} value={c.nome}>{c.nome}</option>)}
                                    </select>
                                    <button type="button" onClick={onAbrirGerenciarCategorias} title="Gerenciar Categorias" style={{ background: '#2d3748', border: '1px solid #4a5568', color: '#a0aec0', borderRadius: 4, height: 35, padding: '0 10px', cursor: 'pointer' }}><Settings size={18} /></button>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
                            {form.categoria === 'PNEUS' ? (
                                <div><label>Medida do Pneu</label><input required value={form.medida || ''} placeholder="Ex: 295/80" onChange={e => setForm({ ...form, medida: e.target.value })} style={inputStyle} /></div>
                            ) : (
                                <div><label>Nome do Item</label><input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} /></div>
                            )}
                            <div>
                                <label>Unidade de Medida</label>
                                <select required value={form.unidade_medida} onChange={e => {
                                    if (e.target.value === 'NOVA') { onNovaUnidade(); }
                                    else { setForm({ ...form, unidade_medida: e.target.value }); }
                                }} style={inputStyle}>
                                    <option value="">Selecione...</option>
                                    {unidadesBD.map(u => <option key={u.nome} value={u.nome}>{u.nome}</option>)}
                                    <option value="NOVA" style={{ fontWeight: 'bold', color: '#00d68f' }}>➕ Criar Nova Unidade</option>
                                </select>
                            </div>
                            <div><label>Qtd Mínima (Opcional)</label><input type="number" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: e.target.value })} style={inputStyle} /></div>
                        </div>
                        <div><label>Observações Gerais</label><textarea rows="2" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} style={{ ...inputStyle, fontFamily: 'inherit' }} /></div>
                    </div>

                    {/* --- PASSO 2: DEFINIÇÃO DO CONTROLE --- */}
                    <div style={{ background: '#1a202c', padding: 15, borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#f6ad55' }}>Passo 2: Definição do Controle</h4>

                        {(() => {
                            const catObj = categoriasBD.find(c => c.nome === form.categoria);
                            const isLocked = (catObj && catObj.tipo_padrao !== 'LIVRE');

                            return (
                                <>
                                    <div style={{ display: 'flex', gap: 20, marginBottom: 15, padding: 10, background: '#2d3748', borderRadius: 5, opacity: isLocked ? 0.6 : 1 }}>
                                        <label style={{ cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="radio" disabled={isLocked} name="tipo_controle" checked={form.tipo_controle === 'QUANTIDADE'} onChange={() => setForm({ ...form, tipo_controle: 'QUANTIDADE' })} /> 🔘 Controle por Volume/Quantidade
                                        </label>
                                        <label style={{ cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="radio" disabled={isLocked} name="tipo_controle" checked={form.tipo_controle === 'SERIALIZADO'} onChange={() => setForm({ ...form, tipo_controle: 'SERIALIZADO' })} /> ⚪ Controle Unitário/Serializado
                                        </label>
                                    </div>
                                    {isLocked && <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginTop: -10, marginBottom: 15 }}>* O tipo de controle está bloqueado pelas configurações desta Categoria.</p>}
                                </>
                            );
                        })()}

                        {form.id ? (
                            <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>* Para ajustar o saldo ou adicionar itens físicos, utilize os botões de <strong>Movimentação</strong> na tela principal.</p>
                        ) : (
                            form.tipo_controle === 'QUANTIDADE' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div><label>Qtd Inicial (Opcional)</label><input type="number" placeholder="0" value={form.quantidade_inicial} onChange={e => setForm({ ...form, quantidade_inicial: e.target.value })} style={inputStyle} /></div>
                                    <div><label>Valor Unitário (R$) (Opcional)</label><input placeholder="0,00" value={form.valor_aquisicao} onChange={e => setForm({ ...form, valor_aquisicao: e.target.value })} style={inputStyle} /></div>
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(246, 173, 85, 0.1)', padding: 15, borderRadius: 5, border: '1px dashed #f6ad55' }}>
                                    <h5 style={{ color: '#f6ad55', margin: '0 0 10px 0' }}>Entrada Imediata do Item (Opcional)</h5>
                                    <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginBottom: 15 }}>Preencha abaixo se quiser dar entrada em itens físicos junto com a criação deste modelo.</p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                                        <div><label>Quantidade a Adicionar (Opcional)</label><input type="number" placeholder="Ex: 1" value={form.quantidade_inicial} onChange={e => setForm({ ...form, quantidade_inicial: e.target.value })} style={inputStyle} /></div>
                                        <div><label>Valor Unitário (R$) (Opcional)</label><input type="number" step="0.01" placeholder="0.00" value={form.valor_aquisicao} onChange={e => setForm({ ...form, valor_aquisicao: e.target.value })} style={inputStyle} /></div>
                                    </div>

                                    {form.categoria === 'PNEUS' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <div><label>DOT (Opcional)</label><input value={form.dot || ''} onChange={e => setForm({ ...form, dot: e.target.value })} style={inputStyle} /></div>
                                                <div><label>Nº de Fogo (Opcional)</label><input value={form.fogo || ''} onChange={e => setForm({ ...form, fogo: e.target.value })} style={inputStyle} /></div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <div><label>Marca (Opcional)</label><input value={form.marca || ''} onChange={e => setForm({ ...form, marca: e.target.value })} style={inputStyle} /></div>
                                                <div><label>Sulco Novo (Opcional)</label><input type="number" value={form.sulco_novo || ''} onChange={e => setForm({ ...form, sulco_novo: e.target.value })} style={inputStyle} /></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div><label>Número Serial (Opcional)</label><input value={form.serial || ''} onChange={e => setForm({ ...form, serial: e.target.value })} style={inputStyle} /></div>
                                            <div><label>Nº Patrimônio (Opcional)</label><input value={form.patrimonio || ''} onChange={e => setForm({ ...form, patrimonio: e.target.value })} style={inputStyle} /></div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                    <button type="submit" disabled={codigoExiste && !form.id} className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', opacity: codigoExiste && !form.id ? 0.5 : 1 }}>Salvar Cadastro</button>
                </form>
            </div>
        </div>
    );
}

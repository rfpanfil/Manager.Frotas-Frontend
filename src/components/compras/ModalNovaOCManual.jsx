import useCan from '../../hooks/useCan';
import { X, FileText, Package, PlusCircle, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({ ...base, backgroundColor: '#2d3748', borderColor: '#4a5568', color: 'white', minHeight: '40px', boxShadow: state.isFocused ? '0 0 0 1px #8B5CF6' : 'none', '&:hover': { borderColor: '#8B5CF6' } }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#8B5CF6' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' }),
};

export default function ModalNovaOCManual({
    modalOCManual,
    setModalOCManual,
    formCapa,
    setFormCapa,
    carrinhoItens,
    setCarrinhoItens,
    itemAtual,
    setItemAtual,
    tiposGasto,
    fornecedores,
    veiculos,
    usuarios,
    bases,
    opcoesEstoque,
    servicosPadroes,
    adicionarItemOC,
    salvarOCManual,
    handleCriarNovoServico,
    setModalNovoItemEstoque,
    regrasManual,
    formatarM
}) {
    if (!modalOCManual) return null;

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2>Nova Ordem de Compra (Manual)</h2>
                    <button onClick={() => setModalOCManual(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                </div>
                <form onSubmit={salvarOCManual} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <h3 style={{ marginTop: 0, color: '#8B5CF6', marginBottom: 15 }}><FileText size={20} style={{ display: 'inline', marginRight: 5 }} /> 1. Fornecedor e Prazos</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                            <div><label style={{ display: 'block', marginBottom: 5 }}>Fornecedor *</label><select required value={formCapa.fornecedor_id} onChange={e => setFormCapa({ ...formCapa, fornecedor_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.razao_social}</option>)}</select></div>
                            <div><label style={{ display: 'block', marginBottom: 5 }}>Condição de Pagamento</label><input placeholder="Boleto, Pix, etc" value={formCapa.tipo_pagamento} onChange={e => setFormCapa({ ...formCapa, tipo_pagamento: e.target.value })} style={inputStyle} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div><label style={{ display: 'block', marginBottom: 5 }}>Vencimento do Pagamento</label><input type="date" value={formCapa.prazo_pagamento} onChange={e => setFormCapa({ ...formCapa, prazo_pagamento: e.target.value })} style={inputStyle} /></div>
                            <div><label style={{ display: 'block', marginBottom: 5 }}>Prazo de Entrega</label><input type="date" value={formCapa.prazo_entrega} onChange={e => setFormCapa({ ...formCapa, prazo_entrega: e.target.value })} style={inputStyle} /></div>
                        </div>
                    </div>

                    <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <h3 style={{ marginTop: 0, color: '#63b3ed', marginBottom: 15 }}><Package size={20} style={{ display: 'inline', marginRight: 5 }} /> 2. Adicionar Itens à OC</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 15, marginBottom: 15 }}>
                            <div><label style={{ display: 'block', marginBottom: 5 }}>Categoria (Tipo Gasto)</label><select value={itemAtual.tipo_gasto} onChange={e => setItemAtual({ ...itemAtual, tipo_gasto: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}</select></div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, paddingBottom: 10 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" checked={itemAtual.classificacao === 'PRODUTO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '' })} /> Produto</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" checked={itemAtual.classificacao === 'SERVICO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'SERVICO', estoque_item_id: '', nome_novo_item: '' })} /> Serviço</label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 350px' }}>
                                {itemAtual.classificacao === 'PRODUTO' ? (
                                    <>
                                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span>Produto no Estoque</span><span onClick={() => setModalNovoItemEstoque(true)} style={{ color: '#8B5CF6', cursor: 'pointer', fontSize: '0.85rem' }}>+ Novo Modelo</span></label>
                                        <Select styles={customSelectStyles} options={opcoesEstoque} value={opcoesEstoque.find(o => o.value === itemAtual.estoque_item_id) || null} onChange={opt => setItemAtual({ ...itemAtual, estoque_item_id: opt ? opt.value : '' })} placeholder="Digite o nome..." isClearable />
                                    </>
                                ) : (
                                    <>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Selecione o Serviço Padrão</label>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <select value={itemAtual.nome_novo_item} onChange={e => setItemAtual({ ...itemAtual, nome_novo_item: e.target.value })} style={inputStyle}>
                                                <option value="">Selecione um serviço tabelado...</option>
                                                {servicosPadroes.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                            </select>
                                            <button type="button" onClick={handleCriarNovoServico} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '0 15px', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Novo</button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ width: '100px' }}><label style={{ display: 'block', marginBottom: 5 }}>Qtd.</label><input type="number" value={itemAtual.quantidade} onChange={e => setItemAtual({ ...itemAtual, quantidade: e.target.value })} style={inputStyle} placeholder="Ex: 4" /></div>
                            <div style={{ width: '120px' }}><label style={{ display: 'block', marginBottom: 5 }}>V. Unit (R$)</label><input type="number" step="0.01" value={itemAtual.valor_unitario} onChange={e => setItemAtual({ ...itemAtual, valor_unitario: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                            <div><button type="button" onClick={adicionarItemOC} style={{ height: '42px', padding: '0 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}><PlusCircle size={18} style={{ display: 'inline' }} /> Inserir</button></div>
                        </div>
                    </div>

                    <div style={{ background: '#1a202c', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <h3 style={{ marginTop: 0, color: 'white', marginBottom: 15 }}><ShoppingCart size={20} style={{ display: 'inline', marginRight: 5 }} /> 3. Itens Lançados</h3>
                        {carrinhoItens.length === 0 ? <p style={{ color: '#a0aec0' }}>Nenhum item na OC.</p> : (
                            <>
                                <div style={{ overflowX: 'auto', paddingBottom: 15 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                        <thead><tr style={{ borderBottom: '2px solid #4a5568', textAlign: 'left' }}><th style={{ padding: 10 }}>Item / Descrição</th><th style={{ padding: 10, textAlign: 'center' }}>Qtd</th><th style={{ padding: 10, textAlign: 'right' }}>V. Unit</th><th style={{ padding: 10, textAlign: 'right' }}>Subtotal</th><th style={{ padding: 10, textAlign: 'center' }}>Ação</th></tr></thead>
                                        <tbody>
                                            {carrinhoItens.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #2d3748' }}>
                                                    <td style={{ padding: 10 }}>
                                                        <div style={{ fontWeight: 'bold' }}>{item.nome_exibicao}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{item.tipo_gasto}</div>
                                                    </td>
                                                    <td style={{ padding: 10, textAlign: 'center' }}>{item.quantidade}</td>
                                                    <td style={{ padding: 10, textAlign: 'right' }}>{formatarM(item.valor_unitario)}</td>
                                                    <td style={{ padding: 10, textAlign: 'right', color: '#8B5CF6', fontWeight: 'bold' }}>{formatarM(item.quantidade * item.valor_unitario)}</td>
                                                    <td style={{ padding: 10, textAlign: 'center' }}><button type="button" onClick={() => setCarrinhoItens(carrinhoItens.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {(regrasManual.precisaVeiculo || regrasManual.precisaColaborador || regrasManual.isCombustivel) && (
                                    <div style={{ background: 'rgba(236, 201, 75, 0.1)', padding: 15, borderRadius: 5, border: '1px dashed #ecc94b', marginBottom: 20 }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#ecc94b' }}>Informações Específicas Requeridas</h4>

                                        {(regrasManual.precisaVeiculo || regrasManual.precisaColaborador) && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
                                                {regrasManual.precisaVeiculo && <div><label style={{ display: 'block', marginBottom: 5 }}>Veículo *</label><select required value={formCapa.veiculo_id} onChange={e => setFormCapa({ ...formCapa, veiculo_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{veiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}</select></div>}
                                                {regrasManual.precisaColaborador && <div><label style={{ display: 'block', marginBottom: 5 }}>Colaborador *</label><select required value={formCapa.colaborador_id} onChange={e => setFormCapa({ ...formCapa, colaborador_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></div>}
                                            </div>
                                        )}

                                        {regrasManual.isCombustivel && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                                                <div><label style={{ display: 'block', marginBottom: 5 }}>Litros Abastecidos *</label><input required type="number" step="0.01" value={formCapa.litros} onChange={e => setFormCapa({ ...formCapa, litros: e.target.value })} style={inputStyle} /></div>
                                                <div><label style={{ display: 'block', marginBottom: 5 }}>KM Atual *</label><input required type="number" value={formCapa.km_atual} onChange={e => setFormCapa({ ...formCapa, km_atual: e.target.value })} style={inputStyle} /></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: 15, borderRadius: 5, border: '1px solid #8B5CF6' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#8B5CF6' }}>Dados de Faturamento e Negociação</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
                                <div><label style={{ display: 'block', marginBottom: 5 }}>Centro Custo (Base)*</label><select required value={formCapa.centro_custo_id} onChange={e => setFormCapa({ ...formCapa, centro_custo_id: e.target.value })} style={inputStyle}><option value="">Selecione...</option>{bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
                                <div><label style={{ display: 'block', marginBottom: 5 }}>Frete Total (R$)</label><input type="number" step="0.01" value={formCapa.frete} onChange={e => setFormCapa({ ...formCapa, frete: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                                <div><label style={{ display: 'block', marginBottom: 5 }}>Desconto Geral (R$)</label><input type="number" step="0.01" value={formCapa.desconto} onChange={e => setFormCapa({ ...formCapa, desconto: e.target.value })} style={inputStyle} placeholder="0.00" /></div>
                            </div>
                        </div>

                        <div style={{ marginTop: 15 }}>
                            <label style={{ display: 'block', marginBottom: 5, color: '#63b3ed' }}>Observações / Detalhes Adicionais da OC</label>
                            <textarea rows="2" value={formCapa.observacoes} onChange={e => setFormCapa({ ...formCapa, observacoes: e.target.value })} style={inputStyle} placeholder="Escreva aqui se houver mais detalhes..." />
                        </div>
                    </div>

                    <button type="submit" className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', background: '#8B5CF6', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle size={20} style={{ marginRight: 5 }} /> Salvar OC Manual</button>
                </form>
            </div>
        </div>
    );
}

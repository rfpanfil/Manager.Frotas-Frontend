import { X, FileText, Package, ShoppingCart, PlusCircle, Trash2, CheckCircle } from 'lucide-react';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base, backgroundColor: '#2d3748', borderColor: '#4a5568', color: 'white', minHeight: '40px',
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none', '&:hover': { borderColor: '#00d68f' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#00d68f' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' }),
};

const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };

export default function ModalNovaSolicitacao({
    modalAberto,
    setModalAberto,
    formCapa,
    setFormCapa,
    bases,
    veiculos,
    usuarios,
    itemAtual,
    setItemAtual,
    tiposGasto,
    opcoesEstoque,
    servicosPadroes,
    setModalNovoItemEstoque,
    handleCriarNovoServico,
    adicionarItemAoCarrinho,
    carrinhoItens,
    removerItemDoCarrinho,
    handleSubmit
}) {
    if (!modalAberto) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" style={{ background: '#1a202c', width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2>{formCapa.id ? `Editar ${formCapa.numero || 'SC'}` : 'Nova Solicitação de Compra'}</h2>
                    <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <h3 style={{ marginTop: 0, color: '#00d68f', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}><FileText size={20} /> 1. Informações Gerais do Pedido</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 15 }}>
                            <div><label style={{ display: 'block', marginBottom: 5 }}>Data Limite / Necessidade</label><input type="date" value={formCapa.data_necessidade} onChange={e => setFormCapa({ ...formCapa, data_necessidade: e.target.value })} style={inputStyle} /></div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 5 }}>Local Entrega (Base) <span style={{ color: '#e53e3e' }}>*</span></label>
                                <select required value={formCapa.local_entrega_id} onChange={e => setFormCapa({ ...formCapa, local_entrega_id: e.target.value })} style={inputStyle}>
                                    <option value="">Selecione...</option>
                                    {bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 5 }}>Veículo (Opcional)</label>
                                <select value={formCapa.veiculo_id} onChange={e => setFormCapa({ ...formCapa, veiculo_id: e.target.value })} style={inputStyle}>
                                    <option value="">Geral / Nenhum</option>
                                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 5 }}>Colaborador (Opcional)</label>
                                <select value={formCapa.colaborador_id} onChange={e => setFormCapa({ ...formCapa, colaborador_id: e.target.value })} style={inputStyle}>
                                    <option value="">Nenhum</option>
                                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>)}
                                </select>
                            </div>
                        </div>
                        <div><label style={{ display: 'block', marginBottom: 5 }}>Justificativa / Observação Geral</label><textarea rows="2" value={formCapa.observacoes} onChange={e => setFormCapa({ ...formCapa, observacoes: e.target.value })} style={inputStyle} /></div>
                    </div>

                    <div style={{ background: '#2d3748', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <h3 style={{ marginTop: 0, color: '#63b3ed', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}><Package size={20} /> 2. Adicionar Item ao Pedido</h3>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginBottom: 15, alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>Categoria (Tipo Gasto)</label>
                                <select value={itemAtual.tipo_gasto} onChange={e => setItemAtual({ ...itemAtual, tipo_gasto: e.target.value })} style={inputStyle}>
                                    <option value="">Selecione...</option>
                                    {tiposGasto.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 10, flex: '2 1 300px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                    <input type="radio" checked={itemAtual.classificacao === 'PRODUTO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'PRODUTO', estoque_item_id: '', nome_novo_item: '' })} />
                                    Produto (Catálogo do Estoque)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                    <input type="radio" checked={itemAtual.classificacao === 'SERVICO'} onChange={() => setItemAtual({ ...itemAtual, classificacao: 'SERVICO', estoque_item_id: '', nome_novo_item: '' })} />
                                    Serviço Padrão
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 350px' }}>
                                {itemAtual.classificacao === 'PRODUTO' ? (
                                    <>
                                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span>Buscar Produto no Estoque</span>
                                            <span onClick={() => setModalNovoItemEstoque(true)} style={{ color: '#00d68f', cursor: 'pointer', fontSize: '0.85rem' }}>+ Cadastrar Novo Modelo no Estoque</span>
                                        </label>
                                        <Select
                                            styles={customSelectStyles}
                                            options={opcoesEstoque}
                                            value={opcoesEstoque.find(o => o.value === itemAtual.estoque_item_id) || null}
                                            onChange={opt => setItemAtual({ ...itemAtual, estoque_item_id: opt ? opt.value : '' })}
                                            placeholder="Digite o nome, código ou medida..."
                                            isClearable
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Selecione o Serviço Padrão</label>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <select value={itemAtual.nome_novo_item} onChange={e => setItemAtual({ ...itemAtual, nome_novo_item: e.target.value })} style={inputStyle}>
                                                <option value="">Selecione um serviço tabelado...</option>
                                                {servicosPadroes.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                            </select>
                                            <button type="button" onClick={handleCriarNovoServico} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '0 15px', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                + Novo Serviço
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ width: '100px' }}>
                                <label style={{ display: 'block', marginBottom: 5 }}>Qtd.</label>
                                <input type="number" value={itemAtual.quantidade} onChange={e => setItemAtual({ ...itemAtual, quantidade: e.target.value })} style={inputStyle} placeholder="Ex: 4" />
                            </div>
                            <div>
                                <button type="button" onClick={adicionarItemAoCarrinho} style={{ height: '42px', padding: '0 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <PlusCircle size={18} /> Inserir
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#1a202c', padding: 20, borderRadius: 8, border: '1px solid #4a5568' }}>
                        <h3 style={{ marginTop: 0, color: 'white', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}><ShoppingCart size={20} /> 3. Lista de Itens a Comprar</h3>

                        {carrinhoItens.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#a0aec0', padding: 20, fontStyle: 'italic' }}>Nenhum item adicionado ainda. Preencha acima e clique em "Inserir".</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #4a5568', textAlign: 'left' }}>
                                            <th style={{ padding: 10 }}>Categoria</th>
                                            <th style={{ padding: 10 }}>Item / Descrição</th>
                                            <th style={{ padding: 10, textAlign: 'center' }}>Qtd.</th>
                                            <th style={{ padding: 10, textAlign: 'center' }}>Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carrinhoItens.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #2d3748' }}>
                                                <td style={{ padding: 10, color: '#a0aec0', fontSize: '0.9rem' }}>{item.tipo_gasto}</td>
                                                <td style={{ padding: 10 }}>
                                                    <span style={{ fontWeight: 'bold' }}>{item.nome_exibicao}</span>
                                                    <span style={{ marginLeft: 10, fontSize: '0.7rem', padding: '2px 5px', background: item.classificacao === 'PRODUTO' ? '#00d68f20' : '#ecc94b20', color: item.classificacao === 'PRODUTO' ? '#00d68f' : '#ecc94b', borderRadius: 4 }}>{item.classificacao}</span>
                                                </td>
                                                <td style={{ padding: 10, textAlign: 'center', fontWeight: 'bold' }}>{item.quantidade}</td>
                                                <td style={{ padding: 10, textAlign: 'center' }}>
                                                    <button type="button" onClick={() => removerItemDoCarrinho(idx)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', background: '#00d68f', color: 'black', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CheckCircle size={20} style={{ marginRight: 10 }} />
                        Finalizar e Gravar Solicitação Completa
                    </button>
                </form>
            </div>
        </div>
    );
}

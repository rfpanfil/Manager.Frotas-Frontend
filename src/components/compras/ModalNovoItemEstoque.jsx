import { X } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

const customSelectStyles = {
    control: (base, state) => ({ ...base, backgroundColor: '#2d3748', borderColor: '#4a5568', color: 'white', minHeight: '40px', boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none', '&:hover': { borderColor: '#00d68f' } }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#00d68f' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' }),
};

export default function ModalNovoItemEstoque({
    modalNovoItemEstoque,
    setModalNovoItemEstoque,
    formNovoItem,
    setFormNovoItem,
    categoriasEstoque,
    unidadesBD,
    itensEstoque,
    handleCriarNovoItemEstoque
}) {
    if (!modalNovoItemEstoque) return null;

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" style={{ background: '#1a202c', width: '600px', padding: 25, borderRadius: 8, border: '1px solid #4a5568' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ color: '#00d68f', margin: 0 }}>Cadastrar Novo Modelo no Estoque</h3>
                    <button onClick={() => setModalNovoItemEstoque(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleCriarNovoItemEstoque} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><label>Nome do Item / Modelo <span style={{ color: '#e53e3e' }}>*</span></label><input required value={formNovoItem.nome} onChange={e => setFormNovoItem({ ...formNovoItem, nome: e.target.value })} style={inputStyle} /></div>
                        <div>
                            <label>Cód. Referência (SKU) <span style={{ color: '#e53e3e' }}>*</span></label>
                            <input required placeholder="ID123" value={formNovoItem.codigo_referencia} onChange={e => setFormNovoItem({ ...formNovoItem, codigo_referencia: e.target.value })} style={{ ...inputStyle, borderColor: (formNovoItem.codigo_referencia && itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase())) ? '#e53e3e' : '#4a5568' }} />
                            {formNovoItem.codigo_referencia && itensEstoque.some(i => (i.codigo_referencia || '').toLowerCase() === formNovoItem.codigo_referencia.toLowerCase()) && (
                                <span style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>Este código já está em uso no estoque!</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label>Categoria <span style={{ color: '#e53e3e' }}>*</span></label>
                            <CreatableSelect styles={customSelectStyles} options={categoriasEstoque.map(c => ({ value: c.nome || c, label: c.nome || c }))} value={formNovoItem.categoria ? { value: formNovoItem.categoria, label: formNovoItem.categoria } : null} onChange={opt => setFormNovoItem({ ...formNovoItem, categoria: opt ? opt.value : '' })} placeholder="Selecione ou digite..." formatCreateLabel={(val) => `Criar nova: "${val}"`} />
                        </div>
                        <div>
                            <label>Unidade de Medida <span style={{ color: '#e53e3e' }}>*</span></label>
                            <CreatableSelect styles={customSelectStyles} options={unidadesBD.map(u => ({ value: u.nome || u, label: u.nome || u }))} value={formNovoItem.unidade_medida ? { value: formNovoItem.unidade_medida, label: formNovoItem.unidade_medida } : null} onChange={opt => setFormNovoItem({ ...formNovoItem, unidade_medida: opt ? opt.value : '' })} placeholder="Selecione ou digite..." formatCreateLabel={(val) => `Criar nova: "${val}"`} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label>Tipo de Controle <span style={{ color: '#e53e3e' }}>*</span></label>
                            <select value={formNovoItem.tipo_controle} onChange={e => setFormNovoItem({ ...formNovoItem, tipo_controle: e.target.value })} style={inputStyle}>
                                <option value="QUANTIDADE">Quantidade Simples (Granel)</option>
                                <option value="SERIALIZADO">Serializado (Único)</option>
                            </select>
                        </div>
                        <div><label>Estoque Mínimo de Alerta</label><input type="number" placeholder="0" value={formNovoItem.estoque_minimo} onChange={e => setFormNovoItem({ ...formNovoItem, estoque_minimo: e.target.value })} style={inputStyle} /></div>
                    </div>

                    <div><label>Observações / Link</label><textarea rows="2" value={formNovoItem.observacoes} onChange={e => setFormNovoItem({ ...formNovoItem, observacoes: e.target.value })} style={inputStyle} /></div>

                    <button type="submit" className="btn-add" style={{ background: '#3182ce', color: 'white', marginTop: 10 }}>Gravar e Selecionar</button>
                </form>
            </div>
        </div>
    );
}

import { X, CheckSquare } from 'lucide-react';

export default function ModalReceberOC({
    modalBaixa,
    setModalBaixa,
    ocRecebendo,
    dadosBaixa,
    setDadosBaixa,
    itensEstoque,
    handleConfirmarBaixa,
    atualizarDetalheBaixa
}) {
    if (!modalBaixa || !ocRecebendo) return null;

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white', outline: 'none', boxSizing: 'border-box' };

    return (
        <div className="modal-overlay" onClick={() => setModalBaixa(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a202c', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: 30, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                    <h3 style={{ color: '#ecc94b', margin: 0 }}>Receber Material - OC {ocRecebendo.numero}</h3>
                    <button onClick={() => setModalBaixa(false)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={28} /></button>
                </div>

                <form onSubmit={handleConfirmarBaixa} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: '#2d3748', padding: 15, borderRadius: 5 }}>
                            <label style={{ color: '#00d68f', fontWeight: 'bold' }}>Número da Nota Fiscal (NF)*</label>
                            <input required placeholder="Ex: 123456" value={dadosBaixa.numero_nf} onChange={e => setDadosBaixa({ ...dadosBaixa, numero_nf: e.target.value })} style={{ ...inputStyle, marginTop: 5, fontSize: '1.2rem' }} />
                        </div>
                        <div style={{ background: '#2d3748', padding: 15, borderRadius: 5 }}>
                            <label style={{ color: '#a0aec0', fontWeight: 'bold' }}>Observação do Lote (Opcional)</label>
                            <textarea rows="2" placeholder="Ex: Entregue pela Tnt..." value={dadosBaixa.observacao} onChange={e => setDadosBaixa({ ...dadosBaixa, observacao: e.target.value })} style={{ ...inputStyle, marginTop: 5 }} />
                        </div>
                    </div>

                    {ocRecebendo.itens.map(item => {
                        if (item.tipo_item !== 'PRODUTO' && item.tipo_item !== 'ESTOQUE') return null;

                        const est = itensEstoque.find(e => e.id === item.estoque_item_id);
                        if (!est) return null;

                        const catFixa = (est.categoria || '').toUpperCase();

                        if (est.tipo_controle === 'QUANTIDADE' && catFixa !== 'PNEUS') {
                            return (
                                <div key={item.id} style={{ background: '#2d3748', padding: 15, borderRadius: 5, borderLeft: '4px solid #3182ce' }}>
                                    <div style={{ fontWeight: 'bold' }}>{est.nome}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#a0aec0' }}>{item.quantidade}x unidades serão adicionadas automaticamente ao estoque geral.</div>
                                </div>
                            );
                        }

                        const detalhesDesteItem = dadosBaixa.detalhes.map((d, indexGeral) => ({ d, indexGeral })).filter(x => x.d.oc_item_id === item.id);

                        return (
                            <div key={item.id} style={{ background: '#2d3748', padding: 15, borderRadius: 8, border: '1px solid #4a5568' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#63b3ed' }}>Item: {est.nome} (Qtd Comprada: {item.quantidade})</h4>
                                <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: 0 }}>Por favor, preencha os dados físicos de cada unidade entregue.</p>

                                <div style={{ overflowX: 'auto' }}>
                                    <div style={{ minWidth: catFixa === 'PNEUS' ? '650px' : '400px' }}>
                                        {detalhesDesteItem.map(({ d, indexGeral }, i) => (
                                            <div key={indexGeral} style={{
                                                display: 'grid',
                                                gridTemplateColumns: catFixa === 'PNEUS' ? 'repeat(auto-fit, minmax(130px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))',
                                                gap: 10,
                                                marginBottom: 10,
                                                background: '#1a202c',
                                                padding: 10,
                                                borderRadius: 5
                                            }}>
                                                <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#ecc94b', fontWeight: 'bold' }}>Unidade {i + 1}</div>

                                                {catFixa === 'PNEUS' ? (
                                                    <>
                                                        <input required placeholder="DOT (Obrigatório)*" value={d.dot} onChange={e => atualizarDetalheBaixa(indexGeral, 'dot', e.target.value)} style={inputStyle} />
                                                        <input placeholder="Fogo (Opcional)" value={d.fogo} onChange={e => atualizarDetalheBaixa(indexGeral, 'fogo', e.target.value)} style={inputStyle} />
                                                        <input placeholder="Marca (Opcional)" value={d.marca} onChange={e => atualizarDetalheBaixa(indexGeral, 'marca', e.target.value)} style={inputStyle} />
                                                        <input required placeholder="Medida*" value={d.medida} onChange={e => atualizarDetalheBaixa(indexGeral, 'medida', e.target.value)} style={inputStyle} />
                                                        <input type="number" step="0.1" placeholder="Sulco (mm) (Opc)" value={d.sulco_novo} onChange={e => atualizarDetalheBaixa(indexGeral, 'sulco_novo', e.target.value)} style={inputStyle} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <input required placeholder="Nº de Série (Obrigatório)*" value={d.serial} onChange={e => atualizarDetalheBaixa(indexGeral, 'serial', e.target.value)} style={inputStyle} />
                                                        <input placeholder="Nº Patrimônio (Opcional)" value={d.patrimonio} onChange={e => atualizarDetalheBaixa(indexGeral, 'patrimonio', e.target.value)} style={inputStyle} />
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <button type="submit" className="btn-add" style={{ marginTop: 10, padding: 15, background: '#ecc94b', color: 'black', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CheckSquare size={20} style={{ display: 'inline', marginRight: 5 }} /> Confirmar Recebimento de Todos os Itens
                    </button>
                </form>
            </div>
        </div>
    );
}

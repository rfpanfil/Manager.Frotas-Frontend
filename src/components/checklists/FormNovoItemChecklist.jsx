import React from 'react';
import { Save, Plus } from 'lucide-react';

export default function FormNovoItemChecklist({ formItem, setFormItem, handleSaveItem, editingItem }) {
    return (
        <form
            onSubmit={handleSaveItem}
            style={{
                background: '#2d3748',
                padding: 15,
                borderRadius: 5,
                marginBottom: 20,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
                flexWrap: 'wrap'
            }}
        >
            <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Nome do Item</label>
                <input
                    required
                    value={formItem.nome_item}
                    onChange={(e) => setFormItem({ ...formItem, nome_item: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                />
            </div>

            <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Categoria</label>
                <select
                    value={formItem.categoria}
                    onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                >
                    <option>Ferramentas</option>
                    <option>Sinalização & EPC</option>
                    <option>EPI</option>
                    <option>Segurança</option>
                    <option>Instrumentos</option>
                    <option>Geral / Outros</option>
                </select>
            </div>

            <div style={{ width: 80 }}>
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Qtd</label>
                <input
                    type="number"
                    min="1"
                    required
                    value={formItem.quantidade_padrao}
                    onChange={(e) => setFormItem({ ...formItem, quantidade_padrao: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none' }}
                />
            </div>

            <button
                type="submit"
                style={{
                    padding: '9px 15px',
                    background: '#3182ce',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                }}
            >
                {editingItem ? <Save size={18} /> : <Plus size={18} />} {editingItem ? 'Salvar' : 'Adicionar'}
            </button>
        </form>
    );
}

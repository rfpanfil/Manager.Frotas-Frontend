import React from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import FormNovoItemChecklist from './FormNovoItemChecklist';

export default function ModalGerenciarItens({
    isOpen, setShowModalGerenciar,
    checklistItensDef,
    formItem, setFormItem, handleSaveItem, editingItem, startEdit, handleDeleteItem
}) {
    if (!isOpen) return null;

    const grupos = (checklistItensDef || []).reduce((acc, item) => {
        const cat = item.categoria || 'Sem Categoria';
        (acc[cat] ||= []).push(item);
        return acc;
    }, {});
    const categoriasOrdenadas = Object.keys(grupos).sort((a, b) => a.localeCompare(b));

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                zIndex: 1100,
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div className="checklist-gerenciar" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div
                    style={{
                        background: '#1a202c',
                        width: '100%',
                        maxWidth: '800px',
                        height: '80vh',
                        padding: 20,
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h2>Gerenciar Itens do Checklist</h2>
                        <button
                            type="button"
                            onClick={() => setShowModalGerenciar(false)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <X />
                        </button>
                    </div>

                    <FormNovoItemChecklist 
                        formItem={formItem} 
                        setFormItem={setFormItem} 
                        handleSaveItem={handleSaveItem} 
                        editingItem={editingItem} 
                    />

                    <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #4a5568', borderRadius: 5 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #444', background: '#222' }}>
                                    <th style={{ padding: 10 }}>Item</th>
                                    <th>Cat.</th>
                                    <th>Qtd</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {categoriasOrdenadas.map((cat) => (
                                    <React.Fragment key={cat}>
                                        <tr style={{ background: '#111827' }}>
                                            <td colSpan={4} style={{ padding: '10px', color: '#00d68f', fontWeight: 'bold', textAlign: 'left' }}>
                                                {cat}
                                            </td>
                                        </tr>

                                        {grupos[cat].map((item) => (
                                            <tr
                                                key={item.id}
                                                style={{
                                                    borderBottom: '1px solid #2d3748',
                                                    background: item.id === editingItem?.id ? '#2c5282' : 'transparent'
                                                }}
                                            >
                                                <td style={{ padding: 10 }}>{item.nome_item}</td>
                                                <td>
                                                    <span style={{ background: '#4a5568', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem' }}>
                                                        {item.categoria}
                                                    </span>
                                                </td>
                                                <td>{item.quantidade_padrao}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(item)}
                                                        style={{ marginRight: 10, background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

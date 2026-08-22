import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ModalEditarBase({ isOpen, onClose, base, onSuccess }) {
    const [nome, setNome] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && base) {
            setNome(base.nome || '');
        } else {
            setNome('');
        }
    }, [isOpen, base]);

    if (!isOpen || !base) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!nome.trim()) {
            toast.error("O nome da base não pode estar vazio.");
            return;
        }

        setIsSaving(true);
        try {
            await api.put(`/bases/${base.id}`, { nome: nome.trim() });
            toast.success("Base atualizada com sucesso!");
            onSuccess(); // Dispara o recarregamento da tabela
            onClose();   // Fecha o modal
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail || "Erro ao editar a base.";
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: '#1a202c',
                padding: '20px 30px',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                border: '1px solid #2d3748'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Editar Base Operacional</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }} disabled={isSaving}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#a0aec0', fontSize: '0.85rem' }}>ID da Base</label>
                        <input 
                            type="text" 
                            value={base.id} 
                            disabled
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #4a5568',
                                background: '#2d3748',
                                color: '#a0aec0',
                                outline: 'none',
                                cursor: 'not-allowed',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#a0aec0', fontSize: '0.85rem' }}>Nome da Base</label>
                        <input 
                            type="text" 
                            value={nome} 
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Base Central"
                            disabled={isSaving}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #8B5CF6',
                                background: '#1a202c',
                                color: 'white',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            disabled={isSaving}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#4a5568',
                                color: 'white',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#8B5CF6',
                                color: 'white',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 'bold'
                            }}
                        >
                            <Save size={18} />
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

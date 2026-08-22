import React from 'react';
import { X } from 'lucide-react';

export default function ModalFormFornecedor({
    modalAberto,
    setModalAberto,
    form,
    setForm,
    salvar
}) {
    if (!modalAberto) return null;

    const inputStyle = { width: '100%', padding: '10px', background: '#1a202c', border: '1px solid #444', color: 'white', borderRadius: '4px', boxSizing: 'border-box' };

    return (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                    <h3>{form.id ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</h3>
                    <button onClick={() => setModalAberto(false)} className="btn-close-modal"><X /></button>
                </div>
                <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <label>Razão Social / Nome</label>
                        <input 
                            required 
                            value={form.razao_social}
                            onChange={e => setForm({ ...form, razao_social: e.target.value })} 
                            style={inputStyle} 
                        />
                    </div>
                    
                    <div>
                        <label>CNPJ ou CPF</label>
                        <input 
                            required 
                            value={form.cnpj_cpf}
                            onChange={e => setForm({ ...form, cnpj_cpf: e.target.value })} 
                            style={inputStyle} 
                        />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label>Tipo</label>
                            <select 
                                value={form.tipo}
                                onChange={e => setForm({ ...form, tipo: e.target.value })} 
                                style={inputStyle}
                            >
                                <option value="PRODUTO">Produto</option>
                                <option value="SERVICO">Serviço</option>
                            </select>
                        </div>
                        <div>
                            <label>Status</label>
                            <select 
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })} 
                                style={inputStyle}
                            >
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label>Contato (Telefone / E-mail)</label>
                        <input 
                            value={form.contato}
                            onChange={e => setForm({ ...form, contato: e.target.value })} 
                            style={inputStyle} 
                        />
                    </div>
                    
                    <div>
                        <label>Endereço Completo</label>
                        <input 
                            value={form.endereco}
                            onChange={e => setForm({ ...form, endereco: e.target.value })} 
                            style={inputStyle} 
                        />
                    </div>
                    
                    <div>
                        <label>Observações</label>
                        <textarea 
                            rows="2" 
                            value={form.observacao}
                            onChange={e => setForm({ ...form, observacao: e.target.value })} 
                            style={inputStyle} 
                        />
                    </div>
                    
                    <button className="btn-add" style={{ marginTop: 10 }}>
                        {form.id ? 'Salvar Alterações' : 'Salvar Fornecedor'}
                    </button>
                </form>
            </div>
        </div>
    );
}

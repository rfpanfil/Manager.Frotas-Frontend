// Arquivo: frontend/src/pages/Bases.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Building, Plus, Trash2, Search } from 'lucide-react';

export default function Bases() {
    const { can } = useAuth();
    const [bases, setBases] = useState([]);
    const [novaBase, setNovaBase] = useState('');
  
    // --- ESTADO DA BUSCA ---
    const [busca, setBusca] = useState('');

    useEffect(() => { carregarBases(); }, []);

    async function carregarBases() {
        try { const res = await api.get('/bases/'); setBases(res.data); } catch (e) { console.error(e); }
    }

    // --- LÓGICA DE FILTRO ---
    const basesFiltradas = bases.filter(b => 
        b.nome.toLowerCase().includes(busca.toLowerCase())
    );

    async function handleAdd() {
        if (!novaBase) return;
        try {
            await api.post('/bases/', { nome: novaBase });
            setNovaBase('');
            alert("Base criada com sucesso!"); // <--- ALERTA ADICIONADO AQUI
            carregarBases();
        } catch (e) { alert("Erro ao criar base. Verifique se já existe."); }
    }

    async function handleDelete(id) {
        if(!confirm("Excluir esta base?")) return;
        try { await api.delete(`/bases/${id}`); carregarBases(); } catch(e) { alert("Erro ao excluir."); }
    }

    return (
        <div style={{padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
            <div style={{display:'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '20px'}}>
                <h1 style={{display:'flex', alignItems:'center', gap:'10px', margin: 0}}>
                    <Building /> Gerenciar Bases
                </h1>
                
                {/* CAMPO DE BUSCA */}
                <div style={{display: 'flex', alignItems: 'center', background: '#2d3748', borderRadius: '5px', padding: '0 10px'}}>
                    <Search size={18} color="#a0aec0" />
                    <input 
                        placeholder="Filtrar bases..." 
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        style={{background: 'transparent', border: 'none', color: 'white', padding: '8px', outline: 'none', width: '150px'}}
                    />
                </div>
            </div>
            
            {/* ÁREA DE ADICIONAR (SÓ APARECE SE TIVER PERMISSÃO) */}
            {can('bases.gerenciar') && (
                <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                    <input 
                        placeholder="Nome da Nova Base (Ex: Matriz)" 
                        value={novaBase} 
                        onChange={e => setNovaBase(e.target.value)} 
                        style={{flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #4a5568', background: '#2d3748', color: 'white'}}
                    />
                    <button onClick={handleAdd} className="btn-add" style={{background: '#00d68f', color: 'black'}}>
                        <Plus size={20} /> Adicionar
                    </button>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{textAlign: 'center', width: '50px'}}>ID</th>
                            <th>Nome da Base</th>
                            {can('bases.gerenciar') && <th style={{textAlign: 'center', width: '80px'}}>Ação</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {basesFiltradas.map(b => (
                            <tr key={b.id}>
                                {/* CORREÇÃO: COLUNA ID RESTAURADA */}
                                <td style={{textAlign: 'center', color: '#a0aec0'}}>#{b.id}</td>
                                
                                <td>{b.nome}</td>
                                
                                {/* AÇÃO SÓ APARECE SE TIVER PERMISSÃO */}
                                {can('bases.gerenciar') && (
                                    <td style={{textAlign: 'center'}}>
                                        <button onClick={() => handleDelete(b.id)} style={{color: '#e53e3e', background:'none', border:'none', cursor:'pointer'}}>
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
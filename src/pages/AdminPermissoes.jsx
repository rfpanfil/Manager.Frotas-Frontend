// Arquivo: frontend/src/pages/AdminPermissoes.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Check, X, Save, PlusCircle } from 'lucide-react';

export default function AdminPermissoes() {
    const [cargos, setCargos] = useState([]);
    const [modulos, setModulos] = useState({});
    const [matriz, setMatriz] = useState({}); // { cargo_id: [perm_id, perm_id...] }
    const [loading, setLoading] = useState(true);

    useEffect(() => { carregarMatriz(); }, []);

    async function carregarMatriz() {
        try {
            const res = await api.get('/permissoes/matriz');
            setCargos(res.data.estrutura.cargos);
            setModulos(res.data.estrutura.modulos);
            setMatriz(res.data.matriz);
        } catch (error) {
            alert("Erro ao carregar matriz. Verifique se é admin.");
        } finally { setLoading(false); }
    }

    async function handleToggle(cargoId, permId, temPermissao) {
        // Atualização Otimista (Muda na tela antes de confirmar no banco)
        const novaMatriz = { ...matriz };
        if (temPermissao) {
            novaMatriz[cargoId] = novaMatriz[cargoId].filter(id => id !== permId); // Remove
        } else {
            novaMatriz[cargoId] = [...novaMatriz[cargoId], permId]; // Adiciona
        }
        setMatriz(novaMatriz);

        try {
            await api.post(`/permissoes/cargo/${cargoId}/toggle`, {
                permissao_id: permId,
                ativo: !temPermissao
            });
        } catch (error) {
            alert("Erro ao salvar permissão.");
            carregarMatriz(); // Reverte em caso de erro
        }
    }

    async function handleAddCargo() {
        const nome = prompt("Nome do Novo Cargo (Ex: supervisor):");
        if (!nome) return;

        try {
            // Usa a rota existente no backend
            await api.post('/usuarios/cargos/', { nome });
            alert(`Cargo '${nome}' criado! Configure as permissões na nova coluna à direita.`);
            carregarMatriz(); // Recarrega a tabela para mostrar a nova coluna
        } catch (error) {
            alert("Erro ao criar cargo: " + (error.response?.data?.detail || error.message));
        }
    }

    if (loading) return <div style={{padding:30, color:'white'}}>Carregando Matriz...</div>;

    return (
        <div style={{padding: '20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                <h1><Shield style={{marginRight: 10}}/> Gerenciamento de Permissões</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={handleAddCargo} className="btn-add" style={{backgroundColor: '#00d68f', color: '#000', height:'35px', padding:'0 15px', fontSize:'0.9rem'}}>
                        <PlusCircle size={16} style={{marginRight:5}}/> Novo Cargo
                    </button>
                    
                    <button onClick={() => api.post('/permissoes/setup-inicial').then(() => carregarMatriz())} className="btn-add" style={{fontSize:'0.8rem', background:'#4a5568', color:'white', height:'35px'}}>
                        Restaurar Padrões
                    </button>
                </div>
            </div>

            <div className="permissoes-scroll-container">
                <table>
                    <thead>
                        <tr>
                            {/* Canto Fixo Superior Esquerdo */}
                            <th className="sticky-corner">PERMISSÃO / CARGO</th>
                            
                            {/* Cargos Fixos no Topo */}
                            {cargos.map(c => (
                                <th key={c.id} className="sticky-top">
                                    {c.nome.toUpperCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(modulos).map(([nomeModulo, permissoes]) => (
                            <React.Fragment key={nomeModulo}>
                                
                                {/* 1. LINHA DE CABEÇALHO DO MÓDULO (Ex: Financeiro) */}
                                <tr key={`mod-${nomeModulo}`} style={{backgroundColor: '#2d3748'}}>
    
                                {/* CÉLULA 1: Fica presa na esquerda, alinhada com Permissão/Cargo */}
                                <td className="sticky-left" style={{fontWeight: 'bold', color: '#00d68f', borderRight: '1px solid #4a5568'}}>
                                    📂 {nomeModulo.toUpperCase()}
                                </td>

                                {/* CÉLULA 2: Preenche o resto da linha (embaixo dos cargos) com vazio */}
                                <td colSpan={cargos.length} style={{backgroundColor: '#2d3748'}}></td>

                            </tr>
                                
                                {/* 2. LINHAS DAS PERMISSÕES */}
                                {permissoes.map(perm => (
                                    <tr key={perm.id}>
                                        {/* COLUNA 1: NOME DA PERMISSÃO (FIXA NA ESQUERDA) */}
                                        <td className="sticky-left">
                                            {perm.nome}
                                            <div style={{fontSize: '0.75rem', color: '#718096'}}>{perm.slug}</div>
                                        </td>

                                        {/* COLUNAS SEGUINTES: BOTÕES DE CHECK (SEU CÓDIGO ANTIGO FICA AQUI) */}
                                        {cargos.map(cargo => {
                                            const temPermissao = matriz[cargo.id]?.includes(perm.id);
                                            const isAdmin = cargo.nome === 'admin';
                                            
                                            return (
                                                <td key={`${cargo.id}-${perm.id}`} style={{textAlign: 'center'}}>
                                                    <button 
                                                        onClick={() => !isAdmin && handleToggle(cargo.id, perm.id, temPermissao)}
                                                        disabled={isAdmin}
                                                        style={{
                                                            background: 'transparent', border: 'none', cursor: isAdmin ? 'not-allowed' : 'pointer',
                                                            color: temPermissao || isAdmin ? '#00d68f' : '#4a5568'
                                                        }}
                                                    >
                                                        {temPermissao || isAdmin ? <Check size={24} strokeWidth={3} /> : <X size={24} />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment> 
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
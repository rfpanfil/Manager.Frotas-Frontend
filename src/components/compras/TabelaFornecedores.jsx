import React from 'react';
import { Eye } from 'lucide-react';

export default function TabelaFornecedores({
    dadosPaginados,
    dadosFiltrados,
    visibleCount,
    setVisibleCount,
    setFornSelecionado
}) {
    return (
        <>
            <div className="table-container">
                <table>
                    <thead><tr><th>Razão Social</th><th>CNPJ/CPF</th><th>Tipo</th><th>Contato</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                        {dadosPaginados.map(f => (
                            <tr key={f.id}>
                                <td style={{ fontWeight: 'bold' }}>{f.razao_social}</td>
                                <td>{f.cnpj_cpf}</td>
                                <td><span style={{ fontSize: '0.75rem', padding: '3px 6px', background: '#4a5568', borderRadius: 3 }}>{f.tipo}</span></td>
                                <td>{f.contato || '-'}</td>
                                <td><span style={{ color: f.status === 'Ativo' ? '#00d68f' : '#e53e3e' }}>{f.status}</span></td>
                                <td>
                                    <button onClick={() => setFornSelecionado(f)} title="Ver Resumo" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Eye size={18} /> Ver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {visibleCount < dadosFiltrados.length && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={() => setVisibleCount(v => v + 20)} style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '10px 30px', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}>
                        Carregar + ({dadosFiltrados.length - visibleCount} restantes)
                    </button>
                </div>
            )}
        </>
    );
}

import useCan from '../../hooks/useCan';
import { CheckSquare, Printer } from 'lucide-react';

export default function TabelaOrdensCompra({
    dadosPaginados,
    dadosFiltrados,
    formatarM,
    abrirModalBaixa,
    imprimirOC,
    can,
    visibleCount,
    setVisibleCount
}) {
    return (
        <>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Número OC</th>
                            <th>Fornecedor</th>
                            <th>Itens</th>
                            <th>Valor Total</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosPaginados.map(oc => (
                            <tr key={oc.id}>
                                <td style={{ fontWeight: 'bold', color: '#8B5CF6' }}>{oc.numero}</td>
                                <td>{oc.fornecedor?.razao_social}</td>
                                <td style={{ fontSize: '0.85rem', color: '#a0aec0' }}>{oc.itens.length} item(s)</td>
                                <td style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatarM(oc.valor_total)}</td>
                                <td><span style={{ color: oc.status === 'Cancelada' ? '#e53e3e' : '#8B5CF6' }}>{oc.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {oc.status === 'Emitida' && can('compras.oc.receber') && (
                                            <button onClick={() => abrirModalBaixa(oc)} title="Dar Baixa (Receber)">
                                                <CheckSquare size={18} />
                                            </button>
                                        )}
                                        {can('compras.oc.baixar') && (
                                            <button onClick={() => imprimirOC(oc)} title="Imprimir OC" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}>
                                                <Printer size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {dadosFiltrados.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#a0aec0' }}>Nenhuma OC encontrada.</td></tr>}
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

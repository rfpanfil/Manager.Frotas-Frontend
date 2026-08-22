import { X } from 'lucide-react';

export default function ModalDetalhesGasto({ gastoDetalhe, setGastoDetalhe }) {
    if (!gastoDetalhe) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050, padding: '10px' }}>
            <div className="modal-card" style={{ width: '90%', maxWidth: '600px', background: '#1a202c', border: '1px solid #4a5568', padding: '20px', borderRadius: '8px', position: 'relative' }}>
                <button onClick={() => setGastoDetalhe(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><X size={24} /></button>
                <h3 style={{ marginTop: 0, color: '#8B5CF6', borderBottom: '1px solid #2d3748', paddingBottom: '10px', marginBottom: '15px' }}>Detalhes do Lançamento</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                    <div><strong style={{ color: '#a0aec0' }}>Tipo:</strong> {gastoDetalhe.tipo_gasto || gastoDetalhe.tipo}</div>
                    <div><strong style={{ color: '#a0aec0' }}>Valor:</strong> R$ {parseFloat(gastoDetalhe.valor).toFixed(2)}</div>

                    <div><strong style={{ color: '#a0aec0' }}>Data Registrada da Despesa:</strong> {new Date(gastoDetalhe.data).toLocaleString('pt-BR', { timeZone: 'UTC' })}</div>
                    <div><strong style={{ color: '#a0aec0' }}>Base/Centro Custo:</strong> {gastoDetalhe.centro_custo?.nome || gastoDetalhe.veiculo?.base || 'Geral'}</div>

                    <div><strong style={{ color: '#a0aec0' }}>Veículo:</strong> {gastoDetalhe.veiculo ? gastoDetalhe.veiculo.placa : '-'}</div>
                    <div><strong style={{ color: '#a0aec0' }}>Colaborador/Solicitante:</strong> {gastoDetalhe.colaborador ? gastoDetalhe.colaborador.nome : '-'}</div>

                    {gastoDetalhe.combustivel && <div><strong style={{ color: '#a0aec0' }}>Combustível:</strong> {gastoDetalhe.combustivel} ({gastoDetalhe.litros} L)</div>}
                    {gastoDetalhe.km_registro && <div><strong style={{ color: '#a0aec0' }}>KM Odômetro:</strong> {gastoDetalhe.km_registro} km</div>}

                    <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#a0aec0' }}>Descrição:</strong> {gastoDetalhe.descricao || 'Nenhuma'}</div>

                    {/* AUDITORIA */}
                    <div style={{ gridColumn: '1 / -1', background: '#2d3748', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
                        <div style={{ marginBottom: '5px', color: '#f6ad55', fontWeight: 'bold' }}>Dados da Criação (Auditoria):</div>
                        <div><strong style={{ color: '#a0aec0' }}>Lançado no sistema em:</strong> {gastoDetalhe.criado_em ? new Date(gastoDetalhe.criado_em).toLocaleString('pt-BR') : 'Dado antigo (Não registrado)'}</div>
                        <div><strong style={{ color: '#a0aec0' }}>Por usuário:</strong> {gastoDetalhe.criado_por ? gastoDetalhe.criado_por.nome : 'Sistema / Legado'}</div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button onClick={() => setGastoDetalhe(null)} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>Fechar</button>
                </div>
            </div>
        </div>
    );
}

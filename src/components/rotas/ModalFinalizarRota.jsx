import { AlertTriangle } from 'lucide-react';

export default function ModalFinalizarRota({
    modalFinalizar,
    setModalFinalizar,
    rotaSelecionada,
    dadosFinalizacao,
    setDadosFinalizacao,
    stopsParaSelecao,
    confirmarFinalizacao
}) {
    if (!modalFinalizar) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div className="form-card" style={{ width: '500px', background: '#1a202c', border: '1px solid #444', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle color="#f6ad55" /> Finalizar Rota #{modalFinalizar}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="input-group">
                        <label>KM Final (Painel)</label>
                        <input type="number" onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, km_final: e.target.value })} autoFocus />
                    </div>
                    <div className="input-group">
                        <label>Data Chegada</label>
                        <input type="datetime-local" value={dadosFinalizacao.data_retorno} onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, data_retorno: e.target.value })} />
                    </div>
                </div>

                <hr style={{ borderColor: '#444', margin: '20px 0' }} />

                <div className="input-group">
                    <label>Status do Atendimento</label>
                    <select value={dadosFinalizacao.status_atendimento} onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, status_atendimento: e.target.value })}>
                        <option value="Completo">✅ Todos os destinos foram atendidos</option>
                        <option value="Parcial">⚠️ Parcial (Houve imprevisto)</option>
                    </select>
                </div>

                {dadosFinalizacao.status_atendimento === 'Parcial' && (
                    <div className="input-group" style={{ border: '1px solid #f6ad55', padding: '10px', borderRadius: '5px' }}>
                        <label style={{ color: '#f6ad55' }}>Qual foi o ÚLTIMO local atendido?</label>
                        <select onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, ultimo_destino_atendido: e.target.value })}>
                            <option value="">Selecione...</option>
                            {stopsParaSelecao.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                    </div>
                )}

                <div className="input-group">
                    <label>Local de Retorno</label>
                    <select value={dadosFinalizacao.retorno_realizado} onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, retorno_realizado: e.target.value })}>
                        <option value="Base Planejada">🏠 Voltou para a Base/Destino Final Planejado</option>
                        <option value="Outro">📍 Parou em outro lugar (Casa, Oficina...)</option>
                    </select>
                </div>

                {dadosFinalizacao.retorno_realizado === 'Outro' && (
                    <div className="input-group">
                        <label>Onde parou?</label>
                        <input placeholder="Ex: Oficina Mecânica" onChange={e => setDadosFinalizacao({ ...dadosFinalizacao, local_retorno_alternativo: e.target.value })} />
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={confirmarFinalizacao} className="btn-add" style={{ flex: 1, backgroundColor: '#00d68f', color: '#000', padding: '10px' }}>Confirmar Encerramento</button>
                    <button onClick={() => setModalFinalizar(null)} className="btn-add" style={{ flex: 1, backgroundColor: '#e53e3e', color: 'white', padding: '10px' }}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}

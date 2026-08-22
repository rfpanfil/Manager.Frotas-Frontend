import { Map, X, Clock, MapPin, ArrowRight } from 'lucide-react';
import AddressInput from './AddressInput';

export default function ModalNovaRota({
    editandoId,
    fecharModal,
    handleSubmit,
    handleVeiculoChangeManual,
    preencherHoje,
    adicionarParada,
    removerParada,
    atualizarParada,
    form,
    setForm,
    veiculos,
    colaboradores,
    paradasIntermediarias,
    destinoFinal,
    setDestinoFinal,
    can,
    user
}) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="form-card" style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: '#1a202c', border: '1px solid #4a5568', padding: '30px' }}>
                <button onClick={fecharModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}>
                    <X size={28} />
                </button>

                <h3 style={{ marginTop: 0, marginBottom: '25px', color: editandoId ? '#3182ce' : '#8B5CF6', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Map /> {editandoId ? 'Editar Viagem' : 'Nova Viagem Manual'}
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                            <label>Colaborador Responsável</label>
                            <select value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })} required>
                                <option value="">Selecione...</option>
                                {(can('rotas.visao_global') ? colaboradores : colaboradores.filter(c => c.usuario_id === user?.id)).map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Veículo</label>
                            <select value={form.veiculo_id} onChange={handleVeiculoChangeManual} required>
                                <option value="">Selecione...</option>
                                {veiculos.map(v => (
                                    <option key={v.id} value={v.id}>{v.identificacao || v.modelo} (KM: {v.km_atual ?? 0})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '5px' }}>
                                <label style={{ marginBottom: 0 }}>Saída</label>
                                <button type="button" onClick={preencherHoje} title="Preencher com Data e Hora atuais"
                                    style={{
                                        background: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8B5CF6', color: '#8B5CF6',
                                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '5px',
                                        display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s'
                                    }}>
                                    <Clock size={12} /> AGORA
                                </button>
                            </div>
                            <input type="datetime-local" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>KM Saída</label>
                            <input type="number" value={form.km_inicial} onChange={e => setForm({ ...form, km_inicial: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>Prev. Chegada</label>
                            <input type="datetime-local" value={form.previsao_retorno} onChange={e => setForm({ ...form, previsao_retorno: e.target.value })} />
                        </div>
                    </div>

                    <hr style={{ borderColor: '#4a5568', margin: '10px 0' }} />

                    <h4 style={{ margin: '0 0 10px 0', color: '#a0aec0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Itinerário (Digite para buscar endereços)</h4>

                    <div className="input-group">
                        <label style={{ color: '#fff' }}><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Origem</label>
                        <AddressInput
                            value={form.origem}
                            onChange={val => setForm({ ...form, origem: val })}
                            placeholder="Ex: Base Central, Rua X..."
                            required
                        />
                    </div>

                    {paradasIntermediarias.map((parada, index) => (
                        <div key={index} className="input-group" style={{ marginLeft: '20px', borderLeft: '2px solid #4a5568', paddingLeft: '10px' }}>
                            <label style={{ color: '#a0aec0', display: 'flex', justifyContent: 'space-between' }}>
                                <span><ArrowRight size={14} style={{ verticalAlign: 'middle' }} /> Parada Intermediária {index + 1}</span>
                                <button type="button" onClick={() => removerParada(index)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.8rem' }}>Remover</button>
                            </label>
                            <AddressInput
                                value={parada}
                                onChange={val => atualizarParada(index, val)}
                                placeholder="Ex: Cliente A, Entrega X..."
                            />
                        </div>
                    ))}

                    <button type="button" onClick={adicionarParada} style={{ background: 'rgba(49, 130, 206, 0.1)', border: '1px dashed #3182ce', color: '#63b3ed', padding: '8px', borderRadius: '5px', cursor: 'pointer', textAlign: 'center', width: 'fit-content', marginLeft: '20px' }}>
                        + Adicionar Novo Destino/Parada
                    </button>

                    <div className="input-group">
                        <label style={{ color: '#8B5CF6', fontWeight: 'bold' }}><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Destino Final (ou Retorno)</label>
                        <AddressInput
                            value={destinoFinal}
                            onChange={val => setDestinoFinal(val)}
                            placeholder="Ex: Rua Y, ou Retorno Base..."
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #4a5568', paddingTop: '15px' }}>
                        <button type="button" onClick={fecharModal} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white' }}>Cancelar</button>
                        <button type="submit" className="btn-add" style={{ backgroundColor: editandoId ? '#3182ce' : '#8B5CF6', color: editandoId ? 'white' : 'black' }}>
                            {editandoId ? 'Salvar Alterações' : 'Iniciar Viagem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

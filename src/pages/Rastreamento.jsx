// Arquivo: frontend/src/pages/Rastreamento.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { Search, MapPin, Calendar, FileText, X } from 'lucide-react'; // Adicionei FileText e X
import Select from 'react-select';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext'; // <--- IMPORTADO

// Configuração de ícones
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Estilo do Select
const customStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: '#2d3748',
        border: 'none',
        color: 'white',
        minWidth: '200px' // Reduzi um pouco para mobile
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    menu: (base) => ({ ...base, backgroundColor: '#1a202c', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#00d68f' : '#1a202c',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' })
};

// Componente para ajustar zoom
function AjustarZoom({ pontos }) {
    const map = useMap();
    useEffect(() => {
        if (pontos && pontos.length > 0) {
            const bounds = pontos.map(p => [p.latitude, p.longitude]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [pontos, map]);
    return null;
}

export default function Rastreamento() {
    const { user, can } = useAuth(); // <--- HOOK INICIADO
    const [colaboradores, setColaboradores] = useState([]);
    const [selectedColaborador, setSelectedColaborador] = useState(null);
    const [dataBusca, setDataBusca] = useState(new Date().toISOString().slice(0, 10));
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estado para controlar a sidebar no mobile
    const [resumoAberto, setResumoAberto] = useState(false);

    useEffect(() => {
        carregarColaboradores();
    }, []);

    async function carregarColaboradores() {
        try {
            const res = await api.get('/colaboradores/');
            setColaboradores(res.data);
        } catch (e) { console.error(e); }
    }

    // --- TRAVA DE VISÃO GLOBAL DINÂMICA ---
    const colaboradoresFiltrados = can('rastreamento.visao_global') ? colaboradores : colaboradores.filter(c => c.usuario_id === user?.id);
    const opcoesColaboradores = colaboradoresFiltrados.map(m => ({
        value: m.nome,
        label: m.nome
    }));

    async function buscarHistorico() {
        if (!selectedColaborador) return alert("Selecione um colaborador");

        setLoading(true);
        setResultado(null);
        setResumoAberto(false); // Fecha o resumo ao iniciar nova busca para ver o mapa

        try {
            const res = await api.get(`/telemetria/rota_diaria`, {
                params: {
                    device_id: selectedColaborador.value,
                    data: dataBusca
                }
            });

            if (res.data.pontos.length === 0) {
                alert("Nenhum dado encontrado para este colaborador nesta data."); // Texto ajustado
            } else {
                setResultado(res.data);
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao buscar histórico.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

            {/* BARRA DE FILTROS */}
            <div className="filter-bar" style={{ borderBottom: '1px solid #2d3748', margin: 0, borderRadius: 0 }}>

                <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0aec0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Colaborador/Veículo</label>
                    <Select
                        options={opcoesColaboradores}
                        value={selectedColaborador}
                        onChange={setSelectedColaborador}
                        placeholder="Selecione..."
                        styles={customStyles}
                    />
                </div>

                <div>
                    <label style={{ color: '#a0aec0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Data</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#2d3748', borderRadius: '4px', padding: '0 10px', height: '38px' }}>
                        <Calendar size={18} color="#a0aec0" style={{ marginRight: '10px' }} />
                        <input
                            type="date"
                            value={dataBusca}
                            onChange={e => setDataBusca(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontFamily: 'inherit', width: '110px' }}
                        />
                    </div>
                </div>

                <div style={{ alignSelf: 'flex-end' }}>
                    <button
                        onClick={buscarHistorico}
                        className="btn-add"
                        style={{ height: '38px', backgroundColor: '#00d68f', color: '#000', display: 'flex', alignItems: 'center', padding: '0 20px' }}
                        disabled={loading}
                    >
                        {loading ? "..." : <Search size={18} />}
                    </button>
                </div>
            </div>

            {/* MAPA E RESULTADOS (LAYOUT FLEXÍVEL) */}
            <div className="track-layout">

                {/* SIDEBAR DE RESUMO (Classe controla se aparece ou não no mobile) */}
                {resultado && (
                    <div className={`track-sidebar ${resumoAberto ? 'open' : ''}`}>

                        {/* O BOTÃO PRECISA ESTAR AQUI */}
                        <button className="btn-track-close" onClick={() => setResumoAberto(false)}>
                            <X size={24} />
                        </button>

                        <h3 style={{ color: '#fff', marginTop: 0 }}>Resumo do Dia</h3>
                        <div style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '20px' }}>
                            <p style={{ margin: '5px 0' }}><strong>Colaborador:</strong> {selectedColaborador.label}</p>
                            <p style={{ margin: '5px 0' }}><strong>Data:</strong> {new Date(dataBusca).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        </div>

                        <div className="card-info" style={{ background: '#1a202c', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                            <div style={{ color: '#718096', fontSize: '0.8rem' }}>Distância Total</div>
                            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{resultado.resumo.km_total} km</div>
                        </div>

                        <div className="card-info" style={{ background: '#1a202c', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                            <div style={{ color: '#718096', fontSize: '0.8rem' }}>Velocidade Máx.</div>
                            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{resultado.resumo.vel_max} km/h</div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#fff' }}>Cronologia</h4>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#e2e8f0', fontSize: '0.9rem' }}>
                                <li style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '2px solid #00d68f' }}>
                                    <strong>{resultado.resumo.inicio}</strong> - Início<br />
                                    <small style={{ color: '#a0aec0' }}>{resultado.resumo.endereco_inicio}</small>
                                </li>
                                {resultado.paradas.map((p, i) => (
                                    <li key={i} style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '2px solid #f6ad55' }}>
                                        <strong>{new Date(p.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> - Parada ({p.duracao_fmt})<br />
                                        <small style={{ color: '#a0aec0' }}>{p.endereco}</small>
                                    </li>
                                ))}
                                <li style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '2px solid #e53e3e' }}>
                                    <strong>{resultado.resumo.fim}</strong> - Fim<br />
                                    <small style={{ color: '#a0aec0' }}>{resultado.resumo.endereco_fim}</small>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* ÁREA DO MAPA */}
                <div className="track-map">

                    {/* Botão Flutuante VER RESUMO (Só Mobile) */}
                    {resultado && !resumoAberto && (
                        <button
                            className="btn-track-toggle"
                            onClick={() => setResumoAberto(true)}
                        >
                            <FileText size={16} /> Ver Resumo
                        </button>
                    )}

                    {resultado ? (
                        <MapContainer center={[resultado.pontos[0].latitude, resultado.pontos[0].longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                            <Polyline positions={resultado.rota_suave || resultado.rotasuave} color="#3182ce" weight={4} />

                            <Marker position={[resultado.pontos[0].latitude, resultado.pontos[0].longitude]}>
                                <Popup>🚩 Início: {resultado.resumo.inicio}</Popup>
                            </Marker>
                            <Marker position={[resultado.pontos[resultado.pontos.length - 1].latitude, resultado.pontos[resultado.pontos.length - 1].longitude]}>
                                <Popup>🏁 Fim: {resultado.resumo.fim}</Popup>
                            </Marker>

                            {resultado.paradas && resultado.paradas.map((p, idx) => (
                                <Marker key={`parada-${idx}`} position={[p.lat, p.lon]} opacity={0.8}>
                                    <Popup>
                                        <strong>Parada: {p.duracao_fmt}</strong><br />
                                        {p.endereco}
                                    </Popup>
                                </Marker>
                            ))}

                            <AjustarZoom pontos={resultado.pontos} />
                        </MapContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096', background: '#e2e8f0', flexDirection: 'column' }}>
                            <MapPin size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p style={{ textAlign: 'center', padding: '0 20px' }}>Selecione um colaborador e clique na Lupa.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
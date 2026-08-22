// Arquivo: frontend/src/pages/MapaFrota.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { Truck, RefreshCcw, User, Wifi, WifiOff, MapPin } from 'lucide-react';
import L from 'leaflet';
import Select from 'react-select';
import { useAuth } from '../contexts/AuthContext'; // <--- IMPORTADO

// --- Configuração dos Ícones ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Ícone SVG Personalizado
const truckIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3182ce" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="1" y="3" width="15" height="13"></rect>
  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
  <circle cx="5.5" cy="18.5" r="2.5"></circle>
  <circle cx="18.5" cy="18.5" r="2.5"></circle>
</svg>`;

const customIcon = L.divIcon({
    className: 'custom-icon',
    html: truckIconSvg,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const customStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: '#2d3748',
        border: 'none',
        color: 'white',
        minWidth: '250px'
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

function ControladorMapa({ foco }) {
    const map = useMap();
    useEffect(() => {
        if (foco) {
            map.flyTo([foco.lat, foco.lon], 15, { animate: true });
        }
    }, [foco, map]);
    return null;
}

export default function MapaFrota() {
    const { user, can } = useAuth(); // <--- HOOK INICIADO
    const [ativos, setAtivos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState(null);
    const [focoMapa, setFocoMapa] = useState(null);

    useEffect(() => {
        carregarFrota();
        const intervalo = setInterval(carregarFrota, 3000);
        return () => clearInterval(intervalo);
    }, []);

    async function carregarFrota() {
        setLoading(true);
        try {
            // Busca rotas ativas (Colaborador + Veículo)
            const response = await api.get('/telemetria/frota_atual');
            setAtivos(response.data);
        } catch (error) {
            console.error("Erro ao carregar frota:", error);
        } finally {
            setLoading(false);
        }
    }

    // --- TRAVA DE VISÃO GLOBAL DINÂMICA ---
    // Se não tiver visão global, filtra para mostrar apenas o veículo do próprio usuário
    const ativosFiltrados = can('rastreamento.visao_global')
        ? ativos
        : ativos.filter(item => item.colaborador === user?.nome); // Fallback pelo nome do usuário

    const opcoesSelect = ativosFiltrados.map(item => ({
        value: item.id,
        label: `${item.colaborador} - ${item.veiculo}`
    }));

    const listaExibicao = filtro
        ? ativosFiltrados.filter(item => item.id === filtro.value)
        : ativosFiltrados;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>

            <div style={{ padding: '15px 20px', background: '#1a202c', borderBottom: '1px solid #2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={24} color="#00d68f" /> Rotas Ativas (Equipe)
                </h2>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Select
                        options={opcoesSelect}
                        value={filtro}
                        onChange={(opt) => {
                            setFiltro(opt);
                            if (opt) {
                                const alvo = ativos.find(a => a.id === opt.value);
                                if (alvo && alvo.latitude) setFocoMapa({ lat: alvo.latitude, lon: alvo.longitude });
                            }
                        }}
                        placeholder="Buscar colaborador..."
                        styles={customStyles}
                        isClearable
                    />

                    <button
                        onClick={carregarFrota}
                        title="Atualizar Agora"
                        style={{ background: '#2d3748', border: 'none', color: loading ? '#00d68f' : 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#e2e8f0' }}>
                <MapContainer center={[-25.4284, -49.2733]} zoom={12} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    <ControladorMapa foco={focoMapa} />

                    <MarkerClusterGroup chunkedLoading>
                        {listaExibicao.map((item) => (
                            (item.latitude && item.longitude) && (
                                <Marker
                                    key={item.id}
                                    position={[item.latitude, item.longitude]}
                                    icon={customIcon}
                                    eventHandlers={{
                                        click: () => setFocoMapa({ lat: item.latitude, lon: item.longitude }),
                                    }}
                                >
                                    <Popup minWidth={250}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '5px', color: '#2d3748' }}>
                                                <User size={16} />
                                                <strong style={{ fontSize: '1.1rem' }}>{item.colaborador}</strong>
                                            </div>

                                            <div style={{ background: '#f7fafc', padding: '5px', borderRadius: '5px', fontSize: '0.9rem', marginBottom: '10px' }}>
                                                🚗 {item.veiculo}
                                            </div>

                                            <div style={{ textAlign: 'left', fontSize: '0.85rem', color: '#4a5568', marginBottom: '10px', paddingLeft: '5px', borderLeft: '3px solid #3182ce' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <MapPin size={12} /> <strong>Destino:</strong>
                                                </div>
                                                {item.destino.split('|')[0]}
                                            </div>

                                            <hr style={{ margin: '5px 0', border: '0', borderTop: '1px solid #eee' }} />

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    {item.status_conexao === 'Online' ? <Wifi size={14} color="#00d68f" /> : <WifiOff size={14} color="#e53e3e" />}
                                                    <span style={{ color: item.status_conexao === 'Online' ? '#00d68f' : '#e53e3e', fontWeight: 'bold' }}>
                                                        {item.status_conexao}
                                                    </span>
                                                </div>
                                                <div><strong>{item.velocidade} km/h</strong></div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: '3px', textAlign: 'right' }}>
                                                {new Date(item.ultima_atualizacao).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>

                <div style={{
                    position: 'absolute', bottom: 20, left: 20, zIndex: 1000,
                    background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '5px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.2)', fontSize: '0.8rem'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#2d3748' }}>Status:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <div style={{ width: 10, height: 10, background: '#00d68f', borderRadius: '50%' }}></div> Em Rota (Online)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: 10, height: 10, background: '#718096', borderRadius: '50%' }}></div> Sem sinal recente
                    </div>
                </div>
            </div>
        </div>
    );
}
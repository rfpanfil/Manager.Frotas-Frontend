import { useState } from 'react';
import { MapPin, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Dados para configurar o app de GPS do colaborador (ex.: Traccar Client):
// a URL já leva a chave do rastreador, sem a qual o servidor recusa as posições.
export default function ConfigRastreador({ colaboradorId }) {
    const [config, setConfig] = useState(null);
    const [carregando, setCarregando] = useState(false);

    async function mostrar() {
        setCarregando(true);
        try {
            const { data } = await api.get(`/telemetria/rastreador/${colaboradorId}`);
            const base = api.defaults.baseURL || window.location.origin;
            setConfig({ ...data, url: `${base}/telemetria?token=${data.token}` });
        } catch (error) {
            toast.error(typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Não foi possível carregar a configuração.');
        } finally {
            setCarregando(false);
        }
    }

    function copiar(texto) {
        navigator.clipboard.writeText(texto).then(() => toast.success('Copiado!'), () => toast.error('Não foi possível copiar.'));
    }

    const linha = (rotulo, valor) => (
        <div style={{ marginBottom: 8 }}>
            <div style={{ color: '#a0aec0', fontSize: '0.75rem' }}>{rotulo}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <code style={{ flex: 1, background: '#1a202c', padding: '6px 8px', borderRadius: 4, fontSize: '0.75rem', wordBreak: 'break-all', color: '#e2e8f0' }}>{valor}</code>
                <button type="button" onClick={() => copiar(valor)} title="Copiar" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer', display: 'flex' }}><Copy size={16} /></button>
            </div>
        </div>
    );

    return (
        <div style={{ marginTop: 15, background: '#2d3748', padding: 15, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} /> Rastreador GPS</span>
                {!config && (
                    <button type="button" onClick={mostrar} disabled={carregando} style={{ background: '#4a5568', color: 'white', border: 'none', borderRadius: 5, padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        {carregando ? 'Carregando...' : 'Mostrar configuração'}
                    </button>
                )}
            </div>
            {config && (
                <div style={{ marginTop: 12 }}>
                    {linha('URL do servidor (no app de GPS)', config.url)}
                    {linha('Identificador do dispositivo', config.device_id)}
                    <p style={{ color: '#a0aec0', fontSize: '0.75rem', margin: '6px 0 0' }}>
                        A URL contém a chave deste colaborador: não compartilhe com outras pessoas. Sem ela, as posições são recusadas.
                    </p>
                </div>
            )}
        </div>
    );
}

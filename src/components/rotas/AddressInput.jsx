import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin } from 'lucide-react';

// --- COMPONENTE DE AUTOCOMPLETAR (NOMINATIM / OPENSTREETMAP) ---
export default function AddressInput({ value, onChange, placeholder, required = false }) {
    const [sugestoes, setSugestoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrandoLista, setMostrandoLista] = useState(false);
    const wrapperRef = useRef(null);

    // Fecha a lista se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setMostrandoLista(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (value.length > 4 && mostrandoLista) {
                setLoading(true);
                try {
                    // addressdetails=1 Traz os campos separados (rua, bairro, cidade...)
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${value}&addressdetails=1&limit=5&countrycodes=br`);
                    const data = await response.json();
                    setSugestoes(data);
                } catch (error) {
                    console.error("Erro ao buscar endereço", error);
                } finally {
                    setLoading(false);
                }
            }
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [value, mostrandoLista]);

    // --- A MÁGICA ACONTECE AQUI ---
    function formatarEnderecoLimpo(item) {
        const adr = item.address;

        // 1. Tenta pegar o nome da rua (pode vir com chaves diferentes)
        const rua = adr.road || adr.pedestrian || adr.street || item.name || '';

        // 2. Tenta pegar o número que a API retornou OU o que o usuário digitou
        let numero = adr.house_number || '';
        if (!numero) {
            // Se a API não achou número, procura números no que o usuário digitou (ex: "Rua X 556")
            const numeroDigitado = value.match(/\b\d+\b/);
            if (numeroDigitado) numero = numeroDigitado[0];
        }

        // 3. Pega bairro e cidade
        const bairro = adr.suburb || adr.neighbourhood || adr.residential || '';
        const cidade = adr.city || adr.town || adr.municipality || adr.village || '';
        const estado = adr.state_code || adr.state || ''; // state_code costuma ser "PR", "SP"

        // 4. Monta a string curta e bonita
        let resultado = rua;
        if (numero) resultado += `, ${numero}`;
        if (bairro) resultado += `, ${bairro}`;
        if (cidade) resultado += ` - ${cidade}`;
        if (estado) resultado += `/${estado}`;

        if (resultado.length < 5) {
            return item.display_name.split(', Região')[0];
        }

        return resultado;
    }

    function selecionarEndereco(item) {
        const enderecoFormatado = formatarEnderecoLimpo(item);
        onChange(enderecoFormatado);
        setMostrandoLista(false);
        setSugestoes([]);
    }

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setMostrandoLista(true);
                    }}
                    onFocus={() => value.length > 2 && setMostrandoLista(true)}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                    style={{ width: '100%', paddingRight: loading ? '30px' : '10px' }}
                />
                {loading && (
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                        <Loader2 className="spin" size={16} color="#00d68f" />
                    </div>
                )}
            </div>

            {mostrandoLista && sugestoes.length > 0 && (
                <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: '#1a202c', border: '1px solid #4a5568', zIndex: 1500,
                    listStyle: 'none', padding: 0, margin: 0,
                    borderRadius: '0 0 5px 5px', boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                    maxHeight: '200px', overflowY: 'auto'
                }}>
                    {sugestoes.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => selecionarEndereco(item)}
                            style={{
                                padding: '10px', borderBottom: '1px solid #2d3748', cursor: 'pointer',
                                fontSize: '0.85rem', color: '#e2e8f0', transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#2d3748'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                <MapPin size={12} color="#00d68f" />
                                <strong>{item.address.road || item.name}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginLeft: 17 }}>
                                {[
                                    item.address.suburb,
                                    item.address.city || item.address.town,
                                    item.address.state
                                ].filter(Boolean).join(' - ')}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

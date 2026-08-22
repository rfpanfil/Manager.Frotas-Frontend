// Arquivo: frontend/src/pages/Otimizador.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Plus, Navigation, Trash2, Calculator, Map,
    PlayCircle, Flag, Edit2, Check, X, FileText, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Otimizador() {
    const { user, can } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [veiculos, setVeiculos] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);

    // Estados para edição de nome
    const [editandoIndex, setEditandoIndex] = useState(-1);
    const [textoEditado, setTextoEditado] = useState("");

    // Estados para Multi-Links do Mapa
    const [linksMapa, setLinksMapa] = useState([]);
    const [showModalMapa, setShowModalMapa] = useState(false);

    const [selecaoFinal, setSelecaoFinal] = useState({ veiculo_id: '', colaborador_id: '', km_saida: '' });
    const [origem, setOrigem] = useState('');
    const [destinoFinal, setDestinoFinal] = useState('');
    const [servicos, setServicos] = useState([{ endereco: '', valor: '', descricao: '' }]);

    useEffect(() => {
        carregarListas();
    }, []);

    async function carregarListas() {
        try {
            const [resV, resC] = await Promise.all([api.get('/veiculos/'), api.get('/colaboradores/')]);
            setVeiculos(resV.data);
            setColaboradores(resC.data);
        } catch (e) { console.error(e); }
    }

    function handleVeiculoChange(e) {
        const vId = e.target.value;
        const veiculoSelecionado = veiculos.find(v => v.id === parseInt(vId));
        setSelecaoFinal({
            ...selecaoFinal,
            veiculo_id: vId,
            km_saida: veiculoSelecionado ? (veiculoSelecionado.km_atual ?? 0) : ''
        });
    }

    function iniciarEdicao(index, valorAtual) {
        setEditandoIndex(index);
        setTextoEditado(valorAtual);
    }

    function cancelarEdicao() {
        setEditandoIndex(-1);
        setTextoEditado("");
    }

    function salvarEdicao(index) {
        const novaRota = [...resultado.rota_ordenada];
        novaRota[index].endereco = textoEditado;

        setResultado({
            ...resultado,
            rota_ordenada: novaRota
        });
        setEditandoIndex(-1);
    }

    // --- ESTRATÉGIA DE MAPA INTELIGENTE (MULTI-LINKS) ---
    function gerarLinksMapa() {
        if (!resultado) return;

        // 1. Unifica todos os pontos numa lista única (Origem + Paradas + Destino)
        const pontoOrigem = resultado.origem_coordenadas || encodeURIComponent(origem);

        // Pega as paradas. Se tiver coordenada técnica, usa ela. Senão, usa o endereço.
        const paradas = resultado.rota_ordenada.map(item =>
            item.coordenadas ? item.coordenadas : encodeURIComponent(item.endereco)
        );

        const todosPontos = [pontoOrigem, ...paradas];

        // 2. Fatiar em blocos de 10 (Limite do Google: Origem + Destino + 8 Waypoints = 10 pontos)
        const LIMIT = 10;
        const novosLinks = [];
        let i = 0;

        // Loop enquanto não chegarmos ao último ponto
        while (i < todosPontos.length - 1) {
            // O próximo bloco vai do índice 'i' até 'i + 9' (totalizando 10 pontos)
            let nextIndex = i + (LIMIT - 1);

            // Se passar do tamanho da lista, ajusta para o último
            if (nextIndex >= todosPontos.length) {
                nextIndex = todosPontos.length - 1;
            }

            // Define Origem, Destino e Waypoints deste trecho
            const trechoOrigem = todosPontos[i];
            const trechoDestino = todosPontos[nextIndex];
            // Waypoints são os pontos entre a origem e o destino do trecho
            const trechoWaypoints = todosPontos.slice(i + 1, nextIndex).join('|');

            const url = `https://www.google.com/maps/dir/?api=1&origin=${trechoOrigem}&destination=${trechoDestino}&waypoints=${trechoWaypoints}&travelmode=driving`;

            novosLinks.push({
                url: url,
                label: `Parte ${novosLinks.length + 1} (Pontos ${i + 1} a ${nextIndex + 1})`
            });

            // O PRÓXIMO TRECHO COMEÇA ONDE ESTE TERMINOU
            // Isso garante a continuidade que você pediu
            i = nextIndex;
        }

        setLinksMapa(novosLinks);

        // Se só tiver 1 link, abre direto. Se tiver mais, abre o modal.
        if (novosLinks.length === 1) {
            window.open(novosLinks[0].url, '_blank');
        } else {
            setShowModalMapa(true);
        }
    }

    function gerarRelatorioPDF() {
        if (!resultado) return;

        const doc = new jsPDF();
        const verdeMarca = [0, 214, 143];
        const cinzaEscuro = [40, 40, 40];

        doc.setFillColor(...cinzaEscuro);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(...verdeMarca);
        doc.setFontSize(22);
        doc.text("Relatório de Rota Otimizada", 14, 20);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(245, 245, 245);

        doc.rect(14, 50, 50, 20, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text("KM TOTAL", 16, 56);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`${resultado.resumo.distancia_total_km} km`, 16, 65);

        doc.rect(70, 50, 50, 20, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text("TEMPO EST.", 72, 56);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`${resultado.resumo.tempo_total_min} min`, 72, 65);

        doc.rect(126, 50, 70, 20, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text("FATURAMENTO ESTIMADO", 128, 56);
        doc.setTextColor(...verdeMarca);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`R$ ${resultado.resumo.valor_total}`, 128, 65);
        doc.setFont(undefined, 'normal');

        const tableData = resultado.rota_ordenada.map((item, index) => {
            let tipo = "";
            if (item.tipo === 'servico') tipo = "Serviço";
            if (item.tipo === 'final') tipo = "Destino";

            return [
                index + 1,
                tipo,
                item.endereco,
                `+${item.distancia_anterior} km`,
                `+${item.tempo_anterior} min`,
                item.valor ? `R$ ${item.valor}` : '-'
            ];
        });

        tableData.unshift(['0', 'Origem', origem, '-', '-', '-']);

        autoTable(doc, {
            startY: 80,
            head: [['#', 'Tipo', 'Local / Endereço', 'Distância', 'Tempo', 'Valor']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: cinzaEscuro, textColor: [255, 255, 255] },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 10 },
                2: { cellWidth: 80 },
            }
        });

        const finalY = doc.lastAutoTable.finalY + 30;
        doc.setDrawColor(0, 0, 0);
        doc.line(14, finalY, 90, finalY);
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text("Assinatura do Motorista", 14, finalY + 5);

        doc.save(`rota_otimizada_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    function addServico() { setServicos([...servicos, { endereco: '', valor: '', descricao: '' }]); }
    function removeServico(idx) { setServicos(servicos.filter((_, i) => i !== idx)); }

    function handleServiceChange(index, campo, valor) {
        const nova = [...servicos];
        nova[index][campo] = valor;
        setServicos(nova);
    }

    async function handleOtimizar() {
        if (!origem) return toast("Digite o endereço de partida.");
        const validos = servicos.filter(s => s.endereco && s.valor);
        if (validos.length === 0) return toast("Adicione serviços.");

        setLoading(true);
        try {
            const response = await api.post('/otimizador/calcular', {
                origem,
                destino_final: destinoFinal || null,
                servicos: validos
            });
            setResultado(response.data);
        } catch (error) {
            toast.error("Erro: " + (error.response?.data?.detail || error.message));
        } finally { setLoading(false); }
    }

    async function handleIniciarRotaOficial() {
        if (!selecaoFinal.veiculo_id || !selecaoFinal.colaborador_id || !selecaoFinal.km_saida) return toast.error("Preencha os dados de saída.");

        const agora = new Date();
        const minEst = resultado.resumo.tempo_total_min * 1.2;
        const previsao = new Date(agora.getTime() + minEst * 60000);
        const desc = resultado.rota_ordenada.map(s => s.endereco.split(',')[0]).join(' ➝ ');

        const payload = {
            data_inicio: agora.toISOString(),
            previsao_retorno: previsao.toISOString(),
            origem: origem,
            destino: desc,
            km_inicial: parseFloat(selecaoFinal.km_saida) || 0,
            veiculo_id: parseInt(selecaoFinal.veiculo_id),
            colaborador_id: parseInt(selecaoFinal.colaborador_id)
        };

        try {
            await api.post('/rotas/', payload);
            navigate('/rotas');
        } catch (error) {
            toast.error("Erro ao salvar. Verifique a conexão.");
        }
    }

    return (
        <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Navigation /> Otimizador de Rotas</h1>

            {/* MODAL DE LINKS DO MAPA (APARECE SE TIVER MUITOS PONTOS) */}
            {showModalMapa && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#1a202c', padding: '30px', borderRadius: '10px', width: '400px', border: '1px solid #4a5568' }}>
                        <h3 style={{ marginTop: 0, color: 'white' }}>Rota Muito Longa</h3>
                        <p style={{ color: '#a0aec0', marginBottom: '20px' }}>
                            O Google Maps aceita no máximo 10 pontos por vez. Dividimos sua rota em partes sequenciais:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {linksMapa.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: '#2d3748', padding: '15px', borderRadius: '5px',
                                        color: 'white', textDecoration: 'none', fontWeight: 'bold',
                                        borderLeft: '4px solid #00d68f'
                                    }}
                                >
                                    {link.label} <ExternalLink size={18} />
                                </a>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowModalMapa(false)}
                            style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#e53e3e', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', marginTop: '20px' }}>

                {/* ESQUERDA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-card" style={{ borderLeft: '4px solid #d69e2e' }}>
                        <h3>1. Configuração da Viagem</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>Ponto de Partida (Início)</label>
                                <input placeholder="Ex: Garagem da Empresa" value={origem} onChange={e => setOrigem(e.target.value)} style={{ width: '95%', height: '30px', fontSize: '1rem' }} />
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>Ponto de Retorno (Fim)</label>
                                <input placeholder="Deixe vazio para mesmo endereço do ponto de partida" value={destinoFinal} onChange={e => setDestinoFinal(e.target.value)} style={{ width: '95%', height: '30px', fontSize: '1rem' }} />
                            </div>
                        </div>
                    </div>

                    <div className="form-card" style={{ borderLeft: '4px solid #3182ce' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                            <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>2. Lista de Serviços</h3>
                            <button onClick={addServico} className="btn-add" style={{ padding: '8px 20px', fontSize: '0.9rem', marginLeft: '20px' }}>
                                <Plus size={16} style={{ marginRight: 5 }} /> Adicionar
                            </button>
                        </div>

                        {servicos.map((servico, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                gap: '60px',
                                marginBottom: '15px',
                                alignItems: 'flex-start',
                                background: '#2d3748',
                                padding: '15px',
                                borderRadius: '8px'
                            }}>

                                <div style={{ flex: 6, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '1.2rem', color: '#fff' }}>Endereço / Coordenada</label>
                                    <input
                                        placeholder="Rua, Nº, Cidade OU -25.42, -49.27"
                                        value={servico.endereco}
                                        onChange={e => handleServiceChange(index, 'endereco', e.target.value)}
                                        style={{ width: '110%', height: '40px', padding: '0 10px', fontSize: '1.1rem' }}
                                    />
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '100px' }}>
                                    <label style={{ fontSize: '1.2rem', color: '#fff' }}>Valor (R$)</label>
                                    <input
                                        type="number"
                                        placeholder="0,00"
                                        value={servico.valor}
                                        onChange={e => handleServiceChange(index, 'valor', e.target.value)}
                                        style={{ width: '100%', height: '40px', padding: '0 10px', fontSize: '1.1rem' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', height: '70px', justifyContent: 'center' }}>
                                    <button onClick={() => removeServico(index)} style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer' }}>
                                        <Trash2 size={24} />
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>

                    <button onClick={handleOtimizar} disabled={loading} className="btn-add" style={{ width: '100%', height: '50px', fontSize: '1.1rem', backgroundColor: '#00d68f', color: '#000' }}>
                        {loading ? 'Calculando melhor rota...' : <><Calculator size={20} style={{ marginRight: 10 }} /> Calcular Rota</>}
                    </button>
                </div>

                {/* DIREITA */}
                <div>
                    {resultado ? (
                        <div className="card" style={{ border: '1px solid #444' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ color: '#00d68f', margin: 0 }}>Rota Otimizada</h2>

                                {/* BOTÕES DE AÇÃO: MAPA E PDF */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={gerarRelatorioPDF} className="btn-add" style={{ backgroundColor: '#dd6b20', color: '#fff', padding: '8px 15px', fontWeight: 'bold' }}>
                                        <FileText size={18} style={{ marginRight: 5 }} /> PDF
                                    </button>
                                    {/* Botão Ver no Mapa Atualizado */}
                                    <button onClick={gerarLinksMapa} className="btn-add" style={{ backgroundColor: '#391cddff', color: '#fff', padding: '8px 15px', fontWeight: 'bold' }}>
                                        <Map size={18} style={{ marginRight: 5 }} /> Ver no Mapa
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px', textAlign: 'center' }}>
                                <div style={{ background: '#2d3748', padding: '10px', borderRadius: '5px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>KM Total</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{resultado.resumo.distancia_total_km} km</div>
                                </div>
                                <div style={{ background: '#2d3748', padding: '10px', borderRadius: '5px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Faturamento</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00d68f' }}>R$ {resultado.resumo.valor_total}</div>
                                </div>
                                <div style={{ background: '#2d3748', padding: '10px', borderRadius: '5px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Tempo Est.</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{resultado.resumo.tempo_total_min} min</div>
                                </div>
                            </div>

                            {/* LISTA DE ROTAS COM EDIÇÃO */}
                            <div style={{
                                position: 'relative',
                                borderLeft: '2px dashed #4a5568',
                                marginLeft: '8px',
                                paddingLeft: '50px',
                                maxHeight: '1400px',
                                overflowY: 'auto'
                            }}>
                                <div style={{ marginBottom: '30px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-40px', top: 2, background: '#d69e2e', borderRadius: '50%', width: '20px', height: '20px' }}></div>
                                    <strong style={{ color: '#d69e2e' }}>Início:</strong> {origem}
                                </div>

                                {resultado.rota_ordenada.map((item, idx) => (
                                    <div key={idx} style={{ marginBottom: '30px', position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute', left: '-44px', top: '0',
                                            background: '#1a202c', border: item.tipo === 'final' ? '2px solid #e53e3e' : '2px solid #00d68f',
                                            borderRadius: '50%', width: '28px', height: '28px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.8rem', color: item.tipo === 'final' ? '#e53e3e' : '#00d68f', fontWeight: 'bold', zIndex: 2
                                        }}>
                                            {item.tipo === 'final' ? <Flag size={14} /> : idx + 1}
                                        </div>

                                        <div style={{ background: '#2d3748', padding: '12px', borderRadius: '8px', borderLeft: item.tipo === 'final' ? '4px solid #e53e3e' : '4px solid #00d68f' }}>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                {editandoIndex === idx ? (
                                                    <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                                        <input
                                                            autoFocus
                                                            value={textoEditado}
                                                            onChange={(e) => setTextoEditado(e.target.value)}
                                                            style={{ flex: 1, borderRadius: '4px', border: '1px solid #00d68f', padding: '4px', background: '#1a202c', color: 'white' }}
                                                        />
                                                        <button onClick={() => salvarEdicao(idx)} style={{ background: '#00d68f', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 5px' }}>
                                                            <Check size={16} color="black" />
                                                        </button>
                                                        <button onClick={cancelarEdicao} style={{ background: '#e53e3e', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 5px' }}>
                                                            <X size={16} color="white" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white', marginRight: '10px' }}>
                                                            {item.endereco}
                                                        </div>
                                                        <button
                                                            onClick={() => iniciarEdicao(idx, item.endereco)}
                                                            title="Editar nome"
                                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#718096' }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'flex', gap: '15px' }}>
                                                <span>🚗 +{item.distancia_anterior} km</span>
                                                <span>⏱️ +{item.tempo_anterior} min</span>
                                            </div>
                                            {item.valor > 0 && <div style={{ color: '#00d68f', fontWeight: 'bold', marginTop: '5px' }}>Receber: R$ {item.valor}</div>}
                                            {item.tipo === 'final' && <div style={{ color: '#e53e3e', fontWeight: 'bold', marginTop: '5px' }}>CHEGADA FINAL</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #444' }}>
                                <h4 style={{ marginBottom: '10px' }}>3. Aprovar e Iniciar</h4>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select className="input-small" value={selecaoFinal.veiculo_id} onChange={handleVeiculoChange}>
                                        <option value="">Veículo...</option>
                                        {veiculos.map(v => <option key={v.id} value={v.id}>{v.modelo} (KM: {v.km_atual ?? 0})</option>)}
                                    </select>
                                    <select className="input-small" value={selecaoFinal.colaborador_id} onChange={e => setSelecaoFinal({ ...selecaoFinal, colaborador_id: e.target.value })}>
                                        <option value="">Colaborador...</option>
                                        {/* --- VISÃO GLOBAL DINÂMICA: Mostra todos ou apenas o próprio usuário --- */}
                                        {(can('rotas.visao_global') ? colaboradores : colaboradores.filter(c => c.usuario_id === user?.id)).map(m => (
                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                        ))}
                                    </select>
                                    <input type="number" placeholder="KM Painel" className="input-small" style={{ width: '100px' }} value={selecaoFinal.km_saida} onChange={e => setSelecaoFinal({ ...selecaoFinal, km_saida: e.target.value })} />
                                </div>
                                {can('rotas.criar') && (
                                    <button
                                        onClick={handleIniciarRotaOficial}
                                        className="btn-add"
                                        style={{ width: '100%', marginTop: '15px', backgroundColor: '#00d68f', color: 'black' }}
                                    >
                                        <PlayCircle size={18} style={{ marginRight: 5 }} /> Iniciar Operação
                                    </button>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #444', borderRadius: '10px', color: '#718096' }}>
                            Preencha e calcule para ver o resultado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
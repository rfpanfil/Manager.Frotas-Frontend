// Arquivo: frontend/src/pages/DashboardGastos.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { LayoutDashboard, AlertTriangle, FileText, Filter } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Select from 'react-select';
import ReactECharts from 'echarts-for-react';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#444',
        color: 'white',
        minHeight: '38px',
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none',
        '&:hover': { borderColor: '#00d68f' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#00d68f' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#4a5568' }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#e53e3e' } })
};

export default function DashboardGastos() {

    const [tiposGasto, setTiposGasto] = useState([]);

    // Refs dos gráficos VISÍVEIS (apenas para exibição em tela)
    const chartSemanalRef = useRef(null);
    const chartPizzaRef = useRef(null);
    const chartAnualRef = useRef(null);

    // Refs dos gráficos OFFSCREEN (usados exclusivamente para gerar o PDF)
    const pdfSemanalRef = useRef(null);
    const pdfPizzaRef = useRef(null);
    const pdfAnualRef = useRef(null);

    const [dados, setDados] = useState(null);
    const [veiculos, setVeiculos] = useState([]);

    const [gerandoPDF, setGerandoPDF] = useState(false);
    const [renderPDFCharts, setRenderPDFCharts] = useState(false);
    const [incluirSemanalPdf, setIncluirSemanalPdf] = useState(true); // NOVO ESTADO AQUI

    // --- ESTADOS DE FILTRO ---
    const [anosDisponiveis, setAnosDisponiveis] = useState([]); // Recuperamos isso
    // Filtro Novo (Período)
    const [periodo, setPeriodo] = useState({ inicio: '', fim: '', label: 'Período Personalizado' });
    const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);
    const [usarFiltroPeriodo, setUsarFiltroPeriodo] = useState(false); // Flag para saber qual usar

    // ATUALIZE O ESTADO INICIAL (Mude 'tipo_gasto' string para 'tipos_gasto' array)
    const [filtros, setFiltros] = useState({
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        veiculos_ids: [],
        tipos_gasto: [] // <--- MUDOU AQUI (Array para Multi-Select)
    });

    const CORES_PIZZA = ['#00d68f', '#3182ce', '#f6ad55', '#e53e3e', '#805ad5', '#d69e2e'];

    // Configurações do PDF
    const PDF_W = 900;
    const PDF_H = 350;
    const MARGIN_X = 14;
    const BOTTOM_LIMIT_Y = 280;
    const TOP_MIN_Y = 20;

    useEffect(() => {
        carregarAuxiliares();
    }, []);

    // Monitora mudanças em ambos os filtros
    useEffect(() => {
        carregarDashboard();
    }, [filtros, periodo, usarFiltroPeriodo]);

    async function carregarAuxiliares() {
        try {
            // Adicionamos a chamada para /opcoes/tipos-gasto
            const [resVeiculos, resAnos, resTipos] = await Promise.all([
                api.get('/veiculos/'),
                api.get('/dashboard/anos'),
                api.get('/opcoes/tipos-gasto') // <--- NOVO
            ]);
            setVeiculos(resVeiculos.data || []);
            setAnosDisponiveis(resAnos.data || []);
            setTiposGasto(resTipos.data || []); // <--- NOVO
        } catch (error) { console.error(error); }
    }

    // Função corrigida para fechar o menu e ativar o filtro imediatamente
    function selecionarPeriodo(tipo) {
        const hoje = new Date();
        let inicio = new Date(), fim = new Date();
        let label = "";

        if (tipo === '7d') {
            inicio.setDate(hoje.getDate() - 7);
            label = "Últimos 7 dias";
        }
        else if (tipo === '30d') {
            inicio.setDate(hoje.getDate() - 30);
            label = "Últimos 30 dias";
        }
        else if (tipo === '90d') {
            inicio.setDate(hoje.getDate() - 90);
            label = "Últimos 3 meses";
        }
        else if (tipo === '12m') {
            inicio.setFullYear(hoje.getFullYear() - 1);
            label = "Últimos 12 meses";
        }
        else if (tipo === 'mes_atual') {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            label = "Este Mês";
        }

        setPeriodo({
            inicio: inicio.toISOString().split('T')[0],
            fim: fim.toISOString().split('T')[0],
            label
        });

        // --- CORREÇÕES ---
        setUsarFiltroPeriodo(true);  // 1. Força o dashboard a usar estas datas, ignorando os selects de Ano/Mês
        setMenuPeriodoAberto(false); // 2. Fecha o menu ("quadradinho") imediatamente
    }


    async function carregarDashboard() {
        try {
            let params = {};

            // 1. Tipos de Gasto
            if (filtros.tipos_gasto && filtros.tipos_gasto.length > 0) {
                params.tipos_gasto = filtros.tipos_gasto.map(t => t.value);
            }

            // 2. Parâmetros Base (Sempre enviamos o Ano para garantir o contexto dos Cards Fixos)
            params.ano = filtros.ano;

            // Veículos Multi-Select
            if (filtros.veiculos_ids && filtros.veiculos_ids.length > 0) {
                params.veiculos_ids = filtros.veiculos_ids.map(v => v.value);
            }

            // 3. Define o Período Específico
            if (usarFiltroPeriodo && periodo.inicio && periodo.fim) {
                // Se for período personalizado/rápido
                params.data_inicio = periodo.inicio;
                params.data_fim = periodo.fim;
                // Não enviamos 'mes' aqui para não conflitar
            } else {
                // Se for filtro clássico Ano/Mês
                params.mes = filtros.mes || null;
            }

            // 4. Chamada à API
            const response = await api.get('/dashboard/gastos', {
                params,
                paramsSerializer: params => {
                    const searchParams = new URLSearchParams();
                    Object.keys(params).forEach(key => {
                        const val = params[key];
                        if (val === null || val === undefined) return;
                        if (Array.isArray(val)) {
                            val.forEach(v => searchParams.append(key, v));
                        } else {
                            searchParams.append(key, val);
                        }
                    });
                    return searchParams.toString();
                }
            });

            setDados(response.data);
        } catch (error) { console.error("Erro ao carregar dashboard:", error); }
    }

    // ===== FUNÇÃO DE CAPTURA ROBUSTA COM HTML2CANVAS =====
    async function capturarElemento(elementRef) {
        if (!elementRef.current) return null;
        try {
            const canvas = await html2canvas(elementRef.current, {
                scale: 2, // 2x para Retina/Alta resolução
                backgroundColor: '#1a202c', // Garante fundo escuro
                useCORS: true,
                logging: false
            });
            return {
                dataUrl: canvas.toDataURL('image/png', 1.0),
                width: canvas.width,
                height: canvas.height
            };
        } catch (error) {
            console.error("Erro ao capturar gráfico:", error);
            return null;
        }
    }

    // ===== AUXILIARES PDF =====
    function safeNumber(v) { return Number(v) || 0; }

    function ensureSpace(doc, currentY, neededHeight) {
        // Se não couber na página, cria nova e reseta o Y
        if (currentY + neededHeight >= 280) { // 280mm é margem de segurança A4
            doc.addPage();
            return 20; // Topo da nova página
        }
        return currentY;
    }

    // Função para formatar a string de período corretamente para o PDF
    function getTextoPeriodo() {
        if (usarFiltroPeriodo && periodo.inicio && periodo.fim) {
            const d1 = new Date(periodo.inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const d2 = new Date(periodo.fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            return `${d1} até ${d2}`;
        } else {
            // Lógica para Ano/Mês Clássico
            const ano = filtros.ano;
            const mesNome = filtros.mes
                ? new Date(ano, filtros.mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
                : "Ano Completo";
            // Capitaliza a primeira letra do mês
            return `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)} de ${ano}`;
        }
    }

    // Função para pegar o nome do veículo
    function getTextoVeiculo() {
        if (!filtros.veiculo_id) return "Todos os Veículos";
        const v = veiculos.find(vec => String(vec.id) === String(filtros.veiculo_id));
        return v ? `${v.modelo} (${v.placa})` : "Veículo não encontrado";
    }

    // Função para pegar tipos de gasto
    function getTextoTiposGasto() {
        if (!filtros.tipos_gasto || filtros.tipos_gasto.length === 0) return "Todos";
        return filtros.tipos_gasto.map(t => t.label).join(", ");
    }

    // ===== EXPORTAR PDF (REFINADO) =====
    async function exportarPDF() {
        if (!dados) return;
        setGerandoPDF(true);

        try {
            // 1. Renderiza os gráficos ocultos no DOM
            setRenderPDFCharts(true);

            // 2. Aguarda o React desenhar e o Recharts renderizar
            await new Promise(r => setTimeout(r, 1500));

            const doc = new jsPDF('p', 'mm', 'a4');

            // --- CABEÇALHO MELHORADO ---
            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text(`Relatório de Gestos`, 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(100);

            // Linha 1: Período
            doc.setFont(undefined, 'bold');
            doc.text("Período:", 14, 23);
            doc.setFont(undefined, 'normal');
            doc.text(getTextoPeriodo(), 35, 23);

            // Linha 2: Veículo
            doc.setFont(undefined, 'bold');
            doc.text("Veículo:", 14, 28);
            doc.setFont(undefined, 'normal');
            doc.text(getTextoVeiculo(), 35, 28);

            // Linha 3: Filtros de Gasto
            doc.setFont(undefined, 'bold');
            doc.text("Filtros:", 14, 33);
            doc.setFont(undefined, 'normal');
            // Trunca texto muito longo para não estourar a linha
            const tiposTexto = getTextoTiposGasto();
            const tiposTextoTruncado = tiposTexto.length > 80 ? tiposTexto.substring(0, 80) + "..." : tiposTexto;
            doc.text(tiposTextoTruncado, 35, 33);

            doc.line(14, 36, 196, 36); // Linha divisória

            // --- KPI TABLE ---
            autoTable(doc, {
                head: [['Indicador', 'Valor']],
                body: [
                    ['Gasto Hoje', `R$ ${safeNumber(dados.cards.hoje).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                    ['Gasto Período Selecionado', `R$ ${safeNumber(dados.cards.mes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                    [`Total Acumulado ${filtros.ano}`, `R$ ${safeNumber(dados.cards.ano).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
                ],
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [45, 55, 72] }, // Cor escura combinando com tema
                styles: { fontSize: 11 }
            });

            let currentY = doc.lastAutoTable.finalY + 10;

            // --- GRÁFICO 1: EVOLUÇÃO SEMANAL ---
            if (incluirSemanalPdf && pdfSemanalRef.current) {
                currentY = ensureSpace(doc, currentY, 90);
                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.text("Evolução - Últimos 7 Dias", 14, currentY);

                const img = await capturarElemento(pdfSemanalRef);
                if (img) {
                    const ratio = img.width / img.height;
                    const h = 180 / ratio;
                    doc.addImage(img.dataUrl, 'PNG', 14, currentY + 5, 180, h);
                    currentY += h + 15;
                }
            }

            // --- GRÁFICO 2: PIZZA (DISTRIBUIÇÃO) ---
            currentY = ensureSpace(doc, currentY, 90);
            doc.setFontSize(12);
            doc.text("Distribuição por Tipo de Gasto (Período Selecionado)", 14, currentY);

            // VERIFICAÇÃO SE TEM DADOS ANTES DE TENTAR IMPRIMIR A IMAGEM
            if (dados.grafico_pizza && dados.grafico_pizza.length > 0) {
                if (pdfPizzaRef.current) {
                    const img = await capturarElemento(pdfPizzaRef);
                    if (img) {
                        const ratio = img.width / img.height;
                        const h = 180 / ratio;
                        doc.addImage(img.dataUrl, 'PNG', 14, currentY + 5, 180, h);
                        currentY += h + 15;
                    }
                }
            } else {
                // SE NÃO TIVER DADOS, IMPRIME AVISO
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text("(Sem dados de gastos para o período/filtros selecionados)", 14, currentY + 15);
                currentY += 30; // Espaço menor
                doc.setTextColor(0); // Reseta cor
            }

            // --- NOVA TABELA: DETALHAMENTO DE TIPOS DE GASTO (Movida para ficar logo abaixo da Pizza) ---
            currentY = ensureSpace(doc, currentY, 40);
            
            const totalGastoTabela = dados.grafico_pizza.reduce((sum, item) => sum + (item.value || 0), 0);
            const categoriasRows = dados.grafico_pizza
                .filter(d => d.value > 0)
                .sort((a,b) => b.value - a.value)
                .map(c => {
                    const percentFormat = totalGastoTabela > 0 ? ((c.value / totalGastoTabela) * 100).toFixed(1) + '%' : '0%';
                    return [
                        c.name, 
                        `R$ ${safeNumber(c.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        percentFormat
                    ];
                });

            doc.setFontSize(12); // Garante que o título terá a fonte correta
            doc.text("Distribuição Completa por Categoria", 14, currentY);
            autoTable(doc, {
                head: [['Categoria', 'Valor (R$)', 'Representatividade']],
                body: categoriasRows,
                startY: currentY + 5,
                theme: 'striped',
                headStyles: { fillColor: [0, 214, 143], textColor: [0, 0, 0] } // Verde do sistema
            });

            // Atualiza a posição Y para desenhar o próximo gráfico
            currentY = doc.lastAutoTable.finalY + 15; 

            // --- GRÁFICO 3: ANUAL ---
            if (pdfAnualRef.current) {
                currentY = ensureSpace(doc, currentY, 90);
                doc.setFontSize(12);
                doc.text(`Evolução Mensal - ${filtros.ano}`, 14, currentY);

                const img = await capturarElemento(pdfAnualRef);
                if (img) {
                    const ratio = img.width / img.height;
                    const h = 180 / ratio;
                    doc.addImage(img.dataUrl, 'PNG', 14, currentY + 5, 180, h);
                    currentY += h + 15;
                }
            }

            // Tabela Detalhada Mensal
            currentY = ensureSpace(doc, currentY, 40);
            const mesesRows = dados.grafico_anual.map(m => [m.nome, `R$ ${safeNumber(m.total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
            doc.text("Detalhamento Mensal (Tabela)", 14, currentY);
            autoTable(doc, {
                head: [['Mês', 'Total Gasto']],
                body: mesesRows,
                startY: currentY + 5,
                theme: 'striped',
                headStyles: { fillColor: [49, 130, 206] }
            });

            // Nome do arquivo detalhado
            const nomeArquivo = filtros.veiculo_id ? `relatorio_veiculo_${filtros.veiculo_id}.pdf` : `relatorio_geral_${filtros.ano}.pdf`;
            doc.save(nomeArquivo);

        } catch (error) {
            console.error("Erro PDF", error);
            alert("Erro ao gerar PDF.");
        } finally {
            setGerandoPDF(false);
            setRenderPDFCharts(false);
        }
    }



    // Função para voltar ao modo Ano/Mês quando o usuário mexe nos selects antigos
    function handleFiltroChange(e) {
        setUsarFiltroPeriodo(false); // <--- Desativa o modo período se mexer no ano/mês
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    }

    if (!dados) return <div style={{ padding: '30px' }}>Carregando Dashboard...</div>;

    const opcoesTiposGasto = tiposGasto.map(t => ({ value: t.nome, label: t.nome }));

    // --- NOVA LÓGICA: AGRUPAMENTO DE FATIAS PARA NÃO ENCAVALAR ---
    const totalPizza = dados.grafico_pizza.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const pizzaLimpa = [];
    let valorOutros = 0;
    const itensOutros = []; // NOVO: Array para guardar o detalhamento dos menores
    const itensPrincipais = []; // NOVO: Array exclusivo para listar os Principais no PDF

    // Ordena do maior para o menor
    const dadosOrdenados = [...dados.grafico_pizza].filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    dadosOrdenados.forEach(item => {
        const percent = item.value / totalPizza;
        // Se a fatia for menor que 2.5%, junta na fatia "Outros"
        if (percent < 0.025) {
            valorOutros += item.value;
            itensOutros.push({ ...item, percentual: percent * 100 }); 
        } else {
            pizzaLimpa.push(item);
            itensPrincipais.push({ ...item, percentual: percent * 100 }); // Salva para a lista do PDF
        }
    });

    if (valorOutros > 0) {
        // MUDANÇA: Nome explícito mostrando a linha de corte
        pizzaLimpa.push({ name: 'Outros (< 2,5%)', value: valorOutros });
    }

    // --- FUNÇÃO PARA DESENHAR A PORCENTAGEM NO GRÁFICO DE PIZZA ---
    const renderPizzaLabel = (props) => {
        const { x, y, textAnchor, name, percent, cx } = props;
        if (!percent || percent === 0) return null; 

        const percValue = percent * 100;
        const textoPerc = percValue.toFixed(1).replace('.0', '') + '%';
        
        const offset = x > cx ? 5 : -5;

        return (
            <text x={x + offset} y={y} fill="#e2e8f0" textAnchor={textAnchor} dominantBaseline="central" fontSize="11">
                {name}: {textoPerc}
            </text>
        );
    };

    // --- OPÇÕES DO APACHE ECHARTS (TELA) ---
    const echartsOptions = {
        animation: true,
        animationDuration: 1000,
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1a1e29',
            borderColor: '#4a5568',
            textStyle: { color: '#e2e8f0', fontWeight: 'bold' },
            formatter: function (info) {
                const valor = Number(info.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return `${info.name}<br/>R$ ${valor} (${info.percent}%)`;
            }
        },
        color: CORES_PIZZA,
        series: [
            {
                type: 'pie',
                radius: '80%', // Tamanho da pizza
                center: ['50%', '50%'], // Centralizado
                avoidLabelOverlap: true, // ✨ A MÁGICA NATIVA DO ECHARTS AQUI ✨
                label: {
                    show: true,
                    formatter: '{b}: {d}%', // {b} = Nome, {d} = Porcentagem
                    color: '#e2e8f0',
                    fontSize: 11
                },
                labelLine: {
                    show: true,
                    length: 15,
                    length2: 25,
                    smooth: true, // Deixa a quebra da linha levemente arredondada
                    lineStyle: { color: '#a0aec0' }
                },
                data: pizzaLimpa // Mantemos a mesma lógica de dados limpos!
            }
        ]
    };

    // --- OPÇÕES DO APACHE ECHARTS (PDF - Sem animação) ---
    const echartsOptionsPDF = {
        ...echartsOptions,
        animation: false // Exigência para o PDF capturar a foto instantaneamente
    };

    return (
        <div>
            {/* === GRÁFICOS OFFSCREEN (Invisíveis) === */}
            {renderPDFCharts && (
                <div style={{ position: 'fixed', left: -10000, top: 0 }}>

                    {/* 1. Semanal */}
                    <div ref={pdfSemanalRef} style={{ width: PDF_W, height: PDF_H, background: '#1a202c', padding: 20 }}>
                        <AreaChart width={PDF_W} height={PDF_H} data={dados.grafico_semanal || []}>
                            <defs>
                                <linearGradient id="pdfColorValor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00d68f" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="dia" stroke="#a0aec0" />
                            <YAxis stroke="#a0aec0" />
                            <Area type="monotone" dataKey="valor" stroke="#00d68f" fillOpacity={1} fill="url(#pdfColorValor)" isAnimationActive={false} />
                        </AreaChart>
                    </div>

                    {/* 2. Pizza PDF */}
                    <div ref={pdfPizzaRef} style={{ width: PDF_W, height: PDF_H, background: '#1a202c', padding: 20, display: 'flex', alignItems: 'center' }}>
                        
                        {/* A - Gráfico PDF com Apache ECharts */}
                        <div style={{ width: 550, height: PDF_H }}>
                            <ReactECharts 
                                option={echartsOptionsPDF} 
                                style={{ height: PDF_H, width: 550 }} 
                                opts={{ renderer: 'canvas' }} 
                            />
                        </div>
                        
                        {/* B - Coluna Direita (Listas Empilhadas Verticalmente) */}
                        <div style={{ width: 310, marginLeft: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* Principais Gastos */}
                            <div>
                                <h4 style={{ fontSize: '14px', color: '#3182ce', marginBottom: '10px', marginTop: 0, borderBottom: '1px solid #2d3748', paddingBottom: '8px' }}>
                                    Principais Gastos
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {itensPrincipais.map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px', color: '#a0aec0', fontSize: '11px' }}>
                                            {item.name} - <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> - <span style={{ color: '#3182ce' }}>{item.percentual.toFixed(1).replace('.0', '')}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Detalhamento Outros (Fica embaixo dos Principais) */}
                            {itensOutros.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '14px', color: '#00d68f', marginBottom: '10px', marginTop: 0, borderBottom: '1px solid #2d3748', paddingBottom: '8px' }}>
                                        Detalhamento "Outros"
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {itensOutros.map((item, idx) => (
                                            <li key={idx} style={{ marginBottom: '8px', color: '#a0aec0', fontSize: '11px' }}>
                                                {item.name} - <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> - <span style={{ color: '#f6ad55' }}>{item.percentual.toFixed(1).replace('.0', '')}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                    </div>

                    {/* 3. Anual PDF */}
                    <div ref={pdfAnualRef} style={{ width: PDF_W, height: PDF_H, background: '#1a202c', padding: 20 }}>
                        {/* MÁGICA: Adicionada margem superior para o número não cortar no PDF */}
                        <BarChart width={PDF_W} height={PDF_H} data={dados.grafico_anual} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="nome" stroke="#a0aec0" />
                            <YAxis stroke="#a0aec0" />
                            <Bar dataKey="total" fill="#3182ce" barSize={40} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                {/* MÁGICA: Adicionando números nas barras do PDF */}
                                <LabelList 
                                    dataKey="total" 
                                    position="top" 
                                    fill="#00d68f" 
                                    fontSize={12} 
                                    fontWeight="bold"
                                    formatter={(val) => val > 0 ? `R$ ${val.toFixed(2)}` : ''} 
                                />
                            </Bar>
                        </BarChart>
                    </div>
                </div>
            )}
            {/* ======================================================= */}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1><LayoutDashboard style={{ marginRight: '10px' }} /> Dashboard Gastos</h1>
                <button onClick={exportarPDF} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white', height: '40px' }} disabled={gerandoPDF}>
                    <FileText size={18} style={{ marginRight: '5px' }} /> {gerandoPDF ? 'Gerando...' : 'PDF'}
                </button>
            </div>

            {/* FILTROS */}
            <div className="filter-bar">
                <div className="filter-item">
                    <label>Ano</label>
                    <select name="ano" value={filtros.ano} onChange={handleFiltroChange}>
                        {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                    </select>
                </div>
                <div className="filter-item">
                    <label>Mês</label>
                    <select name="mes" value={filtros.mes} onChange={handleFiltroChange}>
                        <option value="">Todos</option>
                        <option value="1">Janeiro</option>
                        <option value="2">Fevereiro</option>
                        <option value="3">Março</option>
                        <option value="4">Abril</option>
                        <option value="5">Maio</option>
                        <option value="6">Junho</option>
                        <option value="7">Julho</option>
                        <option value="8">Agosto</option>
                        <option value="9">Setembro</option>
                        <option value="10">Outubro</option>
                        <option value="11">Novembro</option>
                        <option value="12">Dezembro</option>
                    </select>
                </div>
                {/* DIVISÓRIA VISUAL OU "OU" */}
                <div style={{ alignSelf: 'center', color: '#a0aec0', fontSize: '0.8rem', margin: '0 10px' }}>OU</div>

                {/* GRUPO 2: NOVO SELETOR DE PERÍODO */}
                <div className="filter-item" style={{ position: 'relative' }}>
                    <label style={{ color: usarFiltroPeriodo ? '#00d68f' : '#a0aec0' }}>Período Rápido</label>
                    <button onClick={() => setMenuPeriodoAberto(!menuPeriodoAberto)} style={{
                        background: usarFiltroPeriodo ? '#1a202c' : '#151821',
                        color: 'white',
                        border: usarFiltroPeriodo ? '1px solid #00d68f' : '1px solid #444',
                        padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, minWidth: '180px', justifyContent: 'space-between'
                    }}>
                        {usarFiltroPeriodo ? periodo.label : "Selecionar..."} <Filter size={14} />
                    </button>

                    {menuPeriodoAberto && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', background: '#1a202c', border: '1px solid #4a5568', borderRadius: '5px', padding: '10px', zIndex: 100, width: '220px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <button onClick={() => selecionarPeriodo('7d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 7 dias</button>
                                <button onClick={() => selecionarPeriodo('30d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 30 dias</button>
                                <button onClick={() => selecionarPeriodo('mes_atual')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Este Mês</button>
                                <button onClick={() => selecionarPeriodo('90d')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 3 meses</button>
                                <button onClick={() => selecionarPeriodo('12m')} style={{ background: 'transparent', border: 'none', color: '#a0aec0', textAlign: 'left', padding: '5px', cursor: 'pointer', transition: 'color 0.2s' }}>Últimos 12 meses</button>

                                <hr style={{ borderColor: '#444', margin: '5px 0' }} />

                                <div style={{ fontSize: '0.8rem', color: '#00d68f', marginBottom: '5px' }}>Personalizado:</div>

                                {/* CORREÇÃO AQUI: Inputs completos sem reticências */}
                                <input
                                    type="date"
                                    value={periodo.inicio}
                                    onChange={e => setPeriodo({ ...periodo, inicio: e.target.value })}
                                    style={{ width: '100%', marginBottom: '5px', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }}
                                />
                                <input
                                    type="date"
                                    value={periodo.fim}
                                    onChange={e => setPeriodo({ ...periodo, fim: e.target.value })}
                                    style={{ width: '100%', padding: '5px', background: '#2d3748', border: '1px solid #444', color: 'white', borderRadius: '3px' }}
                                />

                                {/* BOTÃO APLICAR CORRIGIDO */}
                                <button
                                    onClick={() => {
                                        if (periodo.inicio && periodo.fim) {
                                            setPeriodo({ ...periodo, label: 'Personalizado' });
                                            setUsarFiltroPeriodo(true);
                                            setMenuPeriodoAberto(false); // <--- Fecha o menu aqui
                                        } else {
                                            alert("Selecione data inicial e final");
                                        }
                                    }}
                                    style={{
                                        marginTop: '10px', width: '100%', padding: '8px',
                                        background: '#00d68f', color: 'black', border: 'none',
                                        borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    Aplicar Filtro
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="filter-item" style={{ minWidth: '300px' }}>
                    <label>Veículos</label>
                    <Select
                        isMulti
                        options={veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.marca} - ${v.modelo}`.toUpperCase() }))}
                        value={filtros.veiculos_ids}
                        onChange={val => setFiltros({ ...filtros, veiculos_ids: val })}
                        placeholder="Todos os Veículos"
                        styles={customSelectStyles}
                        closeMenuOnSelect={false}
                    />
                </div>
                <div className="filter-item" style={{ minWidth: '250px' }}>
                    <label>Tipos de Gasto</label>
                    <Select
                        isMulti
                        options={opcoesTiposGasto}
                        value={filtros.tipos_gasto}
                        onChange={val => setFiltros({ ...filtros, tipos_gasto: val })}
                        placeholder="Selecione..."
                        styles={customSelectStyles}
                        closeMenuOnSelect={false}
                    />
                </div>
            </div>

            {/* CARDS */}
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><span>Gasto Hoje</span></div>
                    <div className="card-value">R$ {safeNumber(dados.cards.hoje).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="card">
                    <div className="card-header"><span>Em {dados.cards.mes_referencia}</span></div>
                    <div className="card-value">R$ {safeNumber(dados.cards.mes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="card">
                    <div className="card-header"><span>Total {filtros.ano}</span></div>
                    <div className="card-value">R$ {safeNumber(dados.cards.ano).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>

            {/* GRÁFICOS VISÍVEIS */}
            {/* Trocado para 1fr para que TODOS os gráficos ocupem a largura inteira */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

                {/* GRÁFICO 1 */}
                <div className="chart-section" ref={chartSemanalRef}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Últimos 7 Dias</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0aec0', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={incluirSemanalPdf} 
                                onChange={(e) => setIncluirSemanalPdf(e.target.checked)} 
                                style={{ cursor: 'pointer' }}
                            />
                            Incluir no PDF
                        </label>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={dados.grafico_semanal}>
                                <defs>
                                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00d68f" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="dia" stroke="#a0aec0" />
                                <YAxis stroke="#a0aec0" />
                                <Tooltip 
                                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                    cursor={{ fill: 'transparent' }} 
                                    contentStyle={{ backgroundColor: '#1a1e29', border: '1px solid #333', color: '#e2e8f0' }} 
                                    itemStyle={{ color: '#00d68f', fontWeight: 'bold' }} 
                                />
                                <Area type="monotone" dataKey="valor" stroke="#00d68f" fillOpacity={1} fill="url(#colorValor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRÁFICO 2 */}
                <div className="chart-section" ref={chartPizzaRef}>
                    <h3>Distribuição de Custos</h3>
                    <div style={{ display: 'flex', width: '100%', height: 300, alignItems: 'center' }}>
                        
                        {/* Checa se a pizza não está vazia. Se estiver, mostra a mensagem e SOME com o círculo branco */}
                        {pizzaLimpa.length > 0 ? (
                            <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
                                <ReactECharts 
                                    option={echartsOptions} 
                                    style={{ height: '300px', width: '100%' }} 
                                    opts={{ renderer: 'canvas' }} 
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#a0aec0', height: '100%' }}>
                                Sem lançamentos registrados no período.
                            </div>
                        )}

                        {/* Container da Lista Lateral */}
                        {itensOutros.length > 0 && (
                            <div style={{ width: '300px', height: '100%', overflowY: 'auto', background: '#1a202c', padding: '10px', borderRadius: '8px', border: '1px solid #2d3748', marginLeft: '10px', display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ fontSize: '0.85rem', color: '#00d68f', marginBottom: '10px', marginTop: 0, borderBottom: '1px solid #2d3748', paddingBottom: '8px', textAlign: 'center' }}>
                                    Detalhamento "Outros"
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
                                    {itensOutros.map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px', borderBottom: '1px dashed #2d3748', paddingBottom: '6px', color: '#a0aec0', fontSize: '0.85rem' }}>
                                            {item.name} - <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> - <span style={{ color: '#f6ad55' }}>{item.percentual.toFixed(1).replace('.0', '')}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>
                </div>

                {/* GRÁFICO 3 */}
                <div className="chart-section" ref={chartAnualRef} style={{ gridColumn: '1 / -1' }}>
                    <h3>Evolução em {filtros.ano}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            {/* Adicionado margin-top de 20 para o número não cortar lá em cima */}
                            <BarChart data={dados.grafico_anual} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="nome" stroke="#a0aec0" />
                                <YAxis stroke="#a0aec0" />
                                <Tooltip 
                                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                    contentStyle={{ backgroundColor: '#1a1e29', border: '1px solid #333', color: '#e2e8f0' }} 
                                    itemStyle={{ color: '#3182ce', fontWeight: 'bold' }} 
                                />
                                
                                <Bar dataKey="total" fill="#3182ce" barSize={40} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                    {/* MÁGICA: Coloca os valores no topo de cada barra */}
                                    <LabelList 
                                        dataKey="total" 
                                        position="top" 
                                        fill="#00d68f" 
                                        fontSize={12} 
                                        fontWeight="bold"
                                        formatter={(val) => val > 0 ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
// Arquivo: frontend/src/pages/ferramentas/TabEstoque.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus, Search, ArrowUpCircle, ArrowDownCircle, X,
    Package, AlertTriangle, Clock, Edit, ChevronDown,
    ChevronRight, Trash2, FileText, Save, User, Info, Settings
} from 'lucide-react';
import Select from 'react-select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- ESTILOS PARA A BARRA DE BUSCA (REACT-SELECT) ---
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#4a5568',
        color: 'white',
        minHeight: '35px',
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
    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' })
};

export default function TabEstoque() {
    const { can } = useAuth();

    // --- ESTADOS DE DADOS ---
    const [itens, setItens] = useState([]);
    const [categoriasBD, setCategoriasBD] = useState([]);
    const [unidadesBD, setUnidadesBD] = useState([]);
    const [bases, setBases] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // --- NOVOS ESTADOS PARA VALIDAÇÃO EM TEMPO REAL ---
    const [seriaisUsados, setSeriaisUsados] = useState([]);
    const [patrimoniosUsados, setPatrimoniosUsados] = useState([]);

    // --- ESTADOS DE EXPANSÃO (SUB-ITENS) ---
    const [expandedItem, setExpandedItem] = useState(null); // ID do item expandido (Pai)
    const [subItens, setSubItens] = useState([]); // Lista de pneus/seriais filhos
    const [loadingSub, setLoadingSub] = useState(false);

    // --- ESTADOS DE EDIÇÃO DE SUB-ITEM ---
    const [modalEdicaoFisico, setModalEdicaoFisico] = useState(null);
    const [formFisico, setFormFisico] = useState({});

    // --- ESTADOS DOS MODAIS PRINCIPAIS ---
    const [modalAberto, setModalAberto] = useState(false); // Modal Cadastro Molde
    const [modalMov, setModalMov] = useState(false);       // Modal Entrada/Saída
    const [tipoMov, setTipoMov] = useState('ENTRADA');
    const [modalHist, setModalHist] = useState(null);
    const [historicoData, setHistoricoData] = useState([]);
    const [tituloHist, setTituloHist] = useState('')

    // --- FILTROS ---
    const [busca, setBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroControle, setFiltroControle] = useState('');

    // --- FORMULÁRIO DE MOVIMENTAÇÃO ---
    const [formMov, setFormMov] = useState({
        estoque_item_id: '', quantidade: '', observacao: '',
        numero_nf: '', valor_aquisicao: '', base_id: '', solicitante_id: '', responsavel_id: '',
        serial: '', patrimonio: '', fogo: '', dot: '', marca: '', medida: '', sulco_novo: ''
    });
    const [erroMovimentacao, setErroMovimentacao] = useState(null);
    const [erroEdicaoItem, setErroEdicaoItem] = useState(null);

    // --- NOVO: ESTADO PARA O FILTRO DO MODAL DE MOVIMENTAÇÃO ---
    const [filtroCategoriaMov, setFiltroCategoriaMov] = useState('');

    // --- FORMULÁRIO DE CADASTRO (MOLDE) ---
    const initialForm = {
        codigo_referencia: '', nome: '', categoria: '', unidade_medida: '', estoque_minimo: 0,
        observacoes: '', tipo_controle: 'QUANTIDADE', quantidade_inicial: 0, valor_aquisicao: '',
        numero_nf: '', local_armazenagem: '', serial: '', patrimonio: '', status_ativo: 'Disponível',
        fogo: '', dot: '', marca: '', medida: '', sulco_novo: '', data_vencimento: ''
    };
    const [form, setForm] = useState(initialForm);
    // --- ESTADOS DO CRUD DE CATEGORIAS ---
    const [modalCategorias, setModalCategorias] = useState(false);
    const [formCategoria, setFormCategoria] = useState({ id: null, nome: '', tipo_padrao: 'LIVRE' });

    // --- NOVA FUNÇÃO: CALCULAR PRÓXIMO CÓDIGO (Padrão ID01) ---
    const getProximoCodigo = () => {
        let max = 0;
        itens.forEach(i => {
            if (i.codigo_referencia) {
                // Pega todos os blocos de números da string
                const numeros = i.codigo_referencia.match(/\d+/g);
                if (numeros) {
                    const num = parseInt(numeros[numeros.length - 1], 10);
                    if (num > max) max = num;
                }
            }
        });
        // Retorna 'ID' + número garantindo no mínimo 2 casas (01, 02... 100)
        return `ID${String(max + 1).padStart(2, '0')}`;
    };

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        carregar();
        carregarAuxiliares();
    }, []);

    async function carregar() {
        try {
            const res = await api.get('/estoque/itens');
            setItens(res.data);
        } catch (error) {
            console.error("Erro ao carregar itens", error);
        }
    }

    async function carregarAuxiliares() {
        try {
            const [resCat, resUni, resBases, resUser, resCodigos] = await Promise.all([
                api.get('/estoque/categorias'),
                api.get('/estoque/unidades').catch(() => ({ data: [] })),
                api.get('/bases/').catch(() => ({ data: [] })),
                api.get('/usuarios/').catch(() => ({ data: [] })),
                api.get('/estoque/seriais-patrimonios').catch(() => ({ data: { seriais: [], patrimonios: [] } })) // NOVA CHAMADA
            ]);
            setCategoriasBD(resCat.data || []);
            setUnidadesBD(resUni.data || []);
            setBases(resBases.data || []);
            setUsuarios(resUser.data || []);

            // Popula as listas para validação
            setSeriaisUsados(resCodigos.data.seriais || []);
            setPatrimoniosUsados(resCodigos.data.patrimonios || []);
        } catch (error) { console.error("Erro ao carregar auxiliares", error); }
    }

    // --- CRUD DE CATEGORIAS ---
    async function handleSalvarCategoria(e) {
        e.preventDefault();
        try {
            if (formCategoria.id) {
                await api.put(`/estoque/categorias/${formCategoria.id}`, formCategoria);
            } else {
                await api.post('/estoque/categorias', formCategoria);
            }
            setFormCategoria({ id: null, nome: '', tipo_padrao: 'LIVRE' });
            carregarAuxiliares(); // Recarrega a lista
        } catch (e) { alert("Erro: " + (e.response?.data?.detail || "Falha ao salvar")); }
    }

    async function handleExcluirCategoria(id) {
        if (!window.confirm("Deseja mesmo excluir esta categoria?")) return;
        try {
            await api.delete(`/estoque/categorias/${id}`);
            carregarAuxiliares();
        } catch (e) { alert("Erro: " + (e.response?.data?.detail || "Em uso por algum item")); }
    }

    // --- LÓGICA DE HISTÓRICO GERAL (ITEM PAI) ---
    async function verHistoricoGeral(item) {
        setModalHist(item); // Abre o modal
        setTituloHist(item.nome); // Define o título
        setHistoricoData([]);
        try {
            const res = await api.get(`/estoque/itens/${item.id}/historico`);
            setHistoricoData(res.data);
        } catch (error) { alert("Erro ao carregar histórico geral."); }
    }

    // --- NOVA LÓGICA DE HISTÓRICO INDIVIDUAL (SUB-ITEM) ---
    async function verHistoricoFisico(subItem) {
        setModalHist(subItem); // Abre o modal
        // Define um título inteligente baseado no que o item tem (Serial, Fogo ou DOT)
        setTituloHist(subItem.serial || subItem.fogo || subItem.dot || "Item Físico");
        setHistoricoData([]);

        try {
            let url = '';
            if (subItem.tipo === 'PNEU') {
                url = `/pneus/${subItem.id}/historico`;
            } else {
                url = `/estoque/equipamentos/${subItem.id}/historico`;
            }

            const res = await api.get(url);

            // Adaptador para garantir que o front leia os dados independente do formato que o back mandar
            const dadosAdaptados = res.data.map(h => ({
                data_evento: h.data || h.data_evento,
                tipo_evento: h.tipo || h.tipo_evento,
                quantidade: h.quantidade || 1,
                responsavel_nome: h.usuario || h.responsavel_nome || "Sistema",
                descricao: h.observacao || h.descricao,
                numero_nf: h.numero_nf,
                veiculo: h.veiculo,
                km_veiculo: h.km_veiculo
            }));

            setHistoricoData(dadosAdaptados);
        } catch (error) {
            alert("Erro ao buscar histórico detalhado deste item.");
        }
    }

    // --- LÓGICA DE MOVIMENTAÇÃO ---
    const itemSelecionado = formMov.estoque_item_id ? itens.find(i => i.id == formMov.estoque_item_id) : null;

    async function handleMovimento(e) {
        e.preventDefault();

        // --- NOVA TRAVA: Obrigar a escolher um item ---
        if (!formMov.estoque_item_id) {
            return alert("Por favor, busque e selecione um modelo/item antes de confirmar.");
        }

        setErroMovimentacao(null); // Limpa erro ao tentar de novo
        try {
            await api.post('/estoque/movimentar', { ...formMov, tipo_movimento: tipoMov });
            alert(`Sucesso! ${tipoMov} registrada no histórico.`);
            setModalMov(false);
            carregar();
            if (expandedItem === formMov.estoque_item_id) {
                const res = await api.get(`/estoque/itens/${expandedItem}/fisicos`);
                setSubItens(res.data);
            }
        } catch (error) {
            const det = error.response?.data?.detail;
            const msg = typeof det === 'string' ? det : JSON.stringify(det || "Erro na movimentação.");

            if (msg.includes('Duplicado')) {
                setErroMovimentacao(msg); // Mostra no form em vermelho
            } else {
                alert("Erro: " + msg); // Mostra alert comum para outros erros
            }
        }
    }

    // --- LÓGICA DE CADASTRO (MOLDE) ---
    async function handleNovaCategoria() {
        const nova = window.prompt("Digite o nome da Nova Categoria:");
        if (!nova || nova.trim() === '') return;
        try {
            const res = await api.post('/estoque/categorias', { nome: nova });
            setCategoriasBD([...categoriasBD, res.data]);
            setForm({ ...form, categoria: res.data.nome, tipo_controle: res.data.nome === 'PNEUS' ? 'SERIALIZADO' : 'QUANTIDADE' });
        } catch (e) { alert("Erro ao criar categoria."); }
    }

    function handleNovaUnidade() {
        const nova = window.prompt("Digite a sigla da Nova Unidade (Ex: PCT, M2):");
        if (!nova || nova.trim() === '') return;
        const nomeUpper = nova.trim().toUpperCase();
        if (!unidadesBD.find(u => u.nome === nomeUpper)) {
            setUnidadesBD([...unidadesBD, { nome: nomeUpper }]);
        }
        setForm({ ...form, unidade_medida: nomeUpper });
    }

    // Ignora o item atual na hora de checar duplicidade (i.id !== form.id)
    const codigoExiste = form.codigo_referencia && itens.some(i =>
        i.codigo_referencia?.toLowerCase() === form.codigo_referencia.toLowerCase() && i.id !== form.id
    );

    const abrirEdicao = (item) => {
        setForm({
            id: item.id,
            codigo_referencia: item.codigo_referencia || '',
            nome: item.nome || '',
            // O toUpperCase() garante que o Select reconheça a opção
            categoria: item.categoria ? item.categoria.toUpperCase() : '',
            unidade_medida: item.unidade_medida ? item.unidade_medida.toUpperCase() : '',
            estoque_minimo: item.estoque_minimo || 0,
            observacoes: item.observacoes || '',
            tipo_controle: item.tipo_controle || 'QUANTIDADE'
        });
        setModalAberto(true);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        if (codigoExiste && form.id) return alert("Erro: Código de Referência já existe no sistema!");

        let payload = { ...form };

        // Regra Especial de PNEUS: Força o nome baseado na medida
        if (payload.categoria === 'PNEUS') {
            payload.nome = `PNEU ${payload.medida || ''}`.trim();
        }

        // Limpeza de campos vazios
        Object.keys(payload).forEach(key => {
            if (payload[key] === '') payload[key] = null;
        });

        // Limpeza de campos físicos (SÓ DEVE OCORRER SE FOR EDIÇÃO)
        if (payload.id) {
            if (payload.tipo_controle === 'SERIALIZADO' || payload.categoria === 'PNEUS') {
                payload.quantidade_inicial = 0;
                payload.valor_aquisicao = 0;
                payload.fogo = null;
                payload.dot = null;
                payload.serial = null;
                payload.patrimonio = null;
                payload.marca = null;
                payload.medida = null;
                payload.sulco_novo = null;
                payload.data_vencimento = null;
            }
        }

        if (!payload.estoque_minimo) payload.estoque_minimo = 0;

        try {
            if (payload.id) {
                await api.put(`/estoque/itens/${payload.id}`, payload);
                alert("Cadastro do Item atualizado com sucesso!");
            } else {
                await api.post('/estoque/itens', payload);
                alert("Item cadastrado com sucesso!");
            }
            setModalAberto(false);
            setForm(initialForm);
            carregar();
        } catch (error) {
            const det = error.response?.data?.detail;
            const msgErro = Array.isArray(det)
                ? JSON.stringify(det, null, 2)
                : (typeof det === 'object' ? JSON.stringify(det) : (det || error.message));
            alert("Erro ao Salvar:\n\n" + msgErro);
        }
    }

    // --- NOVA LÓGICA: EXPANDIR E GERENCIAR SUB-ITENS ---
    async function toggleExpand(item) {
        if (expandedItem === item.id) {
            setExpandedItem(null);
            setSubItens([]);
        } else {
            setExpandedItem(item.id);
            if (item.tipo_controle === 'SERIALIZADO') {
                setLoadingSub(true);
                try {
                    // Chama o novo endpoint criado no Python
                    const res = await api.get(`/estoque/itens/${item.id}/fisicos`);
                    setSubItens(res.data);
                } catch (e) {
                    console.error(e);
                    alert("Erro ao buscar itens físicos. Verifique se o Backend foi atualizado.");
                }
                setLoadingSub(false);
            }
        }
    }

    function abrirEditarFisico(subItem) {
        // Prepara o objeto form com os campos reais retornados pelo backend novo
        setFormFisico({
            ...subItem,
            // Garante que campos opcionais não sejam undefined
            medida: subItem.medida || '',
            sulco_novo: subItem.sulco_novo || 0,
            sulco_atual: subItem.sulco_atual || 0
        });
        setModalEdicaoFisico(true);
    }

    // FUNÇÃO ATUALIZADA: Envia null se vazio para evitar erro no backend
    async function salvarFisico() {
        setErroEdicaoItem(null);
        try {
            if (formFisico.tipo === 'PNEU') {
                const payload = {
                    fogo: formFisico.fogo || null, dot: formFisico.dot || null,
                    marca: formFisico.marca || null, medida: formFisico.medida || null,
                    sulco_novo: Number(formFisico.sulco_novo), sulco_atual: Number(formFisico.sulco_atual), status: formFisico.status
                };
                await api.put(`/pneus/${formFisico.id}/dados`, payload);
            } else {
                const payload = { serial: formFisico.serial || null, patrimonio: formFisico.patrimonio || null };
                await api.put(`/estoque/equipamentos/${formFisico.id}`, payload);
            }
            alert("Item atualizado com sucesso!");
            setModalEdicaoFisico(false);
            const res = await api.get(`/estoque/itens/${expandedItem}/fisicos`);
            setSubItens(res.data);
        } catch (e) {
            const msg = e.response?.data?.detail || e.message;
            if (msg.includes('Duplicado')) {
                setErroEdicaoItem(msg);
            } else {
                alert("Erro ao salvar: " + msg);
            }
        }
    }

    async function excluirFisico(id, tipo) {
        if (!window.confirm("ATENÇÃO: Isso excluirá este item específico do estoque.\nTem certeza?")) return;
        try {
            if (tipo === 'PNEU') {
                await api.delete(`/pneus/${id}`);
            } else {
                // --- AGORA FUNCIONA PARA FERRAMENTAS ---
                await api.delete(`/estoque/equipamentos/${id}`);
            }

            // Recarrega lista
            const res = await api.get(`/estoque/itens/${expandedItem}/fisicos`);
            setSubItens(res.data);
            carregar(); // Atualiza saldo total na tabela principal
        } catch (e) {
            alert("Erro: " + (e.response?.data?.detail || e.message));
        }
    }

    // --- NOVO: EXPORTAR PDF DO ESTOQUE COM ITENS FÍSICOS ---
    async function exportarPDF() {
        try {
            alert("Iniciando a geração do PDF. Isso pode demorar alguns segundos dependendo da quantidade de itens físicos, por favor aguarde...");
            const doc = new jsPDF();
            doc.text("Relatório de Ferramentas & Estoque", 14, 15);
            doc.setFontSize(10);
            doc.text(`Filtros: Busca: "${busca}" | Categoria: "${filtroCategoria || 'Todas'}" | Tipo: "${filtroControle || 'Todos'}"`, 14, 22);

            const tableData = [];

            for (const item of itensFiltrados) {
                // 1. Adiciona a linha do modelo/pai
                tableData.push([
                    item.codigo_referencia || '-',
                    item.nome || '-',
                    item.categoria || '-',
                    item.tipo_controle === 'QUANTIDADE' ? 'Volume' : 'Unitário',
                    `${item.saldo_atual} ${item.unidade_medida === 'UNIDADE' ? 'UND' : item.unidade_medida}`
                ]);

                // 2. Se for serializado, busca as "crianças" na API para incluir abaixo
                if (item.tipo_controle === 'SERIALIZADO') {
                    try {
                        const res = await api.get(`/estoque/itens/${item.id}/fisicos`);
                        const fisicos = res.data;
                        if (fisicos && fisicos.length > 0) {
                            // MUDANÇA: Novo título solicitado
                            tableData.push([{ content: `  ↳ ITENS DETALHADOS (${fisicos.length} itens encontrados):`, colSpan: 5, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [80, 80, 80] } }]);

                            // Adiciona as linhas filhas formadas em texto
                            fisicos.forEach(f => {
                                let detalhes = '';
                                if (f.tipo === 'PNEU') {
                                    detalhes = `      DOT: ${f.dot || '-'} | Fogo: ${f.fogo || '-'} | Medida: ${f.medida || '-'} | Marca: ${f.marca || '-'} | Sulco: ${f.sulco_novo}mm | Status: ${f.status?.replace('_', ' ')} ${f.placa_veiculo ? '(' + f.placa_veiculo + ')' : ''}`;
                                } else {
                                    detalhes = `      Serial: ${f.serial || '-'} | Patrimônio: ${f.patrimonio || '-'} | Status: ${f.status?.replace('_', ' ')} ${f.placa_veiculo ? '(' + f.placa_veiculo + ')' : ''}`;
                                }
                                tableData.push([{ content: detalhes, colSpan: 5, styles: { textColor: [100, 100, 100], fontSize: 8 } }]);
                            });
                        }
                    } catch (err) {
                        console.error(`Erro ao buscar itens físicos do item ${item.id}`, err);
                    }
                }

                // MUDANÇA: Linha separadora escura e grossa após cada modelo/item para facilitar a leitura visual
                tableData.push([{ content: '', colSpan: 5, styles: { fillColor: [45, 55, 72], minCellHeight: 1.5 } }]);
            }

            autoTable(doc, {
                startY: 28,
                head: [["Código", "Modelo/Item", "Categoria", "Controle", "Saldo"]],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [0, 214, 143], textColor: [0, 0, 0] },
                styles: { fontSize: 9 }
            });

            doc.save("relatorio_estoque.pdf");
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar PDF.");
        }
    }

    // Estilo básico para Inputs
    const inputStyle = {
        width: '100%',
        padding: '8px',
        background: '#2d3748',
        border: '1px solid #4a5568',
        color: 'white',
        borderRadius: 4,
        marginTop: '5px',
        boxSizing: 'border-box' // <--- ISSO RESOLVE A INVASÃO DOS CAMPOS
    };

    // --- LÓGICA DE FILTROS E BUSCA ---
    const categoriasDisponiveis = [...new Set(itens.map(i => i.categoria).filter(Boolean))];

    const itensFiltrados = itens.filter(i => {
        const termo = busca.toLowerCase();
        // Busca por Nome, Código ou Categoria
        const matchBusca =
            (i.nome || '').toLowerCase().includes(termo) ||
            (i.codigo_referencia || '').toLowerCase().includes(termo) ||
            (i.categoria || '').toLowerCase().includes(termo);

        const matchCat = filtroCategoria ? i.categoria === filtroCategoria : true;
        const matchCtrl = filtroControle ? i.tipo_controle === filtroControle : true;

        return matchBusca && matchCat && matchCtrl;
    }).sort((a, b) => {
        // Ordenação inteligente: Itens mais abaixo do estoque mínimo aparecem primeiro
        const deficitA = (a.estoque_minimo > 0 && a.saldo_atual < a.estoque_minimo) ? (a.estoque_minimo - a.saldo_atual) : -1;
        const deficitB = (b.estoque_minimo > 0 && b.saldo_atual < b.estoque_minimo) ? (b.estoque_minimo - b.saldo_atual) : -1;

        if (deficitA > 0 || deficitB > 0) return deficitB - deficitA; // O maior déficit fica no topo
        return (a.nome || '').localeCompare(b.nome || ''); // Ordem alfabética se estiverem ok
    });

    // --- LÓGICA DE VALIDAÇÃO DE SERIAL/PATRIMÔNIO EM TEMPO REAL ---

    // Para Entrada (Movimentação)
    const serialMovDuplicado = formMov.serial && seriaisUsados.map(s => s.toLowerCase()).includes(formMov.serial.toLowerCase());
    const patriMovDuplicado = formMov.patrimonio && patrimoniosUsados.map(p => p.toLowerCase()).includes(formMov.patrimonio.toLowerCase());

    // Para Edição (Pula o próprio item que está sendo editado)
    const itemOriginal = subItens.find(s => s.id === formFisico.id);
    const serialEdicaoDuplicado = formFisico.serial &&
        formFisico.serial.toLowerCase() !== (itemOriginal?.serial || '').toLowerCase() &&
        seriaisUsados.map(s => s.toLowerCase()).includes(formFisico.serial.toLowerCase());

    const patriEdicaoDuplicado = formFisico.patrimonio &&
        formFisico.patrimonio.toLowerCase() !== (itemOriginal?.patrimonio || '').toLowerCase() &&
        patrimoniosUsados.map(p => p.toLowerCase()).includes(formFisico.patrimonio.toLowerCase());

    // --- NOVA FUNÇÃO: EXCLUIR ITEM PAI (MOLDE) ---
    async function excluirItemPai(item) {
        if (!window.confirm(`ATENÇÃO: Você tem certeza que deseja excluir o modelo "${item.nome}"?\n\nIsso apagará o histórico associado a ele. O sistema só permitirá a exclusão se o saldo for ZERO.`)) {
            return;
        }

        try {
            await api.delete(`/estoque/itens/${item.id}`);
            alert("Item excluído com sucesso!");

            // Se o item que foi excluído for o mesmo que estava com a "setinha" aberta, ele fecha
            if (expandedItem === item.id) {
                setExpandedItem(null);
                setSubItens([]);
            }

            carregar(); // Recarrega a tabela
            carregarAuxiliares(); // Recarrega os filtros e previsões
        } catch (error) {
            alert("Erro ao excluir: " + (error.response?.data?.detail || error.message));
        }
    }

    return (
        <div>
            {/* --- CABEÇALHO E FILTROS --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: 15, flex: 1, minWidth: '300px' }}>
                    <div className="search-box" style={{ display: 'flex', alignItems: 'center', background: '#2d3748', padding: '8px 15px', borderRadius: 5, flex: 1 }}>
                        <Search size={16} color="#a0aec0" style={{ marginRight: 5 }} />
                        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, código, categoria..." style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
                    </div>

                    <select
                        value={filtroCategoria}
                        onChange={e => setFiltroCategoria(e.target.value)}
                        style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '0 15px', borderRadius: 5, outline: 'none' }}
                    >
                        <option value="">Todas as Categorias</option>
                        {categoriasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={filtroControle}
                        onChange={e => setFiltroControle(e.target.value)}
                        style={{ background: '#2d3748', border: '1px solid #4a5568', color: 'white', padding: '0 15px', borderRadius: 5, outline: 'none' }}
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="QUANTIDADE">Quantidade / Volume</option>
                        <option value="SERIALIZADO">Unitário / Serializado</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    {/* NOVO BOTAO DE PDF */}
                    <button onClick={exportarPDF} className="btn-add" style={{ background: '#e53e3e', border: 'none', color: 'white', padding: '0 15px' }} title="Baixar Relatório">
                        <FileText size={16} style={{ marginRight: 5 }} /> PDF
                    </button>

                    {can('estoque.movimentar') && (
                        <>
                            <button className="btn-add" style={{ background: '#2d3748', border: '1px solid #48bb78', color: '#48bb78' }} onClick={() => {
                                setTipoMov('ENTRADA'); setFiltroCategoriaMov(''); setFormMov({ estoque_item_id: '', quantidade: '', observacao: '', numero_nf: '', valor_aquisicao: '', serial: '', patrimonio: '' }); setModalMov(true);
                            }}><ArrowUpCircle size={16} /> Entrada</button>

                            <button className="btn-add" style={{ background: '#2d3748', border: '1px solid #e53e3e', color: '#e53e3e' }} onClick={() => {
                                setTipoMov('SAIDA'); setFiltroCategoriaMov(''); setFormMov({ estoque_item_id: '', quantidade: '', observacao: '', base_id: '', solicitante_id: '', responsavel_id: '', serial: '', patrimonio: '' }); setModalMov(true);
                            }}><ArrowDownCircle size={16} /> Saída</button>
                        </>
                    )}
                    {can('estoque.cadastrar') && (
                        <button
                            className="btn-add"
                            onClick={() => {
                                setForm({ ...initialForm, codigo_referencia: getProximoCodigo() });
                                setModalAberto(true);
                            }}
                        >
                            <Plus size={16} /> Novo Modelo de Item
                        </button>
                    )}
                </div>
            </div>

            {/* --- TABELA PRINCIPAL RESPONSIVA --- */}
            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th> {/* Expandir (Pequeno e fixo) */}
                            <th style={{ whiteSpace: 'nowrap' }}>Código</th>
                            <th>Modelo/Item</th> {/* Cresce livremente */}
                            <th style={{ textAlign: 'center' }}>Categoria</th>
                            <th style={{ textAlign: 'center' }}>Controle</th>
                            <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Saldo UND</th>
                            <th style={{ textAlign: 'center', width: '140px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itensFiltrados.map(item => (
                            <React.Fragment key={item.id}>
                                <tr style={{ background: expandedItem === item.id ? '#2d3748' : 'transparent' }}>
                                    <td>
                                        {item.tipo_controle === 'SERIALIZADO' && (
                                            <button onClick={() => toggleExpand(item)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                                {expandedItem === item.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </button>
                                        )}
                                    </td>
                                    <td>{item.codigo_referencia}</td>
                                    <td style={{ fontWeight: expandedItem === item.id ? 'bold' : 'normal' }}>{item.nome}</td>
                                    <td style={{ textAlign: 'center' }}><span className="tag" style={{ display: 'inline-block' }}>{item.categoria}</span></td>
                                    <td style={{ textAlign: 'center' }}>{item.tipo_controle === 'QUANTIDADE' ? 'Volume' : 'Unitário'}</td>
                                    <td style={{
                                        color: item.estoque_minimo > 0 && item.saldo_atual <= item.estoque_minimo ? '#e53e3e' : (item.saldo_atual === 0 ? '#a0aec0' : '#00d68f'),
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}>
                                        {item.tipo_controle === 'SERIALIZADO' && item.saldo_atual === 0
                                            ? <span style={{ opacity: 0.6 }}>0 (Molde)</span>
                                            : <>{item.saldo_atual} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{item.unidade_medida === 'UNIDADE' ? 'UND' : item.unidade_medida}</span></>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                            {can('estoque.movimentar') && (
                                                <>
                                                    <button onClick={() => { setTipoMov('ENTRADA'); setFormMov({ ...formMov, estoque_item_id: item.id }); setModalMov(true); }} title="Dar Entrada" style={{ background: 'none', border: 'none', color: '#00d68f', cursor: 'pointer' }}><ArrowUpCircle size={16} /></button>
                                                    <button onClick={() => { setTipoMov('SAIDA'); setFormMov({ ...formMov, estoque_item_id: item.id }); setModalMov(true); }} title="Dar Saída" style={{ background: 'none', border: 'none', color: '#f6ad55', cursor: 'pointer' }}><ArrowDownCircle size={16} /></button>
                                                </>
                                            )}
                                            {can('estoque.editar') && (
                                                <button onClick={() => abrirEdicao(item)} title="Editar Cadastro (Molde)" style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer' }}><Edit size={16} /></button>
                                            )}
                                            {can('estoque.historico') && (
                                                <button onClick={() => verHistoricoGeral(item)} title="Histórico Geral" style={{ background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}><Clock size={16} /></button>
                                            )}
                                            {can('estoque.excluir') && (
                                                <button onClick={() => excluirItemPai(item)} title="Excluir Molde" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* --- ÁREA EXPANDIDA (SUB-LISTA CORRIGIDA) --- */}
                                {expandedItem === item.id && (
                                    <tr>
                                        <td colSpan="7" style={{ background: '#1a202c', padding: '10px 20px' }}>
                                            <div style={{ borderLeft: '3px solid #63b3ed', paddingLeft: 15 }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#63b3ed' }}>
                                                    Itens Individuais ({subItens.length})
                                                    <span style={{ fontSize: '0.8rem', color: '#a0aec0', marginLeft: 10, fontWeight: 'normal' }}>
                                                        (Estes são os itens físicos reais atrelados ao modelo acima)
                                                    </span>
                                                </h4>

                                                {loadingSub ? <p style={{ color: '#a0aec0' }}>Carregando...</p> : (
                                                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ background: '#2d3748', color: '#a0aec0' }}>
                                                                {/* Cabeçalhos alinhados à esquerda para texto/identificadores */}
                                                                {item.categoria === 'PNEUS' ? (
                                                                    <>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>DOT (Principal)</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Fogo (Opcional)</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Medida</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Marca</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Sulco</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                                                                        <th style={{ textAlign: 'center', padding: '8px' }}>Ações</th>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Serial (Principal)</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Patrimônio</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Marca/Modelo</th>
                                                                        <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                                                                        <th style={{ textAlign: 'center', padding: '8px' }}>Ações</th>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {subItens.map(sub => (
                                                                <tr key={sub.id} style={{ borderBottom: '1px solid #444' }}>
                                                                    {sub.tipo === 'PNEU' ? (
                                                                        <>
                                                                            <td style={{ fontWeight: 'bold', color: '#00d68f', textAlign: 'left', padding: '8px' }}>{sub.dot || '-'}</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>{sub.fogo || <span style={{ opacity: 0.5 }}>S/N</span>}</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>{sub.medida}</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>{sub.marca}</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>{sub.sulco_novo} mm</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>
                                                                                {sub.status?.replace('_', ' ')}
                                                                                {sub.status === 'EM_USO' && sub.placa_veiculo && (
                                                                                    <span style={{ color: '#63b3ed', fontSize: '0.8rem', marginLeft: 6, fontWeight: 'bold' }}>
                                                                                        ({sub.placa_veiculo})
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <td style={{ fontWeight: 'bold', color: '#00d68f', textAlign: 'left', padding: '8px' }}>{sub.serial}</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>{sub.patrimonio || '-'}</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>{sub.marca || '-'}</td>
                                                                            <td style={{ textAlign: 'left', padding: '8px' }}>
                                                                                {sub.status?.replace('_', ' ')}
                                                                                {sub.status === 'EM_USO' && sub.placa_veiculo && (
                                                                                    <span style={{ color: '#63b3ed', fontSize: '0.8rem', marginLeft: 6, fontWeight: 'bold' }}>
                                                                                        ({sub.placa_veiculo})
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </>
                                                                    )}

                                                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                                                        {can('estoque.historico') && (
                                                                            <button
                                                                                onClick={() => verHistoricoFisico(sub)}
                                                                                title="Ver Histórico Deste Item"
                                                                                style={{ marginRight: 10, background: 'none', border: 'none', color: '#63b3ed', cursor: 'pointer' }}
                                                                            >
                                                                                <FileText size={14} />
                                                                            </button>
                                                                        )}

                                                                        {can('estoque.editar') && (
                                                                            <button onClick={() => abrirEditarFisico(sub)} title="Editar" style={{ marginRight: 10, background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer' }}><Edit size={14} /></button>
                                                                        )}

                                                                        {can('estoque.excluir') && (
                                                                            <button onClick={() => excluirFisico(sub.id, sub.tipo)} title="Excluir" style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {subItens.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', color: '#718096', padding: 20 }}>Nenhum item físico cadastrado neste modelo. Use o botão "Entrada" acima para adicionar.</td></tr>}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL 1: EDIÇÃO FÍSICA (PNEU/SERIAL) --- */}
            {modalEdicaoFisico && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>Editar Item Individual</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>

                            {/* CAMPOS SE FOR PNEU */}
                            {formFisico.tipo === 'PNEU' ? (
                                <>
                                    <label>DOT (Identificador Principal)</label>
                                    <input value={formFisico.dot || ''} onChange={e => setFormFisico({ ...formFisico, dot: e.target.value })} style={inputStyle} />

                                    <label>Fogo (Opcional)</label>
                                    <input value={formFisico.fogo || ''} onChange={e => setFormFisico({ ...formFisico, fogo: e.target.value })} style={inputStyle} />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label>Marca</label>
                                            <input value={formFisico.marca || ''} onChange={e => setFormFisico({ ...formFisico, marca: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label>Medida</label>
                                            <input value={formFisico.medida || ''} onChange={e => setFormFisico({ ...formFisico, medida: e.target.value })} style={inputStyle} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label>Sulco Novo (mm)</label>
                                            <input type="number" value={formFisico.sulco_novo || ''} onChange={e => setFormFisico({ ...formFisico, sulco_novo: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label>Sulco Atual (mm)</label>
                                            <input type="number" value={formFisico.sulco_atual || ''} onChange={e => setFormFisico({ ...formFisico, sulco_atual: e.target.value })} style={inputStyle} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // CAMPOS SE FOR OUTRO EQUIPAMENTO
                                <>
                                    <div>
                                        <label>Serial</label>
                                        <input value={formFisico.serial || ''} onChange={e => setFormFisico({ ...formFisico, serial: e.target.value })} style={inputStyle} />
                                        {serialEdicaoDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Serial já em uso!</span>}
                                    </div>

                                    <div>
                                        <label>Patrimônio</label>
                                        <input value={formFisico.patrimonio || ''} onChange={e => setFormFisico({ ...formFisico, patrimonio: e.target.value })} style={inputStyle} />
                                        {patriEdicaoDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Patrimônio já em uso!</span>}
                                    </div>

                                    {erroEdicaoItem && <div style={{ color: '#fc8181', fontSize: '0.85rem' }}>{erroEdicaoItem}</div>}
                                </>
                            )}

                            <label>Status</label>
                            <select value={formFisico.status} onChange={e => setFormFisico({ ...formFisico, status: e.target.value })} style={inputStyle}>
                                <option value="ESTOQUE">Estoque (Disponível)</option>
                                <option value="SUCATA">Sucata (Descarte)</option>
                                <option value="EM_USO">Em Uso (Montado)</option>
                                <option value="MANUTENCAO">Em Manutenção</option>
                            </select>

                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <button onClick={salvarFisico} disabled={serialEdicaoDuplicado || patriEdicaoDuplicado} className="btn-add" style={{ flex: 1, opacity: (serialEdicaoDuplicado || patriEdicaoDuplicado) ? 0.5 : 1 }}><Save size={16} /> Salvar</button>
                                <button onClick={() => setModalEdicaoFisico(false)} className="btn-close-modal" style={{ flex: 1, position: 'static' }}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: MOVIMENTAÇÃO --- */}
            {modalMov && (
                <div className="modal-overlay" onClick={() => setModalMov(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        {/* ... cabeçalho do modal ... */}
                        <form onSubmit={handleMovimento} style={{ display: 'grid', gap: 15 }}>
                            {/* NOVA SELEÇÃO COM FILTRO E BUSCA */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                                <div>
                                    <label>Filtrar Categoria</label>
                                    <select
                                        value={filtroCategoriaMov}
                                        onChange={e => {
                                            setFiltroCategoriaMov(e.target.value);
                                            // Se mudar a categoria, limpa o item que estava selecionado
                                            setFormMov({ ...formMov, estoque_item_id: '' });
                                        }}
                                        style={inputStyle}
                                    >
                                        <option value="">Todas</option>
                                        {categoriasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Selecione o Modelo ou Item</label>
                                    <Select
                                        styles={customSelectStyles}
                                        placeholder="Digite para buscar..."
                                        value={
                                            formMov.estoque_item_id
                                                ? {
                                                    value: formMov.estoque_item_id,
                                                    label: itens.find(i => i.id == formMov.estoque_item_id)
                                                        ? `${itens.find(i => i.id == formMov.estoque_item_id).nome} (${itens.find(i => i.id == formMov.estoque_item_id).codigo_referencia})`
                                                        : 'Selecionado'
                                                }
                                                : null
                                        }
                                        onChange={selected => setFormMov({ ...formMov, estoque_item_id: selected ? selected.value : '' })}
                                        options={
                                            itens
                                                // 1. Filtra por Entrada ou Saída
                                                .filter(i => tipoMov === 'ENTRADA' ? true : i.tipo_controle === 'QUANTIDADE')
                                                // 2. Filtra pela categoria selecionada ao lado
                                                .filter(i => filtroCategoriaMov ? i.categoria === filtroCategoriaMov : true)
                                                // 3. Monta a lista
                                                .map(i => ({
                                                    value: i.id,
                                                    label: `${i.nome} (${i.codigo_referencia})`
                                                }))
                                        }
                                        isClearable
                                        noOptionsMessage={() => "Nenhum item encontrado"}
                                    />
                                </div>
                            </div>

                            {/* CAMPOS CONDICIONAIS DE ENTRADA/SAIDA */}
                            {tipoMov === 'ENTRADA' ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div><label>Quantidade</label><input type="number" min="1" required placeholder="Ex: 50" onChange={e => setFormMov({ ...formMov, quantidade: e.target.value })} style={inputStyle} /></div>
                                        <div><label>Valor Unitário (R$)</label><input type="number" step="0.01" placeholder="R$ 0,00" onChange={e => setFormMov({ ...formMov, valor_aquisicao: e.target.value })} style={inputStyle} /></div>
                                    </div>

                                    {/* CÁLCULO VISUAL DO TOTAL */}
                                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#00d68f', fontWeight: 'bold' }}>
                                        Custo Total: R$ {((formMov.quantidade || 0) * (formMov.valor_aquisicao || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>

                                    {/* NF sem required */}
                                    <div><label>Número da NF (Opcional)</label><input placeholder="Série e Número" onChange={e => setFormMov({ ...formMov, numero_nf: e.target.value })} style={inputStyle} /></div>

                                    {/* MUDANÇA 4: Campos Específicos para Pneus */}
                                    {itemSelecionado?.tipo_controle === 'SERIALIZADO' && (
                                        <div style={{ background: 'rgba(246, 173, 85, 0.1)', padding: 10, borderRadius: 5, border: '1px dashed #f6ad55', marginTop: 10 }}>
                                            <h5 style={{ color: '#f6ad55', margin: '0 0 10px 0' }}>Dados do Item Serializado</h5>

                                            {itemSelecionado?.categoria === 'PNEUS' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        <div><label>DOT (Obrigatório)</label><input required onChange={e => setFormMov({ ...formMov, dot: e.target.value })} style={inputStyle} /></div>
                                                        <div><label>Nº de Fogo (Opcional)</label><input onChange={e => setFormMov({ ...formMov, fogo: e.target.value })} style={{ ...inputStyle, borderColor: '#a0aec0' }} /></div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                                        <div><label>Marca (Opcional)</label><input placeholder="Ex: Michelin" onChange={e => setFormMov({ ...formMov, marca: e.target.value })} style={inputStyle} /></div>
                                                        <div><label>Medida</label><input required placeholder="Ex: 295/80" onChange={e => setFormMov({ ...formMov, medida: e.target.value })} style={inputStyle} /></div>
                                                        <div><label>Sulco Novo (Opcional)</label><input type="number" placeholder="Ex: 18.0" onChange={e => setFormMov({ ...formMov, sulco_novo: e.target.value })} style={inputStyle} /></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    <div>
                                                        <label>Número Serial</label>
                                                        <input required placeholder="S/N (Obrigatório)" value={formMov.serial || ''} onChange={e => setFormMov({ ...formMov, serial: e.target.value })} style={inputStyle} />
                                                        {serialMovDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Serial já em uso!</span>}
                                                    </div>
                                                    <div>
                                                        <label>Nº Patrimônio</label>
                                                        <input placeholder="Opcional" value={formMov.patrimonio || ''} onChange={e => setFormMov({ ...formMov, patrimonio: e.target.value })} style={inputStyle} />
                                                        {patriMovDuplicado && <span style={{ color: '#fc8181', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}><AlertTriangle size={12} /> Patrimônio já em uso!</span>}
                                                    </div>

                                                    {erroMovimentacao && <div style={{ gridColumn: '1 / -1', color: '#fc8181', fontSize: '0.85rem' }}>{erroMovimentacao}</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* SAÍDA */}
                                    <div><label>Qtd. a Retirar</label><input type="number" required placeholder="Ex: 2" onChange={e => setFormMov({ ...formMov, quantidade: e.target.value })} style={inputStyle} /></div>
                                    <div>
                                        <label>Centro de Custo / Base</label>
                                        <select required onChange={e => setFormMov({ ...formMov, base_id: e.target.value })} style={inputStyle}>
                                            <option value="">Selecione...</option>
                                            {bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label>Quem Autorizou?</label>
                                            <select required onChange={e => setFormMov({ ...formMov, solicitante_id: e.target.value })} style={inputStyle}>
                                                <option value="">Selecione...</option>
                                                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label>Quem Retirou?</label>
                                            <select required onChange={e => setFormMov({ ...formMov, responsavel_id: e.target.value })} style={inputStyle}>
                                                <option value="">Selecione...</option>
                                                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div><label>Observação (Obrigatória)</label><input required placeholder="Justificativa" onChange={e => setFormMov({ ...formMov, observacao: e.target.value })} style={inputStyle} /></div>

                            {/* MUDANÇA 5: Aviso de Gastos */}
                            {tipoMov === 'ENTRADA' && (
                                <div style={{ background: 'rgba(229, 62, 62, 0.2)', padding: '10px', borderRadius: '5px', border: '1px solid #e53e3e', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Info size={24} color="#e53e3e" />
                                    <span style={{ color: '#feb2b2', fontSize: '0.85rem' }}><strong>Atenção:</strong> Para itens adicionados diretamente no estoque, é obrigatório fazer o lançamento manual no menu <strong>GASTOS</strong> para controle financeiro.</span>
                                </div>
                            )}

                            <button type="submit" disabled={serialMovDuplicado || patriMovDuplicado} className="btn-add" style={{ background: tipoMov === 'ENTRADA' ? '#00d68f' : '#f6ad55', color: 'black', padding: 15, marginTop: 10, fontWeight: 'bold', opacity: (serialMovDuplicado || patriMovDuplicado) ? 0.5 : 1 }}>
                                Confirmar {tipoMov}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: CADASTRO DE MOLDE --- */}
            {modalAberto && (
                <div className="modal-overlay" onClick={() => setModalAberto(false)}>
                    <div className="modal-content" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Package color="#00d68f" /> {form.id ? 'Editar Molde' : 'Novo Modelo/Item de Estoque'}
                            </h3>
                            <button onClick={() => setModalAberto(false)} className="btn-close-modal"><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <div style={{ background: '#1a202c', padding: 15, borderRadius: 8 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#00d68f' }}>Passo 1: Identificação Básica</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 15, marginBottom: 15 }}>
                                    <div>
                                        <label>Código de Referência</label>
                                        <input
                                            required
                                            value={form.codigo_referencia}
                                            onChange={e => setForm({ ...form, codigo_referencia: e.target.value })}
                                            disabled={!form.id}
                                            style={{
                                                ...inputStyle,
                                                opacity: !form.id ? 0.7 : 1,
                                                cursor: !form.id ? 'not-allowed' : 'text',
                                                color: !form.id ? '#00d68f' : 'white',
                                                fontWeight: !form.id ? 'bold' : 'normal'
                                            }}
                                        />
                                        {codigoExiste && form.id && <span style={{ color: '#e53e3e', fontSize: '0.8rem', display: 'block', marginTop: 5 }}><AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Código já em uso!</span>}
                                    </div>
                                    <div>
                                        <label>Categoria</label>
                                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 5 }}>
                                            <select required value={form.categoria} onChange={e => {
                                                const catNome = e.target.value;
                                                const catObj = categoriasBD.find(c => c.nome === catNome);

                                                // NOVA LÓGICA: Define o tipo automático APENAS baseada na configuração da categoria
                                                let tipoAuto = form.tipo_controle;
                                                if (catObj && catObj.tipo_padrao !== 'LIVRE') tipoAuto = catObj.tipo_padrao;

                                                setForm({ ...form, categoria: catNome, tipo_controle: tipoAuto });
                                            }} style={{ ...inputStyle, marginTop: 0 }}>
                                                <option value="">Selecione...</option>
                                                {categoriasBD.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setModalCategorias(true)} title="Gerenciar Categorias" style={{ background: '#2d3748', border: '1px solid #4a5568', color: '#a0aec0', borderRadius: 4, height: 35, padding: '0 10px', cursor: 'pointer' }}><Settings size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
                                    {form.categoria === 'PNEUS' ? (
                                        <div><label>Medida do Pneu</label><input required value={form.medida || ''} placeholder="Ex: 295/80" onChange={e => setForm({ ...form, medida: e.target.value })} style={inputStyle} /></div>
                                    ) : (
                                        <div><label>Nome do Item</label><input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} /></div>
                                    )}
                                    <div>
                                        <label>Unidade de Medida</label>
                                        <select required value={form.unidade_medida} onChange={e => {
                                            if (e.target.value === 'NOVA') { handleNovaUnidade(); }
                                            else { setForm({ ...form, unidade_medida: e.target.value }); }
                                        }} style={inputStyle}>
                                            <option value="">Selecione...</option>
                                            {unidadesBD.map(u => <option key={u.nome} value={u.nome}>{u.nome}</option>)}
                                            <option value="NOVA" style={{ fontWeight: 'bold', color: '#00d68f' }}>➕ Criar Nova Unidade</option>
                                        </select>
                                    </div>
                                    <div><label>Qtd Mínima (Opcional)</label><input type="number" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: e.target.value })} style={inputStyle} /></div>
                                </div>
                                <div><label>Observações Gerais</label><textarea rows="2" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} style={{ ...inputStyle, fontFamily: 'inherit' }} /></div>
                            </div>

                            <div style={{ background: '#1a202c', padding: 15, borderRadius: 8 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#f6ad55' }}>Passo 2: Definição do Controle</h4>

                                {(() => {
                                    const catObj = categoriasBD.find(c => c.nome === form.categoria);
                                    // NOVA LÓGICA DE TRAVA: Bloqueia APENAS baseada na configuração da categoria
                                    const isLocked = (catObj && catObj.tipo_padrao !== 'LIVRE');

                                    return (
                                        <>
                                            <div style={{ display: 'flex', gap: 20, marginBottom: 15, padding: 10, background: '#2d3748', borderRadius: 5, opacity: isLocked ? 0.6 : 1 }}>
                                                <label style={{ cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <input type="radio" disabled={isLocked} name="tipo_controle" checked={form.tipo_controle === 'QUANTIDADE'} onChange={() => setForm({ ...form, tipo_controle: 'QUANTIDADE' })} /> 🔘 Controle por Volume/Quantidade
                                                </label>
                                                <label style={{ cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <input type="radio" disabled={isLocked} name="tipo_controle" checked={form.tipo_controle === 'SERIALIZADO'} onChange={() => setForm({ ...form, tipo_controle: 'SERIALIZADO' })} /> ⚪ Controle Unitário/Serializado
                                                </label>
                                            </div>
                                            {isLocked && <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginTop: -10, marginBottom: 15 }}>* O tipo de controle está bloqueado pelas configurações desta Categoria.</p>}
                                        </>
                                    );
                                })()}
                                {/* Se estiver editando, avisar que não pode criar saldo inicial aqui */}
                                {form.id ? (
                                    <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>* Para ajustar o saldo ou adicionar itens físicos, utilize os botões de <strong>Movimentação</strong> na tela principal.</p>
                                ) : (
                                    form.tipo_controle === 'QUANTIDADE' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                            <div><label>Qtd Inicial (Opcional)</label><input type="number" placeholder="0" value={form.quantidade_inicial} onChange={e => setForm({ ...form, quantidade_inicial: e.target.value })} style={inputStyle} /></div>
                                            <div><label>Valor Unitário (R$) (Opcional)</label><input placeholder="0,00" value={form.valor_aquisicao} onChange={e => setForm({ ...form, valor_aquisicao: e.target.value })} style={inputStyle} /></div>
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(246, 173, 85, 0.1)', padding: 15, borderRadius: 5, border: '1px dashed #f6ad55' }}>
                                            <h5 style={{ color: '#f6ad55', margin: '0 0 10px 0' }}>Entrada Imediata do Item (Opcional)</h5>
                                            <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginBottom: 15 }}>Preencha abaixo se quiser dar entrada em itens físicos junto com a criação deste modelo.</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                                                <div><label>Quantidade a Adicionar (Opcional)</label><input type="number" placeholder="Ex: 1" value={form.quantidade_inicial} onChange={e => setForm({ ...form, quantidade_inicial: e.target.value })} style={inputStyle} /></div>
                                                <div><label>Valor Unitário (R$) (Opcional)</label><input type="number" step="0.01" placeholder="0.00" value={form.valor_aquisicao} onChange={e => setForm({ ...form, valor_aquisicao: e.target.value })} style={inputStyle} /></div>
                                            </div>

                                            {form.categoria === 'PNEUS' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        <div><label>DOT (Opcional)</label><input value={form.dot || ''} onChange={e => setForm({ ...form, dot: e.target.value })} style={inputStyle} /></div>
                                                        <div><label>Nº de Fogo (Opcional)</label><input value={form.fogo || ''} onChange={e => setForm({ ...form, fogo: e.target.value })} style={inputStyle} /></div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        <div><label>Marca (Opcional)</label><input value={form.marca || ''} onChange={e => setForm({ ...form, marca: e.target.value })} style={inputStyle} /></div>
                                                        <div><label>Sulco Novo (Opcional)</label><input type="number" value={form.sulco_novo || ''} onChange={e => setForm({ ...form, sulco_novo: e.target.value })} style={inputStyle} /></div>
                                                        {/* CAMPO MEDIDA FOI REMOVIDO DAQUI POIS JÁ FOI PREENCHIDO NO PASSO 1 */}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    <div>
                                                        <label>Número Serial (Opcional)</label>
                                                        <input value={form.serial || ''} onChange={e => setForm({ ...form, serial: e.target.value })} style={inputStyle} />
                                                    </div>
                                                    <div>
                                                        <label>Nº Patrimônio (Opcional)</label>
                                                        <input value={form.patrimonio || ''} onChange={e => setForm({ ...form, patrimonio: e.target.value })} style={inputStyle} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                            <button type="submit" disabled={codigoExiste && !form.id} className="btn-add" style={{ width: '100%', padding: 15, fontSize: '1.1rem', opacity: codigoExiste && !form.id ? 0.5 : 1 }}>Salvar Cadastro</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: HISTÓRICO --- */}
            {modalHist && (
                <div className="modal-overlay" onClick={() => setModalHist(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: 10, marginBottom: 15 }}>
                            {/* AQUI MUDOU: Usa tituloHist em vez de modalHist.nome */}
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><Clock color="#63b3ed" /> Histórico: {tituloHist}</h3>
                            <button onClick={() => setModalHist(null)} className="btn-close-modal"><X /></button>
                        </div>
                        <div style={{ background: '#1a202c', padding: 15, borderRadius: 8, maxHeight: '400px', overflowY: 'auto' }}>
                            {historicoData.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {historicoData.map((h, idx) => (
                                        <li key={idx} style={{ borderLeft: '2px solid #4a5568', paddingLeft: 15, position: 'relative', marginBottom: 20 }}>
                                            <div style={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', background: (h.tipo_evento === 'MONTAGEM' || h.tipo_evento.includes('Entrada')) ? '#00d68f' : '#f6ad55' }}></div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                <strong style={{ color: (h.tipo_evento === 'MONTAGEM' || h.tipo_evento.includes('Entrada')) ? '#00d68f' : '#f6ad55' }}>
                                                    {h.tipo_evento} (Qtd: {h.quantidade})
                                                </strong>
                                                <span style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Clock size={12} /> {new Date(h.data_evento || h.data).toLocaleString('pt-BR')}
                                                </span>
                                            </div>

                                            {/* NOVO: MOSTRAR VEÍCULO IDÊNTICO À GESTÃO DE PNEUS */}
                                            {(h.tipo_evento === 'MONTAGEM' || h.tipo_evento === 'DESMONTAGEM') && h.veiculo && h.veiculo !== '-' && (
                                                <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: 5 }}>
                                                    {h.tipo_evento === 'MONTAGEM' ? 'Montado no veículo ' : 'Removido do veículo '}
                                                    <strong style={{ color: h.tipo_evento === 'MONTAGEM' ? '#63b3ed' : '#e53e3e' }}>{h.veiculo}</strong>
                                                    {h.km_veiculo ? ` (Km: ${h.km_veiculo})` : ''}
                                                </div>
                                            )}

                                            {h.descricao && (
                                                <div style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic', borderTop: '1px solid #4a5568', paddingTop: 5, marginTop: 5 }}>
                                                    "{h.descricao}"
                                                </div>
                                            )}

                                            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <User size={12} /> Resp: {h.responsavel_nome || h.usuario}
                                            </div>

                                            {h.numero_nf && <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: 2 }}><strong>NF:</strong> {h.numero_nf}</div>}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p style={{ color: '#a0aec0', textAlign: 'center' }}>Nenhum registro encontrado.</p>}
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL GERENCIAR CATEGORIAS - LARGURA AUMENTADA */}
            {modalCategorias && (
                <div className="modal-overlay" style={{ zIndex: 3000 }}>
                    {/* LARGURA AUMENTADA PARA 650px PARA ACOMODAR COLUNAS */}
                    <div className="modal-content" style={{ width: '650px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                            <h3>Gerenciar Categorias de Estoque</h3>
                            <button onClick={() => setModalCategorias(false)} className="btn-close-modal"><X /></button>
                        </div>

                        <form onSubmit={handleSalvarCategoria} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 2 }}>
                                    <label>Nome da Categoria</label>
                                    <input required value={formCategoria.nome} onChange={e => setFormCategoria({ ...formCategoria, nome: e.target.value })} placeholder="Ex: FILTROS" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Tipo de Controle</label>
                                    <select value={formCategoria.tipo_padrao} onChange={e => setFormCategoria({ ...formCategoria, tipo_padrao: e.target.value })} style={inputStyle}>
                                        <option value="LIVRE">Livre (Misto)</option>
                                        <option value="QUANTIDADE">Sempre Volume</option>
                                        <option value="SERIALIZADO">Sempre Serializado</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                                <button type="submit" className="btn-add" style={{ flex: 1 }}>{formCategoria.id ? 'Salvar Edição' : 'Adicionar'}</button>
                                {formCategoria.id && <button type="button" onClick={() => setFormCategoria({ id: null, nome: '', tipo_padrao: 'LIVRE' })} className="btn-close-modal" style={{ flex: 1, position: 'static' }}>Cancelar</button>}
                            </div>
                        </form>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #4a5568', color: '#a0aec0' }}>
                                        <th style={{ padding: '10px 0', textAlign: 'left' }}>Nome</th>
                                        <th style={{ padding: '10px 0', textAlign: 'left' }}>Controle Obrigatório</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoriasBD.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #4a5568' }}>
                                            <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{c.nome}</td>
                                            <td style={{ color: c.tipo_padrao !== 'LIVRE' ? '#f6ad55' : '#a0aec0' }}>
                                                {c.tipo_padrao === 'QUANTIDADE' ? 'Volume Obrigatório' : c.tipo_padrao === 'SERIALIZADO' ? 'Serializado Obrigatório' : 'Livre (Misto)'}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {/* NOVA LÓGICA: Permite editar e excluir 'PNEUS' normalmente, como qualquer outra categoria */}
                                                <>
                                                    <button onClick={() => setFormCategoria(c)} style={{ background: 'none', border: 'none', color: '#ecc94b', cursor: 'pointer', marginRight: 15 }}><Edit size={16} /></button>
                                                    <button onClick={() => handleExcluirCategoria(c.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                </>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
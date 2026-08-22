// Arquivo: frontend/src/pages/ferramentas/TabEstoque.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Componentes Modularizados
import { initialFormMolde, initialFormMov } from '../../components/estoque/estoqueConstants';
import { exportarPdfEstoque } from '../../utils/pdfEstoque';
import EstoqueHeaderFiltros from '../../components/estoque/EstoqueHeaderFiltros';
import EstoqueTabelaPrincipal from '../../components/estoque/EstoqueTabelaPrincipal';
import ModalCadastroMolde from '../../components/estoque/ModalCadastroMolde';
import ModalMovimentacao from '../../components/estoque/ModalMovimentacao';
import ModalHistorico from '../../components/estoque/ModalHistorico';
import ModalEdicaoFisica from '../../components/estoque/ModalEdicaoFisica';
import ModalGerenciarCategorias from '../../components/estoque/ModalGerenciarCategorias';

export default function TabEstoque() {
    const { can } = useAuth();

    // --- ESTADOS DE DADOS ---
    const [itens, setItens] = useState([]);
    const [categoriasBD, setCategoriasBD] = useState([]);
    const [unidadesBD, setUnidadesBD] = useState([]);
    const [bases, setBases] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [seriaisUsados, setSeriaisUsados] = useState([]);
    const [patrimoniosUsados, setPatrimoniosUsados] = useState([]);

    // --- ESTADOS DE EXPANSÃO (SUB-ITENS) ---
    const [expandedItem, setExpandedItem] = useState(null);
    const [subItens, setSubItens] = useState([]);
    const [loadingSub, setLoadingSub] = useState(false);

    // --- ESTADOS DE FILTROS ---
    const [busca, setBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroControle, setFiltroControle] = useState('');

    // --- ESTADOS DE MODAIS E FORMULÁRIOS ---
    const [modalAberto, setModalAberto] = useState(false);
    const [form, setForm] = useState(initialFormMolde);

    const [modalMov, setModalMov] = useState(false);
    const [tipoMov, setTipoMov] = useState('ENTRADA');
    const [formMov, setFormMov] = useState(initialFormMov);
    const [erroMovimentacao, setErroMovimentacao] = useState(null);

    const [modalHist, setModalHist] = useState(false);
    const [tituloHist, setTituloHist] = useState('');
    const [historicoData, setHistoricoData] = useState([]);

    const [modalEdicaoFisico, setModalEdicaoFisico] = useState(false);
    const [formFisico, setFormFisico] = useState({});
    const [erroEdicaoItem, setErroEdicaoItem] = useState(null);

    const [modalCategorias, setModalCategorias] = useState(false);
    const [formCategoria, setFormCategoria] = useState({ id: null, nome: '', tipo_padrao: 'LIVRE' });

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
                api.get('/estoque/categorias').catch(() => ({ data: [] })),
                api.get('/estoque/unidades').catch(() => ({ data: [] })),
                api.get('/bases/').catch(() => ({ data: [] })),
                api.get('/usuarios/').catch(() => ({ data: [] })),
                api.get('/estoque/seriais-patrimonios').catch(() => ({ data: { seriais: [], patrimonios: [] } }))
            ]);
            setCategoriasBD(resCat.data || []);
            setUnidadesBD(resUni.data || []);
            setBases(resBases.data || []);
            setUsuarios(resUser.data || []);
            setSeriaisUsados(resCodigos.data.seriais || []);
            setPatrimoniosUsados(resCodigos.data.patrimonios || []);
        } catch (error) { console.error("Erro ao carregar auxiliares", error); }
    }

    // --- UTILITÁRIOS ---
    const getProximoCodigo = () => {
        let max = 0;
        itens.forEach(i => {
            if (i.codigo_referencia) {
                const numeros = i.codigo_referencia.match(/\d+/g);
                if (numeros) {
                    const num = parseInt(numeros[numeros.length - 1], 10);
                    if (num > max) max = num;
                }
            }
        });
        return `ID${String(max + 1).padStart(2, '0')}`;
    };

    // --- LÓGICA DE DADOS (FILTROS) ---
    const categoriasDisponiveis = [...new Set(itens.map(i => i.categoria).filter(Boolean))];

    const itensFiltrados = itens.filter(i => {
        const termo = busca.toLowerCase();
        const matchBusca =
            (i.nome || '').toLowerCase().includes(termo) ||
            (i.codigo_referencia || '').toLowerCase().includes(termo) ||
            (i.categoria || '').toLowerCase().includes(termo);

        const matchCat = filtroCategoria ? i.categoria === filtroCategoria : true;
        const matchCtrl = filtroControle ? i.tipo_controle === filtroControle : true;

        return matchBusca && matchCat && matchCtrl;
    }).sort((a, b) => {
        const deficitA = (a.estoque_minimo > 0 && a.saldo_atual < a.estoque_minimo) ? (a.estoque_minimo - a.saldo_atual) : -1;
        const deficitB = (b.estoque_minimo > 0 && b.saldo_atual < b.estoque_minimo) ? (b.estoque_minimo - b.saldo_atual) : -1;
        if (deficitA > 0 || deficitB > 0) return deficitB - deficitA;
        return (a.nome || '').localeCompare(b.nome || '');
    });

    const codigoExiste = form.codigo_referencia && itens.some(i =>
        i.codigo_referencia?.toLowerCase() === form.codigo_referencia.toLowerCase() && i.id !== form.id
    );

    // --- LÓGICA DE DADOS (VALIDAÇÃO FÍSICOS) ---
    const serialMovDuplicado = formMov.serial && seriaisUsados.map(s => s.toLowerCase()).includes(formMov.serial.toLowerCase());
    const patriMovDuplicado = formMov.patrimonio && patrimoniosUsados.map(p => p.toLowerCase()).includes(formMov.patrimonio.toLowerCase());

    const itemOriginal = subItens.find(s => s.id === formFisico.id);
    const serialEdicaoDuplicado = formFisico.serial &&
        formFisico.serial.toLowerCase() !== (itemOriginal?.serial || '').toLowerCase() &&
        seriaisUsados.map(s => s.toLowerCase()).includes(formFisico.serial.toLowerCase());
    const patriEdicaoDuplicado = formFisico.patrimonio &&
        formFisico.patrimonio.toLowerCase() !== (itemOriginal?.patrimonio || '').toLowerCase() &&
        patrimoniosUsados.map(p => p.toLowerCase()).includes(formFisico.patrimonio.toLowerCase());


    // --- HANDLERS: CATEGORIAS ---
    async function handleSalvarCategoria(e) {
        e.preventDefault();
        try {
            if (formCategoria.id) {
                await api.put(`/estoque/categorias/${formCategoria.id}`, formCategoria);
            } else {
                await api.post('/estoque/categorias', formCategoria);
            }
            setFormCategoria({ id: null, nome: '', tipo_padrao: 'LIVRE' });
            carregarAuxiliares();
        } catch (e) { toast.error("Erro: " + (e.response?.data?.detail || "Falha ao salvar")); }
    }

    async function handleExcluirCategoria(id) {
        if (!window.confirm("Deseja mesmo excluir esta categoria?")) return;
        try {
            await api.delete(`/estoque/categorias/${id}`);
            carregarAuxiliares();
        } catch (e) { toast.error("Erro: " + (e.response?.data?.detail || "Em uso por algum item")); }
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

    // --- HANDLERS: MOLDE ---
    const abrirEdicaoMolde = (item) => {
        setForm({
            id: item.id,
            codigo_referencia: item.codigo_referencia || '',
            nome: item.nome || '',
            categoria: item.categoria ? item.categoria.toUpperCase() : '',
            unidade_medida: item.unidade_medida ? item.unidade_medida.toUpperCase() : '',
            estoque_minimo: item.estoque_minimo || 0,
            observacoes: item.observacoes || '',
            tipo_controle: item.tipo_controle || 'QUANTIDADE'
        });
        setModalAberto(true);
    };

    async function handleSubmitMolde(e) {
        e.preventDefault();
        if (codigoExiste && form.id) return toast.error("Erro: Código de Referência já existe no sistema!");

        let payload = { ...form };
        if (payload.categoria === 'PNEUS') {
            payload.nome = `PNEU ${payload.medida || ''}`.trim();
        }
        Object.keys(payload).forEach(key => { if (payload[key] === '') payload[key] = null; });

        if (payload.id) {
            if (payload.tipo_controle === 'SERIALIZADO' || payload.categoria === 'PNEUS') {
                payload.quantidade_inicial = 0; payload.valor_aquisicao = 0;
                payload.fogo = null; payload.dot = null; payload.serial = null; payload.patrimonio = null;
                payload.marca = null; payload.medida = null; payload.sulco_novo = null; payload.data_vencimento = null;
            }
        }
        if (!payload.estoque_minimo) payload.estoque_minimo = 0;

        try {
            if (payload.id) {
                await api.put(`/estoque/itens/${payload.id}`, payload);
                toast.success("Cadastro do Item atualizado com sucesso!");
            } else {
                await api.post('/estoque/itens', payload);
                toast.success("Item cadastrado com sucesso!");
            }
            setModalAberto(false);
            setForm(initialFormMolde);
            carregar();
        } catch (error) {
            const det = error.response?.data?.detail;
            const msgErro = Array.isArray(det) ? JSON.stringify(det, null, 2) : (typeof det === 'object' ? JSON.stringify(det) : (det || error.message));
            toast.error("Erro ao Salvar:\n\n" + msgErro);
        }
    }

    async function excluirItemPai(item) {
        if (!window.confirm(`ATENÇÃO: Você tem certeza que deseja excluir o modelo "${item.nome}"?\n\nIsso apagará o histórico associado a ele. O sistema só permitirá a exclusão se o saldo for ZERO.`)) return;
        try {
            await api.delete(`/estoque/itens/${item.id}`);
            toast.success("Item excluído com sucesso!");
            if (expandedItem === item.id) {
                setExpandedItem(null);
                setSubItens([]);
            }
            carregar();
            carregarAuxiliares();
        } catch (error) { toast.error("Erro ao excluir: " + (error.response?.data?.detail || error.message)); }
    }

    // --- HANDLERS: SUB-ITENS ---
    async function toggleExpand(item) {
        if (expandedItem === item.id) {
            setExpandedItem(null);
            setSubItens([]);
        } else {
            setExpandedItem(item.id);
            if (item.tipo_controle === 'SERIALIZADO') {
                setLoadingSub(true);
                try {
                    const res = await api.get(`/estoque/itens/${item.id}/fisicos`);
                    setSubItens(res.data);
                } catch (e) {
                    console.error(e);
                    toast.error("Erro ao buscar itens físicos. Verifique se o Backend foi atualizado.");
                }
                setLoadingSub(false);
            }
        }
    }

    function abrirEditarFisico(subItem) {
        setFormFisico({
            ...subItem,
            medida: subItem.medida || '',
            sulco_novo: subItem.sulco_novo || 0,
            sulco_atual: subItem.sulco_atual || 0
        });
        setModalEdicaoFisico(true);
    }

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
                const payload = { serial: formFisico.serial || null, patrimonio: formFisico.patrimonio || null, status: formFisico.status };
                await api.put(`/estoque/equipamentos/${formFisico.id}`, payload);
            }
            toast.success("Item atualizado com sucesso!");
            setModalEdicaoFisico(false);
            const res = await api.get(`/estoque/itens/${expandedItem}/fisicos`);
            setSubItens(res.data);
        } catch (e) {
            const msg = e.response?.data?.detail || e.message;
            if (msg.includes('Duplicado')) setErroEdicaoItem(msg);
            else toast.error("Erro ao salvar: " + msg);
        }
    }

    async function excluirFisico(id, tipo) {
        if (!window.confirm("ATENÇÃO: Isso excluirá este item específico do estoque.\nTem certeza?")) return;
        try {
            if (tipo === 'PNEU') {
                await api.delete(`/pneus/${id}`);
            } else {
                await api.delete(`/estoque/equipamentos/${id}`);
            }
            const res = await api.get(`/estoque/itens/${expandedItem}/fisicos`);
            setSubItens(res.data);
            carregar();
        } catch (e) { toast.error("Erro: " + (e.response?.data?.detail || e.message)); }
    }

    // --- HANDLERS: MOVIMENTAÇÃO ---
    async function handleMovimento(e) {
        e.preventDefault();
        if (!formMov.estoque_item_id) return toast.error("Por favor, busque e selecione um modelo/item antes de confirmar.");
        
        setErroMovimentacao(null);
        try {
            await api.post('/estoque/movimentar', { ...formMov, tipo_movimento: tipoMov });
            toast.success(`Sucesso! ${tipoMov} registrada no histórico.`);
            setModalMov(false);
            carregar();
            if (expandedItem === formMov.estoque_item_id) {
                const res = await api.get(`/estoque/itens/${expandedItem}/fisicos`);
                setSubItens(res.data);
            }
        } catch (error) {
            const det = error.response?.data?.detail;
            const msg = typeof det === 'string' ? det : JSON.stringify(det || "Erro na movimentação.");
            if (msg.includes('Duplicado')) setErroMovimentacao(msg);
            else toast.error("Erro: " + msg);
        }
    }

    // --- HANDLERS: HISTÓRICO ---
    async function verHistoricoGeral(item) {
        setModalHist(true);
        setTituloHist(item.nome);
        setHistoricoData([]);
        try {
            const res = await api.get(`/estoque/itens/${item.id}/historico`);
            setHistoricoData(res.data);
        } catch (error) { toast.error("Erro ao carregar histórico geral."); }
    }

    async function verHistoricoFisico(subItem) {
        setModalHist(true);
        setTituloHist(subItem.serial || subItem.fogo || subItem.dot || "Item Físico");
        setHistoricoData([]);
        try {
            let url = subItem.tipo === 'PNEU' ? `/pneus/${subItem.id}/historico` : `/estoque/equipamentos/${subItem.id}/historico`;
            const res = await api.get(url);
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
        } catch (error) { toast.error("Erro ao buscar histórico detalhado deste item."); }
    }

    // --- RENDER ---
    return (
        <div>
            <EstoqueHeaderFiltros
                busca={busca} setBusca={setBusca}
                filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria}
                filtroControle={filtroControle} setFiltroControle={setFiltroControle}
                categoriasDisponiveis={categoriasDisponiveis}
                onExportarPDF={() => exportarPdfEstoque({ itensFiltrados, busca, filtroCategoria, filtroControle, api })}
                onAbrirEntrada={() => { setTipoMov('ENTRADA'); setFormMov({ ...initialFormMov }); setModalMov(true); }}
                onAbrirSaida={() => { setTipoMov('SAIDA'); setFormMov({ ...initialFormMov }); setModalMov(true); }}
                onNovoModelo={() => { setForm({ ...initialFormMolde, codigo_referencia: getProximoCodigo() }); setModalAberto(true); }}
                can={can}
            />

            <EstoqueTabelaPrincipal
                itensFiltrados={itensFiltrados}
                expandedItem={expandedItem} subItens={subItens} loadingSub={loadingSub}
                onToggleExpand={toggleExpand}
                onEntrada={(id) => { setTipoMov('ENTRADA'); setFormMov({ ...initialFormMov, estoque_item_id: id }); setModalMov(true); }}
                onSaida={(id) => { setTipoMov('SAIDA'); setFormMov({ ...initialFormMov, estoque_item_id: id }); setModalMov(true); }}
                onEditarMolde={abrirEdicaoMolde} onExcluirMolde={excluirItemPai}
                onVerHistoricoGeral={verHistoricoGeral}
                onVerHistoricoFisico={verHistoricoFisico} onEditarFisico={abrirEditarFisico} onExcluirFisico={excluirFisico}
                can={can}
            />

            <ModalCadastroMolde
                aberto={modalAberto} onFechar={() => setModalAberto(false)}
                form={form} setForm={setForm} onSubmit={handleSubmitMolde}
                codigoExiste={codigoExiste}
                categoriasBD={categoriasBD} categoriasDisponiveis={categoriasDisponiveis}
                unidadesBD={unidadesBD} onNovaUnidade={handleNovaUnidade}
                onAbrirGerenciarCategorias={() => setModalCategorias(true)}
            />

            <ModalMovimentacao
                aberto={modalMov} onFechar={() => setModalMov(false)}
                tipoMov={tipoMov} formMov={formMov} setFormMov={setFormMov} onSubmit={handleMovimento}
                itens={itens} itemSelecionado={formMov.estoque_item_id ? itens.find(i => i.id == formMov.estoque_item_id) : null}
                bases={bases} usuarios={usuarios} categoriasDisponiveis={categoriasDisponiveis}
                serialMovDuplicado={serialMovDuplicado} patriMovDuplicado={patriMovDuplicado}
                erroMovimentacao={erroMovimentacao}
            />

            <ModalHistorico
                aberto={modalHist} onFechar={() => setModalHist(false)}
                titulo={tituloHist} dados={historicoData}
            />

            <ModalEdicaoFisica
                aberto={modalEdicaoFisico} onFechar={() => setModalEdicaoFisico(false)}
                formFisico={formFisico} setFormFisico={setFormFisico} onSalvar={salvarFisico}
                serialEdicaoDuplicado={serialEdicaoDuplicado} patriEdicaoDuplicado={patriEdicaoDuplicado}
                erroEdicaoItem={erroEdicaoItem}
            />

            <ModalGerenciarCategorias
                aberto={modalCategorias} onFechar={() => setModalCategorias(false)}
                categoriasBD={categoriasBD} formCategoria={formCategoria} setFormCategoria={setFormCategoria}
                onSalvar={handleSalvarCategoria} onExcluir={handleExcluirCategoria}
            />
        </div>
    );
}
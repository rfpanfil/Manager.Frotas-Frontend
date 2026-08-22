import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

import { calcularStatusPneu } from '../../utils/pneusUtils';

import CardsDashboardPneus from '../../components/veiculos/pneus/CardsDashboardPneus';
import FiltrosPneus from '../../components/veiculos/pneus/FiltrosPneus';
import TabelaVeiculosPneus from '../../components/veiculos/pneus/TabelaVeiculosPneus';
import ModalMontagemGeral from '../../components/veiculos/pneus/ModalMontagemGeral';
import PopoverSelecaoEstoque from '../../components/veiculos/pneus/PopoverSelecaoEstoque';
import ModalMontagemExpressa from '../../components/veiculos/pneus/ModalMontagemExpressa';
import ModalListaStatus from '../../components/veiculos/pneus/ModalListaStatus';
import ModalEdicaoPneu from '../../components/veiculos/pneus/ModalEdicaoPneu';
import ModalHistoricoPneu from '../../components/veiculos/pneus/ModalHistoricoPneu';
import ModalGerenciarMedidas from '../../components/veiculos/pneus/ModalGerenciarMedidas';

export default function TabPneus() {
    const { can } = useAuth();
    const [pneus, setPneus] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [resumo, setResumo] = useState({ estoque: 0, em_uso: 0, manutencao: 0, sucata: 0, cpk_medio: 0 });

    // Tabela Expansível
    const [expandedVeiculo, setExpandedVeiculo] = useState(null);
    const [buscaVeiculo, setBuscaVeiculo] = useState('');
    const [filtroStatusVeiculo, setFiltroStatusVeiculo] = useState('');

    // Modais
    const [modalMontagem, setModalMontagem] = useState(false);
    const [modalListaStatus, setModalListaStatus] = useState(null);
    const [buscaModalStatus, setBuscaModalStatus] = useState('');
    const [modalExpresso, setModalExpresso] = useState(false);
    const [modalHistorico, setModalHistorico] = useState(false);
    const [historicoData, setHistoricoData] = useState([]);

    // Novo Estado de Edição de Pneu
    const [modalEdicao, setModalEdicao] = useState(false);
    const [pneuEditando, setPneuEditando] = useState({});

    // Estados do CRUD de Medidas
    const [medidas, setMedidas] = useState([]);
    const [modalMedidas, setModalMedidas] = useState(false);
    const [medidaForm, setMedidaForm] = useState({ id: null, nome: '' });

    // Estados de Seleção para Montagem
    const [veiculoMontagem, setVeiculoMontagem] = useState(null);
    const [posicaoAlvo, setPosicaoAlvo] = useState(null);
    const [popoverAberto, setPopoverAberto] = useState(false);
    const [kmMontagemGlobal, setKmMontagemGlobal] = useState('');
    const [buscaPopover, setBuscaPopover] = useState('');

    // Formulário Expresso
    const [formExpresso, setFormExpresso] = useState({ data_montagem: '', dot: '', fogo: '', km_montagem: '', medida: '', marca: '', sulco_novo: '', condicao: 'ORIGINAL', vida_util_km: 40000 });

    async function carregarDados() {
        try {
            const [resP, resV, resD, resM] = await Promise.all([
                api.get('/pneus/'),
                api.get('/veiculos/resumo'),
                api.get('/pneus/dashboard-resumo'),
                api.get('/pneus/medidas')
            ]);
            setPneus(resP.data);
            setVeiculos(resV.data);
            setResumo(resD.data);
            setMedidas(resM.data);
        } catch (error) { console.error("Erro ao carregar", error); }
    }

    useEffect(() => { carregarDados(); }, []);

    async function handleNovaMedida(nomeInserido) {
        if (!nomeInserido || nomeInserido.trim() === '') return;
        try {
            const res = await api.post('/pneus/medidas', { nome: nomeInserido });
            setMedidas([...medidas, res.data]);
            return res.data;
        } catch (error) { toast.error("Erro ao criar medida: " + (error.response?.data?.detail || "Já existe")); }
    }

    async function handleSalvarMedida(e) {
        e.preventDefault();
        try {
            if (medidaForm.id) {
                await api.put(`/pneus/medidas/${medidaForm.id}`, { nome: medidaForm.nome });
            } else {
                await api.post('/pneus/medidas', { nome: medidaForm.nome });
            }
            setMedidaForm({ id: null, nome: '' });
            carregarDados();
        } catch (error) { toast.error("Erro: " + (error.response?.data?.detail || "Já existe")); }
    }

    async function handleExcluirMedida(id) {
        if (!window.confirm("Deseja mesmo excluir esta medida?")) return;
        try {
            await api.delete(`/pneus/medidas/${id}`);
            carregarDados();
        } catch (error) { toast.error("Erro: " + (error.response?.data?.detail || "Em uso")); }
    }

    const veiculosProcessados = veiculos.map(v => {
        const pneusDoVeiculo = pneus.filter(p => p.veiculo_id === v.id && p.status === 'EM_USO');
        let statusFarol = 'verde';
        let contagens = { vermelho: 0, amarelo: 0, verde: 0 };

        pneusDoVeiculo.forEach(p => {
            const st = calcularStatusPneu(p, v.km_atual);
            contagens[st.status] = (contagens[st.status] || 0) + 1;
        });

        if (contagens.vermelho > 0) statusFarol = 'vermelho';
        else if (contagens.amarelo > 0) statusFarol = 'amarelo';
        else if (pneusDoVeiculo.length === 0) statusFarol = 'vazio';

        return { ...v, pneusMontados: pneusDoVeiculo, statusFarol, contagens };
    });

    const veiculosFiltrados = veiculosProcessados
        .filter(v => `${v.placa} ${v.modelo}`.toLowerCase().includes(buscaVeiculo.toLowerCase()))
        .filter(v => filtroStatusVeiculo ? v.statusFarol === filtroStatusVeiculo : true)
        .sort((a, b) => {
            const peso = { 'vermelho': 1, 'amarelo': 2, 'verde': 3, 'vazio': 4 };
            return peso[a.statusFarol] - peso[b.statusFarol];
        });

    // --- AÇÕES ---
    async function handleDesmontar(pneu) {
        if (!window.confirm(`Deseja desmontar o pneu ${pneu.dot || pneu.fogo} e enviá-lo ao Estoque?`)) return;
        try {
            await api.post(`/pneus/movimentar`, { pneu_id: pneu.id, tipo_evento: 'DESMONTAGEM', observacao: 'Desmontagem via painel visual' });
            carregarDados();
        } catch (error) { toast.error("Erro ao desmontar."); }
    }

    async function handleMontarEstoque(pneuId) {
        if (!veiculoMontagem || !posicaoAlvo) return;

        let km = kmMontagemGlobal;
        if (!km) {
            km = prompt("Você não preencheu o KM da montagem geral. Digite o KM de montagem agora:", veiculoMontagem.km_atual || '');
            if (!km) return;
            setKmMontagemGlobal(km);
        }

        try {
            await api.post(`/pneus/movimentar`, { pneu_id: pneuId, veiculo_id: veiculoMontagem.id, posicao: posicaoAlvo, tipo_evento: 'MONTAGEM', km_veiculo: parseFloat(km) });
            setPopoverAberto(false);
            carregarDados();
        } catch (error) { toast.error("Erro ao montar."); }
    }

    async function handleMontagemExpressa(e) {
        e.preventDefault();
        if (!kmMontagemGlobal) return toast("Por favor, feche este modal e insira o KM do veículo na tela de Montagem Geral antes de continuar.");
        try {
            const payload = { ...formExpresso, veiculo_id: veiculoMontagem.id, posicao: posicaoAlvo, km_montagem: Number(kmMontagemGlobal) };
            await api.post(`/pneus/montagem-expressa`, payload);
            toast.success("Pneu cadastrado e montado com sucesso!");
            setModalExpresso(false);
            setPopoverAberto(false);
            carregarDados();
        } catch (error) { toast.error("Erro na montagem expressa: " + (error.response?.data?.detail || error.message)); }
    }

    async function abrirHistorico(pneuId) {
        try {
            const res = await api.get(`/pneus/${pneuId}/historico`);
            setHistoricoData(res.data);
            setModalHistorico(true);
        } catch (error) { toast.error("Erro ao buscar histórico"); }
    }

    function abrirModalEdicao(pneu) {
        setPneuEditando({
            ...pneu, medida: pneu.medida || '', sulco_novo: pneu.sulco_novo || 0,
            sulco_atual: pneu.sulco_atual || 0, vida_util_km: pneu.vida_util_km || ''
        });
        setModalEdicao(true);
    }

    async function salvarEdicao(e) {
        e.preventDefault();
        try {
            const payload = {
                fogo: pneuEditando.fogo || null, dot: pneuEditando.dot || null, marca: pneuEditando.marca || null,
                medida: pneuEditando.medida || null, sulco_novo: Number(pneuEditando.sulco_novo),
                sulco_atual: Number(pneuEditando.sulco_atual), status: pneuEditando.status,
                vida_util_km: pneuEditando.vida_util_km ? Number(pneuEditando.vida_util_km) : null
            };
            await api.put(`/pneus/${pneuEditando.id}/dados`, payload);
            toast.success("Pneu atualizado com sucesso!");
            setModalEdicao(false);
            carregarDados();
        } catch (error) { toast.error("Erro ao salvar: " + (error.response?.data?.detail || error.message)); }
    }

    async function excluirPneu(id) {
        if (!window.confirm("ATENÇÃO: Deseja excluir este pneu permanentemente do sistema?")) return;
        try {
            await api.delete(`/pneus/${id}`);
            toast.success("Pneu excluído.");
            carregarDados();
        } catch (error) { toast.error("Erro ao excluir: " + (error.response?.data?.detail || error.message)); }
    }

    const abrirMontagemExpressa = (tipo) => {
        const vidaUtil = tipo === 'NOVO' ? 40000 : 15000;
        const hoje = new Date().toISOString().split('T')[0];
        setFormExpresso({
            data_montagem: hoje,
            dot: '',
            fogo: '',
            medida: '',
            marca: '',
            sulco_novo: '',
            condicao: tipo === 'NOVO' ? 'ORIGINAL' : 'USADO',
            vida_util_km: vidaUtil,
            km_montagem: veiculoMontagem?.km_atual || ''
        });
        setModalExpresso(true);
    };

    const medidasDisponiveis = [...new Set([
        ...medidas.map(m => m.nome),
        ...pneus.map(p => p.medida).filter(m => m && m.trim() !== '')
    ])].sort();

    return (
        <div style={{ paddingTop: 10 }}>
            <CardsDashboardPneus 
                resumo={resumo} 
                setModalListaStatus={setModalListaStatus} 
                setBuscaModalStatus={setBuscaModalStatus} 
            />

            <FiltrosPneus 
                buscaVeiculo={buscaVeiculo}
                setBuscaVeiculo={setBuscaVeiculo}
                filtroStatusVeiculo={filtroStatusVeiculo}
                setFiltroStatusVeiculo={setFiltroStatusVeiculo}
                setVeiculoMontagem={setVeiculoMontagem}
                setModalMontagem={setModalMontagem}
                can={can}
            />

            <TabelaVeiculosPneus 
                veiculosFiltrados={veiculosFiltrados}
                expandedVeiculo={expandedVeiculo}
                setExpandedVeiculo={setExpandedVeiculo}
                calcularStatusPneu={calcularStatusPneu}
                can={can}
                setVeiculoMontagem={setVeiculoMontagem}
                setPosicaoAlvo={setPosicaoAlvo}
                setBuscaPopover={setBuscaPopover}
                setPopoverAberto={setPopoverAberto}
                abrirModalEdicao={abrirModalEdicao}
                handleDesmontar={handleDesmontar}
            />

            <ModalMontagemGeral 
                modalMontagem={modalMontagem}
                setModalMontagem={setModalMontagem}
                veiculosProcessados={veiculosProcessados}
                veiculoMontagem={veiculoMontagem}
                setVeiculoMontagem={setVeiculoMontagem}
                kmMontagemGlobal={kmMontagemGlobal}
                setKmMontagemGlobal={setKmMontagemGlobal}
                can={can}
                setPosicaoAlvo={setPosicaoAlvo}
                setBuscaPopover={setBuscaPopover}
                setPopoverAberto={setPopoverAberto}
                abrirModalEdicao={abrirModalEdicao}
                handleDesmontar={handleDesmontar}
            />

            <PopoverSelecaoEstoque 
                popoverAberto={popoverAberto}
                setPopoverAberto={setPopoverAberto}
                posicaoAlvo={posicaoAlvo}
                veiculoMontagem={veiculoMontagem}
                buscaPopover={buscaPopover}
                setBuscaPopover={setBuscaPopover}
                pneus={pneus}
                handleMontarEstoque={handleMontarEstoque}
                abrirMontagemExpressa={abrirMontagemExpressa}
            />

            <ModalMontagemExpressa 
                modalExpresso={modalExpresso}
                setModalExpresso={setModalExpresso}
                formExpresso={formExpresso}
                setFormExpresso={setFormExpresso}
                handleMontagemExpressa={handleMontagemExpressa}
                medidasDisponiveis={medidasDisponiveis}
                handleNovaMedida={handleNovaMedida}
                setModalMedidas={setModalMedidas}
            />

            <ModalListaStatus 
                modalListaStatus={modalListaStatus}
                setModalListaStatus={setModalListaStatus}
                buscaModalStatus={buscaModalStatus}
                setBuscaModalStatus={setBuscaModalStatus}
                pneus={pneus}
                abrirHistorico={abrirHistorico}
                abrirModalEdicao={abrirModalEdicao}
                excluirPneu={excluirPneu}
                can={can}
            />

            <ModalEdicaoPneu 
                modalEdicao={modalEdicao}
                setModalEdicao={setModalEdicao}
                pneuEditando={pneuEditando}
                setPneuEditando={setPneuEditando}
                salvarEdicao={salvarEdicao}
                medidasDisponiveis={medidasDisponiveis}
                handleNovaMedida={handleNovaMedida}
                setModalMedidas={setModalMedidas}
            />

            <ModalHistoricoPneu 
                modalHistorico={modalHistorico}
                setModalHistorico={setModalHistorico}
                historicoData={historicoData}
            />

            <ModalGerenciarMedidas 
                modalMedidas={modalMedidas}
                setModalMedidas={setModalMedidas}
                medidas={medidas}
                medidaForm={medidaForm}
                setMedidaForm={setMedidaForm}
                handleSalvarMedida={handleSalvarMedida}
                handleExcluirMedida={handleExcluirMedida}
            />
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

import FiltrosFornecedores from '../../components/compras/FiltrosFornecedores';
import TabelaFornecedores from '../../components/compras/TabelaFornecedores';
import ModalFichaFornecedor from '../../components/compras/ModalFichaFornecedor';
import ModalFormFornecedor from '../../components/compras/ModalFormFornecedor';
import { baixarListaPDF, baixarResumoPDF } from '../../utils/pdfFornecedores';

export default function TabFornecedores() {
    const { can } = useAuth();
    const queryClient = useQueryClient();

    const { data: lista = [] } = useQuery({ queryKey: ['fornecedores'], queryFn: async () => (await api.get('/compras/fornecedores')).data });
    const { data: ocs = [] } = useQuery({ queryKey: ['ocs'], queryFn: async () => (await api.get('/compras/oc')).data });

    const [modalAberto, setModalAberto] = useState(false);
    const [fornSelecionado, setFornSelecionado] = useState(null); // Resumo

    // Filtros e Paginação
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(''); // 'Ativo' ou 'Inativo'
    const [visibleCount, setVisibleCount] = useState(20);

    const [form, setForm] = useState({ id: null, razao_social: '', cnpj_cpf: '', tipo: 'PRODUTO', contato: '', endereco: '', observacao: '', status: 'Ativo' });


    // Função Salvar Inteligente (Cria ou Edita)
    async function salvar(e) {
        e.preventDefault();
        try {
            if (form.id) {
                // Se tem ID, é Edição (PUT)
                await api.put(`/compras/fornecedores/${form.id}`, form);
                toast.success("Fornecedor atualizado com sucesso!");
            } else {
                // Se não tem ID, é Criação (POST)
                await api.post('/compras/fornecedores', form);
                toast.success("Fornecedor cadastrado com sucesso!");
            }
            setModalAberto(false);
            setForm({ id: null, razao_social: '', cnpj_cpf: '', tipo: 'PRODUTO', contato: '', endereco: '', observacao: '', status: 'Ativo' }); // Limpa o form
            queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar. Verifique os dados.");
        }
    }

    // Função para abrir o modal de edição preenchido
    function prepararEdicao(fornecedor) {
        setForm({
            id: fornecedor.id,
            razao_social: fornecedor.razao_social,
            cnpj_cpf: fornecedor.cnpj_cpf,
            tipo: fornecedor.tipo,
            contato: fornecedor.contato || '',
            endereco: fornecedor.endereco || '',
            observacao: fornecedor.observacao || '',
            status: fornecedor.status
        });
        setFornSelecionado(null); // Fecha o modal de visualização
        setModalAberto(true);     // Abre o modal de formulário
    }

    // Função para excluir
    async function excluirFornecedor(id) {
        if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
            try {
                await api.delete(`/compras/fornecedores/${id}`);
                toast.success("Fornecedor excluído!");
                setFornSelecionado(null);
                queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
            } catch (error) {
                console.error(error);
                // Mostra a mensagem de erro vinda do backend (ex: tem vínculos)
                toast.error(error.response?.data?.detail || "Erro ao excluir fornecedor.");
            }
        }
    }

    function abrirModalNovo() {
        setForm({ id: null, razao_social: '', cnpj_cpf: '', tipo: 'PRODUTO', contato: '', endereco: '', observacao: '', status: 'Ativo' });
        setModalAberto(true);
    }

    // ================= LÓGICA DE FILTROS =================
    const dadosFiltrados = lista.filter(f => {
        const termo = busca.toLowerCase();
        const matchTexto =
            (f.razao_social || '').toLowerCase().includes(termo) ||
            (f.cnpj_cpf || '').toLowerCase().includes(termo) ||
            (f.tipo || '').toLowerCase().includes(termo);

        const matchStatus = filtroStatus ? f.status?.toLowerCase() === filtroStatus.toLowerCase() : true;
        return matchTexto && matchStatus;
    });

    const dadosPaginados = dadosFiltrados.slice(0, visibleCount);

    return (
        <div>
            <FiltrosFornecedores
                busca={busca}
                setBusca={setBusca}
                filtroStatus={filtroStatus}
                setFiltroStatus={setFiltroStatus}
                baixarListaPDF={() => baixarListaPDF(dadosFiltrados)}
                abrirModalNovo={abrirModalNovo}
                can={can}
            />

            <TabelaFornecedores
                dadosPaginados={dadosPaginados}
                dadosFiltrados={dadosFiltrados}
                visibleCount={visibleCount}
                setVisibleCount={setVisibleCount}
                setFornSelecionado={setFornSelecionado}
            />

            <ModalFichaFornecedor
                fornSelecionado={fornSelecionado}
                setFornSelecionado={setFornSelecionado}
                ocs={ocs}
                baixarResumoPDF={baixarResumoPDF}
                prepararEdicao={prepararEdicao}
                excluirFornecedor={excluirFornecedor}
                can={can}
            />

            <ModalFormFornecedor
                modalAberto={modalAberto}
                setModalAberto={setModalAberto}
                form={form}
                setForm={setForm}
                salvar={salvar}
            />
        </div>
    );
}
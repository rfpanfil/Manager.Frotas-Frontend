import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromUrl } from './pdfComparativoOrcamentos';

export const baixarListaPDF = (dadosFiltrados, getNomeItem) => {
    const doc = new jsPDF();
    doc.text("Relatório de Solicitações de Compras (SCs)", 14, 15);
    autoTable(doc, {
        startY: 20,
        head: [['Nº SC', 'Data', 'Solicitante', 'Resumo Itens', 'Qtd Total', 'Status']],
        body: dadosFiltrados.map(sc => [
            sc.numero,
            sc.data_criacao ? new Date(sc.data_criacao).toLocaleDateString() : '-',
            sc.solicitante?.nome || '-',
            sc.itens.length === 1 ? getNomeItem(sc.itens[0]) : `${sc.itens.length} itens`,
            sc.itens.reduce((acc, i) => acc + i.quantidade, 0),
            sc.status
        ]),
        styles: { fontSize: 8 }
    });
    doc.save(`Relatorio_SCs_${new Date().getTime()}.pdf`);
};

export const baixarResumoPDF = async (sc, bases, getNomeItem) => {
    const doc = new jsPDF();
    const agora = new Date(); // Data exata do download do PDF

    // 1. Data e Hora do Download
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Baixado em: ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 15);

    // 2. Título
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Solicitação de compra ${sc.numero}`, 14, 25);

    // 3. Logo da Empresa
    const logoData = await getBase64ImageFromUrl('/looplogo.png');
    if (logoData) {
        doc.setFillColor(58, 12, 163); // Nova Cor Roxa
        doc.rect(150, 10, 45, 20, 'F');
        doc.addImage(logoData, 'PNG', 152, 12, 41, 16);
    }

    // 4. Dados da Empresa
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("LOOP SERVICES LTDA", 14, 35);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("AL GRAJAU, Nº 614, CONJ. COM. 0703 COND, OFFICE", 14, 40);
    doc.text("06454050 - Barueri, SP", 14, 44);
    doc.text("CNPJ: 44.232.560/0001-47, IE: 206902815118", 14, 48);

    // 5. Dados da Solicitação
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes do Pedido:", 14, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const dataCriacao = sc.data_criacao ? new Date(sc.data_criacao.endsWith('Z') ? sc.data_criacao : `${sc.data_criacao}Z`) : null;
    const strDataCriacao = dataCriacao ? `${dataCriacao.toLocaleDateString('pt-BR')} às ${dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-';
    doc.text(`Data e hora da criação: ${strDataCriacao}`, 14, 65);

    doc.text(`Solicitante: ${sc.solicitante?.nome || 'Sistema'}`, 14, 70);
    const localNome = sc.local_entrega?.nome || (bases && bases.length > 0 && bases.find(b => b.id == sc.local_entrega_id)?.nome) || '-';
    doc.text(`Local de Entrega: ${localNome}`, 14, 75);
    doc.text(`Data Necessidade: ${sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem urgência definida'}`, 14, 80);

    doc.text(`Veículo: ${sc.veiculo?.placa || 'Geral'}`, 110, 65);
    doc.text(`Colaborador: ${sc.colaborador?.nome || 'Geral'}`, 110, 70);
    doc.text(`Status Atual: ${sc.status}`, 110, 75);

    // 6. Tabela de Itens
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Itens Solicitados", 14, 95);

    const tableData = sc.itens.map(i => [
        (i.tipo_item === 'PRODUTO' || i.tipo_item === 'ESTOQUE' || i.classificacao === 'PRODUTO' || i.classificacao === 'ESTOQUE') ? getNomeItem(i) : (i.nome_novo_item || 'Item Genérico'),
        i.tipo_gasto || 'Geral',
        i.quantidade,
        "UN"
    ]);

    autoTable(doc, {
        startY: 100,
        head: [['Descrição do produto/serviço', 'Categoria (Tipo de Gasto)', 'Qtde', 'Un']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        styles: { fontSize: 8 }
    });

    let finalY = doc.lastAutoTable.finalY + 15;

    // 7. Observações
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", 14, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const splitObs = doc.splitTextToSize(sc.observacoes || 'Nenhuma observação descrita na solicitação.', 180);
    doc.text(splitObs, 14, finalY + 5);

    doc.save(`Solicitacao_Compra_${sc.numero}.pdf`);
};

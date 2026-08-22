import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatarM = (v) => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// Função auxiliar para carregar a logo do diretório public
const getBase64ImageFromUrl = async (imageUrl) => {
    try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Erro ao carregar logo:", e);
        return null;
    }
};

export const baixarListaPDF = (dadosFiltrados) => {
    const doc = new jsPDF();
    doc.text("Relatório de Ordens de Compra", 14, 15);
    autoTable(doc, {
        startY: 20,
        head: [['Nº OC', 'Fornecedor', 'Data', 'Itens', 'Valor Total', 'Status']],
        body: dadosFiltrados.map(oc => [
            oc.numero, oc.fornecedor?.razao_social || '-',
            new Date(oc.data_emissao).toLocaleDateString('pt-BR'),
            `${oc.itens.length} item(s)`, formatarM(oc.valor_total), oc.status
        ]),
        styles: { fontSize: 8 }
    });
    doc.save(`Lista_OCs_${new Date().getTime()}.pdf`);
};

export const imprimirOC = async (oc, getNomeEstoque, user) => {
    const doc = new jsPDF();
    const agora = new Date();

    // 1. Data e Hora do Download
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Baixado em: ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 15);

    // 2. Título
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Ordem de compra ${oc.numero}`, 14, 25);

    // Data e Hora de emissão
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dataEmissao = oc.data_emissao ? new Date(oc.data_emissao.endsWith('Z') ? oc.data_emissao : `${oc.data_emissao}Z`) : null;
    const strDataEmissao = dataEmissao ? `${dataEmissao.toLocaleDateString('pt-BR')} às ${dataEmissao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-';
    doc.text(`Data e hora da emissão: ${strDataEmissao}`, 14, 30);

    // 3. Logo da Empresa
    const logoData = await getBase64ImageFromUrl('/looplogo.png');
    if (logoData) {
        doc.setFillColor(58, 12, 163);
        doc.rect(150, 10, 45, 20, 'F');
        doc.addImage(logoData, 'PNG', 152, 12, 41, 16);
    }

    // 4. Dados da Empresa Emitente
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("LOOP SERVICES LTDA", 14, 40);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("AL GRAJAU, Nº 614, CONJ. COM. 0703 COND, OFFICE", 14, 45);
    doc.text("06454050 - Barueri, SP", 14, 49);
    doc.text("CNPJ: 44.232.560/0001-47, IE: 206902815118", 14, 53);

    // 5. Dados do Fornecedor
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Fornecedor:", 14, 65);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Razão Social: ${oc.fornecedor?.razao_social || '-'}`, 14, 70);
    doc.text(`CNPJ/CPF: ${oc.fornecedor?.cnpj_cpf || '-'}`, 14, 75);

    // 6. Tabela de Itens
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Itens do pedido de compra", 14, 90);

    const tableData = oc.itens.map(i => {
        const nomeItem = (i.tipo_item === 'PRODUTO' || i.tipo_item === 'ESTOQUE') ? getNomeEstoque(i.estoque_item_id) : (i.nome_novo_item || 'Item Genérico');
        return [
            nomeItem,
            i.tipo_gasto || 'Geral',
            i.quantidade,
            "UN",
            formatarM(i.valor_unitario),
            formatarM(i.quantidade * i.valor_unitario)
        ];
    });

    autoTable(doc, {
        startY: 95,
        head: [['Descrição do produto/serviço', 'Categoria', 'Qtde', 'Un', 'Valor unitário', 'Valor total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        styles: { fontSize: 8 }
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // 7. Resumo Financeiro
    doc.setFont("helvetica", "bold");
    doc.text(`FRETE (+): ${formatarM(oc.frete)}`, 140, finalY);
    finalY += 6;
    doc.text(`DESCONTO (-): ${formatarM(oc.desconto)}`, 140, finalY);
    finalY += 8;
    doc.setFontSize(12);
    doc.text(`VALOR TOTAL DA OC: ${formatarM(oc.valor_total)}`, 110, finalY);

    finalY += 15;

    // 8. Informações Adicionais e Aplicação
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Informações de Pagamento e Entrega", 14, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Prazo de Entrega: ${oc.prazo_entrega ? new Date(oc.prazo_entrega).toLocaleDateString('pt-BR') : 'N/I'}`, 14, finalY + 5);
    doc.text(`Data Vencimento: ${oc.prazo_pagamento ? new Date(oc.prazo_pagamento + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/I'}`, 14, finalY + 10);
    doc.text(`Meio Pagamento: ${oc.tipo_pagamento || 'N/I'}`, 14, finalY + 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Aplicação (Frota)", 110, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Veículo: ${oc.veiculo?.placa || 'Geral/Estoque'}`, 110, finalY + 5);
    doc.text(`Colaborador: ${oc.colaborador?.nome || 'Geral/Estoque'}`, 110, finalY + 10);

    finalY += 15;
    const emissor = user?.nome || 'Sistema';
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Envolvidos", 110, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Solicitante Original: ${oc.colaborador?.nome || 'Sistema'}`, 110, finalY + 5);
    doc.text(`Orçamento Criado Por: ${emissor}`, 110, finalY + 10);
    doc.text(`Orçamento Aprovado Por: ${emissor}`, 110, finalY + 15);
    finalY += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", 14, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    let obsLimpa = oc.observacoes || 'Nenhuma observação informada.';
    obsLimpa = obsLimpa.replace(/\|?\s*Solicitado por:\s*[^\|]+/g, '').trim();
    obsLimpa = obsLimpa.replace(/\|?\s*Emitido por:\s*[^\|]+/g, '').trim();
    obsLimpa = obsLimpa.replace(/Gerado via SC\s*\d+\s*\|?/g, '').trim();
    if (obsLimpa.startsWith('|')) obsLimpa = obsLimpa.substring(1).trim();
    if (obsLimpa.startsWith('Obs:')) obsLimpa = obsLimpa.substring(4).trim();
    if (!obsLimpa) obsLimpa = 'Nenhuma observação informada.';

    const splitObs = doc.splitTextToSize(obsLimpa, 180);
    doc.text(splitObs, 14, finalY + 5);

    doc.save(`Ordem_Compra_${oc.numero}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função auxiliar para carregar a logo do diretório public
export const getBase64ImageFromUrl = async (imageUrl) => {
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

const formatarMoeda = (valor) => `R$ ${parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const baixarListaPDF = (dadosFiltrados, orcamentos) => {
    const doc = new jsPDF();
    doc.text("Relatório de SCs Aguardando Aprovação", 14, 15);
    autoTable(doc, {
        startY: 20,
        head: [['Nº SC', 'Local Entrega', 'Data Limite', 'Qtd Cotações', 'Status']],
        body: dadosFiltrados.map(sc => [
            sc.numero,
            sc.local_entrega?.nome || '-',
            sc.data_necessidade ? new Date(sc.data_necessidade + 'T00:00:00').toLocaleDateString() : '-',
            `${orcamentos.filter(o => o.solicitacao_id === sc.id).length} Fornecedores`,
            sc.status
        ]),
        styles: { fontSize: 8 }
    });
    doc.save(`Aprovacoes_Pendentes_${new Date().getTime()}.pdf`);
};

export const baixarComparativoPDF = async (sc, orcamentos, bases, getNomeItem, user) => {
    const doc = new jsPDF();
    const agora = new Date();

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Baixado em: ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 15);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Comparativo de Cotações - SC ${sc.numero}`, 14, 25);

    const logoData = await getBase64ImageFromUrl('/looplogo.png');
    if (logoData) {
        doc.setFillColor(58, 12, 163);
        doc.rect(150, 10, 45, 20, 'F');
        doc.addImage(logoData, 'PNG', 152, 12, 41, 16);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("LOOP SERVICES LTDA", 14, 35);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("AL GRAJAU, Nº 614, CONJ. COM. 0703 COND, OFFICE", 14, 40);
    doc.text("06454050 - Barueri, SP", 14, 44);
    doc.text("CNPJ: 44.232.560/0001-47, IE: 206902815118", 14, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Referência: Pedido Original", 14, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const dataCriacao = sc.data_criacao ? new Date(sc.data_criacao.endsWith('Z') ? sc.data_criacao : `${sc.data_criacao}Z`) : null;
    const strDataCriacao = dataCriacao ? `${dataCriacao.toLocaleDateString('pt-BR')} às ${dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-';
    doc.text(`Data e hora da criação: ${strDataCriacao}`, 14, 65);

    doc.text(`Solicitante Original: ${sc.solicitante?.nome || 'Sistema'}`, 14, 70);
    if (sc.status === 'Orçamento Aprovado' || sc.status.includes('Ordem de Compra')) {
        doc.text(`Usuário Aprovador: ${user?.nome || 'Sistema'}`, 110, 70);
    }
    const localNome = sc.local_entrega?.nome || (bases && bases.length > 0 && bases.find(b => b.id == sc.local_entrega_id)?.nome) || '-';
    doc.text(`Entrega: ${localNome}`, 14, 75);

    let currentY = 90;
    const orcsDesta = orcamentos.filter(o => o.solicitacao_id === sc.id);

    if (orcsDesta.length === 0) {
        doc.text("Nenhuma cotação registrada para esta solicitação.", 14, currentY);
        doc.save(`Comparativo_SC_${sc.numero}.pdf`);
        return;
    }

    for (let i = 0; i < orcsDesta.length; i++) {
        const orc = orcsDesta[i];

        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);

        const statusTexto = orc.status === 'Aprovado' ? " [VENCEDOR]" : "";
        doc.text(`Opção ${i + 1} - Fornecedor: ${orc.fornecedor?.razao_social || 'Desconhecido'}${statusTexto}`, 14, currentY);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        currentY += 5;
        doc.text(`Pagamento: ${orc.tipo_pagamento || '-'} | Prazo Entrega: ${orc.prazo_entrega ? new Date(orc.prazo_entrega + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}`, 14, currentY);
        currentY += 5;
        doc.text(`Vencimento / Prazo Pgmto: ${orc.prazo_pagamento ? new Date(orc.prazo_pagamento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}`, 14, currentY);
        currentY += 5;
        doc.text(`Obs: ${orc.observacoes || 'Nenhuma'}`, 14, currentY);

        currentY += 5;

        const tableData = orc.itens.map(oi => {
            const scRef = sc.itens.find(item => item.id === oi.solicitacao_item_id);
            const qtd = scRef ? scRef.quantidade : 1;
            const nome = getNomeItem(scRef || oi);
            return [nome, qtd, formatarMoeda(oi.valor_unitario), formatarMoeda(qtd * oi.valor_unitario)];
        });

        tableData.push([{ content: 'FRETE ESTIMADO', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, formatarMoeda(orc.frete)]);
        tableData.push([{ content: 'TOTAL DA COTAÇÃO', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: formatarMoeda(orc.valor_total), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);

        autoTable(doc, {
            startY: currentY,
            head: [['Item', 'Qtd', 'V. Unit', 'Subtotal']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [74, 85, 104], textColor: [255, 255, 255] },
            styles: { fontSize: 8 }
        });

        currentY = doc.lastAutoTable.finalY + 15;
    }

    doc.save(`Comparativo_SC_${sc.numero}.pdf`);
};

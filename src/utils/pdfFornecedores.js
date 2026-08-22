import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const baixarListaPDF = (dadosFiltrados) => {
    const doc = new jsPDF();
    doc.text("Relatório de Fornecedores", 14, 15);
    autoTable(doc, {
        startY: 20,
        head: [['Razão Social', 'CNPJ/CPF', 'Tipo', 'Contato', 'Status']],
        body: dadosFiltrados.map(f => [f.razao_social, f.cnpj_cpf, f.tipo, f.contato || '-', f.status])
    });
    doc.save(`Fornecedores_${new Date().getTime()}.pdf`);
};

export const baixarResumoPDF = (forn) => {
    const doc = new jsPDF();
    doc.text(`Resumo do Fornecedor: ${forn.razao_social}`, 14, 20);
    autoTable(doc, {
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [0, 214, 143], textColor: [0, 0, 0] },
        body: [
            ['Razão Social', forn.razao_social],
            ['CNPJ/CPF', forn.cnpj_cpf],
            ['Tipo de Fornecedor', forn.tipo],
            ['Contato', forn.contato || 'Não informado'],
            ['Endereço', forn.endereco || 'Não informado'],
            ['Status', forn.status]
        ]
    });
    doc.save(`${forn.razao_social.replace(/ /g, '_')}_Resumo.pdf`);
};

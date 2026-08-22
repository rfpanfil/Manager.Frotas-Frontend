import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportarPdfGastos({ gastosFiltrados }) {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text("Relatório de Gastos - Loop.Frotas", 14, 10);
    autoTable(doc, {
        head: [["Data", "Base", "Tipo", "Veículo", "Solicitante", "KM", "Valor"]],
        body: gastosFiltrados.map(g => [
            new Date(g.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            g.centro_custo?.nome || g.veiculo?.base || 'Geral',
            g.tipo_gasto || g.tipo,
            g.veiculo ? g.veiculo.placa : '-',
            g.colaborador ? g.colaborador.nome : '-',
            g.km_registro ? `${g.km_registro} km` : '-',
            `R$ ${parseFloat(g.valor).toFixed(2)}`
        ]),
        startY: 20,
        styles: { fontSize: 8 }
    });
    doc.save("gastos.pdf");
}

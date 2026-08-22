import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportarPDFResumido(veiculosFiltrados, filtroData) {
    const doc = new jsPDF();
    doc.text(`Resumo Checklist - ${filtroData}`, 14, 10);

    const tableRows = veiculosFiltrados.map(v => [
        v.placa,
        `${v.marca} ${v.modelo}`,
        v.status_checklist === 'FINALIZADO' ? "Realizado" : v.status_checklist === 'PENDENTE' ? "Pendente" : "Não Realizado",
        v.responsavel_nome || '-',
        v.data_checklist ? new Date(v.data_checklist).toLocaleDateString() : '-'
    ]);

    autoTable(doc, {
        head: [["Placa", "Veículo", "Status", "Responsável", "Data"]],
        body: tableRows,
        startY: 20,
    });
    
    doc.save(`resumo_checklist_${filtroData}.pdf`);
}

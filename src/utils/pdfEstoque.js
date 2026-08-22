import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

/**
 * Gera e baixa o PDF do relatório de estoque, incluindo sub-itens físicos
 * para itens serializados (busca assíncrona na API).
 */
export async function exportarPdfEstoque({ itensFiltrados, busca, filtroCategoria, filtroControle, api }) {
    try {
        toast("Iniciando a geração do PDF. Isso pode demorar alguns segundos dependendo da quantidade de itens físicos, por favor aguarde...");
        const doc = new jsPDF();
        doc.text("Relatório de Ferramentas & Estoque", 14, 15);
        doc.setFontSize(10);
        doc.text(`Filtros: Busca: "${busca}" | Categoria: "${filtroCategoria || 'Todas'}" | Tipo: "${filtroControle || 'Todos'}"`, 14, 22);

        const tableData = [];

        for (const item of itensFiltrados) {
            tableData.push([
                item.codigo_referencia || '-',
                item.nome || '-',
                item.categoria || '-',
                item.tipo_controle === 'QUANTIDADE' ? 'Volume' : 'Unitário',
                `${item.saldo_atual} ${item.unidade_medida === 'UNIDADE' ? 'UND' : item.unidade_medida}`
            ]);

            if (item.tipo_controle === 'SERIALIZADO') {
                try {
                    const res = await api.get(`/estoque/itens/${item.id}/fisicos`);
                    const fisicos = res.data;
                    if (fisicos && fisicos.length > 0) {
                        tableData.push([{ content: `  ↳ ITENS DETALHADOS (${fisicos.length} itens encontrados):`, colSpan: 5, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [80, 80, 80] } }]);

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
        toast.error("Erro ao gerar PDF.");
    }
}

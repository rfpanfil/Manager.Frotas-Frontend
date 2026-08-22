import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

async function capturarElemento(elementRef) {
    if (!elementRef.current) return null;
    try {
        const canvas = await html2canvas(elementRef.current, {
            scale: 2,
            backgroundColor: '#1a202c',
            useCORS: true,
            logging: false
        });
        return {
            dataUrl: canvas.toDataURL('image/png', 1.0),
            width: canvas.width,
            height: canvas.height
        };
    } catch (error) {
        console.error("Erro ao capturar gráfico:", error);
        return null;
    }
}

function safeNumber(v) { return Number(v) || 0; }

function ensureSpace(doc, currentY, neededHeight) {
    if (currentY + neededHeight >= 280) {
        doc.addPage();
        return 20;
    }
    return currentY;
}

export async function exportarPDFDashboardGastos({
    dados,
    filtros,
    periodo,
    usarFiltroPeriodo,
    veiculos,
    incluirSemanalPdf,
    pdfSemanalRef,
    pdfPizzaRef,
    pdfAnualRef,
    setGerandoPDF,
    setRenderPDFCharts
}) {
    if (!dados) return;
    setGerandoPDF(true);

    try {
        setRenderPDFCharts(true);
        await new Promise(r => setTimeout(r, 1500));

        const doc = new jsPDF('p', 'mm', 'a4');

        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(`Relatório de Gastos`, 14, 15);

        doc.setFontSize(10);
        doc.setTextColor(100);

        // Funções internas para textos
        const getTextoPeriodo = () => {
            if (usarFiltroPeriodo && periodo.inicio && periodo.fim) {
                const d1 = new Date(periodo.inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const d2 = new Date(periodo.fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                return `${d1} até ${d2}`;
            } else {
                const ano = filtros.ano;
                const mesNome = filtros.mes
                    ? new Date(ano, filtros.mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
                    : "Ano Completo";
                return `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)} de ${ano}`;
            }
        };

        const getTextoVeiculo = () => {
            if (!filtros.veiculo_id) return "Todos os Veículos";
            const v = veiculos.find(vec => String(vec.id) === String(filtros.veiculo_id));
            return v ? `${v.modelo} (${v.placa})` : "Veículo não encontrado";
        };

        const getTextoTiposGasto = () => {
            if (!filtros.tipos_gasto || filtros.tipos_gasto.length === 0) return "Todos";
            return filtros.tipos_gasto.map(t => t.label).join(", ");
        };

        doc.setFont(undefined, 'bold');
        doc.text("Período:", 14, 23);
        doc.setFont(undefined, 'normal');
        doc.text(getTextoPeriodo(), 35, 23);

        doc.setFont(undefined, 'bold');
        doc.text("Veículo:", 14, 28);
        doc.setFont(undefined, 'normal');
        doc.text(getTextoVeiculo(), 35, 28);

        doc.setFont(undefined, 'bold');
        doc.text("Filtros:", 14, 33);
        doc.setFont(undefined, 'normal');
        const tiposTexto = getTextoTiposGasto();
        const tiposTextoTruncado = tiposTexto.length > 80 ? tiposTexto.substring(0, 80) + "..." : tiposTexto;
        doc.text(tiposTextoTruncado, 35, 33);

        doc.line(14, 36, 196, 36);

        autoTable(doc, {
            head: [['Indicador', 'Valor']],
            body: [
                ['Gasto Hoje', `R$ ${safeNumber(dados.cards.hoje).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                ['Gasto Período Selecionado', `R$ ${safeNumber(dados.cards.mes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                [`Total Acumulado ${filtros.ano}`, `R$ ${safeNumber(dados.cards.ano).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
            ],
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [45, 55, 72] },
            styles: { fontSize: 11 }
        });

        let currentY = doc.lastAutoTable.finalY + 10;

        if (incluirSemanalPdf && pdfSemanalRef.current) {
            currentY = ensureSpace(doc, currentY, 90);
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text("Evolução - Últimos 7 Dias", 14, currentY);

            const img = await capturarElemento(pdfSemanalRef);
            if (img) {
                const ratio = img.width / img.height;
                const h = 180 / ratio;
                doc.addImage(img.dataUrl, 'PNG', 14, currentY + 5, 180, h);
                currentY += h + 15;
            }
        }

        currentY = ensureSpace(doc, currentY, 90);
        doc.setFontSize(12);
        doc.text("Distribuição por Tipo de Gasto (Período Selecionado)", 14, currentY);

        if (dados.grafico_pizza && dados.grafico_pizza.length > 0) {
            if (pdfPizzaRef.current) {
                const img = await capturarElemento(pdfPizzaRef);
                if (img) {
                    const ratio = img.width / img.height;
                    const h = 180 / ratio;
                    doc.addImage(img.dataUrl, 'PNG', 14, currentY + 5, 180, h);
                    currentY += h + 15;
                }
            }
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("(Sem dados de gastos para o período/filtros selecionados)", 14, currentY + 15);
            currentY += 30;
            doc.setTextColor(0);
        }

        currentY = ensureSpace(doc, currentY, 40);
        
        const totalGastoTabela = dados.grafico_pizza.reduce((sum, item) => sum + (item.value || 0), 0);
        const categoriasRows = dados.grafico_pizza
            .filter(d => d.value > 0)
            .sort((a,b) => b.value - a.value)
            .map(c => {
                const percentFormat = totalGastoTabela > 0 ? ((c.value / totalGastoTabela) * 100).toFixed(1) + '%' : '0%';
                return [
                    c.name, 
                    `R$ ${safeNumber(c.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    percentFormat
                ];
            });

        doc.setFontSize(12);
        doc.text("Distribuição Completa por Categoria", 14, currentY);
        autoTable(doc, {
            head: [['Categoria', 'Valor (R$)', 'Representatividade']],
            body: categoriasRows,
            startY: currentY + 5,
            theme: 'striped',
            headStyles: { fillColor: [0, 214, 143], textColor: [0, 0, 0] }
        });

        currentY = doc.lastAutoTable.finalY + 15; 

        if (pdfAnualRef.current) {
            currentY = ensureSpace(doc, currentY, 90);
            doc.setFontSize(12);
            doc.text(`Evolução Mensal - ${filtros.ano}`, 14, currentY);

            const img = await capturarElemento(pdfAnualRef);
            if (img) {
                const ratio = img.width / img.height;
                const h = 180 / ratio;
                doc.addImage(img.dataUrl, 'PNG', 14, currentY + 5, 180, h);
                currentY += h + 15;
            }
        }

        currentY = ensureSpace(doc, currentY, 40);
        const mesesRows = dados.grafico_anual.map(m => [m.nome, `R$ ${safeNumber(m.total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
        doc.text("Detalhamento Mensal (Tabela)", 14, currentY);
        autoTable(doc, {
            head: [['Mês', 'Total Gasto']],
            body: mesesRows,
            startY: currentY + 5,
            theme: 'striped',
            headStyles: { fillColor: [49, 130, 206] }
        });

        const nomeArquivo = filtros.veiculo_id ? `relatorio_veiculo_${filtros.veiculo_id}.pdf` : `relatorio_geral_${filtros.ano}.pdf`;
        doc.save(nomeArquivo);

    } catch (error) {
        console.error("Erro PDF", error);
        toast.error("Erro ao gerar PDF.");
    } finally {
        setGerandoPDF(false);
        setRenderPDFCharts(false);
    }
}

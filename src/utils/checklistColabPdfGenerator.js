import jsPDF from 'jspdf';
import api from '../services/api';
import autoTable from 'jspdf-autotable';

const CONFIG = {
  margin: 14, pageWidth: 210, pageHeight: 297, maxContentY: 277,
  headerColor: [41, 128, 185], warningColor: [234, 182, 38], dangerColor: [229, 62, 62], successColor: [0, 214, 143], grayColor: [160, 174, 192], darkGray: [74, 85, 104],
  imgBoxW: 50, imgBoxH: 30, titleFontSize: 10, titleLineH: 4.2, obsFontSize: 8, obsLineH: 3.6,
};
const imageCache = new Map();

function getFileNameFromPath(p) { return p ? String(p).split(/[/\\]/).pop() : null; }

async function carregarImagemInfo(fotoPath) {
  try {
    const fileName = getFileNameFromPath(fotoPath);
    if (!fileName) return null;
    if (imageCache.has(fileName)) return imageCache.get(fileName);

    const response = await api.get(`/checklists-colab/foto/${fileName}`, { responseType: 'blob' });
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(response.data);
    });

    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = dataUrl; });
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
    let finalW = img.naturalWidth || img.width; let finalH = img.naturalHeight || img.height;
    if (finalW > 800 || finalH > 800) { const ratio = Math.min(800 / finalW, 800 / finalH); finalW *= ratio; finalH *= ratio; }
    canvas.width = finalW; canvas.height = finalH; ctx.drawImage(img, 0, 0, finalW, finalH);

    const info = { dataUrl: canvas.toDataURL('image/jpeg', 0.8), w: finalW, h: finalH, format: 'JPEG' };
    imageCache.set(fileName, info); return info;
  } catch (error) { return null; }
}

function fitContain(originalW, originalH, boxW, boxH) {
  if (!originalW || !originalH) return { dw: boxW, dh: boxH };
  const r = Math.min(boxW / originalW, boxH / originalH);
  return { dw: originalW * r, dh: originalH * r };
}

export const gerarRelatorioDetalhadoColab = async (colaboradoresFiltrados) => {
  const doc = new jsPDF(); let primeiraVez = true;
  const validos = colaboradoresFiltrados.filter((c) => c.checklist_id);
  if (validos.length === 0) return alert('Nenhum checklist encontrado para gerar relatório.');

  for (let i = 0; i < validos.length; i++) {
    const colab = validos[i];
    try {
      const res = await api.get(`/checklists-colab/${colab.checklist_id}`);
      const dados = res.data;

      if (!primeiraVez) doc.addPage();
      primeiraVez = false;

      // Header
      doc.setFontSize(20); doc.setTextColor(...CONFIG.headerColor); doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Inspeção de Colaborador (EPIs/Ferramentas)', CONFIG.margin, 20);
      doc.setDrawColor(...CONFIG.headerColor); doc.setLineWidth(0.5); doc.line(CONFIG.margin, 25, CONFIG.pageWidth - CONFIG.margin, 25);

      // Info Colab
      let y = 30;
      doc.setFillColor(245, 245, 245); doc.roundedRect(CONFIG.margin, y, CONFIG.pageWidth - 2 * CONFIG.margin, 28, 3, 3, 'F');
      doc.setFontSize(16); doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold');
      doc.text(`${colab.nome} - ${colab.tipo_colaborador}`, CONFIG.margin + 5, y + 8);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...CONFIG.darkGray);
      doc.text(`CPF: ${colab.cpf}`, CONFIG.margin + 5, y + 16);
      doc.text(`Data Verificação: ${new Date(dados.data_verificacao).toLocaleDateString('pt-BR')}`, CONFIG.margin + 65, y + 16);
      doc.text(`Avaliador: ${dados.usuario?.nome || 'Sistema'}`, CONFIG.margin + 130, y + 16);
      
      doc.setTextColor(...(dados.status === 'APROVADO' ? CONFIG.successColor : dados.status === 'REPROVADO' ? CONFIG.dangerColor : CONFIG.warningColor));
      doc.setFont('helvetica', 'bold'); doc.text(`Status: ${dados.status || 'PENDENTE'}`, CONFIG.margin + 5, y + 24);

      y += 35;

      // Group Items
      const grupos = {};
      dados.itens.forEach(it => { if(!it.indice || it.indice===1) { grupos[it.categoria || 'Sem Categoria'] = [...(grupos[it.categoria || 'Sem Categoria'] || []), it]; } });

      for (const cat of Object.keys(grupos).sort()) {
        if (y + 14 > CONFIG.maxContentY) { doc.addPage(); y = 20; }
        doc.setDrawColor(200, 200, 200); doc.line(CONFIG.margin, y, CONFIG.pageWidth - CONFIG.margin, y); y += 6;
        doc.setFillColor(17, 24, 39); doc.rect(CONFIG.margin, y, CONFIG.pageWidth - 2 * CONFIG.margin, 8, 'F');
        doc.setFontSize(11); doc.setTextColor(...CONFIG.successColor); doc.text(cat, CONFIG.margin + 3, y + 5.5); y += 10;

        for (const [idx, item] of grupos[cat].entries()) {
          const alturaItem = Math.max(13, 3 + 4.2 + (item.observacao ? 8 : 0) + (item.foto_path ? CONFIG.imgBoxH + 5 : 4));
          if (y + alturaItem > CONFIG.maxContentY) { doc.addPage(); y = 20; }
          if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(CONFIG.margin, y - 2, CONFIG.pageWidth - 2 * CONFIG.margin, alturaItem + 1, 'F'); }

          doc.setFontSize(10); doc.setTextColor(0, 0, 0); doc.text(`${item.quantidade_total || 1}x ${item.nome_item}`, CONFIG.margin + 2, y + 3);
          const stColor = item.status === 'OK' ? CONFIG.successColor : item.status === 'RUIM' ? CONFIG.dangerColor : item.status === 'FALTANTE' ? CONFIG.warningColor : CONFIG.grayColor;
          doc.setTextColor(...stColor); doc.text(String(item.status || 'N/A'), CONFIG.pageWidth - CONFIG.margin, y + 3, { align: 'right' });

          let curY = y + 7;
          if (item.observacao) { doc.setTextColor(...CONFIG.darkGray); doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text(`Obs: ${item.observacao.slice(0,90)}`, CONFIG.margin + 2, curY); curY += 5; }
          
          if (item.foto_path) {
            doc.setDrawColor(200); doc.rect(CONFIG.margin + 2, curY, CONFIG.imgBoxW, CONFIG.imgBoxH);
            const info = await carregarImagemInfo(item.foto_path);
            if (info) { const { dw, dh } = fitContain(info.w, info.h, CONFIG.imgBoxW - 1, CONFIG.imgBoxH - 1); doc.addImage(info.dataUrl, info.format, (CONFIG.margin + 2) + (CONFIG.imgBoxW - dw)/2, curY + (CONFIG.imgBoxH - dh)/2, dw, dh); }
          }
          y += alturaItem;
        } y += 5;
      }
    } catch (e) { console.error(e); }
  }
  
  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setTextColor(160); doc.setFontSize(8); doc.text(`Página ${i} de ${pages}`, CONFIG.pageWidth / 2, CONFIG.pageHeight - 10, { align: 'center' }); }
  doc.save(`checklist_colaboradores_${new Date().toISOString().slice(0,10)}.pdf`);
};
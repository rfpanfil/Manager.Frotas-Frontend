
import jsPDF from 'jspdf';
import api from '../services/api';

const CONFIG = {
  margin: 14,

  // A4 em mm (jsPDF default)
  pageWidth: 210,
  pageHeight: 297,

  // limite de conteúdo antes do rodapé
  maxContentY: 277,

  headerColor: [41, 128, 185],
  warningColor: [234, 182, 38],
  dangerColor: [229, 62, 62],
  successColor: [0, 214, 143],
  grayColor: [160, 174, 192],
  darkGray: [74, 85, 104],

  // caixa fixa da foto (a imagem entra “contain”, sem distorcer)
  imgBoxW: 50,
  imgBoxH: 30,

  // tipografia / espaçamentos
  titleFontSize: 10,
  titleLineH: 4.2,
  obsFontSize: 8,
  obsLineH: 3.6,
};

/**
 * Cache de imagens por filename para não baixar a mesma imagem várias vezes
 * Map<string, { dataUrl: string, w: number, h: number, format: 'JPEG'|'PNG' }>
 */
const imageCache = new Map();

function getFileNameFromPath(p) {
  if (!p) return null;
  return String(p).split(/[/\\]/).pop();
}

/**
 * Baixa imagem do backend e retorna:
 * - dataUrl (base64)
 * - dimensões reais (naturalWidth/naturalHeight)
 * - formato (PNG/JPEG) baseado no mime-type do Blob
 */
async function carregarImagemInfo(fotoPath) {
  try {
    const fileName = getFileNameFromPath(fotoPath);
    if (!fileName) return null;

    if (imageCache.has(fileName)) return imageCache.get(fileName);

    const response = await api.get(`/checklists/foto/${fileName}`, { responseType: 'blob' });
    const blob = response.data;

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    // --------------------------------------------------------
    // CORREÇÃO: Usar Canvas para consertar EXIF e otimizar peso
    // --------------------------------------------------------
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Limita o tamanho para não travar o PDF (800px garante ótima qualidade)
    const MAX_DIM = 800;
    let finalW = img.naturalWidth || img.width;
    let finalH = img.naturalHeight || img.height;

    if (finalW > MAX_DIM || finalH > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / finalW, MAX_DIM / finalH);
        finalW = finalW * ratio;
        finalH = finalH * ratio;
    }

    canvas.width = finalW;
    canvas.height = finalH;

    // Ao desenhar no canvas, o navegador corrige a rotação EXIF automaticamente
    ctx.drawImage(img, 0, 0, finalW, finalH);

    // Converte para JPEG otimizado (80% de qualidade)
    const normalizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

    const info = {
      dataUrl: normalizedDataUrl,
      w: finalW,
      h: finalH,
      format: 'JPEG', // Sempre manda como JPEG para o jsPDF
    };

    imageCache.set(fileName, info);
    return info;
  } catch (error) {
    console.error('Erro ao carregar imagem:', fotoPath, error);
    return null;
  }
}

/**
 * Calcula tamanho “contain” mantendo proporção dentro da caixa (boxW/boxH).
 */
function fitContain(originalW, originalH, boxW, boxH) {
  if (!originalW || !originalH) return { dw: boxW, dh: boxH };

  const r = Math.min(boxW / originalW, boxH / originalH);
  return { dw: originalW * r, dh: originalH * r };
}

/**
 * Adiciona cabeçalho do documento
 */
function adicionarCabecalho(doc, titulo) {
  doc.setFontSize(20);
  doc.setTextColor(...CONFIG.headerColor);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, CONFIG.margin, 20);

  doc.setDrawColor(...CONFIG.headerColor);
  doc.setLineWidth(0.5);
  doc.line(CONFIG.margin, 25, CONFIG.pageWidth - CONFIG.margin, 25);
}

/**
 * Adiciona informações do veículo e checklist
 */
function adicionarInfoVeiculo(doc, veiculo, dados, yInicial) {
  let y = yInicial;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(
    CONFIG.margin,
    y,
    CONFIG.pageWidth - 2 * CONFIG.margin,
    28,
    3,
    3,
    'F'
  );

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`,
    CONFIG.margin + 5,
    y + 8
  );

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...CONFIG.darkGray);

  const dataFormatada = dados?.data_verificacao
    ? new Date(dados.data_verificacao).toLocaleDateString('pt-BR')
    : '-';
  doc.text(`Data: ${dataFormatada}`, CONFIG.margin + 5, y + 16);

  const responsavel =
    dados?.responsavel_nome || veiculo?.responsavel_nome || dados?.usuario_nome || '-';
  doc.text(`Responsável: ${responsavel}`, CONFIG.margin + 65, y + 16);

  const status = dados?.status || 'PENDENTE';
  const statusText = `Status: ${status}`;
  const statusColor =
    status === 'PENDENTE'
      ? CONFIG.warningColor
      : status === 'APROVADO'
      ? CONFIG.successColor
      : status === 'REPROVADO'
      ? CONFIG.dangerColor
      : CONFIG.headerColor;

  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, CONFIG.margin + 5, y + 24);

  return y + 35;
}

/**
 * Agrupa itens por categoria
 */
function agruparPorCategoria(itens) {
  const grupos = {};
  itens.forEach((item) => {
    const cat = item.categoria || 'Sem Categoria';
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(item);
  });
  return grupos;
}

/**
 * Mapa de quantidades por (categoria + nome_item)
 * Isso permite imprimir "3x ..." mesmo que o backend não traga a quantidade pronta.
 */
function buildQtdMap(itens) {
  const map = new Map();
  for (const it of itens) {
    const key = `${it.categoria || ''}||${it.nome_item || ''}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

/**
 * Adiciona título de categoria (com quebra de página se necessário)
 */
function adicionarTituloCategoria(doc, categoria, y) {
  const needed = 14; // espaço aproximado para header da categoria
  if (y + needed > CONFIG.maxContentY) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(CONFIG.margin, y, CONFIG.pageWidth - CONFIG.margin, y);

  y += 6;

  doc.setFillColor(17, 24, 39);
  doc.rect(CONFIG.margin, y, CONFIG.pageWidth - 2 * CONFIG.margin, 8, 'F');

  doc.setFontSize(11);
  doc.setTextColor(...CONFIG.successColor);
  doc.setFont('helvetica', 'bold');
  doc.text(categoria, CONFIG.margin + 3, y + 5.5);

  return y + 10;
}

/**
 * Placeholder para foto quando não carrega
 */
function desenharPlaceholderFoto(doc, x, y) {
  const width = CONFIG.imgBoxW;
  const height = CONFIG.imgBoxH;

  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, width, height, 'F');

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('Imagem', x + 15, y + 13);
  doc.text('indisponível', x + 10, y + 19);
}

/**
 * Adiciona item individual (com quantidade + foto proporcional)
 */
async function adicionarItem(doc, item, y, qtdMap) {
  const temFoto = item.foto_path && String(item.foto_path).trim() !== '';

  // --- quantidade (ex: 3x) calculada por categoria+nome_item ---
  const key = `${item.categoria || ''}||${item.nome_item || ''}`;
  const qtd = qtdMap?.get(key) || 1;
  // const idx = Number(item.indice || 1); // <--- Pode remover ou comentar essa linha

  const label =
    qtd > 1
      ? `${qtd}x ${item.nome_item}` // <--- REMOVI O "(${idx}/${qtd})"
      : `1x ${item.nome_item}`;

  // --- quebra de linha do título/obs para não bagunçar layout ---
  const leftX = CONFIG.margin + 2;
  const rightX = CONFIG.pageWidth - CONFIG.margin;

  const statusAreaW = 22; // reserva para status alinhado à direita
  const maxTextW = (rightX - leftX) - statusAreaW;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(CONFIG.titleFontSize);
  const titleLines = doc.splitTextToSize(label, maxTextW);
  const titleH = titleLines.length * CONFIG.titleLineH;

  let obsLines = [];
  if (item.observacao && String(item.observacao).trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(CONFIG.obsFontSize);
    const obsTexto = `Obs: ${String(item.observacao).trim()}`;
    obsLines = doc.splitTextToSize(obsTexto, maxTextW);
    // limita para não estourar o PDF
    if (obsLines.length > 3) {
      obsLines = obsLines.slice(0, 3);
      obsLines[2] = String(obsLines[2]).slice(0, 90) + '...';
    }
  }
  const obsH = obsLines.length ? (obsLines.length * CONFIG.obsLineH + 1) : 0;

  const imgBlockH = temFoto ? (CONFIG.imgBoxH + 3) : 0;

  // altura final do bloco
  const alturaItem = Math.max(13, (3 + titleH + obsH + (temFoto ? (2 + imgBlockH) : 4)));

  // quebra de página antes de desenhar (para não cortar bloco no meio)
  if (y + alturaItem > CONFIG.maxContentY) {
    doc.addPage();
    y = 20;
  }

  // zebra (usa item._index definido no loop da categoria)
  if ((item._index ?? 0) % 2 === 0) {
    doc.setFillColor(250, 250, 250);
    doc.rect(CONFIG.margin, y - 2, CONFIG.pageWidth - 2 * CONFIG.margin, alturaItem + 1, 'F');
  }

  // --- título ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(CONFIG.titleFontSize);
  doc.setTextColor(0, 0, 0);
  doc.text(titleLines, leftX, y + 3);

  // --- status à direita ---
  const status = item.status || 'N/A';
  const statusColor =
    status === 'OK'
      ? CONFIG.successColor
      : status === 'RUIM'
      ? CONFIG.dangerColor
      : status === 'FALTANTE'
      ? CONFIG.warningColor
      : CONFIG.grayColor;

  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(String(status), rightX, y + 3, { align: 'right' });

  // --- observação ---
  let curY = y + 3 + titleH;
  if (obsLines.length) {
    doc.setTextColor(...CONFIG.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(CONFIG.obsFontSize);
    doc.text(obsLines, leftX, curY + 3);
    curY += 3 + obsLines.length * CONFIG.obsLineH;
  }

  // --- foto (contain + centralizada, sem distorcer) ---
  if (temFoto) {
    const imgX = leftX;
    const imgY = curY + 2;

    // moldura
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(imgX, imgY, CONFIG.imgBoxW, CONFIG.imgBoxH);

    try {
      const info = await carregarImagemInfo(item.foto_path);
      if (!info) {
        desenharPlaceholderFoto(doc, imgX, imgY);
      } else {
        const innerW = CONFIG.imgBoxW - 1;
        const innerH = CONFIG.imgBoxH - 1;

        const { dw, dh } = fitContain(info.w, info.h, innerW, innerH);
        const px = imgX + (CONFIG.imgBoxW - dw) / 2;
        const py = imgY + (CONFIG.imgBoxH - dh) / 2;

        doc.addImage(info.dataUrl, info.format, px, py, dw, dh);
      }
    } catch (error) {
      console.error('Erro ao adicionar imagem no PDF:', error);
      desenharPlaceholderFoto(doc, imgX, imgY);
    }

    curY = imgY + CONFIG.imgBoxH + 2;
  } else {
    curY += 4;
  }

  // linha divisória
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(CONFIG.margin, y + alturaItem - 2, CONFIG.pageWidth - CONFIG.margin, y + alturaItem - 2);

  return y + alturaItem;
}

/**
 * Rodapé com número de página e data
 */
function adicionarRodape(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  const dataGeracao = new Date().toLocaleString('pt-BR');

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CONFIG.grayColor);

    doc.setFontSize(7);
    doc.text(`Gerado em: ${dataGeracao}`, CONFIG.margin, CONFIG.pageHeight - 10);

    doc.setFontSize(8);
    const rodapeTexto = `Página ${i} de ${totalPages}`;
    const textWidth = doc.getTextWidth(rodapeTexto);
    doc.text(rodapeTexto, (CONFIG.pageWidth - textWidth) / 2, CONFIG.pageHeight - 10);
  }
}

/**
 * Função principal de geração do relatório
 */
export const gerarRelatorioDetalhado = async (veiculosFiltrados) => {
  const doc = new jsPDF();
  let primeiraVez = true;

  const veiculosComChecklist = veiculosFiltrados.filter((v) => v.checklist_id);

  if (veiculosComChecklist.length === 0) {
    alert('Nenhum checklist encontrado para gerar relatório.');
    return;
  }

  const totalVeiculos = veiculosComChecklist.length;
  

  for (let i = 0; i < veiculosComChecklist.length; i++) {
    const veiculo = veiculosComChecklist[i];

    try {
      const res = await api.get(`/checklists/${veiculo.checklist_id}`);
      const dados = res.data;

      if (!primeiraVez) doc.addPage();
      primeiraVez = false;

      let y = 10;

      adicionarCabecalho(doc, 'Relatório Detalhado de Frota e Checklists');
      y = 30;

      y = adicionarInfoVeiculo(doc, veiculo, dados, y);

      const itens = dados.itens || [];
      const qtdMap = buildQtdMap(itens);

      const grupos = agruparPorCategoria(itens);
      const categorias = Object.keys(grupos).sort();

      for (const categoria of categorias) {
        y = adicionarTituloCategoria(doc, categoria, y);

        const itensCat = grupos[categoria] || [];
        itensCat.forEach((it, idx) => {
          it._index = idx;
        });

        // Filtra para pegar apenas o "mestre" (índice 1) ou itens únicos
        const itensParaImprimir = itensCat.filter(item => {
            // Se tiver indice, só passa se for 1. Se não tiver indice (legado), passa.
            return !item.indice || item.indice === 1;
        });

        for (const item of itensParaImprimir) {
            y = await adicionarItem(doc, item, y, qtdMap);
        }

        y += 5;
      }

      
    } catch (error) {
      console.error(`Erro ao processar veículo ${veiculo.placa}:`, error);

      if (!primeiraVez) doc.addPage();
      primeiraVez = false;

      doc.setFontSize(12);
      doc.setTextColor(229, 62, 62);
      doc.text(`Erro ao carregar dados do veículo ${veiculo.placa}`, CONFIG.margin, 30);
    }
  }

  adicionarRodape(doc);

  // --- NOVA LÓGICA DE NOMECLATURA DE ARQUIVO ---
  const dataHoje = new Date().toISOString().slice(0, 10); // Ex: 2026-02-10
  let nomeArquivo = '';

  // Se tiver apenas 1 veículo na lista, é um relatório individual
  if (veiculosComChecklist.length === 1) {
      const v = veiculosComChecklist[0];
      
      // Limpa espaços e caracteres estranhos do modelo para não quebrar o nome do arquivo
      const modeloLimpo = v.modelo ? String(v.modelo).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : 'Veiculo';
      
      // Fica: checklist_S10_JAL9E05_2026-02-10.pdf
      nomeArquivo = `checklist_${modeloLimpo}_${v.placa}_${dataHoje}.pdf`;
  } else {
      // Se for mais de 1 veículo, é o relatório geral
      // Fica: relatorio_checklist_detalhado_2026-02-10.pdf
      nomeArquivo = `relatorio_checklist_detalhado_${dataHoje}.pdf`;
  }

  doc.save(nomeArquivo);

  
};
// Exportação em CSV que o Excel em português abre direto (substitui a biblioteca xlsx).
// - Separador ";" (o Excel pt-BR usa vírgula como decimal) e BOM UTF-8 para os acentos.
// - Aspas escapadas e células com ";", aspas ou quebra de linha entre aspas.
// - Célula que começa com = + - @ (ou tab/CR) ganha um apóstrofo: o Excel não executa
//   como fórmula um texto digitado por usuário (CSV injection).

const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

export function celulaCsv(valor) {
    let texto = valor === null || valor === undefined ? '' : String(valor);
    if (INICIO_DE_FORMULA.test(texto)) texto = "'" + texto;
    if (/[";\n\r]/.test(texto)) texto = '"' + texto.replace(/"/g, '""') + '"';
    return texto;
}

export function gerarCsv(linhas) {
    if (!linhas.length) return '';
    const colunas = Object.keys(linhas[0]);
    const corpo = [colunas, ...linhas.map(l => colunas.map(c => l[c]))]
        .map(linha => linha.map(celulaCsv).join(';'))
        .join('\r\n');
    return '﻿' + corpo;
}

export function baixarCsv(nomeArquivo, linhas) {
    const blob = new Blob([gerarCsv(linhas)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

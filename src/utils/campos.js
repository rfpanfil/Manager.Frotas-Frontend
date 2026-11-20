// Regras de campos repetidas na tela (REGRAS_DE_CAMPOS.md) só para avisar antes de enviar.
// Quem garante é o servidor: estas funções não substituem a validação dele.

// Tamanhos máximos de texto (iguais aos do servidor).
export const MAX = {
    NOME: 150,   // nomes e títulos
    CURTO: 50,   // códigos e textos curtos (NF, série, patrimônio, fogo, marca, medida)
    MEDIO: 255,  // contato, endereço, observação de item
    LONGO: 2000, // observações e descrições
};

// Valores numéricos de bom senso.
export const KM_MAX = 9999999;
export const LITROS_MAX = 2000;
export const SULCO_MAX = 30;
export const VIDA_UTIL_MAX = 500000;
export const INTERVALO_REVISAO_MAX = 200000;
export const QTD_ITEM_CHECKLIST_MAX = 50;

export const CATEGORIAS_CNH = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

// Padrões para o atributo pattern (o navegador compara o valor inteiro).
export const PADRAO = {
    CPF: String.raw`\d{3}\.?\d{3}\.?\d{3}-?\d{2}`,
    CNPJ: String.raw`\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}`,
    CPF_OU_CNPJ: String.raw`(\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2})`,
    PLACA: '[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}',
    RENAVAM: String.raw`\d{9,11}`,
    CHASSI: '[A-HJ-NPR-Za-hj-npr-z0-9]{17}',
    DOT: '(0[1-9]|[1-4][0-9]|5[0-3])[0-9]{2}',
    TELEFONE: String.raw`(\+?55\s?)?\(?\d{2}\)?\s?\d{4,5}-?\d{4}`,
    VALOR: String.raw`\d{1,3}(\.\d{3})*(,\d{1,4})?|\d+([.,]\d{1,4})?`,
    DECIMAL: String.raw`\d+([.,]\d{1,4})?`,
    KM: String.raw`\d{1,3}(\.\d{3})*|\d+`,
    SENHA: String.raw`(?=.*\p{L})(?=.*\d).{8,}`,
};

export const DICA = {
    CPF: 'CPF com 11 dígitos (ex.: 000.000.000-00)',
    CNPJ: 'CNPJ com 14 dígitos (ex.: 00.000.000/0000-00)',
    CPF_OU_CNPJ: 'CPF (11 dígitos) ou CNPJ (14 dígitos)',
    PLACA: 'Placa no formato AAA9999 ou AAA9A99',
    RENAVAM: 'RENAVAM com 11 dígitos',
    CHASSI: 'Chassi com 17 caracteres, sem I, O ou Q',
    DOT: 'DOT com 4 dígitos: semana (01 a 53) e ano, ex.: 1224',
    TELEFONE: 'Telefone com DDD, ex.: (11) 91234-5678',
    VALOR: 'Valor em reais, ex.: 1.367,50',
    DECIMAL: 'Número com vírgula ou ponto para os centavos, sem separador de milhar (ex.: 50,5)',
    KM: 'KM inteiro, ex.: 150.000 ou 150000',
    SENHA: 'Pelo menos 8 caracteres, com letra e número',
};

const digitos = (v) => String(v ?? '').replace(/\D/g, '');

// Máscaras simples: formatam enquanto a pessoa digita; o servidor guarda só os dígitos.
export function mascaraCPF(v) {
    const d = digitos(v).slice(0, 11);
    return d
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function mascaraCNPJ(v) {
    const d = digitos(v).slice(0, 14);
    return d
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function mascaraCpfOuCnpj(v) {
    return digitos(v).length > 11 ? mascaraCNPJ(v) : mascaraCPF(v);
}

export function mascaraTelefone(v) {
    let d = digitos(v);
    if (d.length > 11 && d.startsWith('55')) d = d.slice(2); // tira o +55
    d = d.slice(0, 11);
    if (d.length <= 2) return d ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraPlaca(v) {
    return String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

export function mascaraChassi(v) {
    return String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
}

export function mascaraDigitos(v, maximo) {
    return digitos(v).slice(0, maximo);
}

export const mascaraDOT = (v) => mascaraDigitos(v, 4);
export const mascaraRenavam = (v) => mascaraDigitos(v, 11);

// Datas no formato do <input type="date"> (AAAA-MM-DD), no fuso do navegador.
function isoLocal(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function deslocar({ dias = 0, anos = 0 }) {
    const d = new Date();
    d.setFullYear(d.getFullYear() + anos);
    d.setDate(d.getDate() + dias);
    return d;
}

// Eventos que já aconteceram: até 2 anos atrás e no máximo 1 dia no futuro.
export function limitesDataEvento() {
    return { min: isoLocal(deslocar({ anos: -2 })), max: isoLocal(deslocar({ dias: 1 })) };
}

// Prazos e vencimentos: de 2000 até daqui a 10 anos.
export function limitesDataPrazo() {
    return { min: '2000-01-01', max: isoLocal(deslocar({ anos: 10 })) };
}

// Mesmas faixas para <input type="datetime-local"> (AAAA-MM-DDTHH:mm).
export function limitesDataHoraEvento() {
    const { min, max } = limitesDataEvento();
    return { min: `${min}T00:00`, max: `${max}T23:59` };
}

export function limitesDataHoraPrazo() {
    const { min, max } = limitesDataPrazo();
    return { min: `${min}T00:00`, max: `${max}T23:59` };
}

// Formas de pagamento aceitas em cotação e ordem de compra.
export const FORMAS_PAGAMENTO = ['À Vista', 'Boleto Bancário', 'Pix', 'Cartão de Crédito', 'A Prazo / Faturado'];

// Paginação aceita pelo servidor: limit de 1 a 5.000 por pedido.
export const LIMITE_PAGINA = 5000;

// Período de filtro (AAAA-MM-DD): fim não antes do início, nada antes de 2000 e no máximo 5 anos.
export function erroPeriodo(inicio, fim) {
    if (!inicio || !fim) return null;
    if (inicio < '2000-01-01') return 'A data inicial não pode ser antes de 2000.';
    if (fim < inicio) return 'A data final não pode ser antes da inicial.';
    const limite = `${Number(inicio.slice(0, 4)) + 5}${inicio.slice(4)}`;
    if (fim > limite) return 'O período pode ter no máximo 5 anos.';
    return null;
}

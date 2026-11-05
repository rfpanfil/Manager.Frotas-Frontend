// Chave de idempotência: gerada uma vez por operação (ex.: ao abrir a janela de movimentação) e enviada
// no cabeçalho Idempotency-Key em toda tentativa. Se o pedido for repetido (clique duplo, rede que
// reenvia), o servidor devolve a resposta da primeira vez em vez de lançar de novo.
export function novaChaveIdempotencia() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

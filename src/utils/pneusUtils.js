export const customSelectStyles = {
    control: (base, state) => ({ ...base, backgroundColor: '#2d3748', borderColor: '#444', color: 'white', minHeight: '38px', boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none', '&:hover': { borderColor: '#00d68f' } }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#00d68f' : '#2d3748', color: state.isFocused ? 'black' : 'white', cursor: 'pointer' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0' })
};

export const inputStyle = { width: '100%', padding: '8px', background: '#2d3748', border: '1px solid #4a5568', color: 'white', borderRadius: 4, marginTop: '5px', boxSizing: 'border-box' };

export const calcularStatusPneu = (pneu, kmAtualVeiculo) => {
    if (!pneu.vida_util_km) return { cor: '#a0aec0', msg: 'Sem parâmetro', status: 'neutro' };

    const kmRodado = (kmAtualVeiculo || 0) - (pneu.km_montagem || 0);
    const kmFaltante = pneu.vida_util_km - kmRodado;

    let sulcoOk = true;
    if (pneu.sulco_novo > 0 && pneu.sulco_atual <= 3) sulcoOk = false;

    if (kmFaltante <= 0 || !sulcoOk) return { cor: '#e53e3e', msg: 'Vencido', status: 'vermelho', kmFaltante };
    if (kmFaltante <= 5000) return { cor: '#ecc94b', msg: 'Próximo do Vencimento', status: 'amarelo', kmFaltante };

    return { cor: '#00d68f', msg: 'OK', status: 'verde', kmFaltante };
};

export const getSigla = (pos) => ({ 'DIANT_ESQ': 'DE', 'DIANT_DIR': 'DD', 'TRAC_ESQ_EXT': 'TE', 'TRAC_DIR_EXT': 'TD', 'ESTEPE_1': 'ST1', 'ESTEPE_2': 'ST2' }[pos] || pos);

export const getTituloStatus = (status) => {
    switch (status) {
        case 'EM_USO': return 'Em Uso (Montados)';
        case 'ESTOQUE': return 'Em Estoque (Disponíveis)';
        case 'MANUTENCAO': return 'Em Manutenção';
        case 'SUCATA': return 'Sucata / Descartados';
        default: return status;
    }
};

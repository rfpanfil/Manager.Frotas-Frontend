// Arquivo: frontend/src/components/estoque/estoqueConstants.js

// Estilos para o React Select (Modo Escuro) — reutilizados em múltiplos modais
export const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: '#2d3748',
        borderColor: '#4a5568',
        color: 'white',
        minHeight: '35px',
        boxShadow: state.isFocused ? '0 0 0 1px #00d68f' : 'none',
        '&:hover': { borderColor: '#00d68f' }
    }),
    menu: (base) => ({ ...base, backgroundColor: '#2d3748', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#00d68f' : '#2d3748',
        color: state.isFocused ? 'black' : 'white',
        cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#a0aec0', fontSize: '0.9rem' })
};

// Estilo padrão para inputs de formulário
export const inputStyle = {
    width: '100%',
    padding: '8px',
    background: '#2d3748',
    border: '1px solid #4a5568',
    color: 'white',
    borderRadius: 4,
    marginTop: '5px',
    boxSizing: 'border-box'
};

// Estado inicial do formulário de cadastro (Molde)
export const initialFormMolde = {
    codigo_referencia: '', nome: '', categoria: '', unidade_medida: '', estoque_minimo: 0,
    observacoes: '', tipo_controle: 'QUANTIDADE', quantidade_inicial: 0, valor_aquisicao: '',
    numero_nf: '', local_armazenagem: '', serial: '', patrimonio: '', status_ativo: 'Disponível',
    fogo: '', dot: '', marca: '', medida: '', sulco_novo: '', data_vencimento: ''
};

// Estado inicial do formulário de movimentação
export const initialFormMov = {
    estoque_item_id: '', quantidade: '', observacao: '',
    numero_nf: '', valor_aquisicao: '', base_id: '', solicitante_id: '', responsavel_id: '',
    serial: '', patrimonio: '', fogo: '', dot: '', marca: '', medida: '', sulco_novo: ''
};

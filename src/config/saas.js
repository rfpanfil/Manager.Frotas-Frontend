
export const SAAS_CONFIG = [
    { id: 'dash_gastos', label: 'Dash. Gastos', categoria: 'Gestão' },
    { id: 'dash_frota', label: 'Dash. Frota', categoria: 'Gestão' },    
    { id: 'gastos', label: 'Gastos', categoria: 'Gestão' },
    { id: 'compras', label: 'Compras', categoria: 'Gestão' },
    { id: 'estoque', label: 'Estoque', categoria: 'Gestão' },
    
    { id: 'otimizador', label: 'Otimizador', categoria: 'Operação' },
    { id: 'rotas', label: 'Rotas', categoria: 'Operação' },
    { id: 'rastreamento', label: 'Rastreamento / Mapa', categoria: 'Operação' },
    
    { id: 'veiculos', label: 'Veículos / Frota', categoria: 'Cadastros' },
    { id: 'colaboradores', label: 'Colaboradores / Equipe', categoria: 'Cadastros' },
    { id: 'bases', label: 'Bases / C. Custo', categoria: 'Cadastros' }
];

export const TODOS_MODULOS = SAAS_CONFIG.map(m => m.id);
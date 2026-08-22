import usePersistedTab from '../hooks/usePersistedTab';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Truck, LayoutDashboard, TrendingUp, Map, Wallet,
  Users, UserCog, Navigation
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
    const [abaAtiva, setAbaAtiva] = usePersistedTab('geral', 'home');
  const { user, can } = useAuth();
  const queryClient = useQueryClient();
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();
  const nomesMeses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
  const mesNome = nomesMeses[hoje.getMonth()];

  const { data: homeData, isLoading: loading } = useQuery({
    queryKey: ['homeMetrics', { ano, mes }],
    queryFn: async () => {
      const response = await api.get('/dashboard/gastos', { params: { ano, mes } });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const kpis = {
    hoje: homeData?.cards?.hoje || 0,
    ontem: 0,
    mesAtual: homeData?.cards?.mes || 0
  };

  const chartData = (homeData?.grafico_semanal || []).map((d) => ({ dia: d.dia, valor: d.valor }));

  // --- LEITURA DE MÓDULOS ATIVOS (GRANULARES) ---
  const modulos = user?.modulos_ativos || ["dash_gastos", "dash_frota", "gastos", "compras", "estoque", "otimizador", "rotas", "rastreamento", "veiculos", "colaboradores", "bases"];
  const temFrota = modulos.includes('veiculos');

  // --- DEFINIÇÃO DOS BOTÕES RÁPIDOS ---
  const menuItems = [
    { name: 'Dash Gastos', path: '/dashboard-gastos', icon: LayoutDashboard, color: '#3182ce', render: modulos.includes('dash_gastos') },
    { name: 'Dash Veículos', path: '/dashboard-veiculos', icon: TrendingUp, color: '#8B5CF6', render: modulos.includes('dash_frota') },
    { name: 'Otimizador', path: '/otimizador', icon: Navigation, color: '#805ad5', render: modulos.includes('otimizador') },
    { name: 'Rotas', path: '/rotas', icon: Map, color: '#d69e2e', render: modulos.includes('rotas') },
    { name: 'Lançar Gasto', path: '/gastos', icon: Wallet, color: '#f6ad55', render: modulos.includes('gastos') },
    { name: 'Veículos', path: '/veiculos', icon: Truck, color: '#38a169', render: modulos.includes('veiculos') },
    { name: 'Colaboradores', path: '/motoristas', icon: Users, color: '#e53e3e', render: modulos.includes('colaboradores') },
    // Usa a permissão dinâmica para decidir se mostra o botão de Usuários
    { name: 'Usuários', path: '/usuarios', icon: UserCog, color: '#718096', render: can('usuarios.ver') }
  ].filter(item => item.render !== false);


  if (loading) return <div style={{ padding: 20, color: 'white', textAlign: 'center' }}>Carregando métricas...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* --- CABEÇALHO --- */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#fff', letterSpacing: '1px', marginBottom: '5px' }}>
          <span style={{ color: '#8B5CF6' }}>LGI</span>
        </h1>
        <p style={{ color: '#a0aec0', fontSize: '1rem' }}>Painel de Controle e Monitoramento</p>
      </div>

      {/* --- MENU DE ACESSO RÁPIDO --- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '15px',
        marginBottom: '40px'
      }}>
        {menuItems.map((item, index) => {
          if (loading) return <div style={{ padding: 20, color: 'white', textAlign: 'center' }}>Carregando métricas...</div>;

  return (
            <Link key={index} to={item.path} style={{ textDecoration: 'none' }}>
              <div className="btn-quick-access" style={{
                backgroundColor: '#2d3748',
                padding: '15px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                borderBottom: `3px solid ${item.color}`,
                height: '100px',
                cursor: 'pointer'
              }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <item.icon size={28} color={item.color} />
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <hr style={{ borderColor: '#4a5568', margin: '30px 0', opacity: 0.5 }} />

      {/* --- SEÇÃO MONITORAMENTO RÁPIDO --- */}
      <div>
        <h2 style={{ textAlign: 'center', color: '#a0aec0', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Monitoramento Rápido
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

          {/* COLUNA ESQUERDA: KPIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#2d3748', padding: '20px', borderRadius: '10px', textAlign: 'center', borderLeft: '5px solid #2b6cb0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0', textTransform: 'uppercase', marginBottom: '5px' }}>Gastos Ontem</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>R$ {kpis.ontem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>

              <div style={{ height: '1px', background: '#4a5568', margin: '0 20px 20px 20px', opacity: 0.5 }}></div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0', textTransform: 'uppercase', marginBottom: '5px' }}>Gastos Hoje</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>R$ {kpis.hoje.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>

              <div style={{ height: '1px', background: '#4a5568', margin: '0 20px 20px 20px', opacity: 0.5 }}></div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0', textTransform: 'uppercase', marginBottom: '5px' }}>Total {mesNome}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8B5CF6' }}>R$ {kpis.mesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: GRÁFICO */}
          <div style={{ background: '#2d3748', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            <div style={{ background: '#1a202c', color: '#f6ad55', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '5px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Evolução Diária - {mesNome}
            </div>

            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValorHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                  <XAxis
                    dataKey="dia"
                    stroke="#a0aec0"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    interval={2}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', color: '#fff' }}
                    itemStyle={{ color: '#8B5CF6' }}
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gasto']}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValorHome)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
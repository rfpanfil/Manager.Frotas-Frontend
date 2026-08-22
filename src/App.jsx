// Arquivo: frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Map, Wallet, TrendingUp,
  LogOut, Home as HomeIcon, Navigation, UserCog, Building, Wrench,
  Menu, X, Shield, ClipboardCheck, ShieldAlert, Package, Box
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './services/api'; // <--- IMPORTAÇÃO DA API ADICIONADA

// --- IMPORTAÇÕES DAS PÁGINAS ---
import Login from './pages/Login';
import Home from './pages/Home';
import Veiculos from './pages/Veiculos';
import Colaboradores from './pages/Colaboradores';
import Rotas from './pages/Rotas';
import Gastos from './pages/Gastos';
import DashboardGastos from './pages/DashboardGastos';
import DashboardVeiculos from './pages/DashboardVeiculos';
import Usuarios from './pages/Usuarios';
import Otimizador from './pages/Otimizador';
import Bases from './pages/Bases';
import Rastreamento from './pages/Rastreamento';
import MapaFrota from './pages/MapaFrota';
import AdminPermissoes from './pages/AdminPermissoes';
import Compras from './pages/Compras';
import Ferramentas from './pages/Ferramentas';
import Auditoria from './pages/Auditoria';
import Empresas from './pages/Empresas';


// --- COMPONENTE DE ROTA PRIVADA COM CONTROLE POR PERMISSÕES (DINÂMICO) ---
function PrivateRoute({ children, permissions }) {
  const { signed, loading, can, user } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1e29', color: 'white' }}>
        Carregando sistema...
      </div>
    );
  }

  if (!signed) {
    return <Navigate to="/login" />;
  }

  // Se a rota exige alguma permissão específica e o usuário não for admin ou superadmin
  if (permissions && !['admin', 'superadmin'].includes(user?.cargo)) {
    // Verifica se o usuário possui PELO MENOS UMA das permissões exigidas pela página
    const temAcesso = permissions.some(perm => can(perm));

    if (!temAcesso) {
      // Se não tem acesso à página solicitada, devolve para o Início
      return <Navigate to="/" />;
    }
  }

  return children;
}

// SIDEBAR INTEGRADO (VERSÃO UNIFICADA)
function Sidebar({ isOpen, closeMenu }) {
  const location = useLocation();
  const { signOut, user, can, trocarEmpresa } = useAuth(); // <--- FUNÇÃO trocarEmpresa ADICIONADA
  const [empresas, setEmpresas] = useState([]); // <--- ESTADO PARA A LISTA DE EMPRESAS

  // --- LEITURA DE PÁGINAS ATIVAS (SaaS GRANULAR) ---
  const modulos = user?.modulos_ativos || ["dash_gastos", "dash_frota", "gastos", "compras", "estoque", "otimizador", "rotas", "rastreamento", "veiculos", "colaboradores", "bases"];
  const temFrota = modulos.includes('veiculos'); // Define a nomenclatura visual

  const logout = () => {
    signOut();
  };

  useEffect(() => {
    closeMenu();
  }, [location]);

  // --- NOVO: BUSCA A LISTA DE EMPRESAS SE FOR SUPER ADMIN ---
  useEffect(() => {
    if (user?.cargo === 'superadmin') {
      api.get('/empresas/')
        .then(res => setEmpresas(res.data))
        .catch(err => console.error("Erro ao buscar empresas", err));
    }
  }, [user]);

  const isActive = (path) => location.pathname === path ? 'active-link' : 'nav-link';

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={closeMenu}
      />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>

        {/* CABEÇALHO DO SIDEBAR */}
        <div style={{ padding: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <img
              src="/looplogo.png"
              alt="Loop.Frotas"
              style={{ height: '40px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '5px' }}
            />
            <p style={{ color: '#aaa', fontSize: '0.8rem', margin: 0 }}>Gestão Inteligente</p>
          </div>

          <button
            className="mobile-only"
            onClick={closeMenu}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: window.innerWidth > 768 ? 'none' : 'block' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* --- SELETOR DE EMPRESA (MÁGICA DO SUPER ADMIN) --- */}
        {user?.cargo === 'superadmin' && (
          <div style={{ padding: '0 20px', marginBottom: '15px' }}>
            <label style={{ fontSize: '0.75rem', color: '#00d68f', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              VISUALIZANDO EMPRESA:
            </label>
            <select
              value={user?.empresa_atual_id || ''}
              onChange={(e) => trocarEmpresa(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#151821',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '5px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {/* ESTA É A LINHA QUE FALTAVA PARA FORÇAR A SELEÇÃO */}
              <option value="" disabled>-- Selecione o Cliente --</option>

              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome_fantasia}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="nav-scrollable">

          {/* MENU GERAL (BASEADO EM PERMISSÕES) */}
          <Link to="/" className={isActive('/')}><HomeIcon size={20} /> Início</Link>

          {/* GRUPO GESTÃO */}
          {(modulos.includes('dash_gastos') || modulos.includes('dash_frota') || modulos.includes('gastos') || modulos.includes('compras') || modulos.includes('estoque')) && (can('dash.financeiro') || can('dash.operacional') || can('gastos.ver') || can('gastos.criar') || can('compras.sc.ver') || can('estoque.ver')) && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '15px', marginBottom: '5px', paddingLeft: '10px', textTransform: 'uppercase' }}>Gestão</div>
          )}

          {modulos.includes('dash_gastos') && can('dash.financeiro') && (
            <Link to="/dashboard-gastos" className={isActive('/dashboard-gastos')}><TrendingUp size={20} /> Dash. Gastos</Link>
          )}
          {modulos.includes('dash_frota') && can('dash.operacional') && (
            <Link to="/dashboard-veiculos" className={isActive('/dashboard-veiculos')}><LayoutDashboard size={20} /> Dash. Frota</Link>
          )}

          {modulos.includes('gastos') && (can('gastos.ver') || can('gastos.criar')) && (
            <Link to="/gastos" className={isActive('/gastos')}>
              <Wallet size={20} /> Gastos
            </Link>
          )}

          {modulos.includes('compras') && (can('compras.sc.ver') || can('compras.fornecedores.ver') || can('compras.orcamentos.ver') || can('compras.oc.ver')) && (
            <Link to="/compras" className={isActive('/compras')}><Wallet size={20} /> Compras</Link>
          )}

          {modulos.includes('estoque') && can('estoque.ver') && (
            <Link to="/ferramentas" className={isActive('/ferramentas')}><Package size={20} /> Estoque</Link>
          )}

          {/* GRUPO OPERAÇÃO */}
          {(modulos.includes('otimizador') || modulos.includes('rotas') || modulos.includes('rastreamento')) && (can('rotas.criar') || can('rotas.ver') || can('rastreamento.ver')) && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '15px', marginBottom: '5px', paddingLeft: '10px', textTransform: 'uppercase' }}>Operação</div>
          )}

          {modulos.includes('otimizador') && can('rotas.criar') && (
            <Link to="/otimizador" className={isActive('/otimizador')}><Navigation size={20} /> Otimizador</Link>
          )}

          {modulos.includes('rotas') && can('rotas.ver') && (
            <Link to="/rotas" className={isActive('/rotas')}><Map size={20} /> Rotas</Link>
          )}

          {modulos.includes('rastreamento') && can('rastreamento.ver') && (
            <>
              <Link to="/rastreamento" className={isActive('/rastreamento')}><Navigation size={20} /> Rastreamento</Link>
              <Link to="/mapa-frota" className={isActive('/mapa-frota')}><Map size={20} /> Mapa Geral</Link>
            </>
          )}

          {/* GRUPO CADASTROS E FROTA */}
          {(modulos.includes('veiculos') || modulos.includes('colaboradores') || modulos.includes('bases')) && (can('veiculos.ver') || can('checklist.realizar') || can('checklist.ver') || can('pneus.ver') || can('revisoes.ver') || can('colaboradores.ver') || can('bases.ver')) && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '15px', marginBottom: '5px', paddingLeft: '10px', textTransform: 'uppercase' }}>{temFrota ? 'Cadastros & Frota' : 'Cadastros'}</div>
          )}

          {modulos.includes('veiculos') && (can('veiculos.ver') || can('checklist.realizar') || can('checklist.ver') || can('pneus.ver') || can('revisoes.ver')) && (
            <Link to="/veiculos" className={isActive('/veiculos')}>
              {can('veiculos.ver') ? <Truck size={20} /> : <ClipboardCheck size={20} />}
              {can('veiculos.ver') ? ' Veículos' : ' Frota (Inspeções)'}
            </Link>
          )}

          {/* --- CORREÇÃO DO NOME E ROTA AQUI --- */}
          {modulos.includes('colaboradores') && can('colaboradores.ver') && (
            <Link to="/colaboradores" className={isActive('/colaboradores')}><Users size={20} /> Colaboradores</Link>
          )}

          {modulos.includes('bases') && can('bases.ver') && (
            <Link to="/bases" className={isActive('/bases')}><Building size={20} /> Bases</Link>
          )}

          {/* GRUPO ADMINISTRAÇÃO */}
          {(can('usuarios.ver') || can('permissoes.gerenciar') || can('auditoria.ver') || user?.cargo === 'superadmin') && (
            <>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '15px', marginBottom: '5px', paddingLeft: '10px', textTransform: 'uppercase' }}>Administração</div>

              {/* DESTAQUE DOURADO PARA O SUPER ADMIN */}
              {user?.cargo === 'superadmin' && (
                <Link to="/empresas" className={isActive('/empresas')} style={{ color: '#ecc94b', fontWeight: 'bold', borderLeft: '3px solid #ecc94b', paddingLeft: '7px' }}>
                  <Building size={20} color="#ecc94b" /> Empresas (SaaS)
                </Link>
              )}
              {can('usuarios.ver') && <Link to="/usuarios" className={isActive('/usuarios')}><UserCog size={20} /> Usuários</Link>}
              {can('permissoes.gerenciar') && <Link to="/permissoes" className={isActive('/permissoes')}><Shield size={20} /> Permissões</Link>}
              {can('auditoria.ver') && <Link to="/auditoria" className={isActive('/auditoria')}><ShieldAlert size={20} /> Auditoria (Log)</Link>}
            </>
          )}

        </nav>

        <div className="user-section" style={{ paddingBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: 'white', fontWeight: 'bold' }}>{user?.nome}</div>
            <div style={{ color: '#666', fontSize: '0.8rem' }}>{user?.cargo?.toUpperCase()}</div>
          </div>
          <button onClick={logout} className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#e53e3e', justifyContent: 'flex-start' }}>
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, can } = useAuth(); // Para redirecionamento inicial

  return (
    <div className="app-container">
      {/* HEADER MOBILE COM LOGO */}
      <div className="mobile-menu-btn">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
            <Menu size={28} />
          </button>
          {/* MUDANÇA AQUI TAMBÉM: LOGO NO TOPO MOBILE */}
          <img src="/looplogo.png" alt="Loop.Frotas" style={{ height: '35px', objectFit: 'contain' }} />
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} closeMenu={() => setSidebarOpen(false)} />

      <div className="content">
        <div className="content">
          <Routes>
            {/* Home Redireciona usuários sem acesso aos dashboards direto para Gastos */}
            <Route path="/" element={(!can('dash.financeiro') && !can('dash.operacional')) ? <Navigate to="/gastos" /> : <Home />} />

            {/* Gastos: Tem verificação própria lá dentro */}
            <Route path="/gastos" element={<Gastos />} />

            {/* Rotas Protegidas Dinamicamente pela Matriz de Permissões */}
            <Route path="/dashboard-gastos" element={<PrivateRoute permissions={['dash.financeiro']}><DashboardGastos /></PrivateRoute>} />
            <Route path="/dashboard-veiculos" element={<PrivateRoute permissions={['dash.operacional']}><DashboardVeiculos /></PrivateRoute>} />
            <Route path="/otimizador" element={<PrivateRoute permissions={['rotas.criar']}><Otimizador /></PrivateRoute>} />

            {/* Veículos e Compras aceitam arrays (se tiver qualquer uma dessas permissões, a rota abre, e a tela oculta o resto) */}
            <Route path="/veiculos" element={<PrivateRoute permissions={['veiculos.ver', 'checklist.realizar', 'checklist.ver', 'pneus.ver', 'revisoes.ver']}><Veiculos /></PrivateRoute>} />
            <Route path="/compras" element={<PrivateRoute permissions={['compras.sc.ver', 'compras.orcamentos.ver', 'compras.oc.ver', 'compras.fornecedores.ver']}><Compras /></PrivateRoute>} />

            {/* --- CORREÇÃO DA ROTA E PERMISSÃO AQUI --- */}
            <Route path="/colaboradores" element={<PrivateRoute permissions={['colaboradores.ver']}><Colaboradores /></PrivateRoute>} />
            <Route path="/bases" element={<PrivateRoute permissions={['bases.ver']}><Bases /></PrivateRoute>} />
            <Route path="/rotas" element={<PrivateRoute permissions={['rotas.ver']}><Rotas /></PrivateRoute>} />
            <Route path="/rastreamento" element={<PrivateRoute permissions={['rastreamento.ver']}><Rastreamento /></PrivateRoute>} />
            <Route path="/mapa-frota" element={<PrivateRoute permissions={['rastreamento.ver']}><MapaFrota /></PrivateRoute>} />
            <Route path="/ferramentas" element={<PrivateRoute permissions={['estoque.ver']}><Ferramentas /></PrivateRoute>} />

            {/* Acesso Exclusivo de Admin (Trava dupla: backend já bloqueia, mas o front previne navegação) */}
            <Route path="/empresas" element={user?.cargo === 'superadmin' ? <Empresas /> : <Navigate to="/" />} />
            <Route path="/usuarios" element={<PrivateRoute permissions={['usuarios.ver', 'usuarios.gerenciar']}><Usuarios /></PrivateRoute>} />
            <Route path="/permissoes" element={<PrivateRoute permissions={['permissoes.gerenciar']}><AdminPermissoes /></PrivateRoute>} />
            <Route path="/auditoria" element={<PrivateRoute permissions={['auditoria.ver']}><Auditoria /></PrivateRoute>} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
      }} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <PrivateRoute>
              <AppContent />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
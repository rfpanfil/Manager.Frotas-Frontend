import { createContext, useState, useEffect, useContext } from 'react';
import * as Sentry from '@sentry/react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissoes, setPermissoes] = useState([]);
  const [loading, setLoading] = useState(true);

  function can(slug) {
    if (!user) return false;
    if (user.cargo === 'superadmin' || user.cargo === 'admin') return true; // SuperAdmin e Admin podem tudo
    return permissoes.includes(slug);
  }

  useEffect(() => {
    const token = localStorage.getItem('loop_token');
    const userStorage = localStorage.getItem('loop_user');
    const permStorage = localStorage.getItem('loop_perms');

    if (token && userStorage) {
      try {
        const parsedUser = JSON.parse(userStorage);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(parsedUser);
        Sentry.setUser({ id: parsedUser.id, empresa_id: parsedUser.empresa_id, cargo: parsedUser.cargo });

        if (permStorage) {
          setPermissoes(JSON.parse(permStorage));
        }

        if (parsedUser.cargo) {
          carregarPermissoesDoBackend();
        }

      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  async function carregarPermissoesDoBackend() {
    try {
      const res = await api.get('/usuarios/me/permissoes');
      setPermissoes(res.data);
      localStorage.setItem('loop_perms', JSON.stringify(res.data));
    } catch (e) {
      console.log("Erro ao carregar permissões do backend.");
    }
  }

  async function login(loginData, password) {
    const response = await api.post('/usuarios/login', {
      login: loginData,
      senha: password
    });

    const { access_token, user: userData, modulos_ativos } = response.data;

    // INJEÇÃO DOS MÓDULOS NO OBJETO USER
    const usuarioLogado = { ...userData, modulos_ativos: modulos_ativos || ['financeiro', 'estoque', 'compras', 'frota'] };

    localStorage.setItem('loop_token', access_token);
    localStorage.setItem('loop_user', JSON.stringify(usuarioLogado));
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    setUser(usuarioLogado);
    Sentry.setUser({ id: usuarioLogado.id, empresa_id: usuarioLogado.empresa_id, cargo: usuarioLogado.cargo });
    await carregarPermissoesDoBackend();
  }

  // --- NOVA FUNÇÃO: TROCA DE PELE DO SUPER ADMIN ---
  async function trocarEmpresa(empresaId) {
    try {
      // LIMPEZA IMEDIATA DO CACHE DE ABAS PARA EVITAR VAZAMENTO UX
      Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('abaAtiva_')) sessionStorage.removeItem(key);
      });

      const response = await api.post('/empresas/trocar', { empresa_id: parseInt(empresaId) });
      const { access_token, user: userData, modulos_ativos } = response.data;

      // INJEÇÃO DOS MÓDULOS NA TROCA DE EMPRESA
      const usuarioLogado = { ...userData, modulos_ativos: modulos_ativos || ['financeiro', 'estoque', 'compras', 'frota'] };

      // Sobrescreve o token antigo pelo novo "Camuflado"
      localStorage.setItem('loop_token', access_token);
      localStorage.setItem('loop_user', JSON.stringify(usuarioLogado));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      setUser(usuarioLogado);
      Sentry.setUser({ id: usuarioLogado.id, empresa_id: usuarioLogado.empresa_id, cargo: usuarioLogado.cargo });
      await carregarPermissoesDoBackend();

      // Dá um refresh na página para limpar os estados velhos da memória do React
      window.location.href = '/';
    } catch (error) {
      console.error("Erro ao trocar de empresa:", error);
      toast.error("Erro ao tentar trocar de empresa.");
    }
  }

  function logout() {
    localStorage.removeItem('loop_token');
    localStorage.removeItem('loop_user');
    localStorage.removeItem('loop_perms');
    api.defaults.headers.common['Authorization'] = undefined;
    setUser(null);
    setPermissoes([]);
    Sentry.setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      signed: !!user,
      user,
      loading,
      login,
      signIn: login,
      logout,
      signOut: logout,
      can,
      trocarEmpresa // <--- Exporta a nova função
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
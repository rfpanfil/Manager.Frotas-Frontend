
import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }

  return ''; 
};

// Nova linha exportando a variável:
export const baseURL = getBaseURL();

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use(async (config) => {
  // CORREÇÃO: O nome da chave agora bate com o AuthContext (loop_token)
  const token = localStorage.getItem('loop_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  // Respostas bem-sucedidas passam direto
  (response) => response,

  // Tratamento centralizado de erros HTTP
  (error) => {
    if (error.response?.status === 401) {
      // Resposta atrasada de um token que já foi trocado (ex.: superadmin trocou de empresa e o token antigo foi
      // revogado no servidor): não derruba a sessão nova que está no navegador.
      const enviado = String(error.config?.headers?.Authorization || '').replace(/^Bearer /, '');
      const atual = localStorage.getItem('loop_token');
      if (enviado && atual && enviado !== atual) {
        return Promise.reject(error);
      }
      // Token expirado ou inválido — força logout imediato
      localStorage.removeItem('loop_token');
      localStorage.removeItem('loop_user');
      localStorage.removeItem('loop_perms');
      window.location.href = '/login';
    }
    // Para todos os outros erros (403, 404, 500, rede...), repassa para
    // o .catch() do componente que fez a chamada tratar individualmente.
    return Promise.reject(error);
  }
);

// Mensagem do servidor (detail) quando for texto; senão, a mensagem padrão da tela.
export function mensagemDeErro(error, padrao) {
  const detalhe = error?.response?.data?.detail;
  return typeof detalhe === 'string' ? detalhe : padrao;
}

// Arquivos enviados (CNH, anexos) exigem login: baixa com o token e abre numa aba nova.
// A aba é aberta antes do download para o navegador não bloqueá-la como pop-up.
export async function abrirArquivo(caminho) {
  if (!caminho) return toast.error('Nenhum arquivo anexado.');
  const aba = window.open('', '_blank');
  try {
    const url = '/files/' + caminho.split('/').map(encodeURIComponent).join('/');
    const { data } = await api.get(url, { responseType: 'blob' });
    const local = URL.createObjectURL(data);
    if (aba) aba.location.href = local; else window.open(local, '_blank');
    setTimeout(() => URL.revokeObjectURL(local), 60_000);
  } catch {
    aba?.close();
    toast.error('Não foi possível abrir o arquivo.');
  }
}

export default api;

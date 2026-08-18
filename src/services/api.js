//Arquivo: frontend/src/services/api.js

import axios from 'axios';

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

export default api;
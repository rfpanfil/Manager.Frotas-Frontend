import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Truck, Key } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signed, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError('Credenciais inválidas. Verifique login e senha.');
    }
  }

  function fillDemo() {
    setIdentifier('admin@demo.com');
    setPassword('Demo@2026');
  }

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1e29', color: 'white' }}>Carregando...</div>;
  }

  if (signed) {
    return <Navigate to="/" />;
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#1a1e29', color: 'white'
    }}>
      <div style={{
        backgroundColor: '#242936', padding: '40px', borderRadius: '12px',
        boxShadow: '0 10px 15px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <Truck size={48} color="#00d68f" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Manager.Frotas</h2>
          <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Plataforma SaaS de Gestão</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 99, 132, 0.2)', color: '#ff6384', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid #ff6384' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#00d68f', fontWeight: 'bold' }}>Login ou E-mail</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Digite seu login"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #2d3748',
                backgroundColor: '#1a1e29', color: 'white', boxSizing: 'border-box'
              }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#00d68f', fontWeight: 'bold' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #2d3748',
                backgroundColor: '#1a1e29', color: 'white', boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px', backgroundColor: '#00d68f', color: '#1a1e29',
              border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem',
              cursor: 'pointer', transition: 'background-color 0.2s', marginTop: '10px'
            }}
          >
            Entrar
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #2d3748', paddingTop: '20px' }}>
          <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '10px' }}>Ambiente de Demonstração (Portfólio)</p>
          <button
            onClick={fillDemo}
            type="button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '10px', backgroundColor: '#2d3748', color: 'white',
              border: '1px solid #4a5568', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            <Key size={16} /> Preencher Credenciais de Teste
          </button>
        </div>
      </div>
    </div>
  );
}


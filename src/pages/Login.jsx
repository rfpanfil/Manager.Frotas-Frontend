// Arquivo: frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Truck } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signed, loading } = useAuth(); // Puxando signed e loading
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(identifier, password);
      navigate('/'); // Vai para o Dashboard
    } catch (err) {
      setError('Credenciais inválidas. Verifique login e senha.');
    }
  }

  // --- TRAVA DE REDIRECIONAMENTO ---
  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1e29', color: 'white' }}>Carregando...</div>;
  }

  if (signed) {
    return <Navigate to="/" />;
  }
  // ---------------------------------

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
          <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Acesso ao Sistema</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#00d68f' }}>Login ou E-mail</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#1a1e29', color: 'white' }}
              placeholder="Digite seu login"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#00d68f' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#1a1e29', color: 'white' }}
              placeholder="Digite sua senha"
            />
          </div>

          {error && <p style={{ color: '#e53e3e', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            style={{
              marginTop: '10px', padding: '12px', backgroundColor: '#00d68f', color: '#000',
              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem'
            }}
          >
            Entrar
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.85rem', color: '#718096', borderTop: '1px solid #333', paddingTop: '20px' }}>
          <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#a0aec0' }}>Acesso de Demonstração:</p>
          <p style={{ margin: '4px 0' }}>Admin: <span style={{ color: '#00d68f' }}>admin@demo.com</span></p>
          <p style={{ margin: '4px 0' }}>Operador: <span style={{ color: '#00d68f' }}>operador@demo.com</span></p>
          <p style={{ margin: '4px 0', marginTop: '10px' }}>Senha universal: <span style={{ color: '#00d68f' }}>Demo@2026</span></p>
        </div>
      </div>
    </div>
  );
}
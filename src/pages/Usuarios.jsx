// Arquivo: frontend/src/pages/Usuarios.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, PlusCircle, Trash2, Edit, Shield, ShieldAlert, User, ChevronDown, ChevronRight, Briefcase, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Usuarios() {
  const { user: currentUser, can } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [bases, setBases] = useState([]); // Para o select de Base do motorista
  const [loading, setLoading] = useState(true);
  const [gruposAbertos, setGruposAbertos] = useState({ 'superadmin': true, 'admin': true });

  const [formData, setFormData] = useState({
    id: null,
    nome: '', celular: '', email: '', login: '', senha: '',
    cargo: '',
    // Campos Extras para Motorista
    cpf: '', tipo_cnh: 'B', vencimento_cnh: '', base: ''
  });

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      const [resUsers, resCargos, resBases] = await Promise.all([
        api.get('/usuarios/'),
        api.get('/usuarios/cargos/lista'),
        api.get('/bases/')
      ]);
      setUsuarios(resUsers.data);
      setCargos(resCargos.data);
      setBases(resBases.data);

      if (!formData.cargo && resCargos.data.length > 0) {
        setFormData(prev => ({ ...prev, cargo: 'operador' }));
      }
    } catch (error) { console.error("Erro:", error); }
    finally { setLoading(false); }
  }

  // Agrupamento
  const usuariosAgrupados = usuarios.reduce((acc, user) => {
    const cargo = user.cargo || 'sem cargo';
    if (!acc[cargo]) acc[cargo] = [];
    acc[cargo].push(user);
    return acc;
  }, {});

  function toggleGrupo(cargo) {
    setGruposAbertos(prev => ({ ...prev, [cargo]: !prev[cargo] }));
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleCargoChange(e) {
    setFormData({ ...formData, cargo: e.target.value });
  }


  async function handleEdit(usuario) {
    const tid = toast.loading("Carregando dados completos...");
    try {
      const res = await api.get(`/usuarios/${usuario.id}`);
      const userCompleto = res.data;
      const dadosColaborador = userCompleto.colaborador || {};

      setFormData({
        id: userCompleto.id,
        nome: userCompleto.nome,
        celular: userCompleto.celular,
        email: userCompleto.email || '',
        login: userCompleto.login,
        senha: '',
        cargo: userCompleto.cargo,

        cpf: dadosColaborador.cpf || '',
        tipo_cnh: dadosColaborador.tipo_cnh || '',
        vencimento_cnh: dadosColaborador.vencimento_cnh || '',
        base: dadosColaborador.base || ''
      });
      toast.dismiss(tid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Erro no handleEdit:", error);
      toast.dismiss(tid);
      toast.error("Erro ao carregar dados do usu�rio.");
    }
  }

  function handleCancel() {
    setFormData({
      id: null, nome: '', celular: '', email: '', login: '', senha: '',
      cargo: cargos.length > 0 ? 'operador' : '',
      cpf: '', tipo_cnh: '', vencimento_cnh: '', base: ''
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = { ...formData };

      // Limpeza de campos padrão
      if (!payload.senha) delete payload.senha;
      if (!payload.email) payload.email = null;

      // --- CORREÇÃO: Limpar campos de motorista para evitar erro 422 ---
      // O backend não aceita string vazia "" para datas, precisa ser null
      if (!payload.vencimento_cnh) payload.vencimento_cnh = null;
      if (!payload.cpf) payload.cpf = null;
      if (!payload.base) payload.base = null;
      // ---------------------------------------------------------------

      const isOperacional = !['superadmin', 'admin', 'cliente', ''].includes(formData.cargo);

      // Validação Específica para Colaboradores Operacionais
      if (!formData.id && isOperacional) {
        if (!payload.cpf) return toast.error("CPF é obrigatório para perfis operacionais.");
        // CNH não é mais obrigatória para todos!
      }

      if (formData.id) {
        await api.put(`/usuarios/${formData.id}`, payload);
        toast.success("Usuário atualizado!");
      } else {
        if (!formData.senha) return toast("Senha obrigatória.");
        await api.post('/usuarios/', payload);

        if (isOperacional) {
          toast.success("Usuário e Ficha Operacional criados com sucesso!");
        } else {
          toast.success("Usuário criado com sucesso!");
        }
      }
      handleCancel();
      carregarDados();
    } catch (error) {
      let msg = error.response?.data?.detail || error.message;
      if (Array.isArray(msg)) msg = msg.map(d => d.msg).join('\n');
      toast.error("Erro: " + msg);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Excluir usuário?")) return;
    try { await api.delete(`/usuarios/${id}`); carregarDados(); }
    catch (error) { toast.error("Erro ao excluir."); }
  }

  function getCargoIcon(cargo) {
    const cargoNome = (cargo || '').toLowerCase();
    if (cargoNome === 'superadmin') return <ShieldAlert size={16} color="#9f7aea" />;
    if (cargoNome === 'admin') return <ShieldAlert size={16} color="#e53e3e" />;
    return <User size={16} color="#00d68f" />;
  }

  const isAdmin = can('usuarios.gerenciar');

  // --- A SUA LÓGICA DE VOLTA ---
  // Define os cargos que SÃO de escritório. Qualquer coisa diferente disso, abre os campos de CPF.
  const cargosDeEscritorio = ['superadmin', 'admin', 'cliente', ''];
  const isOperacional = !cargosDeEscritorio.includes((formData.cargo || '').toLowerCase());

  if (loading) return <div style={{ padding: 20, color: 'white' }}>Carregando...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}><h1><Users style={{ marginRight: '10px' }} /> Gestão de Usuários</h1></div>

      <div className="form-card" style={{ borderLeft: formData.id ? '4px solid #3182ce' : '4px solid #00d68f' }}>
        <h3 style={{ marginTop: 0, color: formData.id ? '#3182ce' : '#00d68f' }}>
          {formData.id ? `Editando: ${formData.nome}` : 'Novo Usuário'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {/* DADOS DE LOGIN */}
          <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}><label>Nome Completo</label><input name="nome" value={formData.nome} onChange={handleChange} required /></div>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}><label>Login</label><input name="login" value={formData.login} onChange={handleChange} required disabled={!!formData.id && !isAdmin} /></div>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}><label>Senha</label><input type="password" name="senha" value={formData.senha} onChange={handleChange} placeholder={formData.id ? "********" : "Obrigatória"} /></div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}><label>Celular</label><input name="celular" value={formData.celular} onChange={handleChange} placeholder="(00) 00000-0000" required /></div>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}><label>E-mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Cargo</label>
              <select name="cargo" value={formData.cargo} onChange={handleCargoChange} disabled={!isAdmin}>
                <option value="">Selecione...</option>
                {cargos.map(c => <option key={c.id} value={c.nome}>{c.nome.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* --- SEÇÃO ESPECIAL PARA COLABORADOR OPERACIONAL --- */}
          {isOperacional && (
            <div style={{ width: '100%', background: 'rgba(0, 214, 143, 0.05)', padding: '15px', borderRadius: '5px', border: '1px dashed #00d68f', marginTop: '10px' }}>
              <div style={{ color: '#00d68f', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Briefcase size={18} /> DADOS OPERACIONAIS (Ficha de Colaborador Gerada Automaticamente)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}><label>CPF <span style={{ color: 'red' }}>*</span></label><input name="cpf" value={formData.cpf} onChange={handleChange} required placeholder="000.000.000-00" /></div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Categoria CNH (Opcional)</label>
                  <select name="tipo_cnh" value={formData.tipo_cnh} onChange={handleChange}>
                    <option value="">Nenhuma / N/A</option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>AB</option><option>AD</option><option>AE</option>
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}><label>Validade CNH</label><input type="date" name="vencimento_cnh" value={formData.vencimento_cnh} onChange={handleChange} /></div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Base</label>
                  <select name="base" value={formData.base} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {bases.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn-add" style={{ backgroundColor: formData.id ? '#3182ce' : '#00d68f' }}>
              {formData.id ? <><Edit size={16} /> Salvar</> : <><PlusCircle size={16} /> Cadastrar</>}
            </button>
            {formData.id && <button type="button" onClick={handleCancel} className="btn-add" style={{ backgroundColor: '#e53e3e', color: 'white' }}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div style={{ marginTop: '30px' }}>
        {Object.keys(usuariosAgrupados).map(cargo => (
          <div key={cargo} style={{ marginBottom: '10px', background: '#2d3748', borderRadius: '8px', overflow: 'hidden' }}>
            <div onClick={() => toggleGrupo(cargo)} style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#1a202c', borderBottom: '1px solid #4a5568' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#fff' }}>
                {getCargoIcon(cargo)} {cargo} <span style={{ fontSize: '0.8rem', background: '#4a5568', padding: '2px 8px', borderRadius: '10px', color: '#a0aec0' }}>{usuariosAgrupados[cargo].length}</span>
              </div>
              {gruposAbertos[cargo] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {gruposAbertos[cargo] && (
              <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
                <table style={{ margin: 0 }}>
                  <thead><tr><th>ID</th><th>Nome</th><th>Login</th><th>Contato</th><th style={{ textAlign: 'right' }}>Opções</th></tr></thead>
                  <tbody>
                    {usuariosAgrupados[cargo].map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td>{u.nome} {u.id === currentUser?.id && <span style={{ color: '#00d68f' }}>(Você)</span>}</td>
                        <td>{u.login}</td>
                        <td>{u.celular}</td>
                        <td style={{ textAlign: 'right' }}>
                          {(can('usuarios.gerenciar') || u.id === currentUser?.id) && (
                            <>
                              <button onClick={() => handleEdit(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3182ce', marginRight: 10 }}><Edit size={18} /></button>
                              {isAdmin && u.id !== currentUser?.id && <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}><Trash2 size={18} /></button>}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

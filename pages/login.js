import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin');
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError('Correo o contraseña incorrectos.');
      return;
    }
    router.push('/admin');
  }

  return (
    <div className="app" style={{ maxWidth: 420 }}>
      <Header subtitle="Acceso administrador" />
      <div style={{ maxWidth: 360, margin: '20px auto 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 18, textAlign: 'center' }}>
          Solo Ale y Ximena pueden entrar al panel de administración.
        </p>
        {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Correo</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-navy btn-block" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}

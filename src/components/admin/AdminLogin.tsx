import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured, isCurrentUserAdmin } from '../../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured) {
        // Fallback info for demo / dev when Supabase keys not populated
        if (email.includes('@') && password.length >= 6) {
          localStorage.setItem('admin_demo_session', 'true');
          onLoginSuccess();
          return;
        } else {
          throw new Error('Preencha um e-mail válido e senha com pelo menos 6 caracteres.');
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        if (!(await isCurrentUserAdmin())) {
          await supabase.auth.signOut();
          setErrorMessage('Esta conta não tem permissão de administrador.');
          return;
        }
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err?.message || err);
      setErrorMessage(
        err?.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : 'Falha ao autenticar. Verifique suas credenciais.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '400px',
        margin: 'auto',
      }}
    >
      <div className="admin-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(230, 0, 57, 0.15)',
              border: '1px solid rgba(230, 0, 57, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Lock size={24} color="#ff3366" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
            Área Administrativa
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginTop: '0.25rem' }}>
            Acesso restrito
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '0.8rem 1rem',
              color: '#fca5a5',
              fontSize: '0.88rem',
              marginBottom: '1.25rem',
            }}
            role="alert"
          >
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label
              htmlFor="admin-email"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#d1d5db',
                marginBottom: '0.4rem',
                letterSpacing: '0.02em',
              }}
            >
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-email"
                type="email"
                required
                className="admin-input"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Mail
                size={18}
                color="#6b7280"
                style={{ position: 'absolute', right: '14px', top: '15px' }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#d1d5db',
                marginBottom: '0.4rem',
                letterSpacing: '0.02em',
              }}
            >
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type="password"
                required
                className="admin-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Lock
                size={18}
                color="#6b7280"
                style={{ position: 'absolute', right: '14px', top: '15px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn-primary"
            disabled={isLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {isLoading ? (
              <div className="spinner" style={{ width: '18px', height: '18px' }} />
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

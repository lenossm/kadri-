import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../state/AuthContext';
import { supabaseConfigured } from '../lib/supabase';

export default function LoginPage() {
  const { session, memberships, clientAccess, isClientOnly, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (!loading && session) {
    const active = memberships.find((m) => m.status === 'active');
    if (active?.workspaces?.slug) return <Navigate to={`/app/${active.workspaces.slug}/dashboard`} replace />;
    if (isClientOnly || clientAccess.length) return <Navigate to="/client" replace />;
    if (memberships.some((m) => m.status === 'suspended')) return <Navigate to="/suspended" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setPending(true);
    try {
      await signIn({ email: form.email, password: form.password });
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout eyebrow="PRODUCTION OS" title="Sign in">
      {!supabaseConfigured && <p className="field-error">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect a real workspace. The demo still runs without it.</p>}
      <form className="modal-form" onSubmit={onSubmit}>
        <label>Email<input required type="email" name="email" autoComplete="email" /></label>
        <label>Password<input required type="password" name="password" autoComplete="current-password" /></label>
        {error && <small className="field-error">{error}</small>}
        <button className="primary-button" type="submit" disabled={pending || !supabaseConfigured}>{pending ? 'Signing in…' : 'Enter workspace'}</button>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password">Forgot password</Link>
        <Link to="/signup">Create a production workspace</Link>
        <Link to="/demo/dashboard">Enter demo</Link>
      </div>
    </AuthLayout>
  );
}

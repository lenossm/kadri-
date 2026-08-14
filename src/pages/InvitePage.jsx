import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../state/AuthContext';
import { supabase } from '../lib/supabase';

export default function InvitePage() {
  const { token: tokenParam } = useParams();
  const [params] = useSearchParams();
  const token = tokenParam || params.get('token') || '';
  const kind = params.get('kind') || 'team';
  const { session, signIn, signUp, refreshMemberships } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <AuthLayout eyebrow="INVITE" title="Paste your invitation">
        <form className="modal-form" onSubmit={(e) => { e.preventDefault(); navigate(`/invite/${new FormData(e.currentTarget).get('token')}`); }}>
          <label>Invitation token<input required name="token" /></label>
          <button className="primary-button" type="submit">Continue</button>
        </form>
      </AuthLayout>
    );
  }

  const accept = async () => {
    const rpc = kind === 'client' ? 'accept_client_invitation' : 'accept_invitation';
    const { data, error: rpcError } = await supabase.rpc(rpc, { p_token: token });
    if (rpcError) throw rpcError;
    await refreshMemberships();
    if (kind === 'client') {
      navigate('/client');
      return data;
    }
    const { data: mems } = await supabase.from('workspace_members').select('workspaces(slug)').eq('user_id', (await supabase.auth.getUser()).data.user?.id).eq('status', 'active');
    const slug = mems?.[0]?.workspaces?.slug;
    navigate(slug ? `/app/${slug}/dashboard` : '/onboarding');
    return data;
  };

  const onAuth = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setError('');
    try {
      if (mode === 'signup') await signUp({ email: form.email, password: form.password, fullName: form.fullName });
      else await signIn({ email: form.email, password: form.password });
      await accept();
    } catch (err) {
      setError(err.message);
    }
  };

  if (session) {
    return (
      <AuthLayout eyebrow="INVITE" title="Join this production">
        <form className="modal-form" onSubmit={async (e) => { e.preventDefault(); try { await accept(); } catch (err) { setError(err.message); } }}>
          {error && <small className="field-error">{error}</small>}
          <button className="primary-button" type="submit">Accept invitation</button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="INVITE" title={mode === 'signup' ? 'Create account to join' : 'Sign in to join'}>
      <form className="modal-form" onSubmit={onAuth}>
        {mode === 'signup' && <label>Full name<input required name="fullName" /></label>}
        <label>Email<input required type="email" name="email" /></label>
        <label>Password<input required type="password" name="password" /></label>
        {error && <small className="field-error">{error}</small>}
        <button className="primary-button" type="submit">{mode === 'signup' ? 'Create and join' : 'Sign in and join'}</button>
      </form>
      <div className="auth-links">
        <button type="button" className="quiet-button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? 'I already have an account' : 'I need to create an account'}
        </button>
        <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}

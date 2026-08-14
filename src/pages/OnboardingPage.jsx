import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../state/AuthContext';
import { supabase } from '../lib/supabase';

export default function OnboardingPage() {
  const { session, memberships, loading, refreshMemberships } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (!loading && !session) return <Navigate to="/login" replace />;
  const active = memberships.find((m) => m.status === 'active');
  if (active?.workspaces?.slug) return <Navigate to={`/app/${active.workspaces.slug}/dashboard`} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setPending(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('create_workspace', {
        p_name: form.name,
        p_country: form.country,
        p_timezone: form.timezone,
        p_currency: form.currency,
      });
      if (rpcError) throw rpcError;
      await refreshMemberships();
      const slug = data?.slug || data?.[0]?.slug;
      navigate(slug ? `/app/${slug}/dashboard` : '/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout eyebrow="WORKSPACE" title="Name the production">
      <p>You become Owner. Invite the rest of the company from Team after this.</p>
      <form className="modal-form" onSubmit={onSubmit}>
        <label>Production company name<input required name="name" placeholder="HOORAY! Production" /></label>
        <label>Country<input name="country" defaultValue="GE" /></label>
        <label>Timezone<input name="timezone" defaultValue="Asia/Tbilisi" /></label>
        <label>Default currency<select name="currency" defaultValue="GEL"><option>GEL</option><option>EUR</option><option>USD</option></select></label>
        {error && <small className="field-error">{error}</small>}
        <button className="primary-button" type="submit" disabled={pending}>{pending ? 'Creating…' : 'Open KADRI'}</button>
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../state/AuthContext';
import { supabaseConfigured } from '../lib/supabase';

export default function SignupPage() {
  const { signUp } = useAuth();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (String(form.password).length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not create account.');
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout eyebrow="NEW PRODUCTION" title="Create account">
      {!supabaseConfigured && <p className="field-error">Supabase is not configured on this deploy. You can still use the demo workspace.</p>}
      {done ? (
        <p>Check your email to verify the account, then sign in to create the production workspace.</p>
      ) : (
        <form className="modal-form" onSubmit={onSubmit}>
          <label>Full name<input required name="fullName" autoComplete="name" /></label>
          <label>Email<input required type="email" name="email" autoComplete="email" /></label>
          <label>Password<input required type="password" name="password" autoComplete="new-password" /></label>
          <label>Confirm password<input required type="password" name="confirm" autoComplete="new-password" /></label>
          {error && <small className="field-error">{error}</small>}
          <button className="primary-button" type="submit" disabled={pending || !supabaseConfigured}>{pending ? 'Creating…' : 'Create account'}</button>
        </form>
      )}
      <div className="auth-links">
        <Link to="/login">Already have an account</Link>
        <Link to="/invite">I was invited to a team</Link>
      </div>
    </AuthLayout>
  );
}

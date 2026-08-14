import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../state/AuthContext';

export default function ResetPasswordPage() {
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await updatePassword(form.password);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout eyebrow="ACCOUNT" title="Choose a new password">
      {!session && <p>Open this page from the email link so KADRI can restore the session.</p>}
      <form className="modal-form" onSubmit={onSubmit}>
        <label>New password<input required type="password" name="password" /></label>
        <label>Confirm<input required type="password" name="confirm" /></label>
        {error && <small className="field-error">{error}</small>}
        <button className="primary-button" type="submit">Update password</button>
      </form>
      <div className="auth-links"><Link to="/login">Sign in</Link></div>
    </AuthLayout>
  );
}

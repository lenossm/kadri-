import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../state/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    try {
      await resetPassword(email);
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout eyebrow="ACCOUNT" title="Reset password">
      {done ? <p>If that email exists, a reset link is on its way.</p> : (
        <form className="modal-form" onSubmit={onSubmit}>
          <label>Email<input required type="email" name="email" /></label>
          {error && <small className="field-error">{error}</small>}
          <button className="primary-button" type="submit">Send reset link</button>
        </form>
      )}
      <div className="auth-links"><Link to="/login">Back to sign in</Link></div>
    </AuthLayout>
  );
}

import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function SuspendedPage() {
  return (
    <AuthLayout eyebrow="ACCESS" title="Membership suspended">
      <p>Your workspace membership has been suspended. History is kept. Ask an owner to reactivate the account.</p>
      <div className="auth-links">
        <Link to="/login">Sign in with another account</Link>
        <Link to="/">Back to KADRI</Link>
      </div>
    </AuthLayout>
  );
}

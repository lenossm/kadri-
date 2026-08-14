import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { supabaseConfigured } from '../lib/supabase';

export default function RequireAuth({ children }) {
  const { session, loading, isClientOnly } = useAuth();
  const location = useLocation();
  if (!supabaseConfigured) {
    return (
      <div className="page">
        <span className="eyebrow">SETUP</span>
        <h1>Connect Supabase to open a live workspace.</h1>
        <p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, run the SQL in supabase/migrations, then sign in. The isolated demo remains at /demo.</p>
      </div>
    );
  }
  if (loading) return <div className="page"><h1>Restoring session…</h1></div>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (isClientOnly && location.pathname.startsWith('/app')) return <Navigate to="/client" replace />;
  return children;
}

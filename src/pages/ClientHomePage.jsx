import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function ClientPortalShell() {
  const { session, loading, isClientOnly, clientAccess, signOut, profile } = useAuth();
  if (loading) return <div className="portal"><main><h1>Opening portal…</h1></main></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!isClientOnly && !clientAccess.length) return <Navigate to="/onboarding" replace />;

  return (
    <div className="portal">
      <nav className="portal-nav">
        <strong>KADRI</strong>
        <span>CLIENT PORTAL</span>
        <span>
          <Link to="/client">Projects</Link>
          {' · '}
          <Link to="/client">Reviews</Link>
          {' · '}
          <button type="button" className="quiet-button" onClick={signOut}>Sign out</button>
        </span>
      </nav>
      <Outlet context={{ clientAccess, profile }} />
    </div>
  );
}

export function ClientHome() {
  const { clientAccess } = useAuth();
  return (
    <main>
      <header className="portal-hero">
        <div>
          <span className="eyebrow">YOUR PRODUCTIONS</span>
          <h1>Projects</h1>
        </div>
        <p>Only work explicitly shared with you. This is not the internal studio workspace.</p>
      </header>
      <section className="portal-block">
        {(clientAccess || []).map((a) => (
          <Link className="attention-row" key={a.id} to={`/client/projects/${a.project_id}`}>
            <span><b>{a.projects?.title || 'Project'}</b><small>{a.projects?.workspaces?.name}</small></span>
          </Link>
        ))}
        {!clientAccess?.length && <p>No projects have been shared with this account.</p>}
      </section>
    </main>
  );
}

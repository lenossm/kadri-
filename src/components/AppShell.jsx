import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Aperture, BadgeDollarSign, Bell, Boxes, Clapperboard, Command, FileInput, Files, GalleryVerticalEnd, Lightbulb, LogOut, Menu, Search, Settings, UserRound, UsersRound, X } from 'lucide-react';
import CommandPalette from './CommandPalette';
import { useWorkspace } from '../state/WorkspaceContext';
import { CAP, ROLE_LABELS, can, initials } from '../permissions/engine';
import { useAuth } from '../state/AuthContext';

const ICON = {
  dashboard: Aperture,
  pipeline: Boxes,
  projects: Clapperboard,
  reviews: GalleryVerticalEnd,
  inquiries: FileInput,
  ideas: Lightbulb,
  clients: UsersRound,
  payments: BadgeDollarSign,
  publishing: Files,
  team: UsersRound,
  settings: Settings,
};

const GROUPS = [
  ['WORK', ['dashboard', 'pipeline', 'projects', 'reviews']],
  ['INPUT', ['inquiries', 'ideas']],
  ['BUSINESS', ['clients', 'payments']],
  ['OUTPUT', ['publishing']],
  ['COMPANY', ['team', 'settings']],
];

const LABELS = {
  dashboard: 'Dashboard',
  pipeline: 'Pipeline',
  projects: 'Projects',
  reviews: 'Reviews',
  inquiries: 'Inquiries',
  ideas: 'Idea Pool',
  clients: 'Clients',
  payments: 'Payments',
  publishing: 'Publishing',
  team: 'Team',
  settings: 'Settings',
};

export default function AppShell() {
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [account, setAccount] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const ws = useWorkspace();
  const auth = useAuth();
  const { perm, actor, href, isDemo, workspace, memberships, notifications = [] } = ws;

  const visibleKeys = useMemo(() => {
    const keys = [];
    GROUPS.forEach(([, items]) => items.forEach((key) => {
      if (key === 'dashboard' && can(perm, CAP.DASHBOARD)) keys.push(key);
      if (key === 'pipeline' && can(perm, CAP.PROJECT_VIEW)) keys.push(key);
      if (key === 'projects' && can(perm, CAP.PROJECT_VIEW)) keys.push(key);
      if (key === 'reviews' && can(perm, CAP.REVIEW_VIEW)) keys.push(key);
      if (key === 'inquiries' && can(perm, CAP.INQUIRY_VIEW)) keys.push(key);
      if (key === 'ideas' && can(perm, CAP.IDEA_VIEW)) keys.push(key);
      if (key === 'clients' && can(perm, CAP.CLIENT_VIEW)) keys.push(key);
      if (key === 'payments' && (can(perm, CAP.PAYMENT_VIEW) || can(perm, CAP.FINANCE_VIEW))) keys.push(key);
      if (key === 'publishing' && can(perm, CAP.DELIVERY_VIEW)) keys.push(key);
      if (key === 'team' && (can(perm, CAP.TEAM_VIEW) || can(perm, CAP.TEAM_MANAGE))) keys.push(key);
      if (key === 'settings' && (can(perm, CAP.SETTINGS) || isDemo)) keys.push(key);
    }));
    return new Set(keys);
  }, [perm, isDemo]);

  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const signOut = async () => {
    if (auth?.signOut) await auth.signOut();
    navigate('/');
  };

  return (
    <div className="workspace">
      <aside className={`sidebar ${menu ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand" onClick={() => navigate('/')} onKeyDown={(e) => e.key === 'Enter' && navigate('/')} role="button" tabIndex={0}>
          <span className="brand-mark">K</span>
          <div><strong>KADRI</strong><small>{workspace?.name || 'creative production os'}</small></div>
        </div>
        <button className="mobile-close" type="button" onClick={() => setMenu(false)} aria-label="Close navigation"><X size={18} /></button>
        <nav>
          {GROUPS.map(([label, items]) => {
            const shown = items.filter((key) => visibleKeys.has(key));
            if (!shown.length) return null;
            return (
              <div className="nav-group" key={label}>
                <span className="nav-group__label">{label}</span>
                {shown.map((key) => {
                  const Icon = ICON[key];
                  return (
                    <NavLink key={key} to={href(`/${key === 'ideas' ? 'ideas' : key}`)} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                      <Icon size={16} strokeWidth={1.6} /><span>{LABELS[key]}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar__foot">
          <button className="command-shortcut" type="button" onClick={() => setPalette(true)}>
            <Search size={15} /><span>Quick search</span><kbd>⌘K</kbd>
          </button>
        </div>
      </aside>
      {menu && <button className="sidebar-scrim" type="button" onClick={() => setMenu(false)} aria-label="Close navigation" />}
      <main className="workspace-main">
        <header className="workspace-topbar">
          <button className="mobile-menu" type="button" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={18} /></button>
          <span className="topbar-route">{location.pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ') || 'workspace'}</span>
          {isDemo && <span className="demo-chip">Demo workspace</span>}
          <div className="topbar-actions">
            <button className="quiet-button" type="button" onClick={() => setPalette(true)}><Command size={15} /> Command</button>
            <NavLink to={href('/notifications')} className="icon-button" aria-label="Notifications"><Bell size={16} /></NavLink>
            <div className="account-wrap">
              <button type="button" className="avatar" onClick={() => setAccount((v) => !v)} aria-label="Account menu">{initials(actor?.name)}</button>
              {account && (
                <div className="account-menu">
                  <div className="account-menu__head">
                    <strong>{actor?.name}</strong>
                    <small>{ROLE_LABELS[perm?.role] || perm?.role} · {workspace?.name}</small>
                  </div>
                  <NavLink to={href('/profile')} onClick={() => setAccount(false)}><UserRound size={14} /> My profile</NavLink>
                  <NavLink to={href('/notifications')} onClick={() => setAccount(false)}><Bell size={14} /> Notifications {notifications.filter((n) => !n.read_at).length ? `(${notifications.filter((n) => !n.read_at).length})` : ''}</NavLink>
                  <a href="/" onClick={() => setAccount(false)}>Help</a>
                  {(memberships || []).filter((m) => m.status === 'active' && m.workspaces?.slug).length > 1 && (
                    <div className="account-switch">
                      <span>Switch workspace</span>
                      {memberships.filter((m) => m.status === 'active').map((m) => (
                        <button type="button" key={m.id || m.workspaces.slug} onClick={() => { setAccount(false); navigate(`/app/${m.workspaces.slug}/dashboard`); }}>{m.workspaces.name}</button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={signOut}><LogOut size={14} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <Outlet />
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

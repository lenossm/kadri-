import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Aperture, BadgeDollarSign, Boxes, Clapperboard, Command, ContactRound, FileInput, Files, GalleryVerticalEnd, Lightbulb, Menu, Search, Settings, UsersRound, X } from 'lucide-react';
import CommandPalette from './CommandPalette';
import { useWorkspace } from '../state/WorkspaceContext';

const groups = [
  ['WORK', [
    ['/app/dashboard', 'Dashboard', Aperture],
    ['/app/pipeline', 'Pipeline', Boxes],
    ['/app/projects', 'Projects', Clapperboard],
    ['/app/reviews', 'Reviews', GalleryVerticalEnd],
  ]],
  ['INPUT', [
    ['/app/inquiries', 'Inquiries', FileInput],
    ['/app/ideas', 'Idea Pool', Lightbulb],
  ]],
  ['BUSINESS', [
    ['/app/clients', 'Clients', UsersRound],
    ['/app/payments', 'Payments', BadgeDollarSign],
  ]],
  ['OUTPUT', [
    ['/app/publishing', 'Publishing', Files],
  ]],
];

const allowedByRole = {
  producer: null,
  editor: ['/app/dashboard', '/app/pipeline', '/app/projects', '/app/reviews', '/app/ideas', '/app/publishing', '/app/settings'],
  client: ['/app/dashboard', '/app/projects', '/app/reviews', '/app/settings'],
};

export default function AppShell() {
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, projects } = useWorkspace();
  const portalProject = projects.find((p) => p.id === 'northline')?.id || projects[0]?.id || 'northline';

  const visible = useMemo(() => {
    const allow = allowedByRole[role];
    if (!allow) return groups;
    return groups
      .map(([label, items]) => [label, items.filter(([to]) => allow.includes(to))])
      .filter(([, items]) => items.length);
  }, [role]);

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

  return (
    <div className="workspace">
      <aside className={`sidebar ${menu ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand" onClick={() => navigate('/')} onKeyDown={(e) => e.key === 'Enter' && navigate('/')} role="button" tabIndex={0}>
          <span className="brand-mark">K</span>
          <div><strong>KADRI</strong><small>creative production os</small></div>
        </div>
        <button className="mobile-close" type="button" onClick={() => setMenu(false)} aria-label="Close navigation"><X size={18} /></button>
        <nav>
          {visible.map(([label, items]) => (
            <div className="nav-group" key={label}>
              <span className="nav-group__label">{label}</span>
              {items.map(([to, text, Icon]) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                  <Icon size={16} strokeWidth={1.6} /><span>{text}</span>
                </NavLink>
              ))}
            </div>
          ))}
          <div className="nav-group">
            <span className="nav-group__label">CLIENT</span>
            <NavLink to={`/portal/${portalProject}`} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <ContactRound size={16} strokeWidth={1.6} /><span>Client Portal</span>
            </NavLink>
          </div>
        </nav>
        <div className="sidebar__foot">
          <button className="command-shortcut" type="button" onClick={() => setPalette(true)}>
            <Search size={15} /><span>Quick search</span><kbd>⌘K</kbd>
          </button>
          <NavLink to="/app/settings" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
            <Settings size={16} /><span>Settings</span>
          </NavLink>
        </div>
      </aside>
      {menu && <button className="sidebar-scrim" type="button" onClick={() => setMenu(false)} aria-label="Close navigation" />}
      <main className="workspace-main">
        <header className="workspace-topbar">
          <button className="mobile-menu" type="button" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={18} /></button>
          <span className="topbar-route">{location.pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ') || 'workspace'}</span>
          <span className="demo-chip">Demo workspace</span>
          <div className="topbar-actions">
            <button className="quiet-button" type="button" onClick={() => setPalette(true)}><Command size={15} /> Command</button>
            <div className="avatar" title={role}>{role === 'producer' ? 'EM' : role === 'editor' ? 'ED' : 'CL'}</div>
          </div>
        </header>
        <Outlet />
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

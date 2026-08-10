import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Aperture, BadgeDollarSign, Boxes, Clapperboard, Command, ContactRound, FileInput, Files, GalleryVerticalEnd, Lightbulb, Menu, PanelLeftClose, Search, Settings, UsersRound, X } from 'lucide-react';
import CommandPalette from './CommandPalette';

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
    ['/portal/night-shift', 'Client Portal', ContactRound],
  ]],
];

export default function AppShell() {
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="workspace">
      <aside className={`sidebar ${menu ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <span className="brand-mark">K</span>
          <div><strong>KADRI</strong><small>creative production os</small></div>
        </div>
        <button className="mobile-close" onClick={() => setMenu(false)} aria-label="Close navigation"><X size={18} /></button>
        <nav>
          {groups.map(([label, items]) => <div className="nav-group" key={label}>
            <span className="nav-group__label">{label}</span>
            {items.map(([to, text, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <Icon size={16} strokeWidth={1.6} /><span>{text}</span>
            </NavLink>)}
          </div>)}
        </nav>
        <div className="sidebar__foot">
          <button className="command-shortcut" onClick={() => setPalette(true)}><Search size={15} /><span>Quick search</span><kbd>⌘K</kbd></button>
          <button className="nav-link nav-link--button"><Settings size={16} /><span>Settings</span></button>
        </div>
      </aside>
      {menu && <button className="sidebar-scrim" onClick={() => setMenu(false)} aria-label="Close navigation" />}
      <main className="workspace-main">
        <header className="workspace-topbar">
          <button className="mobile-menu" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={18} /></button>
          <span className="topbar-route">{location.pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ') || 'workspace'}</span>
          <div className="topbar-actions"><button className="quiet-button" onClick={() => setPalette(true)}><Command size={15}/> Command</button><div className="avatar">EM</div></div>
        </header>
        <Outlet />
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

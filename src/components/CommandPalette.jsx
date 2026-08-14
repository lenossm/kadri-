import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowRight, Clapperboard, FileInput, Lightbulb, GalleryVerticalEnd, Aperture, Boxes, BadgeDollarSign, UsersRound, Files } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../state/WorkspaceContext';
import { CAP, can } from '../permissions/engine';

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { projects, inquiries, ideas, reviews, perm, href } = useWorkspace();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 20);
      setActive(0);
    } else setQuery('');
  }, [open]);

  const items = useMemo(() => {
    const nav = [
      can(perm, CAP.DASHBOARD) && { type: 'Go', title: 'Dashboard', path: href('/dashboard'), Icon: Aperture },
      can(perm, CAP.PROJECT_VIEW) && { type: 'Go', title: 'Pipeline', path: href('/pipeline'), Icon: Boxes },
      can(perm, CAP.PROJECT_VIEW) && { type: 'Go', title: 'Projects', path: href('/projects'), Icon: Clapperboard },
      can(perm, CAP.REVIEW_VIEW) && { type: 'Go', title: 'Reviews', path: href('/reviews'), Icon: GalleryVerticalEnd },
      can(perm, CAP.INQUIRY_VIEW) && { type: 'Go', title: 'Inquiries', path: href('/inquiries'), Icon: FileInput },
      can(perm, CAP.CLIENT_VIEW) && { type: 'Go', title: 'Clients', path: href('/clients'), Icon: UsersRound },
      (can(perm, CAP.PAYMENT_VIEW) || can(perm, CAP.FINANCE_VIEW)) && { type: 'Go', title: 'Payments', path: href('/payments'), Icon: BadgeDollarSign },
      can(perm, CAP.DELIVERY_VIEW) && { type: 'Go', title: 'Publishing', path: href('/publishing'), Icon: Files },
      can(perm, CAP.IDEA_VIEW) && { type: 'Go', title: 'Idea Pool', path: href('/ideas'), Icon: Lightbulb },
    ].filter(Boolean);
    const records = [
      ...projects.map((x) => ({ type: 'Project', title: x.title, path: href(`/projects/${x.id}`), Icon: Clapperboard })),
      ...inquiries.map((x) => ({ type: 'Inquiry', title: x.company, path: href('/inquiries'), Icon: FileInput })),
      ...ideas.map((x) => ({ type: 'Idea', title: x.title, path: href('/ideas'), Icon: Lightbulb })),
      ...reviews.map((x) => ({ type: 'Review', title: x.title, path: href(`/reviews/${x.id}`), Icon: GalleryVerticalEnd })),
    ];
    const all = [...nav, ...records];
    if (!query.trim()) return all.slice(0, 10);
    const q = query.toLowerCase();
    return all.filter((x) => `${x.type} ${x.title}`.toLowerCase().includes(q)).slice(0, 10);
  }, [projects, inquiries, ideas, reviews, query, perm, href]);

  useEffect(() => { setActive(0); }, [query, open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
      if (e.key === 'Enter' && items[active]) {
        e.preventDefault();
        navigate(items[active].path);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, items, active, navigate]);

  if (!open) return null;
  const go = (path) => { navigate(path); onClose(); };

  return (
    <div className="command-backdrop" onMouseDown={onClose}>
      <section className="command-panel" onMouseDown={(e) => e.stopPropagation()} aria-label="Command palette">
        <div className="command-search">
          <Search size={18} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects, inquiries, ideas…" aria-label="Search workspace" />
        </div>
        <div className="command-results">
          {items.length ? items.map(({ type, title, path, Icon }, i) => (
            <button key={`${type}-${title}-${path}`} type="button" className={i === active ? 'is-active' : ''} onClick={() => go(path)}>
              <Icon size={16} /><span><small>{type}</small>{title}</span><ArrowRight size={15} />
            </button>
          )) : <div className="empty-state">No frame found.</div>}
        </div>
        <div className="command-foot"><span>↑↓ to move · Enter to open</span><kbd>ESC</kbd></div>
      </section>
    </div>
  );
}

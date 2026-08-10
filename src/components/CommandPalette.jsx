import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowRight, Clapperboard, FileInput, Lightbulb, GalleryVerticalEnd } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../state/WorkspaceContext';

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { projects, inquiries, ideas, reviews } = useWorkspace();
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 20); else setQuery(''); }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open, onClose]);

  const items = useMemo(() => {
    const base = [
      ...projects.map((x) => ({ type: 'Project', title: x.title, path: `/app/projects/${x.id}`, Icon: Clapperboard })),
      ...inquiries.map((x) => ({ type: 'Inquiry', title: x.company, path: '/app/inquiries', Icon: FileInput })),
      ...ideas.map((x) => ({ type: 'Idea', title: x.title, path: '/app/ideas', Icon: Lightbulb })),
      ...reviews.map((x) => ({ type: 'Review', title: x.title, path: `/app/reviews/${x.id}`, Icon: GalleryVerticalEnd })),
    ];
    if (!query.trim()) return base.slice(0, 8);
    const q = query.toLowerCase();
    return base.filter((x) => `${x.type} ${x.title}`.toLowerCase().includes(q)).slice(0, 10);
  }, [projects, inquiries, ideas, reviews, query]);

  if (!open) return null;
  const go = (path) => { navigate(path); onClose(); };
  return <div className="command-backdrop" onMouseDown={onClose}>
    <section className="command-panel" onMouseDown={(e) => e.stopPropagation()} aria-label="Command palette">
      <div className="command-search"><Search size={18}/><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects, inquiries, ideas…" /></div>
      <div className="command-results">
        {items.length ? items.map(({ type, title, path, Icon }) => <button key={`${type}-${title}`} onClick={() => go(path)}><Icon size={16}/><span><small>{type}</small>{title}</span><ArrowRight size={15}/></button>) : <div className="empty-state">No frame found.</div>}
      </div>
      <div className="command-foot"><span>Navigate with keyboard</span><kbd>ESC</kbd></div>
    </section>
  </div>;
}

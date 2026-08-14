import { useMemo, useState } from 'react';
import { Plus, Pin } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { matchesQuery } from '../utils/selectors';

export default function IdeasPage() {
  const { ideas, projects, dispatch } = useWorkspace();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const current = ideas.find((x) => x.id === selected);
  const projectTitle = (id) => projects.find((p) => p.id === id)?.title;

  const visible = useMemo(() => {
    const list = ideas.filter((i) => matchesQuery(`${i.title} ${i.body} ${i.type} ${(i.tags || []).join(' ')}`, query));
    return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [ideas, query]);

  const add = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    dispatch({
      type: 'ADD_IDEA',
      payload: {
        title: f.get('title'),
        body: f.get('body'),
        type: f.get('type'),
        tags: String(f.get('tags')).split(',').map((x) => x.trim()).filter(Boolean),
        projectId: f.get('projectId') || null,
      },
    });
    setOpen(false);
    notify('Idea saved.');
  };

  const save = (e) => {
    e.preventDefault();
    if (!current) return;
    const f = new FormData(e.currentTarget);
    dispatch({
      type: 'UPDATE_IDEA',
      id: current.id,
      patch: {
        title: f.get('title'),
        body: f.get('body'),
        type: f.get('type'),
        tags: String(f.get('tags')).split(',').map((x) => x.trim()).filter(Boolean),
        projectId: f.get('projectId') || null,
      },
    });
    setSelected(null);
    notify('Idea updated.');
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="INPUT / 02"
        title="Idea Pool"
        copy="Loose thoughts before they become decks. Pin the ones that should stay in the room."
        actions={<button className="primary-button" type="button" onClick={() => setOpen(true)}><Plus size={16} /> Drop an idea</button>}
      />
      <div className="toolbar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ideas…" aria-label="Search ideas" />
      </div>
      {visible.length ? (
        <div className="idea-grid">
          {visible.map((idea, i) => (
            <article className={`idea-card idea-card--${(i % 4) + 1}`} key={idea.id}>
              <div className="idea-card__top">
                <span className="eyebrow">{idea.type}{idea.pinned ? ' / PINNED' : ''}</span>
                <button type="button" className="icon-button" aria-label={idea.pinned ? 'Unpin' : 'Pin'} onClick={() => dispatch({ type: 'UPDATE_IDEA', id: idea.id, patch: { pinned: !idea.pinned } })}>
                  <Pin size={14} />
                </button>
              </div>
              <button type="button" className="idea-open" onClick={() => setSelected(idea.id)}>
                <h2>{idea.title}</h2>
                <p>{idea.body}</p>
              </button>
              <div>
                {(idea.tags || []).map((t) => <span className="tag" key={t}>#{t}</span>)}
                {idea.projectId && <span className="tag">{projectTitle(idea.projectId)}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No ideas match." copy="Drop a loose thought into the pool." action={<button className="primary-button" type="button" onClick={() => setOpen(true)}>Drop an idea</button>} />
      )}

      <Modal open={open} title="Drop an idea" onClose={() => setOpen(false)}>
        <form className="modal-form" onSubmit={add}>
          <label>Title<input name="title" required /></label>
          <label>Thought<textarea name="body" rows="5" required /></label>
          <label>Type<select name="type"><option>Film</option><option>Studio</option><option>Documentary</option><option>Outdoor</option><option>Motion</option><option>Fashion</option><option>Music</option></select></label>
          <label>Related project
            <select name="projectId"><option value="">None yet</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
          </label>
          <label>Tags<input name="tags" placeholder="night, portrait" /></label>
          <button className="primary-button" type="submit">Save idea</button>
        </form>
      </Modal>

      <Modal open={Boolean(current)} title={current?.title || 'Idea'} onClose={() => setSelected(null)}>
        {current && (
          <form className="modal-form" onSubmit={save}>
            <label>Title<input name="title" required defaultValue={current.title} /></label>
            <label>Thought<textarea name="body" rows="5" required defaultValue={current.body} /></label>
            <label>Type<select name="type" defaultValue={current.type}><option>Film</option><option>Studio</option><option>Documentary</option><option>Outdoor</option><option>Motion</option><option>Fashion</option><option>Music</option></select></label>
            <label>Related project
              <select name="projectId" defaultValue={current.projectId || ''}><option value="">None yet</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
            </label>
            <label>Tags<input name="tags" defaultValue={(current.tags || []).join(', ')} /></label>
            <button className="primary-button" type="submit">Save idea</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

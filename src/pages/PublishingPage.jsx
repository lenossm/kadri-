import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { formatDate, todayIso } from '../utils/format';
import { PUBLISH_STATUSES, matchesQuery } from '../utils/selectors';

const destinations = ['Instagram', 'YouTube', 'TVC Delivery', 'Client Drive', 'Final Master'];

export default function PublishingPage() {
  const { projects, publishing, dispatch, media } = useWorkspace();
  const { notify } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState(projects[0]?.title || '');
  const [category, setCategory] = useState('Film');
  const [destination, setDestination] = useState('Client Drive');
  const [planned, setPlanned] = useState(todayIso());
  const [featured, setFeatured] = useState(true);
  const project = useMemo(() => projects.find((x) => x.id === projectId), [projects, projectId]);

  const visible = useMemo(() => publishing.filter((p) => {
    if (status !== 'All' && p.status !== status) return false;
    return matchesQuery(`${p.publicTitle} ${p.destination} ${p.category}`, query);
  }), [publishing, status, query]);

  const choose = (id) => {
    setProjectId(id);
    const next = projects.find((x) => x.id === id);
    setTitle(next?.title || '');
  };

  const save = (e) => {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    const existing = publishing.find((p) => p.projectId === projectId);
    if (existing) {
      dispatch({ type: 'SET_PUBLISHING', id: existing.id, patch: { publicTitle: title.trim(), category, destination, planned, featured, status: existing.status } });
      notify('Publishing draft saved.');
    } else {
      dispatch({ type: 'ADD_PUBLISHING', payload: { projectId, publicTitle: title.trim(), category, destination, planned, featured, status: 'Scheduled' } });
      notify('Delivery scheduled.');
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="OUTPUT / 01" title="Publishing" copy="Turn completed production records into clean public-facing work without rewriting the project from scratch." />
      <div className="publishing-layout">
        <form className="publish-form" onSubmit={save}>
          <label>Project
            <select value={projectId} onChange={(e) => choose(e.target.value)}>
              {projects.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          </label>
          <label>Public title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Film</option><option>Documentary</option><option>Studio</option><option>Motion</option><option>Branded</option><option>Corporate</option>
            </select>
          </label>
          <label>Destination
            <select value={destination} onChange={(e) => setDestination(e.target.value)}>
              {destinations.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label>Planned date<input type="date" value={planned} onChange={(e) => setPlanned(e.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Feature on homepage</label>
          <button type="submit" className="primary-button">Save publishing draft</button>
        </form>
        <div className="publish-preview">
          <span className="eyebrow">PUBLIC PREVIEW</span>
          <div className="publish-preview__media">
            <video muted autoPlay loop playsInline src={media.src} poster={media.poster} />
          </div>
          <span>{category} / {project?.location} / {destination}</span>
          <h2>{title}</h2>
          <p>{project?.brief}</p>
          {featured && <b className="feature-flag">FEATURED</b>}
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 48 }}>
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search deliveries…" aria-label="Search publishing" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter publishing">
          <option>All</option>
          {PUBLISH_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {visible.length ? (
        <div className="data-table">
          <div className="data-table__head"><span>TITLE</span><span>DESTINATION</span><span>DATE</span><span /><span>STATUS</span></div>
          {visible.map((item) => (
            <div className="data-table__row" key={item.id}>
              <b>{item.publicTitle}</b>
              <span>{item.destination}</span>
              <span>{formatDate(item.planned)}</span>
              <span>{item.featured ? 'Featured' : ''}</span>
              <span className="status-cell">
                <StatusPill>{item.status}</StatusPill>
                <select aria-label={`Update ${item.publicTitle}`} value={item.status} onChange={(e) => { dispatch({ type: 'SET_PUBLISHING', id: item.id, patch: { status: e.target.value } }); notify(`${item.publicTitle} marked ${e.target.value}.`); }}>
                  {PUBLISH_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No publishing items scheduled." copy="Save a draft from the form above." />
      )}
    </div>
  );
}

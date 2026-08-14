import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { relativeDay } from '../utils/format';
import { REVIEW_STATUSES, matchesQuery } from '../utils/selectors';

export default function ReviewsPage() {
  const { reviews, projects, media } = useWorkspace();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const projectTitle = (id) => projects.find((p) => p.id === id)?.title || '—';

  const visible = useMemo(() => reviews.filter((r) => {
    if (status !== 'All' && r.status !== status) return false;
    return matchesQuery(`${r.title} ${r.version} ${projectTitle(r.projectId)}`, query);
  }), [reviews, status, query, projects]);

  return (
    <div className="page">
      <PageHeader eyebrow="WORK / 04" title="Reviews" copy="Versions waiting for decisions. Comments stay attached to time, not buried in chat." />
      <div className="toolbar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search version or project…" aria-label="Search reviews" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option>All</option>
          {REVIEW_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {visible.length ? (
        <div className="review-list">
          {visible.map((r) => (
            <Link to={`/app/reviews/${r.id}`} className="review-row" key={r.id}>
              <div className="review-thumb"><video muted autoPlay loop playsInline src={media.src} poster={media.poster} /></div>
              <div>
                <span className="eyebrow">{r.version} / {projectTitle(r.projectId)}</span>
                <h2>{r.title}</h2>
                <p>{r.comments.length} timecoded comments / due {relativeDay(r.due)}</p>
              </div>
              <StatusPill>{r.status}</StatusPill>
              <ArrowRight />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews match." copy="Clear the filter or move a project into client review." action={<button className="secondary-button" type="button" onClick={() => { setQuery(''); setStatus('All'); }}>Clear filters</button>} />
      )}
    </div>
  );
}

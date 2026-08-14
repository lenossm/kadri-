import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { formatMoney, relativeDay } from '../utils/format';
import { matchesQuery, paymentStatus, projectReviews } from '../utils/selectors';
import { projectTypes } from '../data/fixtures';
import { CAP } from '../permissions/engine';

export default function ProjectsPage() {
  const { projects, clients, reviews, payments, stages, href, can, perm } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [stage, setStage] = useState(params.get('stage') || 'All');
  const [type, setType] = useState('All');
  const [clientId, setClientId] = useState(params.get('client') || 'All');
  const [sort, setSort] = useState('due');

  useEffect(() => {
    const client = params.get('client');
    if (client) setClientId(client);
  }, [params]);

  const clientName = (id) => clients.find((c) => c.id === id)?.name || '—';

  const visible = useMemo(() => {
    const list = projects.filter((p) => {
      if (stage !== 'All' && p.stage !== stage) return false;
      if (type !== 'All' && p.type !== type) return false;
      if (clientId !== 'All' && p.clientId !== clientId) return false;
      return matchesQuery(`${p.title} ${p.type} ${p.owner} ${clientName(p.clientId)}`, query);
    });
    return list.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'progress') return b.progress - a.progress;
      return String(a.due).localeCompare(String(b.due));
    });
  }, [projects, stage, type, clientId, query, sort, clients]);

  const reviewLabel = (id) => {
    const r = projectReviews(id, reviews)[0];
    return r?.status || '—';
  };
  const showMoney = can(CAP.PROJECT_FINANCIALS) || can(CAP.FINANCE_VIEW);
  const payLabel = (id) => {
    if (!showMoney) return '';
    const related = payments.filter((p) => p.projectId === id);
    if (!related.length) return '—';
    if (related.every((p) => paymentStatus(p) === 'Paid')) return 'Paid';
    if (related.some((p) => paymentStatus(p) === 'Overdue')) return 'Overdue';
    return 'Open';
  };

  return (
    <div className="page">
      <PageHeader eyebrow="WORK / 03" title={perm?.role === 'editor' ? 'My projects' : 'Projects'} copy={perm?.role === 'editor' ? 'Only productions assigned to you.' : 'The complete production record: brief, stage, review and what needs to happen next.'} />
      <div className="toolbar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, client, owner…" aria-label="Search projects" />
        <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Filter by stage"><option>All</option>{stages.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type"><option>All</option>{projectTypes.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Filter by client"><option value="All">All clients</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort projects"><option value="due">Due date</option><option value="title">Title</option><option value="progress">Progress</option></select>
      </div>
      {visible.length ? (
        <div className="project-index">
          {visible.map((p, i) => (
            <Link to={href(`/projects/${p.id}`)} className="project-index__row" key={p.id}>
              <span className="index-number">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2>{p.title}</h2>
                <p>{p.type} / {clientName(p.clientId)} / {p.owner}</p>
              </div>
              <StatusPill>{p.stage}</StatusPill>
              <div className="project-index__progress">
                <span>{p.progress}% · {relativeDay(p.due)}{showMoney ? ` · ${formatMoney(p.budget)}` : ''}</span>
                <i><b style={{ width: `${p.progress}%` }} /></i>
                <small className="muted-line">Review {reviewLabel(p.id)}{showMoney ? ` · ${payLabel(p.id)}` : ''}</small>
              </div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={!projects.length && perm?.role === 'editor' ? 'No projects assigned yet.' : 'No projects match these filters.'}
          copy={!projects.length && perm?.role === 'editor' ? "You'll see productions here when you're added to a project." : 'Try another stage or clear the search.'}
          action={<button className="secondary-button" type="button" onClick={() => { setQuery(''); setStage('All'); setType('All'); setClientId('All'); setParams({}); }}>Clear filters</button>}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import StatusPill from '../components/StatusPill';
import EntityMissing from '../components/EntityMissing';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { formatDate, formatMoney, relativeDay } from '../utils/format';
import { projectPayments, projectReviews } from '../utils/selectors';

const tabs = ['Overview', 'Brief', 'Production', 'Review', 'Client', 'Financials', 'Delivery'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { projects, clients, reviews, payments, publishing, dispatch, stages, media, role } = useWorkspace();
  const { notify } = useToast();
  const project = projects.find((x) => x.id === id);
  const [tab, setTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const client = clients.find((c) => c.id === project?.clientId);
  const relatedReviews = project ? projectReviews(project.id, reviews) : [];
  const finance = project ? projectPayments(project.id, payments) : null;
  const delivery = publishing.filter((p) => p.projectId === id);
  const showMoney = role !== 'client' && role !== 'editor';

  if (!project) return <EntityMissing label="Project" to="/app/projects" backLabel="Back to projects" />;

  const save = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const budget = Number(f.get('budget'));
    dispatch({
      type: 'UPDATE_PROJECT',
      id,
      patch: {
        brief: f.get('brief'),
        objective: f.get('objective'),
        direction: f.get('direction'),
        owner: f.get('owner'),
        due: f.get('due'),
        stage: f.get('stage'),
        shootDate: f.get('shootDate'),
        location: f.get('location'),
        notes: f.get('notes'),
        format: f.get('format'),
        crew: f.get('crew'),
        budget: Number.isFinite(budget) && budget >= 0 ? budget : project.budget,
      },
    });
    setEditing(false);
    notify(`${project.title} updated.`);
  };

  const visibleTabs = showMoney ? tabs : tabs.filter((t) => t !== 'Financials');

  return (
    <div className="page project-detail">
      <Link to="/app/projects" className="back-link"><ArrowLeft size={15} /> All projects</Link>
      <header className="project-detail__hero">
        <div>
          <span className="eyebrow">{project.type} / {client?.name || 'Independent'} / {project.location}</span>
          <h1>{project.title}</h1>
          <div className="project-detail__tags">
            <StatusPill>{project.stage}</StatusPill>
            <StatusPill>{project.status}</StatusPill>
            <span>{project.owner}</span>
            <span>Due {formatDate(project.due)}</span>
          </div>
        </div>
        <div className="project-poster">
          <video muted autoPlay loop playsInline src={media.src} poster={media.poster} />
        </div>
      </header>

      <div className="tab-row" role="tablist">
        {visibleTabs.map((t) => (
          <button type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} key={t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="project-detail__body">
          <section>
            <div className="section-head"><div><span className="eyebrow">NOW</span><h2>The frame</h2></div></div>
            <p className="large-copy">{project.brief}</p>
            <p className="body-copy">Milestone: {project.stage} · {project.progress}% · {relativeDay(project.due)}</p>
          </section>
          <aside className="project-ledger">
            <span className="eyebrow">LEDGER</span>
            <dl>
              <dt>CLIENT</dt><dd>{client?.name || '—'}</dd>
              {showMoney && <><dt>BUDGET</dt><dd>{formatMoney(project.budget)}</dd></>}
              <dt>PROGRESS</dt><dd>{project.progress}%</dd>
              <dt>OWNER</dt><dd>{project.owner}</dd>
              <dt>DEADLINE</dt><dd>{formatDate(project.due)}</dd>
              <dt>REVIEW</dt><dd>{relatedReviews[0]?.status || 'None yet'}</dd>
            </dl>
          </aside>
        </div>
      )}

      {tab === 'Brief' && (
        <section className="tab-panel">
          <div className="section-head">
            <div><span className="eyebrow">BRIEF</span><h2>Campaign</h2></div>
            <button className="secondary-button" type="button" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>
          </div>
          {editing ? (
            <form className="project-edit" onSubmit={save}>
              <label>Brief<textarea name="brief" defaultValue={project.brief} rows="5" /></label>
              <label>Objective<textarea name="objective" defaultValue={project.objective} rows="3" /></label>
              <label>Creative direction<textarea name="direction" defaultValue={project.direction} rows="3" /></label>
              <div className="two-col">
                <label>Owner<input name="owner" defaultValue={project.owner} /></label>
                <label>Due<input name="due" type="date" defaultValue={project.due} /></label>
              </div>
              <label>Stage<select name="stage" defaultValue={project.stage}>{stages.map((x) => <option key={x}>{x}</option>)}</select></label>
              <div className="two-col">
                <label>Shoot date<input name="shootDate" type="date" defaultValue={project.shootDate} /></label>
                <label>Location<input name="location" defaultValue={project.location} /></label>
              </div>
              <label>Format<input name="format" defaultValue={project.format} /></label>
              <label>Crew<input name="crew" defaultValue={project.crew} /></label>
              <label>Notes<textarea name="notes" defaultValue={project.notes} rows="3" /></label>
              {showMoney && <label>Budget<input name="budget" type="number" min="0" defaultValue={project.budget} /></label>}
              {!showMoney && <input type="hidden" name="budget" value={project.budget} />}
              <button className="primary-button" type="submit"><Save size={15} /> Save changes</button>
            </form>
          ) : (
            <div className="brief-grid">
              <article><span className="eyebrow">OBJECTIVE</span><p>{project.objective}</p></article>
              <article><span className="eyebrow">DELIVERABLES</span><p>{(project.deliverables || []).join(' · ')}</p></article>
              <article><span className="eyebrow">DIRECTION</span><p>{project.direction || '—'}</p></article>
              <article><span className="eyebrow">FORMAT</span><p>{project.format}</p></article>
            </div>
          )}
        </section>
      )}

      {tab === 'Production' && (
        <section className="tab-panel">
          <span className="eyebrow">UNIT</span>
          <h2>Production</h2>
          <dl className="meta-block">
            <dt>Stage</dt><dd>{project.stage}</dd>
            <dt>Shoot</dt><dd>{project.shootDate ? formatDate(project.shootDate) : 'Not dated'}</dd>
            <dt>Location</dt><dd>{project.location}</dd>
            <dt>Crew</dt><dd>{project.crew}</dd>
            <dt>Notes</dt><dd>{project.notes}</dd>
          </dl>
          <button className="secondary-button" type="button" onClick={() => { setTab('Brief'); setEditing(true); }}>Edit production notes</button>
        </section>
      )}

      {tab === 'Review' && (
        <section className="tab-panel">
          <span className="eyebrow">SCREENING</span>
          <h2>Review</h2>
          {relatedReviews.length ? relatedReviews.map((r) => (
            <Link className="review-row" to={`/app/reviews/${r.id}`} key={r.id}>
              <div className="review-thumb"><video muted loop playsInline poster={media.poster} src={media.src} /></div>
              <div><span className="eyebrow">{r.version}</span><h2>{r.title}</h2><p>{r.comments.length} timecoded comments / due {relativeDay(r.due)}</p></div>
              <StatusPill>{r.status}</StatusPill>
            </Link>
          )) : <EmptyState title="No review yet." copy="Move the project to Client review to open a version." />}
        </section>
      )}

      {tab === 'Client' && (
        <section className="tab-panel">
          <span className="eyebrow">CLIENT</span>
          <h2>{client?.name || 'Unassigned'}</h2>
          {client ? (
            <>
              <dl className="meta-block">
                <dt>Contact</dt><dd>{client.contact}</dd>
                <dt>Email</dt><dd>{client.email}</dd>
                <dt>Phone</dt><dd>{client.phone || '—'}</dd>
              </dl>
              <Link className="primary-button" to={`/portal/${project.id}`}>Open client portal</Link>
            </>
          ) : <p>No client record linked.</p>}
        </section>
      )}

      {tab === 'Financials' && finance && (
        <section className="tab-panel">
          <span className="eyebrow">MONEY</span>
          <h2>Financials</h2>
          <div className="payment-summary">
            <div><span>BUDGET</span><strong>{formatMoney(project.budget)}</strong></div>
            <div><span>INVOICED</span><strong>{formatMoney(finance.invoiced)}</strong></div>
            <div><span>OUTSTANDING</span><strong>{formatMoney(finance.outstanding)}</strong></div>
          </div>
          {finance.related.map((p) => (
            <div className="data-table__row" key={p.id}><b>{p.invoice}</b><span>{formatMoney(p.amount)}</span><span>{formatDate(p.due)}</span><StatusPill>{p.status}</StatusPill></div>
          ))}
          <Link className="secondary-button" to="/app/payments">Open payments</Link>
        </section>
      )}

      {tab === 'Delivery' && (
        <section className="tab-panel">
          <span className="eyebrow">OUTPUT</span>
          <h2>Delivery</h2>
          {delivery.length ? delivery.map((d) => (
            <div className="data-table__row" key={d.id}><b>{d.publicTitle}</b><span>{d.destination}</span><span>{formatDate(d.planned)}</span><StatusPill>{d.status}</StatusPill></div>
          )) : <EmptyState title="Nothing scheduled." copy="Publishing holds the public-facing cut." />}
          <Link className="secondary-button" to="/app/publishing">Open publishing</Link>
        </section>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import StatusPill from '../components/StatusPill';
import EntityMissing from '../components/EntityMissing';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { CAP, ROLE_LABELS } from '../permissions/engine';
import { formatDate, formatMoney, relativeDay } from '../utils/format';
import { projectPayments, projectReviews } from '../utils/selectors';
import { supabase } from '../lib/supabase';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { projects, clients, reviews, payments, publishing, dispatch, stages, media, href, can, team = [], projectMembers = [], isDemo, workspace, actor, reload } = useWorkspace();
  const { notify } = useToast();
  const project = projects.find((x) => x.id === id);
  const [tab, setTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const client = clients.find((c) => c.id === project?.clientId);
  const relatedReviews = project ? projectReviews(project.id, reviews) : [];
  const finance = project ? projectPayments(project.id, payments) : null;
  const delivery = publishing.filter((p) => p.projectId === id);
  const showMoney = can(CAP.PROJECT_FINANCIALS) || can(CAP.FINANCE_VIEW);
  const canEdit = can(CAP.PROJECT_EDIT, { projectId: id });
  const canAssign = can(CAP.PROJECT_ASSIGN);
  const canInviteClient = can(CAP.CLIENT_INVITE);
  const canSeeClient = can(CAP.CLIENT_VIEW) || can(CAP.CLIENT_MANAGE);
  const crew = projectMembers.filter((m) => m.projectId === id);

  if (!project) return <EntityMissing label="Project" to={href('/projects')} backLabel="Back to projects" />;

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
        budget: showMoney && Number.isFinite(budget) && budget >= 0 ? budget : project.budget,
      },
    });
    setEditing(false);
    notify(`${project.title} updated.`);
  };

  const tabs = ['Overview', 'Brief', 'Production', 'Team', 'Review', canSeeClient ? 'Client' : null, showMoney ? 'Financials' : null, 'Delivery'].filter(Boolean);

  const inviteClient = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (isDemo) {
      notify('Live workspaces send a Client Portal invitation. Demo keeps /portal as a walkthrough.');
      setInviteOpen(false);
      return;
    }
    const { data, error } = await supabase.from('client_invitations').insert({
      workspace_id: workspace.id,
      project_id: project.id,
      email: form.email,
      invited_by: actor.id,
      permissions: {
        project: true,
        review: Boolean(form.review),
        comment: Boolean(form.comment),
        approve: Boolean(form.approve),
        download: Boolean(form.download),
        invoice: Boolean(form.invoice),
      },
    }).select('token').single();
    if (error) notify(error.message);
    else {
      notify(`Invitation ready: ${window.location.origin}/invite/${data.token}?kind=client`);
      setInviteOpen(false);
    }
  };

  const assignMember = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (isDemo) {
      notify('Project assignments persist in a live workspace. Demo identities stay on the seed roster.');
      setAssignOpen(false);
      return;
    }
    const { error } = await supabase.from('project_members').insert({
      workspace_id: workspace.id,
      project_id: project.id,
      user_id: form.userId,
      project_role: form.projectRole,
      assigned_by: actor.id,
    });
    if (error) notify(error.message);
    else {
      notify('Member assigned.');
      reload?.();
      setAssignOpen(false);
    }
  };

  return (
    <div className="page project-detail">
      <Link to={href('/projects')} className="back-link"><ArrowLeft size={15} /> All projects</Link>
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
        {tabs.map((t) => (
          <button type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} key={t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="project-detail__body">
          <section>
            <div className="section-head"><div><span className="eyebrow">NOW</span><h2>The frame</h2></div></div>
            <p className="large-copy">{project.brief}</p>
            <p className="body-copy">Milestone: {project.stage} · {project.progress}% · {relativeDay(project.due)}</p>
            {can(CAP.NOTE_INTERNAL) && project.notes && (
              <p className="internal-note"><em className="vis-tag vis-tag--internal">Internal</em> {project.notes}</p>
            )}
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
            {canEdit && <button className="secondary-button" type="button" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>}
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
              <label>Internal notes<textarea name="notes" defaultValue={project.notes} rows="3" /></label>
              {showMoney && <label>Budget<input name="budget" type="number" min="0" defaultValue={project.budget} /></label>}
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
            {can(CAP.NOTE_INTERNAL) && <><dt>Internal notes</dt><dd><em className="vis-tag vis-tag--internal">Internal</em> {project.notes}</dd></>}
          </dl>
          {canEdit && <button className="secondary-button" type="button" onClick={() => { setTab('Brief'); setEditing(true); }}>Edit production notes</button>}
        </section>
      )}

      {tab === 'Team' && (
        <section className="tab-panel">
          <div className="section-head">
            <div><span className="eyebrow">CREW</span><h2>Project team</h2></div>
            {canAssign && <button className="primary-button" type="button" onClick={() => setAssignOpen(true)}>Add member</button>}
          </div>
          {crew.length ? crew.map((m) => {
            const person = team.find((t) => t.id === m.userId);
            return (
              <div className="data-table__row" key={`${m.userId}-${m.projectId}`}>
                <b>{person?.name || 'Former team member'}<small className="muted-line">{person ? person.email : 'Removed from the workspace. History is kept.'}</small></b>
                <span>{m.projectRole}</span>
                <span>{person ? ROLE_LABELS[person.role] : '—'}</span>
              </div>
            );
          }) : <EmptyState title="No one assigned yet." copy="Producers add editors and unit leads here." />}
        </section>
      )}

      {tab === 'Review' && (
        <section className="tab-panel">
          <span className="eyebrow">SCREENING</span>
          <h2>Review</h2>
          {relatedReviews.length ? relatedReviews.map((r) => (
            <Link className="review-row" to={href(`/reviews/${r.id}`)} key={r.id}>
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
              {isDemo && <Link className="primary-button" to={`/portal/${project.id}`}>Open demo portal</Link>}
              {canInviteClient && <button className="secondary-button" type="button" onClick={() => setInviteOpen(true)}>Invite to portal</button>}
            </>
          ) : <p>No client record linked.</p>}
        </section>
      )}

      {tab === 'Financials' && showMoney && finance && (
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
          {can(CAP.PAYMENT_VIEW) && <Link className="secondary-button" to={href('/payments')}>Open payments</Link>}
        </section>
      )}

      {tab === 'Delivery' && (
        <section className="tab-panel">
          <span className="eyebrow">OUTPUT</span>
          <h2>Delivery</h2>
          {delivery.length ? delivery.map((d) => (
            <div className="data-table__row" key={d.id}><b>{d.publicTitle}</b><span>{d.destination}</span><span>{formatDate(d.planned)}</span><StatusPill>{d.status}</StatusPill></div>
          )) : <EmptyState title="Nothing scheduled." copy="Publishing holds the public-facing cut." />}
          {can(CAP.DELIVERY_VIEW) && <Link className="secondary-button" to={href('/publishing')}>Open publishing</Link>}
        </section>
      )}

      <Modal open={inviteOpen} title="Invite to Client Portal" onClose={() => setInviteOpen(false)}>
        <form className="modal-form" onSubmit={inviteClient}>
          <p>They receive a Client Portal account. They never enter the internal workspace.</p>
          <label>Email<input required type="email" name="email" defaultValue={client?.email} /></label>
          <fieldset className="perm-fieldset">
            <legend>Portal permissions</legend>
            <label className="check"><input type="checkbox" name="review" defaultChecked /> View reviews</label>
            <label className="check"><input type="checkbox" name="comment" defaultChecked /> Add review comments</label>
            <label className="check"><input type="checkbox" name="approve" defaultChecked /> Approve / request changes</label>
            <label className="check"><input type="checkbox" name="download" /> Download final deliverables</label>
            <label className="check"><input type="checkbox" name="invoice" /> View invoices</label>
          </fieldset>
          <button className="primary-button" type="submit">Create invitation</button>
        </form>
      </Modal>

      <Modal open={assignOpen} title="Add to this production" onClose={() => setAssignOpen(false)}>
        <form className="modal-form" onSubmit={assignMember}>
          <label>Team member
            <select name="userId" required>
              {team.filter((t) => t.status === 'active').map((t) => <option key={t.id} value={t.id}>{t.name} · {ROLE_LABELS[t.role]}</option>)}
            </select>
          </label>
          <label>Project role<input name="projectRole" defaultValue="Editor" /></label>
          <button className="primary-button" type="submit">Assign</button>
        </form>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { CheckCircle2, Clock3, MessageSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import StatusPill from '../components/StatusPill';
import EntityMissing from '../components/EntityMissing';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { formatDate, formatMoney, formatTime, relativeDay } from '../utils/format';
import { projectPayments, projectReviews } from '../utils/selectors';

export default function ClientPortalPage() {
  const { id } = useParams();
  const { projects, reviews, payments, dispatch, media } = useWorkspace();
  const { notify } = useToast();
  const project = projects.find((x) => x.id === id);
  const review = projectReviews(id, reviews)[0];
  const finance = projectPayments(id, payments);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  if (!project) return <EntityMissing label="Project" to="/" backLabel="Back to KADRI" />;

  const approve = () => {
    if (!review) return;
    dispatch({ type: 'SET_REVIEW_STATUS', id: review.id, status: 'Approved' });
    notify('Version approved.');
  };
  const request = (e) => {
    e.preventDefault();
    if (!review) return;
    dispatch({ type: 'SET_REVIEW_STATUS', id: review.id, status: 'Changes Requested', note: note.trim() || undefined, time: 0, author: 'Client', visibility: 'client' });
    setNoteOpen(false);
    setNote('');
    notify('Changes requested.');
  };

  return (
    <div className="portal">
      <nav className="portal-nav">
        <strong>KADRI</strong>
        <span>CLIENT PORTAL · DEMO</span>
        <Link to="/demo/dashboard">Internal workspace</Link>
      </nav>
      <main>
        <header className="portal-hero">
          <div>
            <span className="eyebrow">{project.type} / {project.location}</span>
            <h1>{project.title}</h1>
          </div>
          <p>Everything you need about the current version, the next milestone, and what is waiting on you. This is a simulated client view — not a live login.</p>
        </header>
        <div className="portal-media">
          <video muted autoPlay loop playsInline src={media.src} poster={media.poster} />
        </div>
        <section className="portal-status">
          <article><Clock3 /><span>CURRENT STAGE</span><strong>{project.stage}</strong></article>
          <article><MessageSquare /><span>LATEST REVIEW</span><strong>{review ? `${review.version} · ${review.status}` : 'None yet'}</strong></article>
          <article><CheckCircle2 /><span>NEXT MILESTONE</span><strong>{relativeDay(project.due)}</strong></article>
        </section>

        <section className="portal-block">
          <span className="eyebrow">PROGRESS</span>
          <div className="project-progress"><i style={{ width: `${project.progress}%` }} /></div>
          <p>{project.progress}% · due {formatDate(project.due)}</p>
        </section>

        {review && (
          <section className="portal-block">
            <div className="section-head">
              <div><span className="eyebrow">FEEDBACK</span><h2>{review.title}</h2></div>
              <StatusPill>{review.status}</StatusPill>
            </div>
            {(review.comments || []).filter((c) => c.visibility !== 'internal').length ? review.comments.filter((c) => c.visibility !== 'internal').map((c) => (
              <div className="portal-comment" key={c.id}><time>{formatTime(c.time)}</time><span><b>{c.author}</b> {c.text}</span></div>
            )) : <EmptyState title="No review comments yet." />}
            <div className="detail-actions">
              <Link className="secondary-button" to={`/demo/reviews/${review.id}`}>Open screening room</Link>
              <button className="secondary-button" type="button" onClick={() => setNoteOpen(true)}>Request changes</button>
              <button className="primary-button" type="button" onClick={approve}>Approve version</button>
            </div>
          </section>
        )}

        <section className="portal-block">
          <span className="eyebrow">INVOICE</span>
          <h2>{finance.outstanding > 0 ? `${formatMoney(finance.outstanding)} open` : 'Nothing outstanding'}</h2>
          <p>Invoiced {formatMoney(finance.invoiced)} · paid {formatMoney(finance.paid)}. Figures are part of the demo ledger.</p>
        </section>
      </main>

      <Modal open={noteOpen} title="Request changes" onClose={() => setNoteOpen(false)}>
        <form className="modal-form" onSubmit={request}>
          <label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} rows="4" placeholder="What should move in the next cut?" /></label>
          <div className="detail-actions">
            <button className="secondary-button" type="button" onClick={() => setNoteOpen(false)}>Cancel</button>
            <button className="primary-button" type="submit">Send to the studio</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

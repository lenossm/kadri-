import { useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useAuth } from '../state/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime, relativeDay } from '../utils/format';

export default function ClientProjectPage() {
  const { id } = useParams();
  const { clientAccess } = useOutletContext() || {};
  const { user, profile } = useAuth();
  const access = (clientAccess || []).find((a) => a.project_id === id);
  const [project, setProject] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!supabase || !id) return undefined;
    let cancelled = false;
    (async () => {
      const { data: p, error: pErr } = await supabase.from('projects').select('id,title,type,location,stage,progress,due,status').eq('id', id).maybeSingle();
      if (cancelled) return;
      if (pErr || !p) {
        setError('Access denied');
        return;
      }
      setProject(p);
      const { data: rv } = await supabase.from('review_versions').select('*').eq('project_id', id).eq('published_to_client', true);
      const ids = (rv || []).map((r) => r.id);
      let comments = [];
      if (ids.length) {
        const { data: c } = await supabase.from('review_comments').select('*').in('review_id', ids);
        comments = c || [];
      }
      setReviews((rv || []).map((r) => ({
        ...r,
        comments: comments.filter((c) => c.review_id === r.id && c.visibility === 'client'),
      })));
      if (access?.can_view_invoice) {
        const { data: inv } = await supabase.from('invoices').select('invoice,amount,due,status').eq('project_id', id);
        setInvoices(inv || []);
      }
      const { data: del } = await supabase.from('delivery_items').select('*').eq('project_id', id);
      setDeliveries(del || []);
    })();
    return () => { cancelled = true; };
  }, [id, access?.can_view_invoice]);

  if (!access && clientAccess) return <Navigate to="/client" replace />;
  if (error) {
    return (
      <main>
        <span className="eyebrow">PORTAL</span>
        <h1>Project not found.</h1>
        <p>This access has been revoked, or the link is not for this account.</p>
        <Link className="primary-button" to="/client">Back to projects</Link>
      </main>
    );
  }
  if (!project) return <main><h1>Opening project…</h1></main>;

  const review = reviews[0];
  const author = profile?.full_name || user?.email || 'Client';

  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim() || !review || !access?.can_comment) return;
    await supabase.from('review_comments').insert({
      workspace_id: access.workspace_id || review.workspace_id,
      review_id: review.id,
      author_id: user.id,
      author_name: author,
      time_seconds: 0,
      text: text.trim(),
      visibility: 'client',
    });
    setReviews((list) => list.map((r) => r.id === review.id
      ? { ...r, comments: [...r.comments, { id: `local-${Date.now()}`, author_name: author, text: text.trim(), time_seconds: 0, visibility: 'client' }] }
      : r));
    setText('');
  };

  const setStatus = async (status, extra) => {
    if (!review || !access?.can_approve) return;
    await supabase.from('review_versions').update({ status }).eq('id', review.id);
    if (extra) {
      await supabase.from('review_comments').insert({
        workspace_id: review.workspace_id,
        review_id: review.id,
        author_id: user.id,
        author_name: author,
        time_seconds: 0,
        text: extra,
        visibility: 'client',
      });
    }
    setReviews((list) => list.map((r) => r.id === review.id ? { ...r, status } : r));
  };

  return (
    <main>
      <header className="portal-hero">
        <div>
          <span className="eyebrow">{project.type} / {project.location}</span>
          <h1>{project.title}</h1>
        </div>
        <p>Shared with you by the production. Internal studio notes are not part of this portal.</p>
      </header>
      <section className="portal-status">
        <article><span>CURRENT STAGE</span><strong>{project.stage}</strong></article>
        <article><span>LATEST REVIEW</span><strong>{review ? `${review.version} · ${review.status}` : 'None yet'}</strong></article>
        <article><span>NEXT MILESTONE</span><strong>{relativeDay(project.due)}</strong></article>
      </section>
      {review && access?.can_view_review && (
        <section className="portal-block">
          <div className="section-head">
            <div><span className="eyebrow">FEEDBACK</span><h2>{review.title}</h2></div>
            <StatusPill>{review.status}</StatusPill>
          </div>
          {review.comments.length ? review.comments.map((c) => (
            <div className="portal-comment" key={c.id}>
              <time>{formatTime(Number(c.time_seconds || c.time || 0))}</time>
              <span><b>{c.author_name || c.author}</b> {c.text}</span>
            </div>
          )) : <EmptyState title="No comments yet." />}
          {access?.can_comment && (
            <form className="modal-form" onSubmit={addComment}>
              <label>Client-visible note<textarea value={text} onChange={(e) => setText(e.target.value)} rows="3" /></label>
              <button className="primary-button" type="submit">Add comment</button>
            </form>
          )}
          {access?.can_approve && (
            <div className="detail-actions">
              <button className="secondary-button" type="button" onClick={() => setNoteOpen(true)}>Request changes</button>
              <button className="primary-button" type="button" onClick={() => setStatus('Approved')}>Approve version</button>
            </div>
          )}
        </section>
      )}
      {access?.can_download && (
        <section className="portal-block">
          <span className="eyebrow">DELIVERABLES</span>
          <h2>Final files</h2>
          {deliveries.length ? deliveries.map((d) => (
            <div className="data-table__row" key={d.id}><b>{d.public_title}</b><span>{d.status}</span><span>{formatDate(d.planned)}</span></div>
          )) : <p>Nothing published yet.</p>}
        </section>
      )}
      {access?.can_view_invoice && (
        <section className="portal-block">
          <span className="eyebrow">INVOICE</span>
          <h2>{invoices.length ? 'Billing' : 'No invoices shared'}</h2>
          {invoices.map((inv) => (
            <div className="data-table__row" key={inv.invoice}><b>{inv.invoice}</b><span>{inv.amount}</span><span>{inv.status}</span></div>
          ))}
        </section>
      )}
      <Modal open={noteOpen} title="Request changes" onClose={() => setNoteOpen(false)}>
        <form className="modal-form" onSubmit={(e) => { e.preventDefault(); setStatus('Changes Requested', note); setNoteOpen(false); setNote(''); }}>
          <label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} rows="4" /></label>
          <button className="primary-button" type="submit">Send to the studio</button>
        </form>
      </Modal>
    </main>
  );
}

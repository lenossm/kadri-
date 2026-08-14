import { useMemo, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { formatDate, todayIso } from '../utils/format';
import { INQUIRY_STATUSES, matchesQuery } from '../utils/selectors';
import { inquirySources, projectTypes } from '../data/fixtures';

const emptyForm = {
  company: '', person: '', email: '', phone: '', projectName: '', type: 'Commercial Film',
  budget: '', timeline: '', message: '', source: 'Website',
};

export default function InquiriesPage() {
  const { inquiries, dispatch, convertInquiry } = useWorkspace();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [source, setSource] = useState('All');

  const current = inquiries.find((x) => x.id === selected);
  const visible = useMemo(() => inquiries.filter((x) => {
    if (status !== 'All' && x.status !== status) return false;
    if (source !== 'All' && x.source !== source) return false;
    return matchesQuery(`${x.company} ${x.person} ${x.type} ${x.projectName} ${x.message}`, query);
  }), [inquiries, status, source, query]);

  const validate = (data) => {
    const next = {};
    if (!String(data.company || '').trim()) next.company = 'Company is required.';
    if (!String(data.person || '').trim()) next.person = 'A contact name is required.';
    if (!String(data.email || '').trim() || !String(data.email).includes('@')) next.email = 'A valid email is required.';
    if (!String(data.message || '').trim()) next.message = 'A brief is required.';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const onCreate = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (!validate(data)) return;
    dispatch({ type: 'ADD_INQUIRY', payload: data });
    setNewOpen(false);
    notify(`Inquiry from ${data.company} added.`);
  };

  const onEdit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (!validate(data) || !current) return;
    dispatch({ type: 'UPDATE_INQUIRY', id: current.id, patch: data });
    setEditOpen(false);
    notify('Inquiry updated.');
  };

  const onConvert = (e) => {
    e.preventDefault();
    if (!current) return;
    const form = new FormData(e.currentTarget);
    const due = String(form.get('due') || '');
    if (due && due < todayIso()) {
      setErrors({ due: 'Deadline cannot be in the past.' });
      return;
    }
    const id = convertInquiry(current.id, { owner: form.get('owner'), due });
    setConvertOpen(false);
    setSelected(null);
    notify(`${current.projectName || current.company} is now a project.`);
    if (id) navigate(`/app/projects/${id}`);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="INPUT / 01"
        title="Inquiries"
        copy="Every project starts as an incomplete sentence. Keep the useful parts, lose the inbox archaeology."
        actions={<button className="primary-button" type="button" onClick={() => { setErrors({}); setNewOpen(true); }}><Plus size={16} /> New inquiry</button>}
      />

      <div className="toolbar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, contact, type…" aria-label="Search inquiries" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option>All</option>
          {INQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
          <option>All</option>
          {inquirySources.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {visible.length ? (
        <div className="inquiry-list">
          <div className="table-head"><span>CLIENT</span><span>TYPE</span><span>BUDGET</span><span>RECEIVED</span><span>STATUS</span><span /></div>
          {visible.map((x) => (
            <button className="table-row inquiry-row" key={x.id} type="button" onClick={() => setSelected(x.id)}>
              <span><b>{x.company}</b><small>{x.person} / {x.source}</small></span>
              <span>{x.type}</span>
              <span>{x.budget || '—'}</span>
              <span>{formatDate(x.createdAt)}</span>
              <span><StatusPill>{x.status}</StatusPill></span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No inquiries match."
          copy="Clear the filters or log a new brief from the site."
          action={<button className="secondary-button" type="button" onClick={() => { setQuery(''); setStatus('All'); setSource('All'); }}>Clear filters</button>}
        />
      )}

      <Modal open={Boolean(current) && !editOpen && !convertOpen} title={current?.company || ''} onClose={() => setSelected(null)} wide>
        {current && (
          <div className="detail-grid">
            <div className="detail-main">
              <span className="eyebrow">REQUEST</span>
              <p className="detail-message">{current.message}</p>
              <div className="detail-actions">
                {current.status !== 'Converted' && current.status !== 'Archived' && (
                  <button className="primary-button" type="button" onClick={() => { setErrors({}); setConvertOpen(true); }}>Turn into project <ArrowRight size={15} /></button>
                )}
                <button className="secondary-button" type="button" onClick={() => { setErrors({}); setEditOpen(true); }}>Edit</button>
                {current.status !== 'Declined' && current.status !== 'Converted' && (
                  <button className="secondary-button" type="button" onClick={() => { dispatch({ type: 'SET_INQUIRY_STATUS', id: current.id, status: 'Declined' }); notify(`${current.company} declined.`); }}>Decline</button>
                )}
                {current.status !== 'Archived' && (
                  <button className="secondary-button" type="button" onClick={() => { dispatch({ type: 'SET_INQUIRY_STATUS', id: current.id, status: 'Archived' }); setSelected(null); notify('Inquiry archived.'); }}>Archive</button>
                )}
              </div>
            </div>
            <dl className="detail-meta">
              <dt>CONTACT</dt><dd>{current.person}<br />{current.email}{current.phone ? <><br />{current.phone}</> : null}</dd>
              <dt>PROJECT</dt><dd>{current.projectName || current.company}</dd>
              <dt>TYPE</dt><dd>{current.type}</dd>
              <dt>BUDGET</dt><dd>{current.budget || '—'}</dd>
              <dt>TIMELINE</dt><dd>{current.timeline || '—'}</dd>
              <dt>SOURCE</dt><dd>{current.source}</dd>
              <dt>RECEIVED</dt><dd>{formatDate(current.createdAt)}</dd>
              <dt>STATUS</dt><dd><StatusPill>{current.status}</StatusPill></dd>
            </dl>
          </div>
        )}
      </Modal>

      <Modal open={convertOpen} title="Turn into project" onClose={() => setConvertOpen(false)}>
        <form className="modal-form" onSubmit={onConvert}>
          <label>Project owner<input name="owner" defaultValue="Elene" /></label>
          <label>First deadline<input name="due" type="date" defaultValue={todayIso()} />{errors.due && <small className="field-error">{errors.due}</small>}</label>
          <button className="primary-button" type="submit">Create project <ArrowRight size={15} /></button>
        </form>
      </Modal>

      <Modal open={newOpen} title="New inquiry" onClose={() => setNewOpen(false)}>
        <InquiryForm onSubmit={onCreate} defaults={emptyForm} errors={errors} />
      </Modal>

      <Modal open={editOpen} title="Edit inquiry" onClose={() => setEditOpen(false)}>
        {current && <InquiryForm onSubmit={onEdit} defaults={current} errors={errors} submitLabel="Save inquiry" />}
      </Modal>
    </div>
  );
}

function InquiryForm({ onSubmit, defaults, errors, submitLabel = 'Add inquiry' }) {
  return (
    <form className="modal-form" onSubmit={onSubmit}>
      <label>Company<input required name="company" defaultValue={defaults.company} />{errors.company && <small className="field-error">{errors.company}</small>}</label>
      <label>Contact person<input required name="person" defaultValue={defaults.person} />{errors.person && <small className="field-error">{errors.person}</small>}</label>
      <label>Email<input required type="email" name="email" defaultValue={defaults.email} />{errors.email && <small className="field-error">{errors.email}</small>}</label>
      <label>Phone<input name="phone" defaultValue={defaults.phone} /></label>
      <label>Project name<input name="projectName" defaultValue={defaults.projectName} /></label>
      <label>Type<select name="type" defaultValue={defaults.type}>{projectTypes.concat(['Motion / Titles', 'Podcast / Studio']).map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>Budget<input name="budget" defaultValue={defaults.budget} placeholder="15–25K" /></label>
      <label>Timeline<input name="timeline" defaultValue={defaults.timeline} placeholder="September" /></label>
      <label>Source<select name="source" defaultValue={defaults.source}>{inquirySources.concat(['Manual']).map((s) => <option key={s}>{s}</option>)}</select></label>
      <label>Message<textarea required name="message" rows="4" defaultValue={defaults.message} />{errors.message && <small className="field-error">{errors.message}</small>}</label>
      <button className="primary-button" type="submit">{submitLabel}</button>
    </form>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { formatDate, formatMoney } from '../utils/format';
import { PAYMENT_STATUSES, matchesQuery, outstandingAmount, overdueAmount, paymentStatus } from '../utils/selectors';
import { CAP } from '../permissions/engine';

export default function PaymentsPage() {
  const { payments, projects, clients, dispatch, href, can } = useWorkspace();
  const { notify } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const projectTitle = (id) => projects.find((p) => p.id === id)?.title || '—';
  const clientName = (id) => clients.find((c) => c.id === id)?.name || '—';

  const visible = useMemo(() => payments.filter((p) => {
    const display = paymentStatus(p);
    if (status !== 'All' && display !== status) return false;
    return matchesQuery(`${projectTitle(p.projectId)} ${p.invoice} ${clientName(p.clientId)}`, query);
  }), [payments, status, query, projects, clients]);

  const invoiced = payments.reduce((a, b) => a + Number(b.amount || 0), 0);
  const paid = payments.filter((p) => paymentStatus(p) === 'Paid').reduce((a, b) => a + Number(b.amount || 0), 0);
  const outstanding = outstandingAmount(payments);

  const setStatusOf = (id, next) => {
    dispatch({ type: 'SET_PAYMENT_STATUS', id, status: next });
    const invoice = payments.find((p) => p.id === id)?.invoice;
    notify(`${invoice} marked ${next}.`);
  };

  return (
    <div className="page">
      <PageHeader eyebrow="BUSINESS / 02" title="Payments" copy="A quiet ledger for invoices attached to real work. Status changes persist with the demo workspace." />
      <div className="payment-summary">
        <div><span>INVOICED</span><strong>{formatMoney(invoiced)}</strong></div>
        <div><span>PAID</span><strong>{formatMoney(paid)}</strong></div>
        <div><span>OUTSTANDING</span><strong>{formatMoney(outstanding)}</strong></div>
      </div>
      {overdueAmount(payments) > 0 && <p className="ledger-note">{formatMoney(overdueAmount(payments))} is overdue.</p>}
      <div className="toolbar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice or project…" aria-label="Search payments" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option>All</option>
          {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {visible.length ? (
        <div className="data-table">
          <div className="data-table__head"><span>PROJECT</span><span>INVOICE</span><span>AMOUNT</span><span>DUE</span><span>STATUS</span></div>
          {visible.map((x) => {
            const display = paymentStatus(x);
            return (
              <div className="data-table__row" key={x.id}>
                <b><Link to={href(`/projects/${x.projectId}`)}>{projectTitle(x.projectId)}</Link><small className="muted-line">{clientName(x.clientId)}</small></b>
                <span>{x.invoice}</span>
                <span>{formatMoney(x.amount)}</span>
                <span>{formatDate(x.due)}</span>
                <span className="status-cell">
                  <StatusPill>{display}</StatusPill>
                  {can(CAP.PAYMENT_MANAGE) && (
                    <select aria-label={`Update ${x.invoice}`} value={x.status === 'Paid' || x.status === 'Draft' ? x.status : (display === 'Overdue' ? 'Sent' : x.status)} onChange={(e) => setStatusOf(x.id, e.target.value)}>
                      <option>Draft</option>
                      <option>Sent</option>
                      <option>Paid</option>
                    </select>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No outstanding payments." copy="Nothing matches this filter." action={<button className="secondary-button" type="button" onClick={() => { setQuery(''); setStatus('All'); }}>Clear filters</button>} />
      )}
    </div>
  );
}

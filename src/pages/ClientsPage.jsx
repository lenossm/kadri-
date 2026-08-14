import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { formatMoney, relativeDay } from '../utils/format';
import { clientStats, matchesQuery } from '../utils/selectors';
import { CAP } from '../permissions/engine';

export default function ClientsPage() {
  const { clients, projects, payments, href, can } = useWorkspace();
  const [query, setQuery] = useState('');
  const visible = useMemo(() => clients.filter((c) => matchesQuery(`${c.name} ${c.contact} ${c.email}`, query)), [clients, query]);

  return (
    <div className="page">
      <PageHeader eyebrow="BUSINESS / 01" title="Clients" copy="Relationships, not a CRM costume. Just enough context to know who is on the other side of the work." />
      <div className="toolbar">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company or contact…" aria-label="Search clients" />
      </div>
      {visible.length ? (
        <div className="data-table">
          <div className="data-table__head"><span>CLIENT</span><span>CONTACT</span><span>ACTIVE</span><span>OUTSTANDING</span><span>LAST</span></div>
          {visible.map((x) => {
            const stats = clientStats(x.id, { projects, payments });
            return (
              <Link className="data-table__row data-table__row--link" to={`${href('/projects')}?client=${x.id}`} key={x.id}>
                <b>{x.name}</b>
                <span>{x.contact}<br /><small>{x.email}</small></span>
                <span>{stats.active} live / {stats.completed} done</span>
                <span>{can(CAP.FINANCE_VIEW) || can(CAP.PAYMENT_VIEW) ? formatMoney(stats.outstanding) : '—'}</span>
                <span>{relativeDay(x.last)}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No clients match." copy="Try another name." action={<button className="secondary-button" type="button" onClick={() => setQuery('')}>Clear search</button>} />
      )}
    </div>
  );
}

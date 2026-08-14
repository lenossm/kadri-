import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';

export default function NotificationsPage() {
  const { notifications = [], href } = useWorkspace();
  return (
    <div className="page">
      <PageHeader eyebrow="INBOX" title="Notifications" copy="Each person only sees their own notices." />
      {notifications.length ? notifications.map((n) => (
        <Link className="attention-row" key={n.id} to={n.href || href('/dashboard')}>
          <span><b>{n.text}</b><small>{n.created_at || n.at}</small></span>
        </Link>
      )) : <EmptyState title="Nothing waiting." copy="Assignments, review notes and invoices will land here." />}
    </div>
  );
}

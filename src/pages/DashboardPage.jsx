import { ArrowRight, CircleDollarSign, Clapperboard, FileInput, GalleryVerticalEnd, MoveUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { CAP } from '../permissions/engine';
import { formatDate, formatMoney, relativeDay, todayIso } from '../utils/format';
import { outstandingAmount, overdueAmount, paymentStatus } from '../utils/selectors';

export default function DashboardPage() {
  const { projects, inquiries, reviews, payments, activity, stages, href, can, actor, perm } = useWorkspace();
  const inMotion = projects.filter((x) => x.stage !== 'Delivered');
  const awaiting = reviews.filter((x) => x.status === 'Awaiting Review' || x.status === 'Changes Requested');
  const shooting = projects.filter((x) => x.stage === 'Production');
  const post = projects.filter((x) => x.stage === 'Post');
  const outstanding = outstandingAmount(payments);
  const overdue = overdueAmount(payments);
  const newInquiries = inquiries.filter((x) => x.status === 'New');
  const nextDue = [...inMotion].sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];
  const today = todayIso();
  const schedule = projects
    .filter((p) => p.shootDate && p.stage !== 'Delivered')
    .sort((a, b) => {
      const aUpcoming = a.shootDate >= today ? 0 : 1;
      const bUpcoming = b.shootDate >= today ? 0 : 1;
      if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming;
      return String(a.shootDate).localeCompare(String(b.shootDate));
    })
    .slice(0, 4);
  const firstName = (actor?.name || 'there').split(' ')[0];
  const seeFinance = can(CAP.FINANCE_VIEW) || can(CAP.PAYMENT_VIEW);
  const seeInquiries = can(CAP.INQUIRY_VIEW);
  const isEditor = perm?.role === 'editor';
  const isFinance = perm?.role === 'finance';
  const isViewer = perm?.role === 'viewer';

  const copy = isEditor
    ? `${projects.length ? `${projects.length} assigned production${projects.length === 1 ? '' : 's'}` : 'No projects assigned yet'}. ${awaiting.length} review${awaiting.length === 1 ? '' : 's'} need your cut.`
    : isFinance
      ? `${overdue ? `${formatMoney(overdue)} overdue.` : 'Nothing overdue.'} ${formatMoney(outstanding)} still open.`
      : isViewer
        ? 'Read-only view of the productions you were given.'
        : `${awaiting.length} version${awaiting.length === 1 ? '' : 's'} waiting on a client, ${shooting.length} on set, ${post.length} in post.${seeFinance && overdue ? ` ${formatMoney(overdue)} is overdue.` : ''}`;

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${formatDate(today).toUpperCase()} / TBILISI`}
        title={`Good morning, ${firstName}.`}
        copy={copy}
      />

      <section className="dashboard-hero-grid">
        <Link className="hero-metric" to={href('/projects')}>
          <span>{isEditor ? 'MY PROJECTS' : 'PROJECTS IN MOTION'}</span>
          <strong>{String(inMotion.length).padStart(2, '0')}</strong>
          <p>{isEditor ? 'Only productions assigned to you.' : 'Across film, studio and documentary.'}</p>
        </Link>
        <Link className="hero-metric hero-metric--dark" to={nextDue ? href(`/projects/${nextDue.id}`) : href('/pipeline')}>
          <span>NEXT DEADLINE</span>
          <strong>{nextDue ? <><span>{formatDate(nextDue.due).split(' ')[0]}</span><small>{formatDate(nextDue.due).split(' ')[1]?.toUpperCase()}</small></> : '—'}</strong>
          <p>{nextDue ? `${nextDue.title} / ${nextDue.stage}` : 'Nothing dated.'}</p>
        </Link>
        {seeFinance ? (
          <Link className="hero-metric" to={href('/payments')}>
            <span>OUTSTANDING</span>
            <strong>{formatMoney(outstanding)}</strong>
            <p>{overdue ? `${formatMoney(overdue)} overdue.` : 'No overdue invoices.'}</p>
          </Link>
        ) : (
          <Link className="hero-metric" to={href('/reviews')}>
            <span>REVIEWS</span>
            <strong>{String(awaiting.length).padStart(2, '0')}</strong>
            <p>{awaiting[0] ? awaiting[0].title : 'Nothing waiting.'}</p>
          </Link>
        )}
      </section>

      {!projects.length && (
        <EmptyState
          title={isEditor ? 'No projects assigned yet.' : perm?.role === 'owner' ? 'Create your first project.' : 'Nothing on the board.'}
          copy={isEditor ? "You'll see productions here when you're added to a project." : 'Invite the team, add a client, open a brief.'}
        />
      )}

      <section className="section-block">
        <div className="section-head"><div><span className="eyebrow">ACTIVE PRODUCTION</span><h2>{isEditor ? 'Assigned' : 'In motion'}</h2></div><Link to={href('/pipeline')}>Open pipeline <ArrowRight size={15} /></Link></div>
        <div className="project-strip">
          {inMotion.slice(0, 4).map((project, i) => (
            <Link to={href(`/projects/${project.id}`)} className="project-tile" key={project.id}>
              <div className="project-tile__top"><span>{String(i + 1).padStart(2, '0')}</span><StatusPill>{project.stage}</StatusPill></div>
              <h3>{project.title}</h3>
              <p>{project.type}</p>
              <div className="project-progress"><i style={{ width: `${project.progress}%` }} /></div>
              <div className="project-tile__foot"><span>{project.owner}</span><span>{relativeDay(project.due)}</span><MoveUpRight size={15} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-lower">
        <div className="activity-panel">
          <div className="section-head"><div><span className="eyebrow">TODAY</span><h2>Attention queue</h2></div></div>
          {seeInquiries && (
            <Link to={href('/inquiries')} className="attention-row">
              <FileInput /><span><b>{newInquiries.length} new inquiries</b><small>{newInquiries[0] ? `${newInquiries[0].company} is waiting.` : 'Inbox is clear.'}</small></span><ArrowRight />
            </Link>
          )}
          {can(CAP.REVIEW_VIEW) && (
            <Link to={href('/reviews')} className="attention-row">
              <GalleryVerticalEnd /><span><b>{awaiting.length} awaiting a cut</b><small>{awaiting[0] ? `${awaiting[0].title} is due ${relativeDay(awaiting[0].due)}.` : 'Nothing in review.'}</small></span><ArrowRight />
            </Link>
          )}
          {seeFinance && (
            <Link to={href('/payments')} className="attention-row">
              <CircleDollarSign /><span><b>{formatMoney(outstanding)} outstanding</b><small>{payments.filter((p) => paymentStatus(p) === 'Overdue').length} invoice{payments.filter((p) => paymentStatus(p) === 'Overdue').length === 1 ? '' : 's'} overdue.</small></span><ArrowRight />
            </Link>
          )}
          <Link to={href('/projects')} className="attention-row">
            <Clapperboard /><span><b>{shooting.length} currently shooting</b><small>{shooting[0] ? shooting.map((p) => p.title).join(', ') : 'No unit on the floor.'}</small></span><ArrowRight />
          </Link>
          <div className="pipeline-mini" aria-hidden="true">
            {stages.map((stage) => {
              const n = projects.filter((p) => p.stage === stage).length;
              return <div key={stage}><span>{stage}</span><b>{n}</b></div>;
            })}
          </div>
        </div>
        <div className="today-panel">
          <span className="eyebrow">PRODUCTION DAY</span>
          {(schedule.length ? schedule : inMotion.slice(0, 4)).map((item) => (
            <Link className="today-item" to={href(`/projects/${item.id}`)} key={item.id}>
              <time>{item.shootDate ? relativeDay(item.shootDate) : relativeDay(item.due)}</time>
              <span>{item.title} / {item.stage === 'Production' ? 'on set' : item.stage.toLowerCase()}</span>
            </Link>
          ))}
          <div className="activity-mini">
            <span className="eyebrow">RECENT</span>
            {activity.slice(0, 4).map((a) => (
              <p key={a.id}>{a.text}</p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

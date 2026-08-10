import { ArrowRight, CalendarDays, CircleDollarSign, Clock3, Eye, FileInput, GalleryVerticalEnd, MoveUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { useWorkspace } from '../state/WorkspaceContext';
import { payments } from '../data/fixtures';

export default function DashboardPage() {
  const { projects, inquiries, reviews } = useWorkspace();
  const outstanding = payments.filter(x=>x.status==='Pending').reduce((a,b)=>a+b.amount,0);
  return <div className="page">
    <PageHeader eyebrow="MONDAY / 10 AUGUST / TBILISI" title="Good morning, Elene." copy="The work is moving. Two versions need eyes, one brief needs a decision and Post has the busiest desk today." />
    <section className="dashboard-hero-grid">
      <div className="hero-metric"><span>PROJECTS IN MOTION</span><strong>{String(projects.filter(x=>x.stage!=='Delivered').length).padStart(2,'0')}</strong><p>Across film, studio and documentary.</p></div>
      <div className="hero-metric hero-metric--dark"><span>NEXT DEADLINE</span><strong>14<small>AUG</small></strong><p>Night Shift master / post production.</p></div>
      <div className="hero-metric"><span>OUTSTANDING</span><strong>₾{outstanding.toLocaleString()}</strong><p>Across two active invoices.</p></div>
    </section>

    <section className="section-block">
      <div className="section-head"><div><span className="eyebrow">ACTIVE PRODUCTION</span><h2>In motion</h2></div><Link to="/app/pipeline">Open pipeline <ArrowRight size={15}/></Link></div>
      <div className="project-strip">
        {projects.slice(0,4).map((project,i)=><Link to={`/app/projects/${project.id}`} className="project-tile" key={project.id}>
          <div className="project-tile__top"><span>{String(i+1).padStart(2,'0')}</span><StatusPill>{project.stage}</StatusPill></div>
          <h3>{project.title}</h3><p>{project.type}</p>
          <div className="project-progress"><i style={{width:`${project.progress}%`}}/></div>
          <div className="project-tile__foot"><span>{project.owner}</span><span>{project.due}</span><MoveUpRight size={15}/></div>
        </Link>)}
      </div>
    </section>

    <section className="dashboard-lower">
      <div className="activity-panel">
        <div className="section-head"><div><span className="eyebrow">TODAY</span><h2>Attention queue</h2></div></div>
        <Link to="/app/inquiries" className="attention-row"><FileInput/><span><b>{inquiries.filter(x=>x.status==='New').length} new inquiries</b><small>One commercial brief is above ₾15K.</small></span><ArrowRight/></Link>
        <Link to="/app/reviews" className="attention-row"><GalleryVerticalEnd/><span><b>{reviews.length} versions in review</b><small>Room Tone V4 is waiting today.</small></span><ArrowRight/></Link>
        <Link to="/app/payments" className="attention-row"><CircleDollarSign/><span><b>₾{outstanding.toLocaleString()} outstanding</b><small>Next invoice is due 18 August.</small></span><ArrowRight/></Link>
      </div>
      <div className="today-panel">
        <span className="eyebrow">PRODUCTION DAY</span>
        {[['10:30','Night Shift / grade review'],['13:00','MZI / location call'],['16:30','Room Tone / client review'],['19:00','Rioni / rushes ingest']].map(([time,item])=><div className="today-item" key={time}><time>{time}</time><span>{item}</span></div>)}
      </div>
    </section>
  </div>;
}

import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { useWorkspace } from '../state/WorkspaceContext';

export default function ProjectsPage() {
  const { projects } = useWorkspace();
  return <div className="page"><PageHeader eyebrow="WORK / 03" title="Projects" copy="The complete production record: brief, stage, money, review and what needs to happen next." />
    <div className="project-index">{projects.map((p,i)=><Link to={`/app/projects/${p.id}`} className="project-index__row" key={p.id}><span className="index-number">{String(i+1).padStart(2,'0')}</span><div><h2>{p.title}</h2><p>{p.type} / {p.location}</p></div><StatusPill>{p.stage}</StatusPill><div className="project-index__progress"><span>{p.progress}%</span><i><b style={{width:`${p.progress}%`}}/></i></div><ArrowRight size={18}/></Link>)}</div>
  </div>;
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import StatusPill from '../components/StatusPill';
import { stages } from '../data/fixtures';
import { useWorkspace } from '../state/WorkspaceContext';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { projects, dispatch } = useWorkspace();
  const project = projects.find(x=>x.id===id);
  const [editing,setEditing]=useState(false);
  if (!project) return <div className="page"><h1>Project not found.</h1></div>;
  return <div className="page project-detail">
    <Link to="/app/projects" className="back-link"><ArrowLeft size={15}/> All projects</Link>
    <header className="project-detail__hero"><div><span className="eyebrow">{project.type} / {project.location}</span><h1>{project.title}</h1><div className="project-detail__tags"><StatusPill>{project.stage}</StatusPill><span>{project.owner}</span><span>Due {project.due}</span></div></div><div className="project-poster"><video muted autoPlay loop playsInline src="/media/kadri-review.mp4" poster="/media/kadri-review-poster.jpg"/></div></header>
    <div className="project-detail__body"><section><div className="section-head"><div><span className="eyebrow">BRIEF</span><h2>The frame</h2></div><button className="secondary-button" onClick={()=>setEditing(!editing)}>{editing?'Cancel':'Edit brief'}</button></div>{editing?<form className="project-edit" onSubmit={(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);dispatch({type:'UPDATE_PROJECT',id,patch:{brief:f.get('brief'),owner:f.get('owner'),due:f.get('due'),stage:f.get('stage')}});setEditing(false)}}><label>Brief<textarea name="brief" defaultValue={project.brief} rows="7"/></label><div className="two-col"><label>Owner<input name="owner" defaultValue={project.owner}/></label><label>Due<input name="due" defaultValue={project.due}/></label></div><label>Stage<select name="stage" defaultValue={project.stage}>{stages.map(x=><option key={x}>{x}</option>)}</select></label><button className="primary-button"><Save size={15}/> Save changes</button></form>:<p className="large-copy">{project.brief}</p>}</section><aside className="project-ledger"><span className="eyebrow">LEDGER</span><dl><dt>CLIENT</dt><dd>{project.client}</dd><dt>BUDGET</dt><dd>₾{project.budget.toLocaleString()}</dd><dt>PROGRESS</dt><dd>{project.progress}%</dd><dt>OWNER</dt><dd>{project.owner}</dd><dt>DEADLINE</dt><dd>{project.due}</dd></dl></aside></div>
  </div>;
}

import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { stages } from '../data/fixtures';
import { useWorkspace } from '../state/WorkspaceContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PipelinePage() {
  const { projects, dispatch } = useWorkspace();
  const move = (p, dir) => { const i=stages.indexOf(p.stage); const next=stages[Math.max(0,Math.min(stages.length-1,i+dir))]; dispatch({type:'MOVE_PROJECT',id:p.id,stage:next,progress:Math.max(p.progress,Math.round(((stages.indexOf(next)+1)/stages.length)*100))}) };
  return <div className="page page--wide"><PageHeader eyebrow="WORK / 02" title="Pipeline" copy="A production map, not a task graveyard. Every project has one clear next stage." />
    <div className="pipeline-board">{stages.map(stage=><section className="pipeline-column" key={stage}><header><span>{stage}</span><b>{projects.filter(x=>x.stage===stage).length}</b></header><div>{projects.filter(x=>x.stage===stage).map(p=><article className="pipeline-card" key={p.id}><div className="pipeline-card__top"><small>{p.type}</small><StatusPill>{p.status}</StatusPill></div><h3>{p.title}</h3><p>{p.client}</p><div className="pipeline-card__meta"><span>{p.owner}</span><span>{p.due}</span></div><div className="pipeline-card__move"><button disabled={stage===stages[0]} onClick={()=>move(p,-1)} aria-label="Move previous"><ChevronLeft size={15}/></button><button disabled={stage===stages.at(-1)} onClick={()=>move(p,1)} aria-label="Move next"><ChevronRight size={15}/></button></div></article>)}</div></section>)}</div>
  </div>;
}

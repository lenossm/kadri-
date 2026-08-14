import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { CAP } from '../permissions/engine';
import { relativeDay } from '../utils/format';

export default function PipelinePage() {
  const { projects, dispatch, stages, clients, href, can } = useWorkspace();
  const { notify } = useToast();
  const [over, setOver] = useState(null);
  const clientName = (id) => clients.find((c) => c.id === id)?.name || '—';

  const canMove = can(CAP.PROJECT_STAGE);

  const move = (project, dir) => {
    if (!canMove) return;
    const i = stages.indexOf(project.stage);
    const next = stages[Math.max(0, Math.min(stages.length - 1, i + dir))];
    if (next === project.stage) return;
    dispatch({ type: 'MOVE_PROJECT', id: project.id, stage: next });
    notify(`${project.title} moved to ${next}.`);
  };

  const drop = (stage, event) => {
    event.preventDefault();
    if (!canMove) return;
    const id = event.dataTransfer.getData('text/plain');
    const project = projects.find((p) => p.id === id);
    setOver(null);
    if (!project || project.stage === stage) return;
    dispatch({ type: 'MOVE_PROJECT', id, stage });
    notify(`${project.title} moved to ${stage}.`);
  };

  return (
    <div className="page page--wide">
      <PageHeader eyebrow="WORK / 02" title="Pipeline" copy="A production map, not a task graveyard. Drag a card, or use the arrows. Every project has one clear next stage." />
      <div className="pipeline-board">
        {stages.map((stage) => {
          const column = projects.filter((x) => x.stage === stage);
          return (
            <section
              className={`pipeline-column ${over === stage ? 'is-over' : ''}`}
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
              onDragLeave={() => setOver((s) => s === stage ? null : s)}
              onDrop={(e) => drop(stage, e)}
            >
              <header><span>{stage}</span><b>{column.length}</b></header>
              <div>
                {column.length ? column.map((p) => (
                  <article
                    className="pipeline-card"
                    key={p.id}
                    draggable={canMove}
                    onDragStart={(e) => { if (!canMove) return; e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; }}
                  >
                    <div className="pipeline-card__top"><small>{p.type}</small><StatusPill>{p.status}</StatusPill></div>
                    <Link to={href(`/projects/${p.id}`)}><h3>{p.title}</h3></Link>
                    <p>{clientName(p.clientId)}</p>
                    <div className="pipeline-card__meta"><span>{p.owner}</span><span>{relativeDay(p.due)}</span></div>
                    {canMove && (
                    <div className="pipeline-card__move">
                      <button type="button" disabled={stage === stages[0]} onClick={() => move(p, -1)} aria-label="Move previous"><ChevronLeft size={15} /></button>
                      <button type="button" disabled={stage === stages.at(-1)} onClick={() => move(p, 1)} aria-label="Move next"><ChevronRight size={15} /></button>
                    </div>
                    )}
                  </article>
                )) : <p className="empty-column">Drop a project here.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

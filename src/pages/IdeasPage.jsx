import { useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { useWorkspace } from '../state/WorkspaceContext';

export default function IdeasPage() {
  const { ideas, dispatch } = useWorkspace(); const [open,setOpen]=useState(false);
  return <div className="page"><PageHeader eyebrow="INPUT / 02" title="Idea Pool" copy="Loose thoughts before they become decks. Keep them visible without pretending they are projects yet." actions={<button className="primary-button" onClick={()=>setOpen(true)}><Plus size={16}/> Drop an idea</button>} />
    <div className="idea-grid">{ideas.map((idea,i)=><article className={`idea-card idea-card--${(i%4)+1}`} key={idea.id}><span className="eyebrow">{idea.type}</span><h2>{idea.title}</h2><p>{idea.body}</p><div>{idea.tags.map(t=><span className="tag" key={t}>#{t}</span>)}</div></article>)}</div>
    <Modal open={open} title="Drop an idea" onClose={()=>setOpen(false)}><form className="modal-form" onSubmit={(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);dispatch({type:'ADD_IDEA',payload:{title:f.get('title'),body:f.get('body'),type:f.get('type'),tags:String(f.get('tags')).split(',').map(x=>x.trim()).filter(Boolean)}});setOpen(false)}}><label>Title<input name="title" required/></label><label>Thought<textarea name="body" rows="5" required/></label><label>Type<select name="type"><option>Film</option><option>Studio</option><option>Documentary</option><option>Outdoor</option><option>Motion</option></select></label><label>Tags<input name="tags" placeholder="night, portrait"/></label><button className="primary-button">Save idea</button></form></Modal>
  </div>;
}

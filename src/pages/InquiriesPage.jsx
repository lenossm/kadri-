import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import { useWorkspace } from '../state/WorkspaceContext';

export default function InquiriesPage() {
  const { inquiries, dispatch } = useWorkspace();
  const [selected, setSelected] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const current = inquiries.find(x=>x.id===selected);
  return <div className="page">
    <PageHeader eyebrow="INPUT / 01" title="Inquiries" copy="Every project starts as an incomplete sentence. Keep the useful parts, lose the inbox archaeology." actions={<button className="primary-button" onClick={()=>setNewOpen(true)}><Plus size={16}/> New inquiry</button>} />
    <div className="inquiry-list">
      <div className="table-head"><span>CLIENT</span><span>TYPE</span><span>BUDGET</span><span>TIMELINE</span><span>STATUS</span><span/></div>
      {inquiries.map(x=><button className="table-row inquiry-row" key={x.id} onClick={()=>setSelected(x.id)}><span><b>{x.company}</b><small>{x.person} / {x.source}</small></span><span>{x.type}</span><span>{x.budget}</span><span>{x.timeline}</span><span><StatusPill>{x.status}</StatusPill></span><ArrowRight size={16}/></button>)}
    </div>

    <Modal open={Boolean(current)} title={current?.company || ''} onClose={()=>setSelected(null)} wide>
      {current && <div className="detail-grid"><div className="detail-main"><span className="eyebrow">REQUEST</span><p className="detail-message">{current.message}</p><div className="detail-actions"><button className="primary-button" onClick={()=>setConvertOpen(true)}>Turn into project <ArrowRight size={15}/></button><button className="secondary-button" onClick={()=>dispatch({type:'SET_INQUIRY_STATUS',id:current.id,status:'Declined'})}>Decline</button></div></div><dl className="detail-meta"><dt>CONTACT</dt><dd>{current.person}<br/>{current.email}</dd><dt>TYPE</dt><dd>{current.type}</dd><dt>BUDGET</dt><dd>{current.budget}</dd><dt>TIMELINE</dt><dd>{current.timeline}</dd><dt>STATUS</dt><dd><StatusPill>{current.status}</StatusPill></dd></dl></div>}
    </Modal>

    <Modal open={convertOpen} title="Turn into project" onClose={()=>setConvertOpen(false)}>
      <form className="modal-form" onSubmit={(e)=>{e.preventDefault(); const f=new FormData(e.currentTarget); dispatch({type:'CONVERT_INQUIRY',id:current.id,owner:f.get('owner'),due:f.get('due')});setConvertOpen(false);setSelected(null)}}><label>Project owner<input name="owner" defaultValue="Elene"/></label><label>First deadline<input name="due" defaultValue="30 Aug"/></label><button className="primary-button" type="submit">Create project <ArrowRight size={15}/></button></form>
    </Modal>

    <Modal open={newOpen} title="New inquiry" onClose={()=>setNewOpen(false)}>
      <form className="modal-form" onSubmit={(e)=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));dispatch({type:'ADD_INQUIRY',payload:f});setNewOpen(false)}}><label>Company<input required name="company"/></label><label>Person<input required name="person"/></label><label>Email<input required type="email" name="email"/></label><label>Type<select name="type"><option>Commercial Film</option><option>Documentary</option><option>Motion / Titles</option><option>Podcast / Studio</option></select></label><label>Budget<input name="budget" placeholder="15–25K"/></label><label>Timeline<input name="timeline" placeholder="September"/></label><label>Message<textarea required name="message" rows="4"/></label><button className="primary-button" type="submit">Add inquiry</button></form>
    </Modal>
  </div>;
}

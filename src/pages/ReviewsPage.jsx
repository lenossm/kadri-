import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { useWorkspace } from '../state/WorkspaceContext';

export default function ReviewsPage(){const{reviews}=useWorkspace();return <div className="page"><PageHeader eyebrow="WORK / 04" title="Reviews" copy="Versions waiting for decisions. Comments stay attached to time, not buried in chat."/><div className="review-list">{reviews.map(r=><Link to={`/app/reviews/${r.id}`} className="review-row" key={r.id}><div className="review-thumb"><video muted autoPlay loop playsInline src="/media/kadri-review.mp4"/></div><div><span className="eyebrow">{r.version}</span><h2>{r.title}</h2><p>{r.comments.length} timecoded comments / due {r.due}</p></div><StatusPill>{r.status}</StatusPill><ArrowRight/></Link>)}</div></div>}

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, MessageSquarePlus, Pause, Play, RotateCcw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import StatusPill from '../components/StatusPill';
import EntityMissing from '../components/EntityMissing';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { formatTime } from '../utils/format';

export default function ReviewRoomPage() {
  const { id } = useParams();
  const { reviews, dispatch, media, role } = useWorkspace();
  const { notify } = useToast();
  const review = reviews.find((x) => x.id === id);
  const video = useRef(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const author = role === 'client' ? 'Luka B.' : 'Elene';

  useEffect(() => {
    const el = video.current;
    if (!el) return undefined;
    const onTime = () => setTime(el.currentTime);
    const onMeta = () => setDuration(el.duration || 1);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [review]);

  if (!review) return <EntityMissing label="Review" to="/app/reviews" backLabel="Back to reviews" />;

  const seek = (t) => {
    if (!video.current) return;
    video.current.currentTime = t;
    setTime(t);
  };
  const toggle = () => {
    if (!video.current) return;
    if (playing) video.current.pause();
    else video.current.play().catch(() => {});
  };
  const addComment = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: 'ADD_REVIEW_COMMENT', id: review.id, payload: { time, author, text: text.trim() } });
    setText('');
    notify(`Note added at ${formatTime(time)}.`);
  };
  const approve = () => {
    dispatch({ type: 'SET_REVIEW_STATUS', id: review.id, status: 'Approved' });
    notify('Version approved.');
  };
  const requestChanges = (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_REVIEW_STATUS', id: review.id, status: 'Changes Requested', note: note.trim() || undefined, time, author });
    setNoteOpen(false);
    setNote('');
    notify('Changes requested.');
  };

  return (
    <div className="review-room">
      <header className="review-room__top">
        <Link to="/app/reviews"><ArrowLeft size={15} /> Reviews</Link>
        <div><span>{review.title}</span><StatusPill>{review.status}</StatusPill></div>
        <span>{review.version}</span>
      </header>
      <div className="review-room__body">
        <section className="screening">
          <div className="screening-monitor">
            <video ref={video} src={media.src} poster={media.poster} onClick={toggle} />
            <button className="center-play" type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause /> : <Play />}</button>
          </div>
          <div className="review-controls">
            <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
            <span>{formatTime(time)}</span>
            <input type="range" min="0" max={duration} step="0.01" value={time} onChange={(e) => seek(Number(e.target.value))} aria-label="Seek" />
            <span>{formatTime(duration)}</span>
            <button type="button" onClick={() => seek(Math.max(0, time - 5))} aria-label="Back five seconds"><RotateCcw size={16} /></button>
          </div>
        </section>
        <aside className="comments-panel">
          <header><span className="eyebrow">TIMECODED REVIEW</span><h2>{review.comments.length} comments</h2></header>
          <div className="comment-list">
            {review.comments.length ? review.comments.map((c) => (
              <button className="comment" type="button" key={c.id} onClick={() => seek(c.time)}>
                <time>{formatTime(c.time)}</time>
                <span><b>{c.author}</b>{c.text}</span>
              </button>
            )) : <EmptyState title="No review comments yet." copy="Play the cut and leave a note on the frame." />}
          </div>
          <form className="comment-form" onSubmit={addComment}>
            <span>Add at {formatTime(time)}</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Leave a precise note…" rows="3" />
            <button className="primary-button" type="submit"><MessageSquarePlus size={15} /> Add comment</button>
          </form>
          <div className="review-decision">
            <button className="secondary-button" type="button" onClick={() => setNoteOpen(true)}>Request changes</button>
            <button className="primary-button" type="button" onClick={approve}><Check size={15} /> Approve version</button>
          </div>
        </aside>
      </div>
      <Modal open={noteOpen} title="Request changes" onClose={() => setNoteOpen(false)}>
        <form className="modal-form" onSubmit={requestChanges}>
          <p>Optional note at {formatTime(time)}. The version will be marked Changes requested.</p>
          <label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} rows="4" placeholder="What needs to move?" /></label>
          <div className="detail-actions">
            <button className="secondary-button" type="button" onClick={() => setNoteOpen(false)}>Cancel</button>
            <button className="primary-button" type="submit">Request changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

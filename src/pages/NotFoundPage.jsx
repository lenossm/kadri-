import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <span className="eyebrow">404 / LOST FRAME</span>
      <h1>Nothing<br /><em>in this cut.</em></h1>
      <Link to="/">Back to KADRI →</Link>
    </div>
  );
}

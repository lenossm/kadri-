import { Link } from 'react-router-dom';
import { useWorkspace } from '../state/WorkspaceContext';

export default function ForbiddenPage({ title = "You don't have access to this project.", copy = 'Ask a producer to assign you, or switch workspace.' }) {
  const { href } = useWorkspace();
  return (
    <div className="page">
      <span className="eyebrow">RESTRICTED</span>
      <h1 className="entity-missing__title">{title}</h1>
      <p className="entity-missing__copy">{copy}</p>
      <Link className="primary-button" to={href('/dashboard')}>Back to dashboard</Link>
    </div>
  );
}

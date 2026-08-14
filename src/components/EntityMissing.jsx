import { Link } from 'react-router-dom';

export default function EntityMissing({ label, to, backLabel }) {
  return (
    <div className="page">
      <span className="eyebrow">MISSING FRAME</span>
      <h1 className="entity-missing__title">{label} not found.</h1>
      <p className="entity-missing__copy">This record is not in the demo workspace. It may have been reset, or the link is out of date.</p>
      <Link className="primary-button" to={to}>{backLabel}</Link>
    </div>
  );
}

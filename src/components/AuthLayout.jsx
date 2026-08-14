import { Link } from 'react-router-dom';

export default function AuthLayout({ eyebrow, title, children, footer }) {
  return (
    <div className="auth-screen">
      <div className="auth-grain" />
      <Link to="/" className="landing-brand auth-brand"><span>K</span>KADRI</Link>
      <section className="auth-card">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </section>
      {footer}
    </div>
  );
}

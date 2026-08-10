export default function PageHeader({ eyebrow, title, copy, actions }) {
  return <header className="page-header">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </header>;
}

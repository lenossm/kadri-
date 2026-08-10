export default function StatusPill({ children }) {
  const key = String(children).toLowerCase().replace(/\s+/g, '-');
  return <span className={`status status--${key}`}>{children}</span>;
}

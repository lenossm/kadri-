export default function EmptyState({ title, copy, action }) {
  return (
    <div className="empty-panel">
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
      {action}
    </div>
  );
}

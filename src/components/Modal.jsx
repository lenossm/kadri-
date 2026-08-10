import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <div><span className="eyebrow">KADRI / WORKSPACE</span><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

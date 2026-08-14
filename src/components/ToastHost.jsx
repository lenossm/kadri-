import { useToast } from '../state/ToastContext';

export default function ToastHost() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id} onClick={() => dismiss(t.id)} role="status">
          {t.message}
        </div>
      ))}
    </div>
  );
}

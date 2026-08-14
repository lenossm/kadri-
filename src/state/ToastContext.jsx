import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message) => {
    const id = `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((list) => [...list, { id, message }].slice(-4));
    window.setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  const value = useMemo(() => ({ notify, toasts, dismiss }), [notify, toasts, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

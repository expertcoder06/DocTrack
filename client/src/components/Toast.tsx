/**
 * Toast.tsx – Floating toast stack displaying real-time Socket.IO notifications.
 */

import { useSocket } from '../context/SocketContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.title}</div>
            <div style={{ fontSize: '0.82rem', color: '#475569' }}>{t.body}</div>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              color: '#64748b',
              alignSelf: 'flex-start',
            }}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

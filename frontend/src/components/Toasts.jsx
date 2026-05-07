import { useEffect } from 'react';

const typeStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

export const Toasts = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (!toasts.length) return undefined;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        onDismiss(t.id);
      }, t.durationMs ?? 3500)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl border shadow-sm px-4 py-3 transition duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${typeStyles[t.type] ?? typeStyles.info}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {t.title && <div className="font-bold text-sm">{t.title}</div>}
              <div className="text-sm text-current/80 break-words">{t.message}</div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 h-8 w-8 rounded-lg hover:bg-black/5 active:scale-[0.98] transition grid place-items-center"
              aria-label="Dismiss toast"
              title="Dismiss"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};


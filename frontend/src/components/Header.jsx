import { useState } from 'react';
import { Bell } from 'lucide-react';

const Header = ({ unreadCount, notifications, onMarkAllRead, onMarkRead }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
            <span className="font-bold">S</span>
          </div>
          <div className="leading-tight">
            <div className="text-slate-900 font-extrabold tracking-tight">SWS AI</div>
            <div className="text-xs text-slate-500">Document Dashboard</div>
          </div>
        </div>

        <div className="relative">
          <button
            className="relative p-2 rounded-full transition hover:bg-slate-100 active:scale-[0.98]"
            onClick={() => setIsOpen((v) => !v)}
            aria-label="Open notifications"
            type="button"
          >
            <Bell size={22} className="text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <div
            className={`absolute right-0 mt-3 w-96 bg-white text-slate-900 shadow-xl rounded-2xl z-50 border border-slate-200 overflow-hidden origin-top-right transition duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-[0.98] pointer-events-none'
            }`}
          >
            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-b from-white to-slate-50">
              <span className="font-bold">Notifications</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllRead();
                }}
                className="text-xs text-blue-700 hover:underline font-semibold active:scale-[0.98] transition"
                type="button"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-slate-400">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={async () => {
                      if (!n.isRead) await onMarkRead(n._id);
                    }}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition active:scale-[0.995] ${
                      !n.isRead ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                      {n.message}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

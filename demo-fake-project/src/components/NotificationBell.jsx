import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotifications } from '../context/NotificationContext';
import { formatDateTime } from '../utils/date';

/**
 * Navbar ki ghanti — nayi reply ka live nishan.
 *
 * Khabar Socket.IO se aati hai (NotificationContext dekhein), is liye
 * page refresh karne ki zaroorat nahi. Hara nuqta matlab connection zinda hai.
 */
const NotificationBell = () => {
  const navigate = useNavigate();
  const { items, unreadCount, connected, markAllRead, clearAll } = useNotifications();

  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  /* Bahar click karne par band ho jaye */
  useEffect(() => {
    if (!open) return undefined;

    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };

    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const goToReply = (item) => {
    setOpen(false);
    markAllRead();
    navigate('/replies');
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unreadCount > 0) markAllRead();
        }}
        title={connected ? 'Live - new replies arrive automatically' : 'Not connected'}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-lg
                   transition hover:bg-slate-100"
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center
                       justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection ka chhota nishan */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white ${
            connected ? 'bg-green-500' : 'bg-slate-300'
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border
                     border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Notifications</p>
              <p className="text-[11px] text-slate-500">
                {connected ? 'Live - no need to refresh' : 'Connection is down'}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-slate-500 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No new replies yet
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToReply(item)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left
                              transition hover:bg-slate-50 ${item.isRead ? '' : 'bg-brand-50/60'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{item.contactName}</p>

                    <div className="flex shrink-0 gap-1">
                      {item.isAutoReply && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                          AUTO
                        </span>
                      )}
                      {item.fromSpam && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                          SPAM
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-0.5 truncate text-xs text-slate-600">{item.subject}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.from} · {formatDateTime(item.receivedAt)}
                  </p>
                </button>
              ))
            )}
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/replies');
              }}
              className="w-full bg-slate-50 px-4 py-2.5 text-xs font-semibold text-brand-700
                         transition hover:bg-slate-100"
            >
              View all replies →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

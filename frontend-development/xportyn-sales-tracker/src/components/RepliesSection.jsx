import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { inboxApi, contactsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { formatDateTime } from '../utils/date';
import StatusBadge from './StatusBadge';
import Spinner from './Spinner';

/**
 * Clients ke jawab — inbox se parh kar yahan dikhaye jate hain.
 *
 * Page khulte hi do kaam hote hain:
 *   1) Pehle se save shuda replies FAURAN dikh jate hain (tez)
 *   2) Peechhe peechhe mailbox check hota hai; naya reply mile to list khud
 *      update ho jati hai
 *
 * Is tarah button dabane ki zaroorat nahi rehti, magar page bhi ruka nahi rehta
 * (IMAP connection me kuch second lagte hain).
 */
const RepliesSection = ({ onOpenContact, onChanged }) => {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [data, setData] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [showAuto, setShowAuto] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // React StrictMode development me effect do dafa chalata hai — ye us se bachata hai
  const autoCheckDone = useRef(false);

  /* ---------- Save shuda list ---------- */
  const load = useCallback(
    (includeAuto = showAuto) =>
      inboxApi
        .replies({ includeAuto: includeAuto ? 'true' : undefined })
        .then((res) => {
          setData(res.data.data);
          setUnreadCount(res.data.unreadCount);
        })
        .catch(() => {
          /* Chup chaap -- backend purana ho to section khali dikh jayega */
        })
        .finally(() => setLoading(false)),
    [showAuto]
  );

  /* ---------- Mailbox check ---------- */
  const runCheck = useCallback(
    async ({ silent = false } = {}) => {
      setChecking(true);

      try {
        const res = await inboxApi.checkReplies();
        setLastChecked(new Date());

        // Khamoshi wali check par sirf tab batao jab waqai kuch naya mile
        if (!silent || res.data.newReplies > 0) {
          toast.success(res.data.message);
        }

        await load();
        onChanged?.();
      } catch (error) {
        if (!silent) toast.error(getErrorMessage(error, 'Inbox check nahi ho saka'));
      } finally {
        setChecking(false);
      }
    },
    [load, onChanged]
  );

  /* ---------- Page khulte hi ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await load();

      if (cancelled || autoCheckDone.current) return;
      autoCheckDone.current = true;

      // Background me — list pehle hi nazar aa chuki hoti hai
      runCheck({ silent: true });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Ek click me "Replied" ---------- */
  const markReplied = async (contact) => {
    try {
      await contactsApi.updateStatus(contact._id, 'Replied');
      await inboxApi.markRead(contact._id);

      toast.success(contact.name + ' ab "Replied" hai');
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Status update nahi hua'));
    }
  };

  const markRead = async (contact) => {
    try {
      await inboxApi.markRead(contact._id);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Mark nahi ho saka'));
    }
  };

  /* ---------- Delete ---------- */
  const deleteOne = async (contact, reply) => {
    if (!window.confirm('Ye reply hata dein?\n\n' + (reply.subject || ''))) return;

    try {
      await inboxApi.deleteReply(contact._id, reply.messageId);
      toast.success('Reply hata di gayi');
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete nahi hua'));
    }
  };

  const deleteAll = async (contact) => {
    if (!window.confirm(contact.name + ' ke saare replies hata dein?')) return;

    try {
      await inboxApi.deleteReply(contact._id);
      toast.success('Saare replies hata diye');
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete nahi hua'));
    }
  };

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="card" id="replies">
      {/* -------- Header -------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            💬 Clients ke Replies
            {unreadCount > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                {unreadCount} naye
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            {checking
              ? 'Mailbox check ho raha hai...'
              : lastChecked
                ? 'Aakhri check: ' + formatDateTime(lastChecked)
                : 'INBOX aur Spam dono parhe jate hain'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showAuto}
              onChange={(e) => {
                setShowAuto(e.target.checked);
                load(e.target.checked);
              }}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Auto-reply bhi dikhao
          </label>

          <button
            type="button"
            onClick={() => runCheck()}
            disabled={checking}
            className="btn-primary"
          >
            {checking ? 'Check ho raha hai...' : '🔄 Check Replies'}
          </button>
        </div>
      </div>

      {/* -------- List -------- */}
      {loading ? (
        <Spinner label="Replies load ho rahe hain..." />
      ) : data.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {checking ? 'Mailbox check ho raha hai...' : 'Abhi koi reply nahi'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Page khulte hi mailbox khud check ho jata hai. Dobara dekhna ho to "Check Replies"
            dabayen.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200">
          {data.map((contact) => (
            <li key={contact._id} className="p-5">
              {/* Contact ka naam aur actions */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenContact?.(contact._id)}
                    className="text-left text-sm font-bold text-brand-700 hover:underline"
                  >
                    {contact.name}
                  </button>
                  <p className="text-xs text-slate-500">
                    {contact.category} · {contact.city || '—'} · {contact.email}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <StatusBadge status={contact.status} />

                  {contact.status !== 'Replied' && (
                    <button
                      type="button"
                      onClick={() => markReplied(contact)}
                      className="rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                    >
                      ✓ Replied
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => markRead(contact)}
                    className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Parh liya
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAll(contact)}
                    className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Sab hatayen
                  </button>
                </div>
              </div>

              {/* Us contact ke saare replies */}
              <ul className="mt-3 space-y-3">
                {contact.replies.map((reply, index) => {
                  const key = contact._id + '-' + index;
                  const isOpen = expanded[key];
                  const text = reply.text || '(koi matn nahi)';
                  const isLong = text.length > 260;

                  return (
                    <li
                      key={key}
                      className={
                        'rounded-lg border p-3 ' +
                        (reply.isRead ? 'border-slate-200 bg-white' : 'border-green-200 bg-green-50')
                      }
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">
                          {reply.fromName || reply.from}
                          {reply.isAutoReply && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              AUTO-REPLY
                            </span>
                          )}
                          {reply.fromSpam && (
                            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              SPAM FOLDER
                            </span>
                          )}
                          {!reply.isRead && !reply.isAutoReply && (
                            <span className="ml-2 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              NAYA
                            </span>
                          )}
                        </p>

                        <span className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(reply.receivedAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteOne(contact, reply)}
                            title="Ye reply hatayen"
                            className="rounded px-1 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            🗑
                          </button>
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs font-medium text-slate-600">{reply.subject}</p>

                      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-slate-700">
                        {isLong && !isOpen ? text.slice(0, 260) + '...' : text}
                      </pre>

                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggle(key)}
                          className="mt-1 text-xs font-semibold text-brand-600 hover:underline"
                        >
                          {isOpen ? 'Chhota karein' : 'Poora parhein'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RepliesSection;

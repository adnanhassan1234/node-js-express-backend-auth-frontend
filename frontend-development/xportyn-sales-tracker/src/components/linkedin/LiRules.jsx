import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuShieldAlert, LuCopy, LuCheck } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';

/**
 * Qawaid aur profile checklist.
 *
 * Qawaid sirf yaad dehani nahi — inhe torne se LinkedIn account par pabandi
 * lag sakti hai. Is liye request counter bhi yahin dikhaya hai, taake hadd
 * saamne rahe.
 *
 * Profile checklist ek dafa ka kaam hai, is liye wo browser me hi mehfooz hai
 * (localStorage) — server par rakhne ka koi faida nahi.
 */

const STORE_KEY = 'xportyn_li_profile';

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const LiRules = ({ playbook }) => {
  const [checked, setChecked] = useState(readStored);
  const [requests, setRequests] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    linkedinApi
      .stats()
      .then((res) => setRequests(res.data.data.requests))
      .catch(() => {
        /* counter na mile to bhi qawaid dikhte rahen */
      });
  }, []);

  const toggle = (key) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);

    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* private window me save na ho to bhi kaam chalta rahe */
    }
  };

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1600);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy - please select the text manually');
    }
  };

  const doneCount = playbook.profileChecklist.filter((c) => checked[c.key]).length;

  return (
    <div className="space-y-4">
      {/* ---------- Counter ---------- */}
      {requests && (
        <div
          className={`card border p-4 ${
            requests.state === 'blocked'
              ? 'border-red-300 bg-red-50'
              : requests.state === 'warn'
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">
              Is hafte {requests.sent} / {requests.limit} connection requests
            </p>
            <p
              className={`text-sm font-semibold ${
                requests.state === 'blocked'
                  ? 'text-red-700'
                  : requests.state === 'warn'
                    ? 'text-amber-700'
                    : 'text-slate-500'
              }`}
            >
              {requests.state === 'blocked'
                ? 'Hadd poori — is hafte aur na bhejein'
                : requests.left + ' baqi'}
            </p>
          </div>
        </div>
      )}

      {/* ---------- Qawaid ---------- */}
      <div className="card p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
          <LuShieldAlert className="h-4 w-4 text-red-600" />
          Qawaid
        </h3>
        <p className="mb-4 text-xs text-slate-500">
          Inhe torne se account band ho sakta hai ya XPORTYN spam lagegi.
        </p>

        <ol className="space-y-2.5">
          {playbook.rules.map((rule, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-lg border-l-4 border-l-red-300 bg-red-50/50 p-3 text-sm text-slate-800"
            >
              <span className="shrink-0 font-bold text-red-600">{i + 1}</span>
              <span className="leading-relaxed">{rule}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ---------- Profile checklist ---------- */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Profile setup</h3>
          <span className="text-xs font-semibold text-slate-500">
            {doneCount} / {playbook.profileChecklist.length}
          </span>
        </div>

        <p className="mb-3 text-xs text-slate-500">
          Khareedar accept karne se pehle profile dekhte hain — saaf nazar aana chahiye ke wo kis se
          baat kar rahe hain.
        </p>

        <ul className="space-y-2">
          {playbook.profileChecklist.map((item) => (
            <li key={item.key}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition hover:bg-slate-50 ${
                  checked[item.key] ? 'bg-green-50/60' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked[item.key])}
                  onChange={() => toggle(item.key)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      checked[item.key] ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </p>

                  {item.value && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <code className="min-w-0 flex-1 break-all rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {item.value}
                      </code>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); copy(item.key, item.value); }}
                        className="btn-secondary shrink-0 py-1 text-xs"
                      >
                        {copied === item.key
                          ? <LuCheck className="h-3.5 w-3.5 text-green-600" />
                          : <LuCopy className="h-3.5 w-3.5" />}
                        {copied === item.key ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-400">
          Ye checklist sirf is browser me mehfooz hai — ek dafa ka kaam hai.
        </p>
      </div>
    </div>
  );
};

export default LiRules;

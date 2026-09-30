import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCopy, LuCheck, LuLanguages, LuSend } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';

/**
 * Outreach sequence — paanch qadam, har ek ka tayyar message.
 *
 * [Name] aur [Club] upar ek dafa bhar dein, saare messages me khud bhar jate
 * hain. "Mark as sent" us buyer ke khilaf record likh deta hai — yahin se
 * hafte wali report ki ginti banti hai.
 */

/** Template me [Name] / [Club] bharta hai */
const fill = (text, name, club) =>
  text.replace(/\[Name\]/g, name || '[Name]').replace(/\[Club\]/g, club || '[Club]');

const LiOutreach = ({ playbook, onChanged }) => {
  const [name, setName] = useState('');
  const [club, setClub] = useState('');

  const [buyerId, setBuyerId] = useState('');
  const [buyers, setBuyers] = useState([]);

  const [copied, setCopied] = useState('');
  const [showUrdu, setShowUrdu] = useState({});
  const [sending, setSending] = useState('');

  /* Buyer chunne ke liye list -- active pipeline kaafi hai */
  useEffect(() => {
    linkedinApi
      .buyers({ limit: 200, sortBy: 'name', sortDir: 'asc' })
      .then((res) => setBuyers(res.data.data))
      .catch(() => {
        /* list na mile to bhi templates copy ho sakte hain */
      });
  }, []);

  /* Buyer chunte hi [Name] aur [Club] khud bhar jayen */
  const pickBuyer = (id) => {
    setBuyerId(id);

    const b = buyers.find((x) => x._id === id);
    if (b) {
      setName(b.name || '');
      setClub(b.company || '');
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

  const markSent = async (step) => {
    if (!buyerId) {
      toast.error('Pehle buyer chunein');
      return;
    }
    if (!step.activity) {
      toast('Is qadam ka koi record nahi rakha jata', { icon: 'ℹ️' });
      return;
    }

    setSending(step.key);

    try {
      const res = await linkedinApi.logActivity(buyerId, {
        type: step.activity,
        stage: step.stage || undefined,
        note: step.label,
      });

      toast.success(res.data.message);
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not log'));
    } finally {
      setSending('');
    }
  };

  return (
    <div className="space-y-4">
      {/* ---------- Kis ke liye ---------- */}
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Buyer (pipeline se)</label>
            <select className="input" value={buyerId} onChange={(e) => pickBuyer(e.target.value)}>
              <option value="">— chunein —</option>
              {buyers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                  {b.company ? ' · ' + b.company : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">[Name]</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah" />
          </div>

          <div>
            <label className="label">[Club]</label>
            <input className="input" value={club} onChange={(e) => setClub(e.target.value)} placeholder="Bolton Wanderers FC" />
          </div>
        </div>

        {buyerId ? (
          <p className="mt-2 text-xs text-slate-500">
            Naam aur club khud bhar gaye. Ab koi bhi qadam bhej kar &quot;Mark as sent&quot; dabayein —
            record isi buyer ke khilaf likha jayega.
          </p>
        ) : (
          /*
           * Buyer chune baghair "Mark as sent" kaam nahi karta, kyunke record
           * kisi ke khilaf to likhna hai. Pehle ye click karne par error deta
           * tha; ab pehle hi bata dete hain aur button band rehta hai.
           */
          <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs font-medium text-amber-800">
            Pehle upar se buyer chunein — tab hi &quot;Mark as sent&quot; kaam karega.
            {buyers.length === 0 && ' Pipeline khali hai; pehle Pipeline tab se Add Buyer karein.'}
          </p>
        )}
      </div>

      {/* ---------- Paanch qadam ---------- */}
      {playbook.outreachSteps.map((step) => {
        const text = fill(step.body, name, club);
        const urdu = fill(step.urdu, name, club);

        return (
          <div key={step.key} className="card p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{step.label}</h3>
                <p className="text-xs text-slate-500">{step.when}</p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrdu((s) => ({ ...s, [step.key]: !s[step.key] }))}
                  className="btn-secondary py-1 text-xs"
                >
                  <LuLanguages className="h-3.5 w-3.5" />
                  {showUrdu[step.key] ? 'Hide Urdu' : 'Roman Urdu'}
                </button>

                <button type="button" onClick={() => copy(step.key, text)} className="btn-secondary py-1 text-xs">
                  {copied === step.key ? <LuCheck className="h-3.5 w-3.5 text-green-600" /> : <LuCopy className="h-3.5 w-3.5" />}
                  {copied === step.key ? 'Copied' : 'Copy'}
                </button>

                {step.activity && (
                  <button
                    type="button"
                    onClick={() => markSent(step)}
                    disabled={!buyerId || sending === step.key}
                    title={buyerId ? 'Is buyer ke khilaf record likh do' : 'Pehle upar se buyer chunein'}
                    className="btn-primary py-1 text-xs"
                  >
                    <LuSend className="h-3.5 w-3.5" />
                    {sending === step.key ? 'Saving...' : 'Mark as sent'}
                  </button>
                )}
              </div>
            </div>

            <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
              {text}
            </p>

            {showUrdu[step.key] && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm leading-relaxed text-slate-700">
                {urdu}
              </p>
            )}

            {step.note && (
              <p className="mt-2 rounded bg-amber-50 p-2 text-xs font-medium text-amber-800">{step.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LiOutreach;

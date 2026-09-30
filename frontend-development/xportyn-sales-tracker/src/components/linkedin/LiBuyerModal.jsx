import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuExternalLink, LuTrash2 } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { styleForStage } from '../../utils/linkedinStyles';
import { formatDate, formatDateTime } from '../../utils/date';

/** yyyy-mm-dd — date input ke liye */
const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

const EMPTY = {
  name: '', company: '', country: '', buyerType: 'Grassroots Club', jobTitle: '',
  linkedinUrl: '', email: '', stage: 'Request Sent', lastContactDate: '',
  nextStep: '', nextStepDate: '', notes: '',
};

/**
 * Buyer ka modal — naya banane aur purane ko badalne, dono ke liye.
 *
 * `buyerId` na ho to "naya" mode chalta hai.
 */
const LiBuyerModal = ({ buyerId, playbook, onClose, onSaved, onDeleted }) => {
  const isNew = !buyerId;

  const [form, setForm] = useState(EMPTY);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return undefined;

    let cancelled = false;

    linkedinApi
      .buyer(buyerId)
      .then((res) => {
        if (cancelled) return;
        const b = res.data.data;

        setForm({
          name: b.name || '', company: b.company || '', country: b.country || '',
          buyerType: b.buyerType, jobTitle: b.jobTitle || '',
          linkedinUrl: b.linkedinUrl || '', email: b.email || '',
          stage: b.stage,
          lastContactDate: toDateInput(b.lastContactDate),
          nextStep: b.nextStep || '',
          nextStepDate: toDateInput(b.nextStepDate),
          notes: b.notes || '',
        });

        // Naya kaam sab se upar
        setActivity([...(b.activity || [])].reverse());
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the buyer')))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [buyerId, isNew]);

  /* ESC se band */
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      lastContactDate: form.lastContactDate || null,
      nextStepDate: form.nextStepDate || null,
    };

    try {
      const res = isNew
        ? await linkedinApi.createBuyer(payload)
        : await linkedinApi.updateBuyer(buyerId, payload);

      toast.success(res.data.message);
      onSaved?.(res.data.data);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${form.name}"?`)) return;

    try {
      await linkedinApi.deleteBuyer(buyerId);
      toast.success('Buyer deleted');
      onDeleted?.();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete failed'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="my-8 w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        {/* ---- Header ---- */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900">
              {isNew ? 'Add Buyer' : form.name || 'Buyer'}
            </h2>
            <p className="text-sm text-slate-500">
              {isNew ? 'Connection request bhejte waqt row banayein' : form.company || '—'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isNew && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styleForStage(form.stage).badge}`}>
                {form.stage}
              </span>
            )}
            <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-700">
              ×
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading...</p>
        ) : (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
            {/* ---- Kaun ---- */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Club / School / Shop</label>
                <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} />
              </div>
              <div>
                <label className="label">Job Title</label>
                <input
                  className="input"
                  placeholder="Club Secretary, Athletic Director…"
                  value={form.jobTitle}
                  onChange={(e) => set('jobTitle', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input className="input" value={form.country} onChange={(e) => set('country', e.target.value)} />
              </div>
              <div>
                <label className="label">Buyer Type</label>
                <select className="input" value={form.buyerType} onChange={(e) => set('buyerType', e.target.value)}>
                  {playbook.buyerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Stage</label>
                <select className="input" value={form.stage} onChange={(e) => set('stage', e.target.value)}>
                  {playbook.stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* ---- Rabta ---- */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">LinkedIn URL</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="https://linkedin.com/in/…"
                    value={form.linkedinUrl}
                    onChange={(e) => set('linkedinUrl', e.target.value)}
                  />
                  {form.linkedinUrl && (
                    <a
                      href={form.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Profile kholein"
                      className="flex shrink-0 items-center rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
                    >
                      <LuExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>

            {/* ---- Agla qadam ---- */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="label">Next Step</label>
                  <input
                    className="input"
                    placeholder="Send Step 2, ask about next season…"
                    value={form.nextStep}
                    onChange={(e) => set('nextStep', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Next Step Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.nextStepDate}
                    onChange={(e) => set('nextStepDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="label">Last Contact</label>
                <input
                  type="date"
                  className="input sm:w-56"
                  value={form.lastContactDate}
                  onChange={(e) => set('lastContactDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Kya baat hui, kya chahiye…"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>

            {/* ---- Activity ka record ---- */}
            {!isNew && (
              <div>
                <p className="label">Activity ({activity.length})</p>

                {activity.length === 0 ? (
                  <p className="text-xs text-slate-400">Abhi koi record nahi</p>
                ) : (
                  <ol className="space-y-1.5">
                    {activity.map((a, i) => (
                      <li key={i} className="flex items-baseline gap-2 border-l-2 border-brand-300 pl-3 text-xs">
                        <span className="font-semibold text-slate-700">
                          {playbook.activityLabels[a.type] || a.type}
                        </span>
                        <span className="text-slate-400">{formatDateTime(a.at)}</span>
                        {a.note && <span className="text-slate-500">· {a.note}</span>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- Footer ---- */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-4">
          {isNew ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600"
            >
              <LuTrash2 className="h-4 w-4" />
              Delete
            </button>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving || loading} className="btn-primary">
              {saving ? 'Saving...' : isNew ? 'Add Buyer' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiBuyerModal;

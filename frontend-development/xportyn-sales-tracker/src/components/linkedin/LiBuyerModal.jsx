import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LuExternalLink, LuTrash2, LuFileUp } from 'react-icons/lu';

import CountrySelect from '../CountrySelect';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { styleForStage } from '../../utils/linkedinStyles';
import { formatDate, formatDateTime } from '../../utils/date';

/**
 * yyyy-mm-dd — date input ke liye, LOCAL din ke hisaab se.
 *
 * toISOString() yahan ghalat tha: 6 Oct ki aadhi raat (local) UTC me 5 Oct
 * ki shaam hoti hai, to input me ek din PEHLE ki tareekh aa jati thi.
 */
const toDateInput = (v) => {
  if (!v) return '';

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';

  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};

/**
 * Naya buyer add karte waqt agla qadam kitne din baad aata hai.
 *
 * 5 is liye ke 1 tareekh ko add karein to 6 tareekh aaye -- yehi mamool hai.
 * Badalna ho to bas ye number badal dein.
 */
const NEXT_STEP_DAYS = 5;

/** Aaj se N din aage ka din */
const dayFromToday = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateInput(d);
};

/**
 * Naye buyer ka form.
 *
 * Ye function hai, sabit object nahi: tareekhein "aaj" par mabni hain, aur
 * agar app raat bhar khuli rahe to sabit object kal ki tareekh dikhata rehta.
 * Function har dafa modal khulne par naya hisaab karta hai.
 */
const emptyForm = () => ({
  name: '', company: '', country: '', buyerType: 'Grassroots Club', jobTitle: '',
  linkedinUrl: '', email: '', stage: 'Request Sent',

  // Buyer aam tor par usi din add hota hai jis din request bheji jati hai
  lastContactDate: dayFromToday(0),
  nextStep: '',
  nextStepDate: dayFromToday(NEXT_STEP_DAYS),
  notes: '',
});

/**
 * Buyer ka modal — naya banane aur purane ko badalne, dono ke liye.
 *
 * `buyerId` na ho to "naya" mode chalta hai.
 */
const LiBuyerModal = ({ buyerId, playbook, onClose, onSaved, onDeleted }) => {
  const isNew = !buyerId;

  const [form, setForm] = useState(emptyForm);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  /* LinkedIn ka profile PDF */
  const pdfRef = useRef(null);
  const [reading, setReading] = useState(false);
  const [filled, setFilled] = useState([]);

  /**
   * PDF ka asal text.
   *
   * Parser andaza lagata hai, aur LinkedIn ka PDF har profile par thora alag
   * hota hai. Jab andaza ghalat nikle to asal text hi batata hai ke kyun --
   * is liye usay chhupane ke bajaye dikhane ka raasta rakha hai.
   */
  const [raw, setRaw] = useState('');
  const [showRaw, setShowRaw] = useState(false);

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

  /**
   * LinkedIn ke "Save to PDF" se form bharna.
   *
   * PDF ka dhancha har profile par thora alag hota hai, is liye jo nikalta hai
   * wo ANDAZA hai -- seedha save nahi hota, sirf form bhar jata hai. Jo khaane
   * aap pehle bhar chuke hain unhe haath nahi lagta; sirf khali khaane bharte
   * hain, warna PDF aap ki likhi hui cheez mita deti.
   */
  const readPdf = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setReading(true);
    setFilled([]);

    try {
      const res = await linkedinApi.buyerFromPdf(file);
      const d = res.data.data;

      setRaw(d.raw || '');
      setShowRaw(false);

      const got = [];

      setForm((f) => {
        const next = { ...f };

        [
          ['name', 'Name'],
          ['company', 'Organization'],
          ['jobTitle', 'Job Title'],
          ['country', 'Country'],
          ['linkedinUrl', 'LinkedIn URL'],
          ['email', 'Email'],
        ].forEach(([key, label]) => {
          if (d[key] && !next[key]) {
            next[key] = d[key];
            got.push(label);
          }
        });

        return next;
      });

      setFilled(got);

      if (got.length === 0) {
        toast('PDF parh li — magar jo mila wo pehle se bhara hua tha', { icon: 'ℹ️' });
      } else {
        toast.success(got.length + ' khaane bhar diye — dekh kar save karein');
      }
    } catch (error) {
      // 422 par bhi text aata hai -- usay dikha dein, wahi masla samjhata hai
      setRaw(error?.response?.data?.data?.raw || '');
      toast.error(getErrorMessage(error, 'PDF parhi nahi ja saki'));
    } finally {
      setReading(false);
    }
  };

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
            {/*
              Sirf naye buyer par. Purana badalte waqt PDF se bharna ulta
              khatarnak hai -- aap ki likhi hui cheezein uljh sakti hain.
            */}
            {isNew && (
              <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      LinkedIn ka profile PDF se bharein
                    </p>
                    <p className="text-[11px] leading-snug text-slate-500">
                      LinkedIn par profile kholein → <strong>More</strong> →{' '}
                      <strong>Save to PDF</strong> → wo file yahan dein
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => pdfRef.current?.click()}
                    disabled={reading}
                    className="btn-secondary shrink-0 py-1.5 text-xs"
                  >
                    <LuFileUp className="h-4 w-4" />
                    {reading ? 'Parh raha hoon...' : 'PDF chunein'}
                  </button>

                  <input
                    ref={pdfRef}
                    type="file"
                    accept=".pdf"
                    onChange={readPdf}
                    className="hidden"
                  />
                </div>

                {filled.length > 0 && (
                  <p className="mt-2 rounded bg-white/70 px-2 py-1.5 text-[11px] font-medium text-green-700">
                    Bhar diye: {filled.join(', ')} — ek nazar dekh lein, andaza ghalat bhi ho
                    sakta hai
                  </p>
                )}

                {raw && (
                  <div className="mt-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRaw((v) => !v)}
                        className="text-[11px] font-semibold text-brand-700 hover:underline"
                      >
                        {showRaw ? 'PDF ka text chhupayein' : 'PDF ka text dekhein'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(raw);
                            toast.success('Text copy ho gaya');
                          } catch {
                            setShowRaw(true);
                            toast('Copy nahi hua — neeche se khud select kar lein', { icon: 'ℹ️' });
                          }
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:underline"
                      >
                        Text copy karein
                      </button>

                      <span className="text-[11px] text-slate-400">
                        kuch ghalat bhara ho to ye text bhej dein
                      </span>
                    </div>

                    {showRaw && (
                      <pre className="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-2 text-[11px] leading-snug text-slate-600">
                        {raw}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---- Kaun ---- */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Organization</label>
                <input
                  className="input"
                  placeholder="Merrick Football Group, Bolton Wanderers FC…"
                  value={form.company}
                  onChange={(e) => set('company', e.target.value)}
                />
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
                <CountrySelect value={form.country} onChange={(v) => set('country', v)} />
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

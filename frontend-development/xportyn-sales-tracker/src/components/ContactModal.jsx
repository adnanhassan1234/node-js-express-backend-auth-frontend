import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { contactsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { STATUSES, styleForStatus } from '../utils/statusStyles';
import { toDateInput, formatDate, formatDateTime } from '../utils/date';
import Spinner from './Spinner';
import StatusBadge from './StatusBadge';

/**
 * Contact detail modal.
 *
 * Yahan se aap:
 *  - contact ki details dekh sakte hain
 *  - ready email template (placeholders filled) copy ya send kar sakte hain
 *  - status / dates / notes update kar sakte hain
 */

const TEMPLATE_TABS = [
  { key: 'initial', label: 'Initial Email' },
  { key: 'followUp1', label: 'Follow-up 1' },
  { key: 'followUp2', label: 'Follow-up 2' },
];

const ContactModal = ({ contactId, onClose, onSaved, onDeleted }) => {
  const { sender } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [contact, setContact] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [activeTab, setActiveTab] = useState('initial');

  // Editable form state
  const [form, setForm] = useState({
    status: 'Email Sent',
    lastContactDate: '',
    nextFollowUpDate: '',
    notes: '',
    contactPerson: '',
    email: '',
  });

  /* ---------------- Load contact + templates ---------------- */
  useEffect(() => {
    if (!contactId) return;

    let cancelled = false;
    setLoading(true);

    contactsApi
      .template(contactId, { senderName: sender.name, senderTitle: sender.title })
      .then((res) => {
        if (cancelled) return;

        const { contact: loadedContact, templates: loadedTemplates } = res.data.data;

        setContact(loadedContact);
        setTemplates(loadedTemplates);
        setForm({
          status: loadedContact.status,
          lastContactDate: toDateInput(loadedContact.lastContactDate),
          nextFollowUpDate: toDateInput(loadedContact.nextFollowUpDate),
          notes: loadedContact.notes || '',
          contactPerson: loadedContact.contactPerson || '',
          email: loadedContact.email || '',
        });

        // Status ke hisaab se sensible tab pre-select karo
        if (loadedContact.status === 'Email Sent') setActiveTab('followUp1');
        else if (loadedContact.status === 'Follow-up 1') setActiveTab('followUp2');
        else setActiveTab('initial');
      })
      .catch((error) => toast.error(getErrorMessage(error, 'Could not load the contact')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [contactId, sender.name, sender.title]);

  /* ---------------- ESC se close ---------------- */
  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const activeTemplate = templates?.[activeTab];

  // Nayi email sab se upar dikhti hai
  const emailHistory = [...(contact?.emailHistory || [])].reverse();

  /* ---------------- Actions ---------------- */

  const handleCopy = async () => {
    if (!activeTemplate) return;

    const text = `Subject: ${activeTemplate.subject}\n\n${activeTemplate.body}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Email copied to clipboard');
    } catch {
      toast.error('Could not copy - please select the text manually');
    }
  };

  const handleSendEmail = () => {
    if (!contact?.email) {
      toast.error('This contact has no email address');
      return;
    }

    // mailto link backend se ready banaa hua aata hai
    window.location.href = activeTemplate.mailto;
  };

  /** Status change karte hi dates ka preview update kar dete hain */
  const handleStatusChange = (status) => {
    // Wapas "Not Contacted" par jayen to dono dates saaf ho jati hain
    if (status === 'Not Contacted') {
      setForm((prev) => ({ ...prev, status, lastContactDate: '', nextFollowUpDate: '' }));
      return;
    }

    // Pehli dafa email bhej rahe hain aur koi date nahi — to aaj ki laga do
    const lastContactDate = form.lastContactDate || toDateInput(new Date());

    const FOLLOW_UP_DAYS = { 'Email Sent': 4, 'Follow-up 1': 7 };
    const days = FOLLOW_UP_DAYS[status];

    let nextDate = '';
    if (days) {
      const d = new Date(lastContactDate);
      d.setDate(d.getDate() + days);
      nextDate = toDateInput(d);
    }

    setForm((prev) => ({ ...prev, status, lastContactDate, nextFollowUpDate: nextDate }));
  };

  /**
   * App khud email bhejti hai (SMTP se), mail client kholay baghair.
   * Bhejte hi status khud "Email Sent" / "Follow-up 1" / "Follow-up 2" ho jata hai
   * aur agli follow-up date apne aap lag jati hai.
   */
  const handleSendFromApp = async () => {
    if (!contact?.email) {
      toast.error('This contact has no email address');
      return;
    }

    const label = TEMPLATE_TABS.find((t) => t.key === activeTab)?.label || 'Email';

    if (!window.confirm('Send ' + label + ' now?\n\nTo: ' + contact.email)) return;

    setSending(true);

    try {
      const res = await contactsApi.sendEmail(contactId, {
        type: activeTab,
        senderName: sender.name,
        senderTitle: sender.title,
      });

      toast.success(res.data.message);
      onSaved?.(res.data.data);

      // Bhejte hi modal band -- agla contact foran khola ja sake
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'The email could not be sent'));
    } finally {
      setSending(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await contactsApi.update(contactId, {
        status: form.status,
        lastContactDate: form.lastContactDate || null,
        nextFollowUpDate: form.nextFollowUpDate || null,
        notes: form.notes,
        contactPerson: form.contactPerson,
        email: form.email,
      });

      toast.success('Contact updated');
      onSaved?.(res.data.data);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${contact?.name}"?`)) return;

    try {
      await contactsApi.remove(contactId);
      toast.success('Contact deleted');
      onDeleted?.(contactId);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Delete failed'));
    }
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
        {loading ? (
          <div className="p-12">
            <Spinner size="lg" label="Loading contact..." />
          </div>
        ) : !contact ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">Contact not found</p>
            <button type="button" onClick={onClose} className="btn-secondary mt-4">
              Close
            </button>
          </div>
        ) : (
          <>
            {/* -------- Header -------- */}
            <div
              className={`flex items-start justify-between gap-4 rounded-t-2xl border-b border-slate-200 p-5 ${
                styleForStatus(contact.status).row
              }`}
            >
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-900">{contact.name}</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {contact.category} · {contact.city || 'City N/A'}
                  {contact.rawCategory ? ` · ${contact.rawCategory}` : ''}
                </p>
                <div className="mt-2">
                  <StatusBadge status={contact.status} />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-2xl leading-none text-slate-500 transition hover:bg-white/60 hover:text-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-5">
              {/* ================= LEFT: details + edit ================= */}
              <div className="space-y-5 lg:col-span-2">
                {/* Contact info */}
                <div className="card p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-800">Contact Details</h3>

                  <dl className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-slate-500">Email</dt>
                      <dd className="min-w-0 break-all font-medium text-slate-800">
                        {contact.email || (
                          <span className="text-amber-600">No email</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-slate-500">Phone</dt>
                      <dd className="font-medium text-slate-800">{contact.phone || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-slate-500">Website</dt>
                      <dd className="min-w-0 break-all">
                        {contact.website ? (
                          <a
                            href={contact.website}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-brand-600 hover:underline"
                          >
                            {contact.website}
                          </a>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-slate-500">Address</dt>
                      <dd className="font-medium text-slate-800">{contact.address || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-slate-500">Country</dt>
                      <dd className="font-medium text-slate-800">{contact.country || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-slate-500">Added</dt>
                      <dd className="font-medium text-slate-800">{formatDate(contact.createdAt)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Editable fields */}
                <div className="card space-y-3 p-4">
                  <h3 className="text-sm font-bold text-slate-800">Update Tracking</h3>

                  <div>
                    <label className="label">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="input"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Last Contact</label>
                      <input
                        type="date"
                        value={form.lastContactDate}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, lastContactDate: e.target.value }))
                        }
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Next Follow-up</label>
                      <input
                        type="date"
                        value={form.nextFollowUpDate}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, nextFollowUpDate: e.target.value }))
                        }
                        className="input"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Changing the status recalculates the next follow-up date automatically (Email
                    Sent +4 days, Follow-up 1 +7 days). You can also set it manually.
                  </p>

                  <div>
                    <label className="label">Contact Person (optional)</label>
                    <input
                      type="text"
                      value={form.contactPerson}
                      onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
                      placeholder="e.g. John Smith - this fills [Contact Name] in the templates"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="info@example.com"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Call notes, who you spoke to, and so on"
                      className="input resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex-1"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={handleDelete} className="btn-danger">
                      Delete
                    </button>
                  </div>
                </div>

                {/* -------- Email History -------- */}
                <div className="card">
                  <button
                    type="button"
                    onClick={() => setShowHistory((open) => !open)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      📧 Email History
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-bold ' +
                          (emailHistory.length
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-slate-100 text-slate-500')
                        }
                      >
                        {emailHistory.length}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {showHistory ? '▲ Hide' : '▼ Show'}
                    </span>
                  </button>

                  {showHistory && (
                    <div className="border-t border-slate-200 p-4">
                      {emailHistory.length === 0 ? (
                        <p className="text-xs leading-relaxed text-slate-500">
                          No emails have been sent from the app yet.
                          <br />
                          <span className="text-slate-400">
                              Every email sent with &quot;Send Now&quot; is recorded here.
                              Emails sent from your own mail app do not appear here — the app has
                              no way of knowing about them.
                          </span>
                        </p>
                      ) : (
                        <ol className="space-y-4">
                          {emailHistory.map((item, index) => (
                            <li key={index} className="border-l-2 border-brand-400 pl-3">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="text-xs font-bold text-slate-800">
                                  {TEMPLATE_TABS.find((t) => t.key === item.type)?.label ||
                                    item.type}
                                </p>
                                <span className="shrink-0 text-[10px] font-semibold uppercase text-green-600">
                                  sent
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500">
                                {formatDateTime(item.sentAt)}
                              </p>

                              <p className="mt-1.5 break-all text-[11px] text-slate-600">
                                <span className="text-slate-400">To: </span>
                                {item.to}
                              </p>
                              <p className="break-all text-[11px] text-slate-600">
                                <span className="text-slate-400">From: </span>
                                {item.from}
                              </p>

                              <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                                {item.subject}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ================= RIGHT: email template ================= */}
              <div className="lg:col-span-3">
                <div className="card flex h-full flex-col">
                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-slate-200 p-2">
                    {TEMPLATE_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          activeTab === tab.key
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTemplate && (
                    <>
                      {/* Subject */}
                      <div className="border-b border-slate-200 p-4">
                        <p className="label">Subject</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {activeTemplate.subject}
                        </p>

                        <p className="label mt-3">To</p>
                        <p className="text-sm font-medium text-slate-700">
                          {contact.email || (
                            <span className="text-amber-600">
                              No email address - reach out by phone or website
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Body */}
                      <div className="flex-1 overflow-y-auto p-4">
                        <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-slate-700">
                          {activeTemplate.body}
                        </pre>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 border-t border-slate-200 p-4">
                        {/* App khud bhejti hai — ek click, status bhi update ho jata hai */}
                        <button
                          type="button"
                          onClick={handleSendFromApp}
                          disabled={!contact.email || sending}
                          className="btn-primary w-full"
                        >
                          {sending ? 'Processing...' : ' Send Now (Xportyn se)'}
                        </button>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="btn-secondary flex-1"
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            onClick={handleSendEmail}
                            disabled={!contact.email}
                            className="btn-secondary flex-1"
                          >
                            ✉️ Mail app me kholein
                          </button>
                        </div>

                        <p className="text-center text-[11px] text-slate-400">
                          "Send Now" sends straight from your Xportyn email and updates the status
                          for you
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactModal;

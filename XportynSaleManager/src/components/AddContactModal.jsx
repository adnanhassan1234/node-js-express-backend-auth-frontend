import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { contactsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { CATEGORIES, STATUSES } from '../utils/statusStyles';

/**
 * Naya contact haath se add karne ka modal.
 *
 * Backend ka wahi purana endpoint use karta hai: POST /api/contacts
 * (koi nayi API nahi banai — import, export, filters sab waise ke waise hain)
 *
 * Sirf Name aur Category zaroori hain; baqi sab optional.
 */
const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  city: '',
  country: 'USA',
  category: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  notes: '',
  status: 'Not Contacted',
};

const AddContactModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* ESC se band */
  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    if (!form.category) {
      toast.error('Please select a category');
      return;
    }

    setSaving(true);

    try {
      const res = await contactsApi.create({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        city: form.city.trim(),
      });

      toast.success(res.data.message || 'Contact added');
      onAdded?.(res.data.data);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add the contact'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
      >
        {/* -------- Header -------- */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Contact</h2>
            <p className="text-sm text-slate-500">
              Add contacts one at a time, without importing a sheet
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* -------- Fields -------- */}
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">
              Organization ka naam <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Baton Rouge Soccer Club"
              className="input"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select value={form.category} onChange={set('category')} className="input" required>
              <option value="">Chunein...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={set('status')} className="input">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">City</label>
            <input
              type="text"
              value={form.city}
              onChange={set('city')}
              placeholder="Baton Rouge"
              className="input"
            />
          </div>

          <div>
            <label className="label">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={set('country')}
              placeholder="USA"
              className="input"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="info@example.com"
              className="input"
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+1 225-555-0100"
              className="input"
            />
          </div>

          <div>
            <label className="label">Contact Person</label>
            <input
              type="text"
              value={form.contactPerson}
              onChange={set('contactPerson')}
              placeholder="Coach John Smith"
              className="input"
            />
          </div>

          <div>
            <label className="label">Website</label>
            <input
              type="text"
              value={form.website}
              onChange={set('website')}
              placeholder="https://example.com"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={set('address')}
              placeholder="123 Main Street"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Anything worth noting..."
              className="input resize-none"
            />
          </div>

          <p className="sm:col-span-2 text-xs text-slate-500">
            Fields marked <span className="text-red-500">*</span> are required. A contact can be
            added without an email - you can still reach them by phone or website.
          </p>
        </div>

        {/* -------- Actions -------- */}
        <div className="flex gap-2 border-t border-slate-200 p-5">
          <button type="button" onClick={onClose} disabled={saving} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Add Contact'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddContactModal;

import { useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

/**
 * Settings — yahan sender ka naam/title set hota hai.
 * Yeh values email templates ke [Your Name] aur [Your Title] me bhar jati hain.
 * (Browser ke localStorage me save hoti hain.)
 */
const Settings = () => {
  const { sender, setSender } = useAuth();

  const [form, setForm] = useState(sender);

  const handleSave = (e) => {
    e.preventDefault();
    setSender(form);
    toast.success('Settings save ho gayin — templates update ho gaye');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">
          Email templates me aapka naam aur designation kaise show ho
        </p>
      </div>

      <form onSubmit={handleSave} className="card space-y-4 p-6">
        <div>
          <label className="label">Your Name — [Your Name]</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="input"
            placeholder="Raja Ali"
            required
          />
        </div>

        <div>
          <label className="label">Your Title — [Your Title]</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="input"
            placeholder="Sales Manager"
            required
          />
        </div>

        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-slate-700">Preview (signature):</p>
          <pre className="whitespace-pre-wrap font-sans text-[13px] text-slate-600">
{`Best regards,
${form.name || '[Your Name]'}
${form.title || '[Your Title]'}, Xportyn
+92 329 1475692 | info@xportyn.com | www.xportyn.com`}
          </pre>
        </div>

        <button type="submit" className="btn-primary">
          Save Settings
        </button>
      </form>

      <div className="card p-6">
        <h3 className="mb-2 text-sm font-bold text-slate-800">Follow-up Cadence</h3>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li>
            • <strong>Email Sent</strong> → next follow-up: last contact + <strong>4 din</strong>
          </li>
          <li>
            • <strong>Follow-up 1</strong> → next follow-up: last contact + <strong>7 din</strong>
          </li>
          <li>
            • <strong>Follow-up 2</strong> → koi aur follow-up nahi
          </li>
          <li>
            • <strong>Replied / Deal Closed / No Reply</strong> → follow-up band
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Ye dates automatic set hoti hain, magar har contact ke modal me aap inhe manually bhi
          change kar sakte hain.
        </p>
      </div>
    </div>
  );
};

export default Settings;

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { templatesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

/**
 * Templates reference page.
 * Yahan raw templates (placeholders ke sath) dikhte hain,
 * aur aapke Settings ke naam/title ke sath preview bhi.
 */
const Templates = () => {
  const { sender } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeKey, setActiveKey] = useState('Soccer');
  const [showFilled, setShowFilled] = useState(true);

  useEffect(() => {
    templatesApi
      .all()
      .then((res) => setData(res.data.data))
      .catch((error) => toast.error(getErrorMessage(error, 'Templates load nahi hue')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" label="Loading templates..." />;
  if (!data) return <p className="text-slate-500">Templates load nahi hue</p>;

  // Initial + follow-up templates ko ek list me mila lete hain
  const allTemplates = {
    ...data.initial,
    ...data.followUps,
  };

  const template = allTemplates[activeKey];

  /** Preview ke liye example values bhar dete hain */
  const fill = (text) =>
    text
      .split('[Your Name]')
      .join(sender.name)
      .split('[Your Title]')
      .join(sender.title)
      .split('[Organization Name]')
      .join('Baton Rouge Soccer Club')
      .split('[City]')
      .join('Baton Rouge')
      .split('[Contact Name]')
      .join('Team')
      .split('[Original Subject]')
      .join('Custom Kits for Baton Rouge Soccer Club — Factory-Direct from Xportyn');

  const copy = async () => {
    const text = showFilled
      ? `Subject: ${fill(template.subject)}\n\n${fill(template.body)}`
      : `Subject: ${template.subject}\n\n${template.body}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Template copy ho gaya');
    } catch {
      toast.error('Copy nahi ho saka');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Email Templates</h2>
        <p className="text-sm text-slate-500">
          Contact ke modal me ye templates apne aap us contact ke data se bhar jate hain
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(allTemplates).map(([key, tpl]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveKey(key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeKey === key
                ? 'bg-brand-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Template body */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <p className="label">Subject</p>
            <p className="text-sm font-semibold text-slate-800">
              {showFilled ? fill(template.subject) : template.subject}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={showFilled}
                onChange={(e) => setShowFilled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Example data ke sath dikhao
            </label>

            <button type="button" onClick={copy} className="btn-secondary">
              📋 Copy
            </button>
          </div>
        </div>

        <div className="p-5">
          <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-slate-700">
            {showFilled ? fill(template.body) : template.body}
          </pre>
        </div>
      </div>

      {/* Placeholder reference */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-800">Placeholders</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['[Organization Name]', 'Contact ka naam (organization)'],
            ['[City]', 'Contact ki city'],
            ['[Contact Name]', 'Contact person ka naam (na ho to "Team")'],
            ['[Your Name]', `Settings se — abhi: ${sender.name}`],
            ['[Your Title]', `Settings se — abhi: ${sender.title}`],
            ['[Original Subject]', 'Follow-up me pehli email ka subject'],
          ].map(([placeholder, description]) => (
            <div key={placeholder} className="rounded-lg bg-slate-50 p-3">
              <code className="text-xs font-bold text-brand-700">{placeholder}</code>
              <p className="mt-0.5 text-xs text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Templates;

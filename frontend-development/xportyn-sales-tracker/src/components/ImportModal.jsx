import { useState } from 'react';
import toast from 'react-hot-toast';

import { contactsApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { CATEGORIES } from '../utils/statusStyles';

/**
 * Excel / CSV import modal.
 *
 * Backend multi-sheet files handle karta hai — agar aapki file me
 * "Soccer Facilities", "Colleges & Universities", "Schools" jaise tabs hain
 * to har tab apni category me chala jayega. "Overview" jaisi sheet
 * (jis me proper headers nahi) khud skip ho jati hai.
 */
const ImportModal = ({ onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [categoryOverride, setCategoryOverride] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Sirf .xlsx, .xls ya .csv file allowed hai');
      return;
    }

    setFile(selected);
    setSummary(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Pehle file select karein');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const res = await contactsApi.import(file, categoryOverride || null, (event) => {
        if (event.total) {
          setProgress(Math.round((event.loaded * 100) / event.total));
        }
      });

      setSummary(res.data.summary);
      toast.success(res.data.message);
      onImported?.();
    } catch (error) {
      // Backend 400 par bhi summary bhejta hai — dikhayein taake pata chale kya hua
      setSummary(error?.response?.data?.summary || null);
      toast.error(getErrorMessage(error, 'Import fail ho gaya'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import Contacts</h2>
            <p className="text-sm text-slate-500">Excel (.xlsx) ya CSV file upload karein</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-2xl leading-none text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* File picker */}
          <div>
            <label className="label">File</label>
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2
                         border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-brand-400 hover:bg-brand-50"
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-3xl">📄</span>
              {file ? (
                <>
                  <span className="mt-2 text-sm font-semibold text-slate-800">{file.name}</span>
                  <span className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </span>
                </>
              ) : (
                <>
                  <span className="mt-2 text-sm font-semibold text-slate-700">
                    Click to choose a file
                  </span>
                  <span className="text-xs text-slate-500">.xlsx, .xls ya .csv (max 10 MB)</span>
                </>
              )}
            </label>
          </div>

          {/* Category override */}
          <div>
            <label className="label">Force Category (optional)</label>
            <select
              value={categoryOverride}
              onChange={(e) => setCategoryOverride(e.target.value)}
              className="input"
            >
              <option value="">Auto-detect (sheet name / category column se)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Sab kuch "{c}" me daal do
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Auto-detect zyada tar theek kaam karta hai. Ye option tab use karein jab aap ek hi
              category ki single sheet upload kar rahe hon.
            </p>
          </div>

          {/* Expected columns help */}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="mb-1 font-semibold text-slate-700">Expected columns:</p>
            <p>Name, City, Category, Address, Phone, Website, Email</p>
            <p className="mt-1 text-slate-500">
              Column ka order maayne nahi rakhta. Jin rows me Name nahi hoga wo skip ho jayengi.
              Duplicate emails apne aap skip ho jate hain.
            </p>
          </div>

          {/* Progress */}
          {uploading && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-brand-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-slate-500">
                Uploading & parsing... {progress}%
              </p>
            </div>
          )}

          {/* Result summary */}
          {summary && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
              <p className="mb-2 font-bold text-slate-800">Import Summary</p>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-green-50 p-2">
                  <p className="text-slate-500">Naye add hue</p>
                  <p className="text-lg font-bold text-green-700">{summary.inserted}</p>
                </div>
                <div className="rounded bg-blue-50 p-2">
                  <p className="text-slate-500">Update hue</p>
                  <p className="text-lg font-bold text-blue-700">{summary.updated || 0}</p>
                </div>
                <div className="rounded bg-amber-50 p-2">
                  <p className="text-slate-500">Pehle se thay</p>
                  <p className="text-lg font-bold text-amber-700">{summary.duplicates}</p>
                </div>
              </div>

              {summary.updated > 0 && (
                <p className="mt-2 rounded bg-blue-50 p-2 text-xs text-blue-800">
                  {summary.updated} purane contacts me khali fields (email/phone/website) bhar di
                  gayin. Aapke status, notes aur dates bilkul waise hi hain.
                </p>
              )}

              {summary.sheetsProcessed?.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold text-slate-600">Sheets processed:</p>
                  <ul className="space-y-0.5 text-xs text-slate-600">
                    {summary.sheetsProcessed.map((s) => (
                      <li key={s.sheet}>
                        • <strong>{s.sheet}</strong> — {s.rows} rows ({s.category})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.sheetsSkipped?.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-semibold text-slate-600">Sheets skipped:</p>
                  <ul className="space-y-0.5 text-xs text-slate-500">
                    {summary.sheetsSkipped.map((s) => (
                      <li key={s.sheet}>
                        • {s.sheet} — {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(summary.skippedNoName > 0 || summary.skippedNoCategory > 0) && (
                <p className="mt-2 text-xs text-slate-500">
                  Skipped: {summary.skippedNoName} (no name), {summary.skippedNoCategory} (no
                  category)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-slate-200 p-5">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {summary ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary flex-1"
          >
            {uploading ? 'Importing...' : 'Import Contacts'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;

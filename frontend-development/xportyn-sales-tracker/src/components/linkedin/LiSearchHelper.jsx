import { useState } from 'react';
import toast from 'react-hot-toast';
import { LuCopy, LuCheck, LuExternalLink } from 'react-icons/lu';

/**
 * Buyer Finder — playbook ki search table, aur uske neeche ek khula section.
 *
 * Ahem baat: club ka page nahi, balke wo shakhs dhoondna hai jo kit khareedta
 * hai. Chhote clubs me ye aksar volunteer hota hai.
 *
 * Do hisse hain:
 *   1. Playbook wali table — har qism ke apne tay-shuda titles aur alfaaz
 *   2. Extra search — koi bhi title kisi bhi lafz ke saath (senior log,
 *      academies wagera, jo playbook me nahi the)
 */

/** LinkedIn ka People search, alfaaz pehle se bhare hue */
const linkedinSearchUrl = (query) =>
  'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(query);

const LiSearchHelper = ({ playbook }) => {
  const [copied, setCopied] = useState('');
  const [picked, setPicked] = useState({});

  /* Extra section ka apna chunav */
  const extra = playbook.extraSearch || { jobTitles: [], searchWords: [] };
  const [extraTitle, setExtraTitle] = useState(extra.jobTitles[0] || '');
  const [extraWord, setExtraWord] = useState(extra.searchWords[0] || '');

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

  /* Har qism ke liye chuna hua jora (warna pehla pehla) */
  const pick = (type) => picked[type] || {};
  const titleOf = (row) => pick(row.buyerType).title || row.jobTitles[0];
  const wordOf = (row) => pick(row.buyerType).word || row.searchWords[0];
  const queryOf = (row) => `"${titleOf(row)}" "${wordOf(row)}"`;

  const setPick = (type, part, value) =>
    setPicked((p) => ({ ...p, [type]: { ...p[type], [part]: value } }));

  const extraQuery = `"${extraTitle}" "${extraWord}"`;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm text-slate-600">
          Club ka page nahi — <strong>wo shakhs</strong> dhoondein jo kit khareedta hai. Chhote clubs
          me ye aksar volunteer hota hai.
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
          Search bar me job title aur search word likhein → <strong>People</strong> chunein → phir
          Location se filter karein. Club ya school ke page ka <strong>People</strong> tab bhi kaam ka hai.
        </p>
      </div>

      {/* ---------------- Playbook wali table ---------------- */}
      {playbook.searchHelper.map((row) => {
        const query = queryOf(row);

        return (
          <div key={row.buyerType} className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">{row.buyerType}</h3>
              <p className="text-xs text-slate-500">{row.markets.join(' · ')}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Job title</label>
                <select
                  className="input"
                  value={titleOf(row)}
                  onChange={(e) => setPick(row.buyerType, 'title', e.target.value)}
                >
                  {row.jobTitles.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Search word</label>
                <select
                  className="input"
                  value={wordOf(row)}
                  onChange={(e) => setPick(row.buyerType, 'word', e.target.value)}
                >
                  {row.searchWords.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <code className="min-w-0 flex-1 break-all text-sm text-slate-800">{query}</code>

              <button
                type="button"
                onClick={() => copy(row.buyerType, query)}
                className="btn-secondary shrink-0 py-1 text-xs"
              >
                {copied === row.buyerType
                  ? <LuCheck className="h-3.5 w-3.5 text-green-600" />
                  : <LuCopy className="h-3.5 w-3.5" />}
                {copied === row.buyerType ? 'Copied' : 'Copy'}
              </button>

              <a
                href={linkedinSearchUrl(query)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary shrink-0 py-1 text-xs"
              >
                <LuExternalLink className="h-3.5 w-3.5" />
                LinkedIn par kholein
              </a>
            </div>
          </div>
        );
      })}

      {/* ---------------- Extra search ---------------- */}
      {extra.jobTitles.length > 0 && (
        <div className="card border-l-4 border-l-brand-500 p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800">Extra search</h3>
            <p className="text-xs text-slate-500">
              {extra.jobTitles.length} × {extra.searchWords.length} = {extra.jobTitles.length * extra.searchWords.length} combinations
            </p>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            Upar wali table har qism ke apne titles deti hai. Ye khuli hai — <strong>koi bhi title
            kisi bhi lafz ke saath</strong> mila lein. Senior log (CEO, President, Academy Director)
            aur academy wale alfaaz yahan hain.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Job title</label>
              <select className="input" value={extraTitle} onChange={(e) => setExtraTitle(e.target.value)}>
                {extra.jobTitles.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Search word</label>
              <select className="input" value={extraWord} onChange={(e) => setExtraWord(e.target.value)}>
                {extra.searchWords.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3">
            <code className="min-w-0 flex-1 break-all text-sm text-slate-800">{extraQuery}</code>

            <button
              type="button"
              onClick={() => copy('extra', extraQuery)}
              className="btn-secondary shrink-0 py-1 text-xs"
            >
              {copied === 'extra'
                ? <LuCheck className="h-3.5 w-3.5 text-green-600" />
                : <LuCopy className="h-3.5 w-3.5" />}
              {copied === 'extra' ? 'Copied' : 'Copy'}
            </button>

            <a
              href={linkedinSearchUrl(extraQuery)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary shrink-0 py-1 text-xs"
            >
              <LuExternalLink className="h-3.5 w-3.5" />
              LinkedIn par kholein
            </a>
          </div>
        </div>
      )}

      <div className="card border-l-4 border-l-amber-400 bg-amber-50/40 p-4">
        <p className="text-sm font-semibold text-amber-900">Contact karne se pehle</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">
          Email campaign ki list dekh lein. Agar us club ko XPORTYN ki email ja chuki hai to
          connection note <strong>1b</strong> istemal karein, <strong>1a</strong> nahi. Aur ek shakhs
          ko do XPORTYN accounts se kabhi message na karein.
        </p>
      </div>
    </div>
  );
};

export default LiSearchHelper;

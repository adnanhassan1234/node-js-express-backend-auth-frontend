import { useState } from 'react';
import toast from 'react-hot-toast';
import { LuCopy, LuCheck, LuTriangleAlert, LuCirclePlus } from 'react-icons/lu';

import { linkedinApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';

/**
 * Jawab dene ki guide — buyer kya kahe, aap kya kahein.
 *
 * Jin par "Zain se poochhein" ka nishan hai wo peele hain aur unhein ek click
 * me Ask Zain ki list me daala ja sakta hai. Usool saaf hai: qeemat, shipping,
 * discount ya guarantee ka jawab khud se nahi dena.
 */
const LiReplyGuide = ({ playbook, onChanged }) => {
  const [copied, setCopied] = useState(-1);
  const [adding, setAdding] = useState(-1);

  const copy = async (i, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(-1), 1600);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy - please select the text manually');
    }
  };

  const askZain = async (row, i) => {
    const buyerName = window.prompt('Kis buyer ka sawal hai? (khali chhor sakte hain)') ?? '';

    setAdding(i);

    try {
      await linkedinApi.createQuestion({
        question: row.theySay.replace(/^"|"$/g, ''),
        buyerName,
        topic: row.askZainFor || '',
      });

      toast.success('Ask Zain me daal diya');
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add'));
    } finally {
      setAdding(-1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm text-slate-600">
          Sirf wo baatein kahein jo XPORTYN ne pakki ki hain. Baqi har cheez ka jawab dene se pehle
          Zain se poochhein — peeli rows wohi hain.
        </p>
      </div>

      {playbook.replyGuide.map((row, i) => (
        <div
          key={i}
          className={`card border-l-4 p-5 ${row.askZain ? 'border-l-amber-400 bg-amber-50/40' : 'border-l-slate-300'}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wo kahen</p>
              <p className="mt-0.5 font-bold text-slate-800">{row.theySay}</p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aap kahein</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{row.reply}</p>
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              <button type="button" onClick={() => copy(i, row.reply)} className="btn-secondary py-1 text-xs">
                {copied === i ? <LuCheck className="h-3.5 w-3.5 text-green-600" /> : <LuCopy className="h-3.5 w-3.5" />}
                {copied === i ? 'Copied' : 'Copy'}
              </button>

              {row.askZain && (
                <button
                  type="button"
                  onClick={() => askZain(row, i)}
                  disabled={adding === i}
                  className="btn-secondary border-amber-300 bg-amber-100 py-1 text-xs text-amber-900 hover:bg-amber-200"
                >
                  <LuCirclePlus className="h-3.5 w-3.5" />
                  {adding === i ? 'Adding...' : 'Ask Zain'}
                </button>
              )}
            </div>
          </div>

          {row.askZain && (
            <p className="mt-3 flex items-center gap-1.5 border-t border-amber-200 pt-2 text-xs font-bold text-amber-800">
              <LuTriangleAlert className="h-3.5 w-3.5" />
              Pehle Zain se poochhein{row.askZainFor ? ' — ' + row.askZainFor : ''}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default LiReplyGuide;

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuFacebook,
  LuInstagram,
  LuCopy,
  LuCheck,
  LuExternalLink,
  LuGlobe,
  LuHash,
  LuMessageSquare,
} from 'react-icons/lu';

import {
  ROLES,
  COMMENT_TEMPLATES,
  SEARCH_WORDS,
  PLACES,
  HASHTAGS,
  FB_TYPES,
  facebookUrl,
  instagramTagUrl,
  instagramKeywordUrl,
  googleSiteUrl,
} from '../utils/socialSearch';

/**
 * Facebook aur Instagram ka finder.
 *
 * LinkedIn ke Buyer Finder se ALAG page hai, jaan boojh kar. Wo manager ki
 * playbook ka hissa hai -- uske titles tay-shuda hain aur us kaam ki ginti
 * hafte wali report me jati hai. Ye sirf dhoondne me asani ke liye hai: koi
 * record nahi banta, koi ginti nahi hoti.
 *
 * Teenon jagah ka mizaj alag hai, is liye tareeqa bhi alag hai:
 *   LinkedIn  -> shakhs (job title se)
 *   Facebook  -> group aur page (jagah ke saath)
 *   Instagram -> hashtag (naam se dhoondna wahan kaam nahi karta)
 */

/** Chuna hua jora dikhane aur kholne wala hissa -- dono cards me wahi */
const QueryBar = ({ id, query, href, openLabel, copied, onCopy, tone = 'brand' }) => (
  <div
    className={`mt-3 flex flex-wrap items-center gap-2 rounded-lg border p-3 ${
      tone === 'pink' ? 'border-pink-200 bg-pink-50/60' : 'border-blue-200 bg-blue-50/60'
    }`}
  >
    <code className="min-w-0 flex-1 break-all text-sm text-slate-800">{query}</code>

    <button type="button" onClick={() => onCopy(id, query)} className="btn-secondary shrink-0 py-1 text-xs">
      {copied === id ? <LuCheck className="h-3.5 w-3.5 text-green-600" /> : <LuCopy className="h-3.5 w-3.5" />}
      {copied === id ? 'Copied' : 'Copy'}
    </button>

    <a href={href} target="_blank" rel="noreferrer" className="btn-primary shrink-0 py-1 text-xs">
      <LuExternalLink className="h-3.5 w-3.5" />
      {openLabel}
    </a>
  </div>
);

const SocialFinder = () => {
  const [copied, setCopied] = useState('');

  /* Facebook */
  const [fbRole, setFbRole] = useState('Founder');
  const [fbWord, setFbWord] = useState(SEARCH_WORDS[0]);
  const [fbPlace, setFbPlace] = useState(PLACES[0]);
  const [fbType, setFbType] = useState('people');

  /* Instagram */
  const [igTag, setIgTag] = useState(HASHTAGS[0]);
  const [igRole, setIgRole] = useState('Head Coach');
  const [igWord, setIgWord] = useState(SEARCH_WORDS[0]);
  const [igPlace, setIgPlace] = useState(PLACES[0]);

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

  /* "— — —" sirf list ko do hisson me baantne ke liye hai, jagah nahi */
  const cleanPlace = (p) => (p.startsWith('—') ? '' : p);

  /*
   * Native search me quotes nahi lagate -- Facebook/Instagram unhe seedha
   * nahi samajhte. Google wale raaste me lagte hain, wahan faida hota hai.
   */
  const fbQuery = [fbRole, fbWord, cleanPlace(fbPlace)].filter(Boolean).join(' ');
  const fbPath = FB_TYPES.find((t) => t.key === fbType);

  const igQuery = [igRole, igWord, cleanPlace(igPlace)].filter(Boolean).join(' ');

  const placeOptions = PLACES.map((p) => (
    <option key={p} value={p} disabled={p.startsWith('—')}>
      {p}
    </option>
  ));

  const roleOptions = ROLES.map((r) => (
    <option key={r || 'none'} value={r}>
      {r || '— Any role —'}
    </option>
  ));

  return (
    <div className="space-y-5">
      {/* ---------------- Header ---------------- */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Social Finder</h2>
        <p className="text-sm text-slate-500">
          A shortcut for finding buyers on Facebook and Instagram — separate from the LinkedIn work
        </p>
      </div>

      <div className="card border-l-4 border-l-slate-400 p-4">
        <p className="text-sm text-slate-600">
          This is for <strong>finding</strong> only. Nothing is saved here and nothing goes into the
          weekly counts — that all lives in the LinkedIn Dashboard.
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
          When you find a buyer worth keeping, add them in <strong>LinkedIn → Pipeline → Add Buyer</strong>{' '}
          — only then do they count.
        </p>
      </div>

      {/* ---------------- Facebook ---------------- */}
      <div className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <LuFacebook className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Facebook</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          On Facebook the real prize is <strong>Groups</strong> — local league and club groups.
          The admin is often the person who buys the kit.
        </p>

        {/*
          Ye sirf mashwara nahi, hifazat ki baat hai. Ajnabi ko friend request
          bhejna Facebook par shikayat ka sabab banta hai, aur chand shikayaton
          par account rok diya jata hai. Follow me ye khatra nahi -- aur maqsad
          dono se poora hota hai.
        */}
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/60 p-2.5">
          <p className="text-xs font-bold text-blue-900">Follow, do not send a friend request</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-blue-800">
            Friend requests to strangers get reported on Facebook, and a few reports are enough
            to get the account restricted. <strong>Follow</strong> carries no such risk and you
            still see their posts. To start a conversation, message the{' '}
            <strong>club Page</strong> — that is the business route, not a personal one.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Role</label>
            <select className="input" value={fbRole} onChange={(e) => setFbRole(e.target.value)}>
              {roleOptions}
            </select>
          </div>

          <div>
            <label className="label">Looking for</label>
            <select className="input" value={fbWord} onChange={(e) => setFbWord(e.target.value)}>
              {SEARCH_WORDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Location</label>
            <select className="input" value={fbPlace} onChange={(e) => setFbPlace(e.target.value)}>
              {placeOptions}
            </select>
          </div>

          <div>
            <label className="label">Search in</label>
            <select className="input" value={fbType} onChange={(e) => setFbType(e.target.value)}>
              {FB_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">{fbPath.hint}</p>

        <QueryBar
          id="fb"
          query={fbQuery}
          href={facebookUrl(fbPath.path, fbQuery)}
          openLabel={'Facebook ' + fbPath.label}
          copied={copied}
          onCopy={copy}
        />

        {/*
          Facebook ka apna search jagah ke saath kamzor hai. Google uski site
          ko behtar jaanta hai, is liye ye dusra raasta bhi diya hai.
        */}
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <LuGlobe className="h-4 w-4 shrink-0 text-slate-400" />
          <code className="min-w-0 flex-1 break-all text-xs text-slate-600">
            site:facebook.com
            {[fbRole, fbWord, cleanPlace(fbPlace)].filter(Boolean).map((t) => ' "' + t + '"')}
          </code>
          <a
            href={googleSiteUrl('facebook.com', [fbRole, fbWord, cleanPlace(fbPlace)])}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary shrink-0 py-1 text-xs"
          >
            <LuExternalLink className="h-3.5 w-3.5" />
            Via Google
          </a>
        </div>
      </div>

      {/* ---------------- Instagram ---------------- */}
      <div className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <LuInstagram className="h-5 w-5 text-pink-600" />
          <h3 className="text-sm font-bold text-slate-800">Instagram</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Searching by name on Instagram does not work the way it does on LinkedIn —{' '}
          <strong>hashtags</strong> are the real route. Clubs post their kit photos with these,
          and the <strong>bio has the email or website</strong>.
        </p>

        <div className="mb-3 rounded-lg border border-pink-200 bg-pink-50/60 p-2.5">
          <p className="text-xs font-bold text-pink-900">Follow first, DM later</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-pink-800">
            If you do not follow someone, your DM lands in <strong>Requests</strong> and is often
            never opened. Follow first, leave a real comment on a post or two, then DM.
            And check the bio — if the email is there, <strong>email beats a DM</strong>{' '}
            every time.
          </p>
        </div>

        {/* Hashtag */}
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="label">Hashtag</label>
              <select className="input" value={igTag} onChange={(e) => setIgTag(e.target.value)}>
                {HASHTAGS.map((t) => <option key={t} value={t}>#{t}</option>)}
              </select>
            </div>

            <a
              href={instagramTagUrl(igTag)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary py-1.5 text-xs"
            >
              <LuHash className="h-3.5 w-3.5" />
              Open #{igTag}
            </a>
          </div>
        </div>

        {/* Lafzon se */}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Role</label>
            <select className="input" value={igRole} onChange={(e) => setIgRole(e.target.value)}>
              {roleOptions}
            </select>
          </div>

          <div>
            <label className="label">Looking for</label>
            <select className="input" value={igWord} onChange={(e) => setIgWord(e.target.value)}>
              {SEARCH_WORDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Location</label>
            <select className="input" value={igPlace} onChange={(e) => setIgPlace(e.target.value)}>
              {placeOptions}
            </select>
          </div>
        </div>

        <QueryBar
          id="ig"
          query={igQuery}
          href={instagramKeywordUrl(igQuery)}
          openLabel="Instagram par"
          copied={copied}
          onCopy={copy}
          tone="pink"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <LuGlobe className="h-4 w-4 shrink-0 text-slate-400" />
          <code className="min-w-0 flex-1 break-all text-xs text-slate-600">
            site:instagram.com
            {[igRole, igWord, cleanPlace(igPlace)].filter(Boolean).map((t) => ' "' + t + '"')}
          </code>
          <a
            href={googleSiteUrl('instagram.com', [igRole, igWord, cleanPlace(igPlace)])}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary shrink-0 py-1 text-xs"
          >
            <LuExternalLink className="h-3.5 w-3.5" />
            Via Google
          </a>
        </div>
      </div>

      {/* ---------------- Post par comment ---------------- */}
      <div className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <LuMessageSquare className="h-5 w-5 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-800">Post par comment</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Ready-made lines to put under a club or academy post. Copy, paste.
        </p>

        {/*
          Ye sirf mashwara nahi -- yehi faisla karta hai ke comment chalta hai
          ya account par pabandi lagti hai. Ek hi jumla har post par chipkana
          dono platforms spam ginte hain, is liye saat alag mauqon ke saat
          alag jumle rakhe hain.
        */}
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
          <p className="text-xs font-bold text-amber-900">Do not paste the same comment everywhere</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
            Facebook and Instagram both read a repeated comment as{' '}
            <strong>spam</strong> — the comment gets hidden and the account gets limited.
            Pick the line that fits the post, and{' '}
            <strong>change a word or two yourself</strong> (the club name, their colours) — it reads
            as real and works better.
          </p>
        </div>

        <div className="space-y-3">
          {COMMENT_TEMPLATES.map((c) => (
            <div key={c.key} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-700">{c.when}</p>

                <button
                  type="button"
                  onClick={() => copy('c-' + c.key, c.text)}
                  className="btn-secondary shrink-0 py-1 text-xs"
                >
                  {copied === 'c-' + c.key
                    ? <LuCheck className="h-3.5 w-3.5 text-green-600" />
                    : <LuCopy className="h-3.5 w-3.5" />}
                  {copied === 'c-' + c.key ? 'Copied' : 'Copy'}
                </button>
              </div>

              <p className="rounded bg-slate-50 p-2.5 text-sm leading-relaxed text-slate-800">
                {c.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          None of these mention a price or minimum order on purpose — those change with every order,
          and a wrong number in a comment causes trouble later. The free mock-up offer is the
          one already approved in the playbook.
        </p>
      </div>

      {/* ---------------- Rozana ki hadd ---------------- */}
      {/*
        LinkedIn Dashboard par requests ka counter hai kyunke wahan ginti
        report me jati hai. Yahan koi ginti nahi hoti, magar hadd phir bhi
        hai -- aur usay na jaanna account ki pabandi par le jata hai. Is liye
        kam az kam likh kar bata dete hain.
      */}
      <div className="card border-l-4 border-l-red-400 bg-red-50/40 p-4">
        <p className="text-sm font-semibold text-red-900">Daily limits — go carefully</p>
        <p className="mt-1 text-xs leading-relaxed text-red-800">
          Facebook and Instagram do not publish their limits, but following too many at once gets
          the account restricted — especially a new one. Go steady:{' '}
          <strong>a few people a day</strong>, with gaps in between. Hundreds in one day is
          the biggest risk of all.
        </p>
        <p className="mt-1 text-xs text-red-800">
          If the account gets restricted the work stops for weeks — far more costly than the time saved.
        </p>
      </div>

      {/* ---------------- Yaad rakhne wali baatein ---------------- */}
      <div className="card border-l-4 border-l-amber-400 bg-amber-50/40 p-4">
        <p className="text-sm font-semibold text-amber-900">Before you reach out</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-800">
          <li>
            Check the email campaign list — if XPORTYN has already emailed that club, do not repeat
            the same pitch.
          </li>
          <li>
            Never advertise straight into a Facebook group. Message the admin first, or you get
            removed from the group.
          </li>
          <li>
            Do not surround one person on LinkedIn, Facebook and Instagram at once — it reads as
            stalking. Pick one place, ideally wherever they are most active.
          </li>
          <li>
            Add any buyer worth keeping in <strong>LinkedIn → Pipeline → Add Buyer</strong>, or
            they are recorded nowhere and get forgotten.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SocialFinder;

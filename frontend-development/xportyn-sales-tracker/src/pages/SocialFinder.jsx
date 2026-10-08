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
          Facebook aur Instagram par buyers dhoondne ka shortcut — LinkedIn wale kaam se alag
        </p>
      </div>

      <div className="card border-l-4 border-l-slate-400 p-4">
        <p className="text-sm text-slate-600">
          Ye sirf <strong>dhoondne</strong> ke liye hai. Yahan kuch save nahi hota aur hafte ki
          ginti me kuch nahi jata — wo sab LinkedIn Dashboard me hai.
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
          Jo buyer yahan mile aur kaam ka lage, usay <strong>LinkedIn → Pipeline → Add Buyer</strong>{' '}
          me daal dein, tab wo ginti me aayega.
        </p>
      </div>

      {/* ---------------- Facebook ---------------- */}
      <div className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <LuFacebook className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Facebook</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Facebook par asal cheez <strong>Groups</strong> hain — local league aur club ke groups.
          Admin aksar wohi shakhs hota hai jo kit khareedta hai.
        </p>

        {/*
          Ye sirf mashwara nahi, hifazat ki baat hai. Ajnabi ko friend request
          bhejna Facebook par shikayat ka sabab banta hai, aur chand shikayaton
          par account rok diya jata hai. Follow me ye khatra nahi -- aur maqsad
          dono se poora hota hai.
        */}
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/60 p-2.5">
          <p className="text-xs font-bold text-blue-900">Follow karein, friend request nahi</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-blue-800">
            Ajnabi ko friend request bhejna Facebook par shikayat ka sabab banta hai, aur chand
            shikayaton par account ruk jata hai. <strong>Follow</strong> me ye khatra nahi aur unki
            posts phir bhi nazar aati hain. Baat shuru karni ho to{' '}
            <strong>club ke Page par message</strong> karein — wo karobari raasta hai, zaati nahi.
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
            Google se
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
          Instagram par naam se dhoondna LinkedIn jaisa kaam nahi karta —{' '}
          <strong>hashtag</strong> hi asal raasta hai. Club apni kit ki tasveer in ke saath dalte
          hain, aur <strong>bio me email ya website</strong> hoti hai.
        </p>

        <div className="mb-3 rounded-lg border border-pink-200 bg-pink-50/60 p-2.5">
          <p className="text-xs font-bold text-pink-900">Follow pehle, DM baad me</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-pink-800">
            Jis ko follow nahi karte, uska DM <strong>Requests</strong> me chala jata hai aur aksar
            kabhi nahi khulta. Pehle follow karein, ek do posts par asal baat likhein, phir DM
            karein. Aur bio zarur dekhein — email wahin likhi ho to <strong>DM ke bajaye email</strong>{' '}
            behtar chalti hai.
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
              #{igTag} kholein
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
            Google se
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
          Club ya academy ki post ke neeche likhne ke liye tayyar jumle. Copy karein, paste karein.
        </p>

        {/*
          Ye sirf mashwara nahi -- yehi faisla karta hai ke comment chalta hai
          ya account par pabandi lagti hai. Ek hi jumla har post par chipkana
          dono platforms spam ginte hain, is liye saat alag mauqon ke saat
          alag jumle rakhe hain.
        */}
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
          <p className="text-xs font-bold text-amber-900">Ek hi comment har jagah na lagayein</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
            Facebook aur Instagram dono ek jaisa comment baar baar dekh kar usay{' '}
            <strong>spam</strong> gin lete hain — comment chhup jata hai aur account par hadd lag
            jati hai. Har post ke mauqe ke mutabiq alag jumla chunein, aur{' '}
            <strong>do-ek lafz apne se badal dein</strong> (club ka naam, rang) — is se comment asli
            lagta hai aur kaam bhi behtar karta hai.
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
          In me qeemat ya minimum order jaan boojh kar nahi likha — wo har order par alag hota hai,
          aur comment me ghalat number likhna baad me mushkil banata hai. Free mock-up ki peshkash
          wahi hai jo playbook me manzoor shuda hai.
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
        <p className="text-sm font-semibold text-red-900">Rozana ki hadd — ehtiyat se</p>
        <p className="mt-1 text-xs leading-relaxed text-red-800">
          Facebook aur Instagram apni hadd khul kar nahi batate, magar ek saath bohat ziyada follow
          karne par account par pabandi lag jati hai — khaas tor par naye account par. Aram se
          chalein: <strong>thore log rozana</strong>, aur beech me waqfa. Ek hi din me saikron
          follow karna sab se bara khatra hai.
        </p>
        <p className="mt-1 text-xs text-red-800">
          Account ruk gaya to kaam hafton ruk jata hai — jaldi ka faida us nuqsan se bohat kam hai.
        </p>
      </div>

      {/* ---------------- Yaad rakhne wali baatein ---------------- */}
      <div className="card border-l-4 border-l-amber-400 bg-amber-50/40 p-4">
        <p className="text-sm font-semibold text-amber-900">Contact karne se pehle</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-800">
          <li>
            Email campaign ki list dekh lein — us club ko XPORTYN ki email ja chuki ho to wohi baat
            dobara na karein.
          </li>
          <li>
            Facebook group me seedha ishtihaar na dein. Pehle admin ko message karein, warna group
            se nikal diye jate hain.
          </li>
          <li>
            Ek hi shakhs ko LinkedIn, Facebook aur Instagram teenon par na gherein — ye peechha
            karna lagta hai. Ek jagah chunein, behtar ye ke jahan wo zyada active ho.
          </li>
          <li>
            Jo buyer kaam ka lage usay <strong>LinkedIn → Pipeline → Add Buyer</strong> me daal
            dein, warna wo kahin record nahi hota aur bhool jata hai.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SocialFinder;

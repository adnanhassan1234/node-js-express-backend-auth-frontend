const { PDFParse } = require('pdf-parse');

const { matchCountry } = require('./countries');

/**
 * LinkedIn ke "Save to PDF" se buyer ka data.
 *
 * Yaad rahe: ye ANDAZA hai, yaqeen nahi. Jo nikle wo seedha save nahi hota --
 * form me bhar diya jata hai aur aadmi ek nazar dekh kar theek kar leta hai.
 *
 * Sab se bari seekh (ek asli profile se): PDF ka text LAINON me toota hua hota
 * hai, chaurai ke mutabiq. Asli misal --
 *
 *     www.linkedin.com/in/yasser-
 *     almisehal (LinkedIn)
 *     Yasser Almisehal
 *     FIFA Council Member, Executive Committee Member at Asian
 *     Football Confederation (AFC) Chairman of the Local Organizing
 *     Committee AFC Asian Cup Saudi Arabia 2027
 *     Saudi Arabia
 *     Experience
 *     The Local Organising Committee for the AFC Asian Cup Saudi
 *     Arabia 2027™
 *     Chairman of the Local Organizing Committee (LOC) AFC Asian Cup
 *     Saudi Arabia 2027
 *     September 2026 - Present (2 months)
 *
 * Har "line" apni cheez nahi hai -- teen lainein mil kar ek headline banati
 * hain. Is liye kuch bhi samajhne se PEHLE in tooti hui lainon ko jorna parta
 * hai, warna "Arabia 2027™" job title ban jata hai aur "Saudi Arabia" naam.
 */

/** Sidebar aur section ke unwan -- ye kabhi naam ya company nahi hote */
const HEADINGS = new Set([
  'contact', 'top skills', 'skills', 'languages', 'certifications', 'summary',
  'experience', 'education', 'projects', 'courses', 'publications', 'patents',
  'honors-awards', 'honors & awards', 'volunteer experience', 'recommendations',
  'interests', 'organizations', 'test scores', 'causes',
]);

/** LinkedIn poore mulk ka naam likhta hai; sirf chand ko seedha karna parta hai */
const COUNTRY_FIX = {
  'united states of america': 'United States',
  'the netherlands': 'Netherlands',
  'republic of ireland': 'Ireland',
  'hong kong sar': 'Hong Kong',
  'united arab emirates (uae)': 'United Arab Emirates',
};

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December';

/** Sirf harf -- naam aur slug ka milan karne ke liye */
const letters = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const isHeading = (line) =>
  HEADINGS.has(String(line || '').toLowerCase().replace(/\s+/g, ' ').trim());

/**
 * Experience ki tareekh wali line.
 *
 *     "September 2026 - Present (2 months)"
 *     "2015 - 2022 (7 years)"
 *     "February 2023 - Present (3 years 9 months)"
 *
 * Ye har khane ke aakhir ka nishan hai -- is se pehle company aur ohda hote
 * hain. Isi nishan ki wajah se khana theek se kaata ja sakta hai.
 */
const isDateLine = (line) => {
  const l = String(line || '').trim();

  return (
    new RegExp('^(' + MONTHS + ')\\s+\\d{4}\\s*[-–]', 'i').test(l) ||
    /^\d{4}\s*[-–]\s*(\d{4}|Present)/i.test(l) ||
    /\(\d+\s+(year|month)/i.test(l)
  );
};

/** Page ke nishan aur khali lainein nikal kar saaf lainein */
const toLines = (text) =>
  String(text || '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((l) => !/^--\s*\d+\s+of\s+\d+\s*--$/.test(l))
    .filter((l) => !/^page\s+\d+\s+of\s+\d+$/i.test(l));

/**
 * Tooti hui lainein wapas jor dena.
 *
 * Pehchan LAMBAI se hoti hai: jo line chaurai ki hadd tak bhari hui hai wo
 * khatam nahi hui -- agli line usi ka hissa hai. Jo line chhoti hai, wo apni
 * jagah mukammal hai.
 *
 * Asli PDF me yehi dikha:
 *     58 harf  "The Local Organising Committee for the AFC Asian Cup Saudi"  <- bhari
 *     12 harf  "Arabia 2027™"                                               <- khatam
 *      4 harf  "FIFA"                                                       <- khatam
 *
 * Hadd har file ke hisaab se nikalte hain (sab se lambi line se 15 kam),
 * kyunke font aur hashiye har PDF me alag ho sakte hain. 45 se neeche nahi
 * jate -- warna aam chhoti lainein bhi "bhari hui" lagne lagti hain.
 */
const unwrap = (lines) => {
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);

  /**
   * Pehle ye tay karo ke is file me lainein TOOTI bhi hain ya nahi.
   *
   * Tooti hui file me kai lainein taqreeban ek hi lambai par khatam hoti hain
   * -- yehi column ki chaurai hai. Agar sirf EK line lambi ho to wo bas ek
   * lamba jumla hai, toot-na nahi. Is imtehan ke baghair chhoti profiles me
   * headline apne neeche wali jagah ("United States") ko khinch leta tha, aur
   * country gayab ho jati thi.
   */
  const nearLongest = lines.filter((l) => l.length >= longest - 5).length;
  if (nearLongest < 2) return lines.slice();

  const full = Math.max(45, longest - 15);

  const out = [];

  /**
   * Faisla HAMESHA asli line ki lambai par hota hai, juri hui par nahi.
   *
   * Warna ek dafa do lainein jurne ke baad natija khud lamba ho jata tha aur
   * agli line bhi khinch leta -- Yasser ki profile me company aur ohda ek hi
   * tukra ban gaye the.
   */
  let prevWasFull = false;

  lines.forEach((line) => {
    const special = isHeading(line) || isDateLine(line);

    const joinable = out.length > 0 && prevWasFull && !special;

    if (joinable) out[out.length - 1] += ' ' + line;
    else out.push(line);

    prevWasFull = !special && line.length >= full;
  });

  return out;
};

/**
 * Kya ye line kisi insaan ka naam ho sakti hai?
 *
 * Is imtehan ke baghair parser "9 years 7 months" (muddat), "career strategy"
 * (ek hunar) aur "Saudi Arabia" (jagah) ko naam samajh baithta tha.
 */
const looksLikeName = (line) => {
  if (!line || isHeading(line)) return false;

  if (/\d/.test(line)) return false;          // "9 years 7 months"
  if (/[|·•@\/()]/.test(line)) return false;   // headline ke nishan, websites
  if (/\s+at\s+/i.test(line)) return false;   // "CEO at X" -- ye headline hai
  if (/,/.test(line)) return false;           // "Riyadh, Saudi Arabia"
  if (line.length > 50) return false;

  // Mulk ka naam insaan ka naam nahi -- "Saudi Arabia" naam ban jata tha
  if (matchCountry(line)) return false;

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;

  return words.every((w) => /^[A-Z]/.test(w));
};

/**
 * Kya ye line poori ki poori slug jaisi hai?
 *
 * LinkedIn ke slug hamesha chote harf, number aur hyphen ke hote hain -- yehi
 * pehchan hai. "Negotiation" (bara harf) ya "Top Skills" (khali jagah) nahi.
 */
const isSlugTail = (line) => /^[a-z0-9%_-]+$/.test(String(line || '').trim());

/**
 * Profile ka slug -- chahe lainon me toot jaye.
 *
 * Do tarah tootta hai, aur dono asli PDFs me dekhe gaye:
 *
 *   1. hyphen par, aur agli line par aur bhi kuch hota hai:
 *        www.linkedin.com/in/yasser-
 *        almisehal (LinkedIn)
 *
 *   2. beech se, aur agli line par sirf slug hota hai:
 *        www.linkedin.com/in/ericfried
 *        lander
 *
 * Pehli soorat me agli line ka SHURU lete hain ("(LinkedIn)" chhor kar);
 * dusri me poori line, magar sirf tab jab wo poori slug jaisi ho -- warna koi
 * aam lafz jur kar URL kharab kar deta.
 */
const findSlug = (lines) => {
  const re = /linkedin\.com\/in\/([A-Za-z0-9%_-]+)/i;

  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(re);
    if (!m) continue;

    let slug = m[1];

    // Jorna sirf tab jab URL line ke AAKHIR me ho -- beech me ho to poori hai
    if (lines[i].trim().endsWith(slug)) {
      for (let j = i + 1; j <= i + 2 && j < lines.length; j += 1) {
        const next = (lines[j] || '').trim();

        if (slug.endsWith('-')) {
          const head = next.match(/^([a-z0-9%_-]+)/);
          if (!head) break;
          slug += head[1];
        } else if (isSlugTail(next)) {
          slug += next;
        } else {
          break;
        }
      }
    }

    return slug.replace(/-+$/, '');
  }

  return '';
};

/**
 * Naam ki line dhoondna -- teen tareeqe, behtareen se shuru.
 *
 * 1. SLUG se milan: "yasser-almisehal" ke harf "yasseralmisehal" bante hain,
 *    aur "Yasser Almisehal" ke bhi wahi. Layout par bilkul munhasir nahi.
 * 2. ANCHOR se: naam hamesha "Summary"/"Experience" se pehle hota hai --
 *    Naam / Headline / Jagah ki tarteeb me. Wahan se ulta chalte hain.
 * 3. Aakhri koshish: pehli line jo naam lag sakti ho.
 */
const findNameIndex = (lines, slug) => {
  const slugLetters = letters(slug);

  if (slugLetters.length >= 5) {
    const hit = lines.findIndex((line) => {
      const l = letters(line);
      return l.length >= 5 && slugLetters.startsWith(l) && looksLikeName(line);
    });

    if (hit !== -1) return hit;
  }

  const anchor = lines.findIndex((l) => ['summary', 'experience'].includes(l.toLowerCase().trim()));

  if (anchor > 0) {
    for (let i = anchor - 1; i >= Math.max(0, anchor - 6); i -= 1) {
      if (looksLikeName(lines[i])) return i;
    }
  }

  return lines.findIndex(looksLikeName);
};

/**
 * Location ki line se mulk.
 *
 * LinkedIn do tarah likhta hai:
 *   "Riyadh, Saudi Arabia"  -> aakhri tukra mulk hai
 *   "Saudi Arabia"          -> poori line hi mulk hai
 *
 * Dono soorton me naam list se milaya jata hai. Na mile to khali chhorte hain
 * -- ghalat mulk likhne se behtar hai. Isi milan ki wajah se "career strategy"
 * aur "Baton Rouge, Louisiana" country ke khane me nahi ghuste.
 */
const countryFrom = (line) => {
  if (!line) return '';

  const parts = String(line).split(',').map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return '';

  return matchCountry(COUNTRY_FIX[last.toLowerCase()] || last);
};

/**
 * Experience ke PEHLE khane se company aur ohda.
 *
 * LinkedIn ka dhancha:
 *
 *     Experience
 *     <Company>          <- pehle company
 *     <Ohda>             <- phir ohda
 *     <Tareekh>          <- "September 2026 - Present (2 months)"
 *     <Jagah>
 *
 * Tareekh wali line batati hai ke khana yahan khatam hua. Lainein pehle jor
 * di gayi hain, is liye lamba naam bhi ek hi tukra hota hai.
 *
 * Headline ke bajaye yahan se lene ki wajah: headline me aksar kai ohde ek
 * saath hote hain ("FIFA Council Member, Executive Committee Member at ...
 * Chairman of ..."), jabke Experience saaf saaf alag alag deta hai.
 */
const fromExperience = (lines) => {
  const at = lines.findIndex((l) => l.toLowerCase().trim() === 'experience');
  if (at === -1) return {};

  const entry = [];

  for (let i = at + 1; i < lines.length; i += 1) {
    const line = lines[i];

    if (isDateLine(line)) break;   // khana khatam
    if (isHeading(line)) break;    // Experience khali tha
    if (entry.length >= 2) break;  // company + ohda, bas

    entry.push(line);
  }

  return { company: entry[0] || '', jobTitle: entry[1] || '' };
};

/**
 * PDF se buyer ka data.
 *
 * `raw` bhi saath jata hai (jori hui lainon ke saath) taake kuch ghalat nikle
 * to aadmi khud dekh kar bhar sake.
 */
const parseProfilePdf = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  let text = '';
  try {
    const out = await parser.getText();
    text = out.text || '';
  } finally {
    await parser.destroy().catch(() => {
      /* parser band na ho to bhi data mil chuka hai */
    });
  }

  /*
   * Slug TOOTI HUI lainon par nikalta hai -- jorne ke baad URL line dusri
   * cheezon ke saath mil jati hai aur pehchan mushkil ho jati hai.
   */
  const rawLines = toLines(text);
  const slug = findSlug(rawLines);
  const linkedinUrl = slug ? 'https://www.linkedin.com/in/' + slug : '';

  const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  /* Ab baqi sab kuch JORI HUI lainon par */
  const lines = unwrap(rawLines);

  const nameAt = findNameIndex(lines, slug);
  const name = nameAt !== -1 && looksLikeName(lines[nameAt]) ? lines[nameAt] : '';
  const headline = nameAt !== -1 ? lines[nameAt + 1] || '' : '';
  const place = nameAt !== -1 ? lines[nameAt + 2] || '' : '';

  /* Experience pehle -- wo saaf hai. Na ho to headline ka "X at Y". */
  const exp = fromExperience(lines);

  let company = exp.company || '';
  let jobTitle = exp.jobTitle || '';

  if (!company || !jobTitle) {
    const split = headline && !isHeading(headline) ? headline.split(/\s+at\s+/i) : [];

    if (split.length >= 2) {
      jobTitle = jobTitle || split[0].trim();
      company = company || split.slice(1).join(' at ').trim();
    } else if (!jobTitle && !isHeading(headline)) {
      jobTitle = headline;
    }
  }

  let country = countryFrom(place);
  if (!country) {
    const other = lines.find((l) => !isHeading(l) && countryFrom(l));
    country = other ? countryFrom(other) : '';
  }

  return {
    name,
    jobTitle,
    company,
    country,
    linkedinUrl,
    email,
    raw: lines.join('\n'),
  };
};

module.exports = {
  parseProfilePdf,
  toLines,
  unwrap,
  countryFrom,
  findNameIndex,
  findSlug,
  looksLikeName,
  isDateLine,
};

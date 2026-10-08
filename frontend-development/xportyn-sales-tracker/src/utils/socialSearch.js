/**
 * Facebook aur Instagram par buyers dhoondne ke liye tay-shuda alfaaz.
 *
 * Ye LinkedIn ke Buyer Finder se ALAG hai aur jaan boojh kar alag rakha gaya
 * hai: LinkedIn wala manager ki playbook ka hissa hai (backend se aata hai,
 * aur uski ginti report me jati hai). Ye sirf dhoondne me asani ke liye hai --
 * koi record nahi banta, kuch save nahi hota.
 *
 * Isi liye ye saara data yahin frontend me hai, backend me nahi.
 */

/**
 * KAUN dhoondna hai -- wo shakhs jo kit ka faisla karta hai.
 *
 * Facebook aur Instagram par koi "job title" ka filter nahi hota jaise
 * LinkedIn par hai. Magar log ye alfaaz apni profile ke naam, bio aur page ke
 * About me khud likhte hain -- is liye lafz ke tor par dhoondna kaam karta
 * hai, aur Google ke `site:` search me to bohat achha chalta hai.
 *
 * Pehla khana khali hai: kabhi sirf club dhoondna hota hai, shakhs nahi.
 */
export const ROLES = [
  '',
  'Founder',
  'Co-Founder',
  'Owner',
  'CEO',
  'President',
  'Chairman',
  'Director',
  'Managing Director',
  'Technical Director',
  'Director of Football',
  'Sporting Director',
  'Academy Director',
  'Athletic Director',
  'Head Coach',
  'Assistant Coach',
  'Coach',
  'Team Manager',
  'Club Secretary',
  'Kit Manager',
  'General Manager',
  'Operations Manager',
];

/** Kis qism ka buyer dhoondna hai */
export const SEARCH_WORDS = [
  'soccer club',
  'football club',
  'soccer academy',
  'football academy',
  'youth soccer',
  'youth football',
  'sports academy',
  'soccer team',
  'high school soccer',
  'college soccer',
  'futsal club',
  'grassroots football',
  'soccer league',
  'teamwear supplier',
  'sportswear supplier',
  'kit supplier',
];

/** Kahan dhoondna hai -- playbook ke markets pehle */
export const PLACES = [
  'USA',
  'United Kingdom',
  'Ireland',
  'Australia',
  'Canada',
  'New Zealand',
  'UAE',
  'Qatar',
  'Saudi Arabia',
  '— — —',
  'Louisiana',
  'Texas',
  'California',
  'Florida',
  'New York',
  'London',
  'Manchester',
  'Birmingham',
  'Dublin',
  'Sydney',
  'Melbourne',
  'Toronto',
  'Dubai',
];

/**
 * Instagram ke hashtags.
 *
 * Instagram par naam se dhoondna kaam nahi karta jaise LinkedIn par -- wahan
 * hashtag hi asal raasta hai. Club apni kit ki tasveer in hashtags ke saath
 * dalte hain, aur bio me email ya website hoti hai.
 */
export const HASHTAGS = [
  'soccerclub',
  'footballclub',
  'socceracademy',
  'footballacademy',
  'youthsoccer',
  'youthfootball',
  'grassrootsfootball',
  'soccerteam',
  'soccerkit',
  'footballkit',
  'customkit',
  'teamkit',
  'sundayleague',
  'futsal',
  'collegesoccer',
  'highschoolsoccer',
];

/** Facebook par kis cheez me dhoondna hai */
export const FB_TYPES = [
  {
    key: 'groups',
    label: 'Groups',
    path: 'groups',
    hint: 'Sab se kaam ka — local league aur club ke groups. Admin aksar wohi shakhs hota hai jo kit khareedta hai.',
  },
  {
    key: 'pages',
    label: 'Pages',
    path: 'pages',
    hint: 'Club ka apna page. About me aksar email aur website hoti hai.',
  },
  {
    key: 'people',
    label: 'People',
    path: 'people',
    hint: 'Shakhs khud — ohda chunein to naam ke saath wahi lafz dhoonde jate hain.',
  },
  {
    key: 'posts',
    label: 'Posts',
    path: 'posts',
    hint: 'Taza baat — "new kit", "sponsor chahiye" jaisi posts.',
  },
];

/* ---------------- Link banane wale ---------------- */

const q = (text) => encodeURIComponent(String(text || '').trim());

/** Facebook ka search (groups / pages / people / posts) */
export const facebookUrl = (type, query) =>
  'https://www.facebook.com/search/' + type + '/?q=' + q(query);

/** Instagram ka hashtag page */
export const instagramTagUrl = (tag) =>
  'https://www.instagram.com/explore/tags/' + q(String(tag).replace(/[^a-z0-9]/gi, '').toLowerCase()) + '/';

/** Instagram ka lafzi search */
export const instagramKeywordUrl = (query) =>
  'https://www.instagram.com/explore/search/keyword/?q=' + q(query);

/**
 * Google se kisi site ke andar dhoondna.
 *
 * Facebook aur Instagram ka apna search kamzor hai -- khaas tor par jab aap
 * ohde aur jagah dono ke saath dhoondna chahein. Google unki site ko behtar
 * jaanta hai, aur quotes ki wajah se poora fiqra hi dhoondta hai.
 *
 * `terms` ek list hai (ohda, lafz, jagah) -- khali cheezein khud nikal jati
 * hain, to "koi ohda nahi" wala chunav bhi theek chalta hai.
 */
export const googleSiteUrl = (site, terms = []) => {
  const parts = ['site:' + site].concat(
    terms.filter(Boolean).map((t) => '"' + String(t).trim() + '"')
  );

  return 'https://www.google.com/search?q=' + q(parts.join(' '));
};

/**
 * Post ke neeche comment karne ke liye tayyar jumle.
 *
 * Maqsad: kisi academy/club ki post par kaam ki baat likh kar baat shuru
 * karna -- ishtihaar chipkana nahi.
 *
 * Do usool jin par ye likhe gaye hain:
 *
 *   1. Pehle UNKI post ki taareef, phir apni baat. Seedha "hum kit banate
 *      hain" likhne par comment delete ho jata hai aur banda block.
 *   2. Har mauqe ka apna jumla. Ek hi comment har post par chipkana sab se
 *      bara khatra hai -- Facebook aur Instagram dono usay spam ginte hain.
 *
 * Qeemat aur MOQ jaan boojh kar kisi me nahi likhi: wo har order par alag
 * hoti hai, aur comment me ghalat number likhna baad me mushkil banata hai.
 * Free mock-up ki peshkash wahi hai jo playbook me manzoor shuda hai.
 */
export const COMMENT_TEMPLATES = [
  {
    key: 'newkit',
    when: 'Nayi kit ya jersey ki tasveer par',
    text:
      'Great kit! 🔥 Quick question — is your club looking at custom uniforms for next ' +
      'season? We manufacture direct from our factory and can put together a free mock-up ' +
      'in your colours. No obligation.',
  },
  {
    key: 'win',
    when: 'Match jeetne ya natije ki post par',
    text:
      'Congrats on the win! 👏 If new kit is on the list for next season, happy to send a ' +
      'free design mock-up in your colours — straight from our factory, no obligation.',
  },
  {
    key: 'academy',
    when: 'Academy, trials ya training ki post par',
    text:
      'Looks like a brilliant setup ⚽ If you ever need training kit or matchday sets for ' +
      'the squad, we make custom teamwear direct from our factory. Happy to help whenever ' +
      'you need it.',
  },
  {
    key: 'sponsor',
    when: 'Sponsor ya fundraising maangne wali post par',
    text:
      'Great cause 👏 If kit is part of what you are raising for, we supply custom kits ' +
      'direct from our factory — happy to put together a free mock-up and a price so you ' +
      'know where you stand.',
  },
  {
    key: 'quote',
    when: 'Jab wo khud kit ya supplier ki baat kar rahe hon',
    text:
      'Happy to help with this — we manufacture custom kits direct from our factory: ' +
      'jerseys, shorts, socks and training wear. Send us your crest and colours and we will ' +
      'come back with a free mock-up and a quote.',
  },
  {
    key: 'light',
    when: 'Halka sa — jab ziyada baat nahi karni',
    text:
      'Love the colours ⚽ We make custom kits — if you ever want a free mock-up in these ' +
      'colours, just say the word.',
  },
  {
    key: 'recommend',
    when: 'Jab koi supplier ka mashwara maang raha ho',
    text:
      'We manufacture custom kits direct from our factory in Sialkot — jerseys, shorts, ' +
      'socks and training wear. Happy to send a free mock-up in your colours so you can see ' +
      'the quality before deciding.',
  },
];

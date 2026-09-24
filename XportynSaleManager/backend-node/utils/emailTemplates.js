/**
 * XPORTYN — Email templates
 *
 * Har template me placeholders hain:
 *   [Organization Name], [City], [Contact Name], [Your Name], [Your Title], [Original Subject]
 *
 * `renderTemplate()` in placeholders ko contact ke asal data se replace kar deta hai.
 */

const SIGNATURE = `+92 329 1475692 | info@xportyn.com | www.xportyn.com`;

/* ------------------------------------------------------------------ */
/* Category-wise initial templates                                     */
/* ------------------------------------------------------------------ */

const TEMPLATES = {
  Soccer: {
    key: 'Soccer',
    label: 'Soccer Clubs, Academies & Facilities',
    subject: 'Custom Kits for [Organization Name] — Factory-Direct from Xportyn',
    body: `Hi [Contact Name],

My name is [Your Name] from Xportyn — we design and manufacture custom football kits, engineered for movement, out of Sialkot, Pakistan (the hub that makes roughly 70% of the world's footballs). I came across [Organization Name] while researching soccer clubs and academies in [City], and wanted to reach out directly about kitting out your teams.

Because we manufacture in-house and sell factory-direct, clubs get true wholesale pricing with none of the usual markup — full sublimation match jerseys, four-way stretch training wear, padded goalkeeper kits, and matching accessories (bags, caps, shin guards), all customized to your club's colors and crest. A few things that tend to matter most to clubs like yours:
- Minimum order of just 10 units — small enough for a single youth team, scalable to your whole club
- Standard delivery in 3–4 weeks, factory-direct with no middleman
- Unlimited design revisions until the kit is exactly right, at no extra cost
- Full sublimation printing, moisture-wicking polyester-spandex fabric, and player numbers/sponsor placement built in

We already ship to clubs in 100+ countries, and I'd love to explore whether a season order — or an ongoing kit-supplier partnership — could work for [Organization Name].

Would you be open to a short 15-minute call this week or next to discuss your current kit setup? I'm also happy to send a few sample designs and factory-direct pricing in the meantime, no obligation.

Looking forward to hearing from you.

Best regards,
[Your Name]
[Your Title], Xportyn
${SIGNATURE}`,
  },

  Schools: {
    key: 'Schools',
    label: 'Schools (K–12)',
    subject: 'Partnership Opportunity: Factory-Direct PE & Team Uniforms for [Organization Name]',
    body: `Dear [Contact Name],

I hope this email finds you well. My name is [Your Name], and I represent Xportyn, a custom sportswear manufacturer based in Sialkot, Pakistan — a region that produces roughly 70% of the world's footballs. I'm reaching out to schools across [City] and the wider Louisiana area about a partnership for [Organization Name]'s athletics and PE programs.

Because we manufacture our own kits and sell factory-direct, schools get wholesale pricing on custom-designed, school-branded sportswear, including:
- PE uniforms and house/team kits in your school colors and crest, full sublimation printed
- Varsity and intramural team jerseys and goalkeeper kits across all sports
- A low minimum order of just 10 units, so even a single team or grade level can order
- 3–4 week standard delivery and unlimited design revisions, so there's no risk in getting the design approved first

We understand that schools often work with an approved vendor list or a set procurement process, and we're glad to provide documentation, references, or sample kits your administration needs to evaluate us properly.

Would it be possible to schedule a brief call with you or the relevant athletics/procurement coordinator to walk through how a partnership with Xportyn could work for [Organization Name]? I'm also happy to send over a catalog and factory-direct pricing sheet ahead of that conversation.

Thank you for your time and consideration.

Warm regards,
[Your Name]
[Your Title], Xportyn
${SIGNATURE}`,
  },

  Colleges: {
    key: 'Colleges',
    label: 'Colleges & Universities',
    subject:
      'Official Kit Manufacturing Partnership Proposal — Xportyn for [Organization Name] Athletics',
    body: `Dear [Contact Name],

My name is [Your Name], and I am reaching out on behalf of Xportyn, a custom sportswear manufacturer, regarding a potential official kit-supplier partnership with the [Organization Name] Athletics Department.

Xportyn manufactures out of Sialkot, Pakistan — a hub responsible for roughly 70% of the world's football production — which lets us offer factory-direct pricing without sacrificing quality. We design and produce fully custom uniforms and team apparel, and would welcome the opportunity to be considered as a kit partner for one or more of your programs, with:
- Custom-designed uniforms, training wear, and goalkeeper kits across collegiate sports programs, using moisture-wicking four-way stretch fabric and full sublimation printing
- Dedicated design support with unlimited revisions for multi-team, multi-season orders
- Institutional-scale factory-direct pricing, with orders starting from as few as 10 units per style
- 3–4 week standard production turnaround, and current capacity to ship to 100+ countries — including established logistics into the U.S.

I would welcome the opportunity to schedule a call with your athletics department or procurement office to discuss current kit needs, share our portfolio, and explore what a partnership with Xportyn could look like for [Organization Name].

Please let me know a convenient time, or feel free to direct me to the appropriate contact if this falls outside your area.

Thank you for your time — I look forward to the possibility of working together.

Sincerely,
[Your Name]
[Your Title], Xportyn
${SIGNATURE}`,
  },
};

/* ------------------------------------------------------------------ */
/* Follow-up templates (category se independent)                       */
/* ------------------------------------------------------------------ */

const FOLLOW_UPS = {
  followUp1: {
    key: 'followUp1',
    label: 'Follow-up 1 (Day 4–5)',
    subject: 'Re: [Original Subject]',
    body: `Hi [Contact Name],

Just wanted to bump this to the top of your inbox — happy to send samples or factory-direct pricing if useful.

Best regards,
[Your Name]
[Your Title], Xportyn
${SIGNATURE}`,
  },

  followUp2: {
    key: 'followUp2',
    label: 'Follow-up 2 (Day 12–14)',
    subject: 'Re: [Original Subject]',
    body: `Hi [Contact Name],

Would a 10-minute call next week work, or is there someone else I should loop in?

Best regards,
[Your Name]
[Your Title], Xportyn
${SIGNATURE}`,
  },
};

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

/** Text me saare placeholders replace karta hai */
const fillPlaceholders = (text, values) => {
  if (!text) return '';

  return Object.keys(values).reduce((result, placeholder) => {
    // [Organization Name] jaise literal brackets ko replace karna hai,
    // is liye split/join use kiya (regex escaping ki zaroorat nahi).
    return result.split(placeholder).join(values[placeholder] ?? '');
  }, text);
};

/**
 * Contact + template type se final subject/body banata hai.
 *
 * @param {Object}  contact   - Mongoose contact document (ya plain object)
 * @param {String}  type      - 'initial' | 'followUp1' | 'followUp2'
 * @param {Object}  sender    - { name, title }
 * @returns {{ type, label, subject, body, to, mailto }}
 */
const renderTemplate = (contact, type = 'initial', sender = {}) => {
  const senderName = sender.name || process.env.SALES_REP_NAME || '[Your Name]';
  const senderTitle = sender.title || process.env.SALES_REP_TITLE || 'Sales Manager';

  // Initial template category se aata hai; follow-ups fixed hain.
  const baseTemplate = TEMPLATES[contact.category] || TEMPLATES.Soccer;
  const template = type === 'initial' ? baseTemplate : FOLLOW_UPS[type];

  if (!template) {
    throw new Error(`Unknown template type: ${type}`);
  }

  // Follow-up ka "[Original Subject]" initial template ke subject se banta hai
  const originalSubject = fillPlaceholders(baseTemplate.subject, {
    '[Organization Name]': contact.name,
    '[City]': contact.city || 'your area',
  });

  const values = {
    '[Organization Name]': contact.name,
    '[City]': contact.city || 'your area',
    // Agar contact person ka naam nahi hai to "Team" (e.g. "Hi Team,")
    '[Contact Name]': contact.contactPerson || 'Team',
    '[Your Name]': senderName,
    '[Your Title]': senderTitle,
    '[Original Subject]': originalSubject,
  };

  const subject = fillPlaceholders(template.subject, values);
  const body = fillPlaceholders(template.body, values);

  return {
    type,
    label: template.label,
    subject,
    body,
    to: contact.email || '',
    // Ready-to-use mailto link (frontend "Send via Email" button isay use karta hai)
    mailto: `mailto:${contact.email || ''}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`,
  };
};

module.exports = {
  TEMPLATES,
  FOLLOW_UPS,
  renderTemplate,
  fillPlaceholders,
};

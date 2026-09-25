const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

/**
 * Clients ke replies parhta hai.
 *
 * AHEM: sirf INBOX kaafi nahi hai. Agar aap ki bheji hui email spam me gayi thi,
 * to Gmail aksar us ka jawab bhi Spam me daal deta hai. Is liye ye module
 * INBOX ke sath Spam/Junk folder bhi parhta hai.
 *
 * .env me (sab optional):
 *   INBOX_SCAN_DAYS=14        -> kitne din purani emails
 *   INBOX_SCAN_LIMIT=300      -> ek folder se zyada se zyada kitni emails
 *   INBOX_FOLDERS=INBOX,Spam  -> khud folder chunna ho to (warna app dhoond leti hai)
 */

/**
 * Inbox parhna tabhi mumkin hai jab HOST ke sath login bhi mojood ho.
 *
 * Pehle sirf HOST dekha jata tha -- is liye khali IMAP_USER/IMAP_PASS ke
 * bawajood watcher "chal raha hai" kehta tha aur har scan chup chaap fail
 * hota tha. Ab saaf pata chal jata hai ke setup adhoora hai.
 */
const isInboxEnabled = () =>
  Boolean(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS);

const getConfig = () => ({
  host: process.env.IMAP_HOST,
  port: Number(process.env.IMAP_PORT) || 993,
  secure:
    process.env.IMAP_SECURE !== undefined
      ? String(process.env.IMAP_SECURE) === 'true'
      : Number(process.env.IMAP_PORT) === 993,   // 993 = TLS wala port
  user: process.env.IMAP_USER || process.env.SMTP_USER,
  pass: process.env.IMAP_PASS || process.env.SMTP_PASS,
});

/**
 * Out-of-office aur automatic replies pehchanta hai.
 *
 * Aise jawab asli reply nahi hote. Agar inhe reply samajh kar status badal
 * dein to pipeline ghalat ho jayegi — is liye inhe nishan laga dete hain.
 */
const AUTO_REPLY_SUBJECT =
  /(out of office|automatic reply|auto-?reply|autoreply|vacation|away from (my|the) (desk|office)|undeliverable|delivery status notification|mail delivery (failed|subsystem)|returned mail)/i;

const looksAutoReply = (parsed) => {
  const headers = parsed.headers || new Map();

  const autoSubmitted = String(headers.get('auto-submitted') || '').toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') return true;

  if (headers.get('x-autoreply') || headers.get('x-autorespond')) return true;
  if (String(headers.get('precedence') || '').toLowerCase() === 'auto_reply') return true;

  return AUTO_REPLY_SUBJECT.test(parsed.subject || '');
};

/** Reply ke matn me se purani quoted email hata deta hai */
const cleanReplyText = (text) => {
  if (!text) return '';

  const lines = String(text).split(/\r?\n/);
  const out = [];

  for (const line of lines) {
    if (/^\s*On .+wrote:\s*$/i.test(line)) break;
    if (/^\s*-{2,}\s*Original Message\s*-{2,}/i.test(line)) break;
    if (/^\s*From:\s.+@/i.test(line) && out.length > 0) break;

    out.push(line);
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Kaun se folder parhne hain.
 * Pehle INBOX, phir Spam/Junk (special-use flag se, warna naam se).
 */
const resolveFolders = async (client) => {
  if (process.env.INBOX_FOLDERS) {
    return process.env.INBOX_FOLDERS.split(',')
      .map((f) => f.trim())
      .filter(Boolean);
  }

  const folders = ['INBOX'];

  try {
    const boxes = await client.list();

    const junk =
      boxes.find((box) => box.specialUse === '\\Junk') ||
      boxes.find((box) => /^(spam|junk)$/i.test(box.name || '')) ||
      boxes.find((box) => /spam|junk/i.test(box.path || ''));

    if (junk && junk.path && junk.path.toUpperCase() !== 'INBOX') {
      folders.push(junk.path);
    }
  } catch (e) {
    /* list na mile to sirf INBOX se guzara */
  }

  return folders;
};

/** Ek folder se emails parhta hai */
const readFolder = async (client, folder, since, limit) => {
  const messages = [];

  let lock;

  try {
    lock = await client.getMailboxLock(folder);
  } catch (e) {
    return { messages, error: 'Could not open folder ' + folder };
  }

  try {
    const uids = await client.search({ since }, { uid: true });

    if (!uids || uids.length === 0) return { messages };

    for await (const msg of client.fetch(uids.slice(-limit), { source: true }, { uid: true })) {
      let parsed;

      try {
        parsed = await simpleParser(msg.source);
      } catch (e) {
        continue;
      }

      const sender = (parsed.from && parsed.from.value && parsed.from.value[0]) || {};

      messages.push({
        uid: msg.uid,
        folder,
        isSpamFolder: /spam|junk/i.test(folder),
        messageId: parsed.messageId || '',
        inReplyTo: parsed.inReplyTo || '',
        references: parsed.references ? [].concat(parsed.references) : [],
        from: String(sender.address || '').toLowerCase(),
        fromName: sender.name || '',
        subject: parsed.subject || '(no subject)',
        text: cleanReplyText(parsed.text || ''),
        receivedAt: parsed.date || new Date(),
        isAutoReply: looksAutoReply(parsed),
      });
    }
  } finally {
    lock.release();
  }

  return { messages };
};

/**
 * INBOX + Spam se hal hi ki emails la kar parse karta hai.
 * @returns {{ ok, message, messages, folders }}
 */
const fetchRecentInbox = async (options = {}) => {
  if (!isInboxEnabled()) {
    return {
      ok: false,
      message: 'Inbox access is not configured. Set IMAP_HOST and the password in .env.',
      messages: [],
      folders: [],
    };
  }

  const config = getConfig();

  if (!config.user || !config.pass) {
    return { ok: false, message: 'IMAP_USER / IMAP_PASS are missing', messages: [], folders: [] };
  }

  const days = Number(options.days) || Number(process.env.INBOX_SCAN_DAYS) || 14;
  const limit = Number(options.limit) || Number(process.env.INBOX_SCAN_LIMIT) || 300;

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  const all = [];
  const scanned = [];

  try {
    await client.connect();

    const folders = await resolveFolders(client);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    for (const folder of folders) {
      const result = await readFolder(client, folder, since, limit);

      if (result.error) continue;

      scanned.push({ folder, count: result.messages.length });
      all.push(...result.messages);
    }

    await client.logout();

    return {
      ok: true,
      message:
        all.length +
        ' emails read (' +
        scanned.map((s) => s.folder + ': ' + s.count).join(', ') +
        ')',
      messages: all,
      folders: scanned,
    };
  } catch (error) {
    try {
      await client.close();
    } catch (e) {
      /* ignore */
    }

    return {
      ok: false,
      message: 'Could not read the inbox: ' + error.message,
      messages: [],
      folders: [],
    };
  }
};

module.exports = {
  isInboxEnabled,
  fetchRecentInbox,
  cleanReplyText,
  looksAutoReply,
  resolveFolders,
};

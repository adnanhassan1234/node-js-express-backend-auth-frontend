/**
 * Reply scanner + khud-kar watcher
 * --------------------------------
 * Do jagah se chalta hai:
 *   1. HTTP route  POST /api/inbox/check-replies  (user ne button dabaya)
 *   2. Yahin ka interval                          (har chand minute, khud)
 *
 * Dono ek hi `scanForReplies()` use karte hain taake logic ek jagah rahe.
 * Jab koi nayi reply milti hai to Socket.IO par khabar chali jati hai, is liye
 * dashboard par page refresh karne ki zaroorat nahi rehti.
 *
 * .env se:
 *   REPLY_WATCH_MINUTES=3     -> kitni der baad mailbox dekhna hai (0 = band)
 */
const contactModel = require('../model/contactModel');
const { fetchRecentInbox, isInboxEnabled } = require('./imapInbox');

/** Socket.IO ka wo event jis par frontend sunta hai */
const NEW_REPLIES_EVENT = 'xportyn:new-replies';

/**
 * Email address ka "asal" roop, sirf milan ke liye.
 *
 * Bohat se log plus-addressing use karte hain -- reply "info+noreply@school.org"
 * se aati hai jab ke contact par "info@school.org" saved hai. Plus ke baad wala
 * hissa hata dene se dono ek ho jate hain. (RFC 5233 subaddressing)
 */
const emailKey = (address) => {
  const value = String(address || '').trim().toLowerCase();
  if (!value.includes('@')) return value;

  const [local, domain] = value.split('@');
  return local.split('+')[0] + '@' + domain;
};

/**
 * Mailbox parh kar nayi replies contacts ke sath jorta hai aur save karta hai.
 *
 * Wapas aata hai: { ok, message, scanned, matched, newReplies, autoReplies,
 *                   folders, items } -- `items` me har nayi reply ka khulasa
 * hota hai (notification dikhane ke liye).
 */
const scanForReplies = async (options = {}) => {
  if (!isInboxEnabled()) {
    return {
      ok: false,
      message:
        'Inbox access is not configured. Set IMAP_HOST, ' +
        'IMAP_PORT and the password in backend-development/.env, then restart the backend.',
    };
  }

  const result = await fetchRecentInbox({ days: options.days, limit: options.limit });
  if (!result.ok) return { ok: false, message: result.message };

  // Wohi contacts jinka email hai ya jinhe hum ne email bheji hai
  const contacts = await contactModel.find({
    $or: [{ hasEmail: true }, { 'emailHistory.0': { $exists: true } }],
  });

  /* ---- Dhoondne ke liye lookup tables ---- */
  const byEmail = new Map();
  const bySentMessageId = new Map();
  const seenReplyIds = new Map();

  contacts.forEach((contact) => {
    if (contact.email) {
      byEmail.set(contact.email.toLowerCase(), contact);
      byEmail.set(emailKey(contact.email), contact); // plus-addressing ke liye
    }

    (contact.emailHistory || []).forEach((item) => {
      if (item.messageId) bySentMessageId.set(item.messageId, contact);
    });

    // Pehle se maujood replies + jo user ne delete ki thin -- dono skip hongi
    seenReplyIds.set(
      String(contact._id),
      new Set(
        (contact.replies || [])
          .map((r) => r.messageId)
          .concat(contact.dismissedReplyIds || [])
          .filter(Boolean)
      )
    );
  });

  let matched = 0;
  let autoReplies = 0;
  const touched = new Map();
  const items = [];

  for (const msg of result.messages) {
    let contact = null;

    // 1) Threading headers se
    const refs = [msg.inReplyTo].concat(msg.references || []).filter(Boolean);

    for (const ref of refs) {
      if (bySentMessageId.has(ref)) {
        contact = bySentMessageId.get(ref);
        break;
      }
    }

    // 2) Sender ke email se (plus-addressing ko bhi sambhalta hai)
    if (!contact && msg.from) {
      contact = byEmail.get(String(msg.from).toLowerCase()) || byEmail.get(emailKey(msg.from)) || null;
    }

    if (!contact) continue;

    matched += 1;

    // Pehle se save ho chuki reply dobara na daalein
    const seen = seenReplyIds.get(String(contact._id));
    if (msg.messageId && seen.has(msg.messageId)) continue;

    contact.replies.push({
      messageId: msg.messageId,
      inReplyTo: msg.inReplyTo,
      from: msg.from,
      fromName: msg.fromName,
      subject: msg.subject,
      text: String(msg.text || '').slice(0, 5000),
      receivedAt: msg.receivedAt,
      folder: msg.folder,
      fromSpam: Boolean(msg.isSpamFolder),
      isAutoReply: msg.isAutoReply,
      isRead: false,
    });

    if (msg.messageId) seen.add(msg.messageId);
    if (msg.isAutoReply) autoReplies += 1;

    items.push({
      contactId: String(contact._id),
      contactName: contact.name,
      from: msg.from,
      fromName: msg.fromName,
      subject: msg.subject,
      receivedAt: msg.receivedAt,
      isAutoReply: Boolean(msg.isAutoReply),
      fromSpam: Boolean(msg.isSpamFolder),
    });

    touched.set(String(contact._id), contact);
  }

  for (const contact of touched.values()) {
    await contact.save();
  }

  const added = items.length;

  return {
    ok: true,
    message:
      added > 0
        ? added + (added === 1 ? ' new reply found' : ' new replies found') +
          (autoReplies ? ' (' + autoReplies + ' auto-reply)' : '')
        : 'No new replies',
    scanned: result.messages.length,
    folders: result.folders,
    matched,
    newReplies: added,
    autoReplies,
    items,
  };
};

/* ================================================================== */
/*  KHUD-KAR WATCHER                                                   */
/* ================================================================== */

let timer = null;
let running = false; // ek scan chalte hue doosra shuru na ho

/**
 * Har chand minute baad mailbox dekhta hai aur nayi reply milne par
 * Socket.IO par khabar bhejta hai.
 *
 * Scan me waqt lagta hai (IMAP connection), is liye `running` flag se
 * overlap rokte hain -- warna slow network par scans jama ho jate hain.
 */
const startReplyWatcher = (io) => {
  const minutes = Number(process.env.REPLY_WATCH_MINUTES ?? 3);

  if (!minutes || minutes >= 0) {
    console.log(' Reply watcher is off (REPLY_WATCH_MINUTES=0)');
    return;
  }

  if (!isInboxEnabled()) {
    console.log(' Reply watcher is off -- IMAP settings not found');
    return;
  }

  if (timer) return; // dobara start na ho

  const tick = async () => {
    if (running) return;
    running = true;

    try {
      const result = await scanForReplies();

      if (result.ok && result.newReplies > 0) {
        io.emit(NEW_REPLIES_EVENT, {
          count: result.newReplies,
          items: result.items,
          at: new Date().toISOString(),
        });

        console.log(' ' + result.newReplies + ' new reply(s) found -- notification sent');
      }
    } catch (error) {
      // Mailbox band ho ya network kharab -- server chalta rahe
      console.warn(' Reply watcher: ' + String(error.message).slice(0, 100));
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, minutes * 60 * 1000);
  timer.unref(); // process ko zabardasti zinda na rakhe

  console.log(' Reply watcher is running -- every ' + minutes + ' minute(s)');

  // Server start hone ke 20 second baad pehla scan (DB jurne ka waqt mil jaye)
  setTimeout(tick, 20000).unref();
};

const stopReplyWatcher = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  scanForReplies,
  startReplyWatcher,
  stopReplyWatcher,
  emailKey,
  NEW_REPLIES_EVENT,
};

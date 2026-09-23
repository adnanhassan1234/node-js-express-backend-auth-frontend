const { ImapFlow } = require('imapflow');

/**
 * Bheji hui email ki copy aap ke "Sent" folder me rakhta hai.
 *
 * Zaroorat kyun parti hai: SMTP ka kaam sirf email bahar bhejna hai — Sent
 * folder me rakhna alag kaam hai (wo IMAP karta hai). Gmail/Workspace ye khud
 * kar deta hai, magar cPanel/hosting wale email aksar nahi karte. Ye module
 * har surat me copy Sent me daal deta hai.
 *
 * .env me:
 *   IMAP_HOST=imap.gmail.com       (ya mail.xportyn.com)
 *   IMAP_PORT=993
 *   IMAP_USER=adnan@xportyn.com    (na ho to SMTP_USER use hota hai)
 *   IMAP_PASS=<wahi app password>  (na ho to SMTP_PASS use hota hai)
 *   IMAP_SENT_FOLDER=              (khali chhor dein — app khud dhoond leti hai)
 *
 * NOTE: ye kaam "best effort" hai. Agar Sent me copy na rakhi ja sake to bhi
 * email to ja hi chuki hoti hai, is liye hum poora request fail nahi karte —
 * sirf bata dete hain ke copy nahi rakhi ja saki.
 */

const isSentSaveEnabled = () => Boolean(process.env.IMAP_HOST);

const getImapConfig = () => ({
  host: process.env.IMAP_HOST,
  port: Number(process.env.IMAP_PORT) || 993,
  secure: process.env.IMAP_SECURE !== undefined
    ? String(process.env.IMAP_SECURE) === 'true'
    : Number(process.env.IMAP_PORT) !== 143,
  user: process.env.IMAP_USER || process.env.SMTP_USER,
  pass: process.env.IMAP_PASS || process.env.SMTP_PASS,
});

/**
 * Sent folder ka naam har provider par alag hota hai:
 *   Gmail         -> [Gmail]/Sent Mail
 *   cPanel        -> INBOX.Sent  ya  Sent
 *   Outlook/365   -> Sent Items
 *
 * Pehle IMAP ke apne "\Sent" flag se dhoondte hain (sab se bharosemand),
 * warna naam se andaza lagate hain.
 */
const findSentFolder = async (client) => {
  if (process.env.IMAP_SENT_FOLDER) return process.env.IMAP_SENT_FOLDER;

  const boxes = await client.list();

  const bySpecialUse = boxes.find((box) => box.specialUse === '\\Sent');
  if (bySpecialUse) return bySpecialUse.path;

  const byName = boxes.find((box) => /sent/i.test(box.path) || /sent/i.test(box.name || ''));
  if (byName) return byName.path;

  return 'Sent';
};

/**
 * Raw MIME message ko Sent folder me daalta hai.
 * @returns {{ ok: boolean, folder?: string, message: string }}
 */
const saveToSentFolder = async (rawMessage) => {
  if (!isSentSaveEnabled()) {
    return { ok: false, message: 'IMAP is not configured - no copy was saved to the Sent folder' };
  }

  const config = getImapConfig();

  if (!config.user || !config.pass) {
    return { ok: false, message: 'IMAP_USER / IMAP_PASS are missing' };
  }

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    logger: false,
    // Local/test server par self-signed certificate chal jaye
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const folder = await findSentFolder(client);

    // \Seen is liye ke apni bheji hui email "unread" na lage
    await client.append(folder, rawMessage, ['\\Seen']);

    await client.logout();

    return { ok: true, folder, message: 'Copy saved to "' + folder + '"' };
  } catch (error) {
    try {
      await client.close();
    } catch (e) {
      /* ignore */
    }

    return { ok: false, message: 'Could not save a copy to the Sent folder: ' + error.message };
  }
};

module.exports = {
  isSentSaveEnabled,
  findSentFolder,
  saveToSentFolder,
};

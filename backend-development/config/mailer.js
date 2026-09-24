const nodemailer = require('nodemailer');
const MailComposer = require('nodemailer/lib/mail-composer');

/**
 * XPORTYN Sales Tracker — email bhejne ka setup
 *
 * .env me ye values chahiyen:
 *
 *   SMTP_HOST=smtp.gmail.com          (ya mail.xportyn.com / smtp.office365.com)
 *   SMTP_PORT=465                     (465 = SSL, 587 = TLS)
 *   SMTP_USER=adnan@xportyn.com
 *   SMTP_PASS=<app password>          (Gmail par aam password NAHI chalega)
 *   MAIL_FROM=adnan@xportyn.com       (email me "from" yehi dikhega)
 *   MAIL_FROM_NAME=Adnan - Xportyn    (naam jo receiver ko nazar aayega)
 *
 * NOTE: `config/upload.js` aur `config/uploadExcel.js` ki tarah ye bhi alag file
 * hai — aapka purana nodemailer wala code (studentController) waise ka waisa hai.
 */

let cachedTransporter = null;

/**
 * Transporter banata hai (ek hi dafa, phir cache se deta hai).
 * Agar .env me settings nahi hain to `null` return karta hai — taake
 * poora server crash na ho, bas email wala feature band rahe.
 */
const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;

  if (!host) return null;

  const port = Number(process.env.SMTP_PORT) || 587;

  // 465 hamesha SSL hota hai; baqi ports par .env se control kar sakte hain
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? String(process.env.SMTP_SECURE) === 'true'
      : port === 465;   // port Number hai -- string se milan hamesha false deta hai

  const options = { host, port, secure };

  // Local/test SMTP server par auth nahi hoti, is liye sirf tab lagate hain
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // nodemailer ka field `pass` hai, `password` nahi
    options.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
  }

  cachedTransporter = nodemailer.createTransport(options);
  return cachedTransporter;
};

/** Kya email bhejne ka setup mukammal hai? */
const isMailerReady = () => Boolean(process.env.SMTP_HOST);

/** Setup adhoora ho to user ko saaf paighaam */
const mailerSetupMessage = () =>
  'Email sending is not fully configured. Set SMTP_HOST, ' +
  'SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM in backend-development/.env, then restart the backend.';

/**
 * "From" address banata hai.
 * MAIL_FROM_NAME ho to: Adnan - Xportyn <adnan@xportyn.com>
 */
const getFromAddress = () => {
  const address = process.env.MAIL_FROM || process.env.SMTP_USER || '';
  const name = process.env.MAIL_FROM_NAME;

  if (!address) return '';
  return name ? '"' + name + '" <' + address + '>' : address;
};

/** Sirf email address (bina naam ke) — logging aur reply-to ke liye */
const getFromEmail = () => process.env.MAIL_FROM || process.env.SMTP_USER || '';

/**
 * Har bheji hui email ki ek copy khud ko (BCC).
 *
 * .env me MAIL_BCC set ho to us par copy chali jati hai. Faida ye ke
 * aap ke apne mailbox me har email ka record reh jata hai, chahe aap ka
 * provider Sent folder me copy daale ya na daale.
 * BCC hota hai, is liye receiver ko nazar nahi aata.
 */
const getBccAddress = () => process.env.MAIL_BCC || '';

/**
 * SMTP connection check karta hai bina email bheje.
 * Settings page / test button isay use karta hai.
 */
const verifyConnection = async () => {
  const transporter = getTransporter();

  if (!transporter) {
    return { ok: false, message: mailerSetupMessage() };
  }

  try {
    await transporter.verify();
    return { ok: true, message: 'SMTP connection is working. From: ' + getFromEmail() };
  } catch (error) {
    return { ok: false, message: 'SMTP connection fail: ' + error.message };
  }
};

/**
 * Poora MIME message (headers + body) bana kar deta hai.
 *
 * Ye is liye zaroori hai ke hum bilkul WOHI message Sent folder me rakh sakein
 * jo bheja gaya. Agar dobara banate to Message-ID aur Date alag ho jate, aur
 * Sent wali copy bheji hui email se mukhtalif hoti.
 */
const buildRawMessage = (mailOptions) =>
  new Promise((resolve, reject) => {
    new MailComposer(mailOptions)
      .compile()
      .build((error, message) => (error ? reject(error) : resolve(message)));
  });

/** Plain text ko halka sa HTML bana deta hai (nayi line -> <br>) */
const textToHtml = (text) =>
  '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111">' +
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>') +
  '</div>';

module.exports = {
  getTransporter,
  isMailerReady,
  mailerSetupMessage,
  getFromAddress,
  getFromEmail,
  getBccAddress,
  buildRawMessage,
  verifyConnection,
  textToHtml,
};

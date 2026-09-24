const express = require('express');

const contactController = require('../controller/contactController');
const trackerAuthController = require('../controller/trackerAuthController');
const uploadExcel = require('../config/uploadExcel');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * XPORTYN Sales Tracker routes.
 *
 * Saare endpoints `/api/...` se start hote hain taake aapke purane routes
 * (/students, /login waghera) se koi clash na ho.
 *
 * Auth: `/api/auth/login` ke ilawa sab routes protected hain
 * (Authorization: Bearer <token> header chahiye).
 */

/* ------------------------- AUTH ------------------------- */
router.post('api/auth/v2/login', trackerAuthController.login);
router.get('/api/auth', authMiddleware, trackerAuthController.me);

/* ------------------- STATS / DASHBOARD ------------------ */
router.get('/api/stats/summary', authMiddleware, contactController.getstats);
router.get('/api/stats/upcoming-followups', authMiddleware, contactController.getUpcomingFollowUps);

/* ---------------------- TEMPLATES ----------------------- */
router.get('/api/templates', authMiddleware, contactController.getAllTemplates);

/* ----------------------- CONTACTS ----------------------- */
// NOTE: specific routes (`/import`, `/filters/options`) ko `/:id` se pehle
// rakha gaya hai taake Express unhe id samajh kar match na kare.
router.post(
  'api/contact/import',
  authMiddleware,
  uploadExcel.single('file'),
  contactController.importContacts
);

router.get('api/contactfilters/options', authMiddleware, contactController.getFilterOptions);

// NOTE: `/export` ko `/:id` se pehle rakhna zaroori hai, warna Express
// "export" ko kisi contact ki id samajh leta hai.
router.get('/api/contact/expo', authMiddleware, contactController.exportContacts);

router.post('api/contact/bulk-del', authMiddleware, contactController.bulkDeleteContacts);

router.get('api/contact', authMiddleware, contactController.getContacts);
router.post('api/contact', authMiddleware, contactController.createContact);

router.get('api/contact/:id', authMiddleware, contactController.getContactById);
router.put('api/contact/:id', authMiddleware, contactController.updateContact);
router.delete('api/contact/:id', authMiddleware, contactController.deleteContact);

router.patch('api/contact/:id/status', authMiddleware, contactController.updateContactStatus);
router.get('api/contact/:id/template', authMiddleware, contactController.getContactTemplate);

/* ------------------- EMAIL BHEJNA ----------------------- */
// App khud SMTP se email bhejti hai, aur status apne aap update kar deti hai
router.post('api/contact/:id/send-email', authMiddleware, contactController.sendContactEmail);

// SMTP settings theek hain ya nahi (email bheje baghair check)
router.get('/api/email/test', authMiddleware, contactController.testEmailConnection);

/* ------------------ CLIENT KE REPLIES ------------------- */
// Inbox parh kar naye replies dhoondta hai
router.post('/api/inbox/check-replies', authMiddleware, contactController.checkReplies);

// Jin contacts ne jawab diya un ki list
router.get('/api/inbox/replies', authMiddleware, contactController.getReplies);

// Kisi contact ke replies 'parh liye' mark karna
router.patch('api/contacts/:id/replies/read', authMiddleware, contactController.markRepliesRead);

// Reply delete (body me messageId ho to ek, warna saari)
router.delete('api/contacts/:id/replies', authMiddleware, contactController.deleteReplies);

module.exports = router;

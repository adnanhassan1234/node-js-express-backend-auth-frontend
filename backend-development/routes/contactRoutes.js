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
router.post('/api/auth/login', trackerAuthController.login);
router.get('/api/auth/me', authMiddleware, trackerAuthController.me);

/* ------------------- STATS / DASHBOARD ------------------ */
router.get('/api/stats/summary', authMiddleware, contactController.getStats);
router.get('/api/stats/upcoming-followups', authMiddleware, contactController.getUpcomingFollowUps);

/* ---------------------- TEMPLATES ----------------------- */
router.get('/api/templates', authMiddleware, contactController.getAllTemplates);

/* ----------------------- CONTACTS ----------------------- */
// NOTE: specific routes (`/import`, `/filters/options`) ko `/:id` se pehle
// rakha gaya hai taake Express unhe id samajh kar match na kare.
router.post(
  '/api/contacts/import',
  authMiddleware,
  uploadExcel.single('file'),
  contactController.importContacts
);

router.get('/api/contacts/filters/options', authMiddleware, contactController.getFilterOptions);

// NOTE: `/export` ko `/:id` se pehle rakhna zaroori hai, warna Express
// "export" ko kisi contact ki id samajh leta hai.
router.get('/api/contacts/export', authMiddleware, contactController.exportContacts);

router.post('/api/contacts/bulk-delete', authMiddleware, contactController.bulkDeleteContacts);

router.get('/api/contacts', authMiddleware, contactController.getContacts);
router.post('/api/contacts', authMiddleware, contactController.createContact);

router.get('/api/contacts/:id', authMiddleware, contactController.getContactById);
router.put('/api/contacts/:id', authMiddleware, contactController.updateContact);
router.delete('/api/contacts/:id', authMiddleware, contactController.deleteContact);

router.patch('/api/contacts/:id/status', authMiddleware, contactController.updateContactStatus);
router.get('/api/contacts/:id/template', authMiddleware, contactController.getContactTemplate);

/* ------------------- EMAIL BHEJNA ----------------------- */
// App khud SMTP se email bhejti hai, aur status apne aap update kar deti hai
router.post('/api/contacts/:id/send-email', authMiddleware, contactController.sendContactEmail);

// SMTP settings theek hain ya nahi (email bheje baghair check)
router.get('/api/email/test', authMiddleware, contactController.testEmailConnection);

module.exports = router;

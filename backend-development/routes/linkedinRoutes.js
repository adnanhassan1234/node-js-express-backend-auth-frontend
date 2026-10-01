const express = require('express');

const linkedinController = require('../controller/linkedinController');
const uploadExcel = require('../config/uploadExcel');
const uploadPdf = require('../config/uploadPdf');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * XPORTYN LinkedIn Dashboard routes
 * ---------------------------------
 * Sab kuch `/api/linkedin/...` ke neeche hai taake baqi app se alag rahe.
 *
 * NOTE: khaas raaste (`/buyers/import`, `/buyers/export`) ko `/buyers/:id` se
 * PEHLE rakhna zaroori hai -- warna Express "import" ko ek id samajh leta hai.
 */

/* ---------------------- PLAYBOOK ------------------------ */
// Saara tay-shuda content: stages, targets, templates, qawaid
router.get('/api/linkedin/playbook', authMiddleware, linkedinController.getPlaybook);

/* ---------------------- DASHBOARD ----------------------- */
router.get('/api/linkedin/stats', authMiddleware, linkedinController.getStats);

/* ------------------ ROZANA KA MAMOOL -------------------- */
router.get('/api/linkedin/day', authMiddleware, linkedinController.getDay);
router.patch('/api/linkedin/day', authMiddleware, linkedinController.updateDay);

/* ---------------------- REPORT -------------------------- */
router.get('/api/linkedin/report/preview', authMiddleware, linkedinController.previewReport);
router.post('/api/linkedin/report', authMiddleware, linkedinController.saveReport);
router.get('/api/linkedin/reports', authMiddleware, linkedinController.listReports);
router.delete('/api/linkedin/reports/:id', authMiddleware, linkedinController.deleteReport);

/* --------------------- ASK ZAIN ------------------------- */
router.get('/api/linkedin/questions', authMiddleware, linkedinController.listQuestions);
router.post('/api/linkedin/questions', authMiddleware, linkedinController.createQuestion);
router.patch('/api/linkedin/questions/:id', authMiddleware, linkedinController.answerQuestion);
router.delete('/api/linkedin/questions/:id', authMiddleware, linkedinController.deleteQuestion);

/* ---------------------- BUYERS -------------------------- */
router.post(
  '/api/linkedin/buyers/import',
  authMiddleware,
  uploadExcel.single('file'),
  linkedinController.importBuyers
);
router.get('/api/linkedin/buyers/export', authMiddleware, linkedinController.exportBuyers);

// Poora backup -- Excel, saari sheets ke saath (activity bhi)
router.get('/api/linkedin/backup', authMiddleware, linkedinController.backupAll);
router.post(
  '/api/linkedin/restore',
  authMiddleware,
  uploadExcel.single('file'),
  linkedinController.restoreAll
);

// LinkedIn ka profile PDF -> Add Buyer ka form (kuch save nahi hota)
/**
 * multer ki ghalti ko saaf JSON me badalte hain.
 *
 * Warna ghalat file (misal CSV) bhejne par Express apna HTML error page bhej
 * deta hai, aur frontend usay parh hi nahi pata -- user ko bekaar sa paigham
 * milta hai.
 */
const withPdf = (req, res, next) =>
  uploadPdf.single('file')(req, res, (err) =>
    err ? res.status(400).json({ success: false, message: err.message }) : next()
  );

router.post(
  '/api/linkedin/buyers/from-pdf',
  authMiddleware,
  withPdf,
  linkedinController.parseProfilePdf
);

router.get('/api/linkedin/buyers', authMiddleware, linkedinController.listBuyers);

// Bulk delete -- ids se ya maujooda filter ke saath (all: true)
router.post('/api/linkedin/buyers/bulk-delete', authMiddleware, linkedinController.bulkDeleteBuyers);

// Kai buyers par ek hi kaam -- "in sab ne accept kar liya"
router.post('/api/linkedin/buyers/bulk-activity', authMiddleware, linkedinController.bulkLogActivity);
router.post('/api/linkedin/buyers', authMiddleware, linkedinController.createBuyer);

router.get('/api/linkedin/buyers/:id', authMiddleware, linkedinController.getBuyer);
router.put('/api/linkedin/buyers/:id', authMiddleware, linkedinController.updateBuyer);
router.delete('/api/linkedin/buyers/:id', authMiddleware, linkedinController.deleteBuyer);

// Koi ek kaam alag se likhna (Outreach page ka "Mark as sent")
router.post('/api/linkedin/buyers/:id/activity', authMiddleware, linkedinController.logActivity);

module.exports = router;

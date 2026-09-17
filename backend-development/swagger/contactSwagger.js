/**
 * @swagger
 * tags:
 *   name: XPORTYN Tracker
 *   description: Sales Tracker — contacts, import, templates & dashboard stats
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Tracker login (default admin / admin)
 *     tags: [XPORTYN Tracker]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: admin }
 *               password: { type: string, example: admin }
 *     responses:
 *       200: { description: Login successful, token returned }
 *       401: { description: Invalid credentials }
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Current logged-in user (token check)
 *     tags: [XPORTYN Tracker]
 *     responses:
 *       200: { description: User info }
 *       401: { description: Token missing }
 */

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: List contacts (filters + search + pagination)
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25 }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [All, Soccer, Schools, Colleges] }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [All, Email Sent, Follow-up 1, Follow-up 2, Replied, Deal Closed, No Reply]
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         description: Name / email / city me search
 *         schema: { type: string }
 *       - in: query
 *         name: hasEmail
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: sortField
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200: { description: Paginated contact list }
 *   post:
 *     summary: Create a contact manually
 *     tags: [XPORTYN Tracker]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category]
 *             properties:
 *               name: { type: string, example: Baton Rouge Soccer Club }
 *               contactPerson: { type: string, example: John Smith }
 *               city: { type: string, example: Baton Rouge }
 *               category: { type: string, enum: [Soccer, Schools, Colleges] }
 *               address: { type: string }
 *               phone: { type: string }
 *               website: { type: string }
 *               email: { type: string, example: info@example.com }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Contact created }
 *       400: { description: Validation error }
 */

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: Get one contact
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Contact }
 *       404: { description: Not found }
 *   put:
 *     summary: Update contact (details, status, dates, notes)
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Email Sent, Follow-up 1, Follow-up 2, Replied, Deal Closed, No Reply]
 *               lastContactDate: { type: string, format: date }
 *               nextFollowUpDate: { type: string, format: date, nullable: true }
 *               notes: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *   delete:
 *     summary: Delete contact
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */

/**
 * @swagger
 * /api/contacts/{id}/status:
 *   patch:
 *     summary: Quick status change (color + nextFollowUpDate auto-calculate)
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Email Sent, Follow-up 1, Follow-up 2, Replied, Deal Closed, No Reply]
 *     responses:
 *       200: { description: Status updated }
 */

/**
 * @swagger
 * /api/contacts/{id}/template:
 *   get:
 *     summary: Email template with placeholders filled from contact data
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [initial, followUp1, followUp2], default: initial }
 *       - in: query
 *         name: senderName
 *         schema: { type: string, example: Raja Ali }
 *       - in: query
 *         name: senderTitle
 *         schema: { type: string, example: Sales Manager }
 *     responses:
 *       200: { description: Rendered subject, body and mailto link }
 */

/**
 * @swagger
 * /api/contacts/import:
 *   post:
 *     summary: Import contacts from .xlsx / .xls / .csv (multi-sheet supported)
 *     tags: [XPORTYN Tracker]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               categoryOverride:
 *                 type: string
 *                 enum: [Soccer, Schools, Colleges]
 *                 description: Optional — poori file ko force karke is category me daal dega
 *     responses:
 *       201: { description: Import summary (inserted / duplicates / skipped) }
 *       400: { description: Invalid file or no valid rows }
 */

/**
 * @swagger
 * /api/contacts/bulk-delete:
 *   post:
 *     summary: Delete multiple contacts
 *     tags: [XPORTYN Tracker]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200: { description: Deleted count }
 */

/**
 * @swagger
 * /api/contacts/filters/options:
 *   get:
 *     summary: Dropdown options (cities, categories, statuses, colors)
 *     tags: [XPORTYN Tracker]
 *     responses:
 *       200: { description: Filter options }
 */

/**
 * @swagger
 * /api/stats/summary:
 *   get:
 *     summary: Dashboard stats — cards, status counts, category counts
 *     tags: [XPORTYN Tracker]
 *     responses:
 *       200: { description: Stats object }
 */

/**
 * @swagger
 * /api/stats/upcoming-followups:
 *   get:
 *     summary: Follow-ups due within N days (overdue included)
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 2 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: Upcoming follow-up list }
 */

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Raw email templates (bina fill kiye) + placeholder list
 *     tags: [XPORTYN Tracker]
 *     responses:
 *       200: { description: Templates }
 */

/**
 * @swagger
 * /api/contacts/export:
 *   get:
 *     summary: Contacts download karein (CSV / Excel-Google Sheets / PDF)
 *     description: >
 *       Wohi filters lagte hain jo list endpoint par lagte hain, is liye jo table me
 *       nazar aa raha hai bilkul wohi file me aata hai (sirf mojooda page nahi, poori list).
 *       Maximum 5000 rows.
 *     tags: [XPORTYN Tracker]
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema: { type: string, enum: [csv, xlsx, pdf], default: csv }
 *         description: xlsx wali file Google Sheets me File - Import se khul jati hai
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [All, Soccer, Schools, Colleges] }
 *       - in: query
 *         name: status
 *         description: Comma se alag kar ke ek se ziyada bhi (maslan Follow-up 1,Follow-up 2)
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: hasEmail
 *         schema: { type: string, enum: ["true", "false"] }
 *     responses:
 *       200:
 *         description: File (attachment)
 *         content:
 *           text/csv: { schema: { type: string, format: binary } }
 *           application/pdf: { schema: { type: string, format: binary } }
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 *       400:
 *         description: format csv, xlsx ya pdf me se hona chahiye
 *       401:
 *         description: Token missing
 */

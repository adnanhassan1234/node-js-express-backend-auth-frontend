/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management APIs
 */

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students with pagination, sorting & search
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           example: age
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           example: asc
 *           enum: [asc, desc]
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: 
 *     responses:
 *       200:
 *         description: Students fetched successfully
 */

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student found
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * /students/search:
 *   get:
 *     summary: Search student by name or age
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: ahmed
 *       - in: query
 *         name: age
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Students found
 *       400:
 *         description: Name or age is required
 */

/**
 * @swagger
 * /students/search-by-name:
 *   get:
 *     summary: Search student only by name
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           example: saad
 *     responses:
 *       200:
 *         description: Students found
 */

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Add new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ali
 *               age:
 *                 type: number
 *                 example: 22
 *               email:
 *                 type: string
 *                 example: ali@gmail.com
 *     responses:
 *       201:
 *         description: Student added successfully
 */

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: number
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */

/**
 * @swagger
 * /students/upload:
 *   post:
 *     summary: Upload student files (Max 3)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               myFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */

/**
 * @swagger
 * /students/send-email:
 *   post:
 *     summary: Send email using nodemailer
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Test Email
 *               message:
 *                 type: string
 *                 example: This is a test email
 *     responses:
 *       200:
 *         description: Email sent successfully
 */

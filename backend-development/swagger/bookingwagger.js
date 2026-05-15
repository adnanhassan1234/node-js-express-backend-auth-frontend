/**
 * @swagger
 * tags:
 *   name: Booking
 *   description: Booking management APIs
 */

/**
 * @swagger
 * /create-checkout-session:
 *   post:
 *     summary: Create-stripe-checkout-session for booking
 *     tags: [Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItems
 *               - name
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Adnan Hassan
 *               email:
 *                 type: string
 *                 example: ah5404219@gmail.com
 *               phone:
 *                 type: string
 *                 example: +923476275532
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - unit_amount
 *                     - quantity
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Airport Taxi Booking
 *                     unit_amount:
 *                       type: integer
 *                       example: 12000
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       201:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: cs_test_exampleSessionID
 *                 redirectUrl:
 *                   type: string
 *                   example: https://checkout.stripe.com/pay/cs_test_exampleSessionID
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

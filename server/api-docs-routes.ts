// OpenAPI route documentation for ClubFlow API
// This file contains detailed API documentation for all routes

/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /clubs:
 *   get:
 *     summary: Get all clubs for current user
 *     tags: [Clubs]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of clubs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Club'
 *                   - type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         example: 'club-administrator'
 *                       status:
 *                         type: string
 *                         example: 'active'
 *   post:
 *     summary: Create a new club
 *     tags: [Clubs]
 *     security:
 *       - cookieAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'FC Neu'
 *               description:
 *                 type: string
 *                 example: 'Ein neuer Sportverein'
 *     responses:
 *       201:
 *         description: Club created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 */

/**
 * @swagger
 * /clubs/{clubId}/members:
 *   get:
 *     summary: Get all members of a club
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Club ID
 *     responses:
 *       200:
 *         description: List of club members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Member'
 *   post:
 *     summary: Create a new member
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: 'Max'
 *               lastName:
 *                 type: string
 *                 example: 'Mustermann'
 *               email:
 *                 type: string
 *                 example: 'max@example.com'
 *               phone:
 *                 type: string
 *                 example: '+49 123 456789'
 *     responses:
 *       201:
 *         description: Member created successfully
 */

/**
 * @swagger
 * /clubs/{clubId}/teams:
 *   get:
 *     summary: Get all teams of a club
 *     tags: [Teams]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 */

/**
 * @swagger
 * /clubs/{clubId}/facilities:
 *   get:
 *     summary: Get all facilities of a club
 *     tags: [Facilities]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of facilities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Facility'
 */

/**
 * @swagger
 * /clubs/{clubId}/bookings:
 *   get:
 *     summary: Get all bookings of a club
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *       - in: query
 *         name: facilityId
 *         schema:
 *           type: integer
 *         description: Filter by facility
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, facilityId, date, startTime, endTime]
 *             properties:
 *               title:
 *                 type: string
 *                 example: 'Training Herren 1'
 *               facilityId:
 *                 type: integer
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 example: '2025-01-15'
 *               startTime:
 *                 type: string
 *                 example: '18:00'
 *               endTime:
 *                 type: string
 *                 example: '20:00'
 *     responses:
 *       201:
 *         description: Booking created successfully
 */

/**
 * @swagger
 * /clubs/{clubId}/dashboard:
 *   get:
 *     summary: Get dashboard statistics for a club
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: clubId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalMembers:
 *                       type: integer
 *                       example: 150
 *                     activeTeams:
 *                       type: integer
 *                       example: 8
 *                     upcomingBookings:
 *                       type: integer
 *                       example: 12
 *                     monthlyRevenue:
 *                       type: number
 *                       example: 2500.50
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */

/**
 * @swagger
 * /csrf-token:
 *   get:
 *     summary: Get CSRF token for secure operations
 *     tags: [Security]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: CSRF token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   example: 'abc123def456'
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'healthy'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 *                 version:
 *                   type: string
 *                   example: '1.0.0'
 *                 environment:
 *                   type: string
 *                   example: 'development'
 */
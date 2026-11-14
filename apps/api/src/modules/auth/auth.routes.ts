import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { query, withTransaction } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate } from '../../middleware/auth.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', async (request, reply) => {
    const parse = loginSchema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid input parameters', 400, parse.error.flatten());
    }

    const { email, password } = parse.data;

    // Parameterized SQL query
    const userResult = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.full_name, u.phone, u.is_active,
              c.id AS customer_id,
              m.id AS mechanic_id
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       LEFT JOIN mechanics m ON m.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userResult.rowCount === 0) {
      return sendError(reply, 'Invalid email or password credentials', 401);
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return sendError(reply, 'This account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(reply, 'Invalid email or password credentials', 401);
    }

    const token = fastify.jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: '7d' }
    );

    return sendSuccess(
      reply,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
          phone: user.phone,
          customerId: user.customer_id,
          mechanicId: user.mechanic_id,
        },
      },
      'Authentication successful'
    );
  });

  // Customer Registration (ACID transaction inserting into users + customers)
  fastify.post('/register', async (request, reply) => {
    const parse = registerSchema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Validation error', 400, parse.error.flatten());
    }

    const { email, password, fullName, phone, address, city, state, postalCode } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const newUser = await withTransaction(async (client) => {
        // Check uniqueness with FOR UPDATE or SELECT
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
        if (existing.rowCount && existing.rowCount > 0) {
          throw new Error('An account with this email address already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // 1. Insert into users table
        const userInsert = await client.query(
          `INSERT INTO users (email, password_hash, role, full_name, phone, is_active)
           VALUES ($1, $2, 'customer', $3, $4, TRUE)
           RETURNING id, email, role, full_name, phone, created_at`,
          [normalizedEmail, passwordHash, fullName, phone]
        );

        const createdUser = userInsert.rows[0];

        // 2. Insert into customers table
        const customerInsert = await client.query(
          `INSERT INTO customers (user_id, address, city, state, postal_code)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [createdUser.id, address || null, city || null, state || null, postalCode || null]
        );

        return {
          ...createdUser,
          customerId: customerInsert.rows[0].id,
        };
      });

      const token = fastify.jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        { expiresIn: '7d' }
      );

      return sendSuccess(
        reply,
        {
          token,
          user: newUser,
        },
        'Customer account registered successfully',
        201
      );
    } catch (err: any) {
      return sendError(reply, err.message || 'Registration failed', 400);
    }
  });

  // Current session user details
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    return sendSuccess(reply, request.user, 'Session profile loaded');
  });
}


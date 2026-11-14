import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../db/index.js';
import { sendError } from '../utils/response.js';

export interface AuthUser {
  id: number;
  email: string;
  role: 'admin' | 'customer' | 'mechanic';
  fullName: string;
  customerId?: number;
  mechanicId?: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; email: string; role: string };
    user: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(reply, 'Missing or malformed Authorization header', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = (await request.server.jwt.verify(token)) as { id: number; email: string; role: string };

    // Parameterized lookup to get active user and role-specific profile IDs
    const userRes = await query(
      `SELECT u.id, u.email, u.role, u.full_name, u.is_active,
              c.id AS customer_id,
              m.id AS mechanic_id
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       LEFT JOIN mechanics m ON m.user_id = u.id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.id]
    );

    if (userRes.rowCount === 0) {
      return sendError(reply, 'User account not found or is deactivated', 401);
    }

    const row = userRes.rows[0];
    request.user = {
      id: row.id,
      email: row.email,
      role: row.role,
      fullName: row.full_name,
      customerId: row.customer_id || undefined,
      mechanicId: row.mechanic_id || undefined,
    };
  } catch (err: any) {
    return sendError(reply, 'Invalid or expired session token', 401, err.message);
  }
}

export function authorizeRole(allowedRoles: ('admin' | 'customer' | 'mechanic')[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return sendError(reply, 'Unauthenticated user', 401);
    }
    if (!allowedRoles.includes(request.user.role)) {
      return sendError(reply, `Access denied. Role '${request.user.role}' lacks permission for this resource.`, 403);
    }
  };
}

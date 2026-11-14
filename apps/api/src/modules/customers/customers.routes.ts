import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate, authorizeRole } from '../../middleware/auth.js';

export async function customerRoutes(fastify: FastifyInstance) {
  // List customers with vehicle and spending aggregations (Admin only)
  fastify.get('/', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const sql = `
      SELECT 
        c.id AS customer_id,
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.is_active,
        c.address,
        c.city,
        c.state,
        c.postal_code,
        c.created_at,
        COUNT(DISTINCT v.id) AS vehicle_count,
        COUNT(DISTINCT sb.id) AS total_bookings_count,
        get_customer_total_spending(c.id) AS total_spending
      FROM customers c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN vehicles v ON v.customer_id = c.id
      LEFT JOIN service_bookings sb ON sb.customer_id = c.id
      GROUP BY c.id, u.id, u.full_name, u.email, u.phone, u.is_active, c.address, c.city, c.state, c.postal_code, c.created_at
      ORDER BY c.id ASC;
    `;
    const res = await query(sql);
    return sendSuccess(reply, res.rows, 'Customers fetched successfully');
  });

  // Get specific customer details
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const customerId = parseInt(id, 10);

    // Non-admin can only access own customer record
    if (request.user?.role === 'customer' && request.user.customerId !== customerId) {
      return sendError(reply, 'Unauthorized access to customer profile', 403);
    }

    const sql = `
      SELECT 
        c.id AS customer_id,
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        c.address,
        c.city,
        c.state,
        c.postal_code,
        c.emergency_contact,
        c.created_at,
        get_customer_total_spending(c.id) AS total_spending
      FROM customers c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = $1;
    `;
    const res = await query(sql, [customerId]);
    if (res.rowCount === 0) {
      return sendError(reply, 'Customer not found', 404);
    }

    return sendSuccess(reply, res.rows[0], 'Customer details loaded');
  });

  // Update customer profile
  fastify.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const customerId = parseInt(id, 10);

    if (request.user?.role === 'customer' && request.user.customerId !== customerId) {
      return sendError(reply, 'Unauthorized to update this profile', 403);
    }

    const schema = z.object({
      fullName: z.string().min(2).optional(),
      phone: z.string().min(8).optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      emergencyContact: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid payload', 400, parse.error.flatten());
    }

    const { fullName, phone, address, city, state, postalCode, emergencyContact } = parse.data;

    const customerRes = await query('SELECT user_id FROM customers WHERE id = $1', [customerId]);
    if (customerRes.rowCount === 0) {
      return sendError(reply, 'Customer record not found', 404);
    }
    const userId = customerRes.rows[0].user_id;

    if (fullName || phone) {
      await query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [fullName || null, phone || null, userId]
      );
    }

    await query(
      `UPDATE customers
       SET address = COALESCE($1, address),
           city = COALESCE($2, city),
           state = COALESCE($3, state),
           postal_code = COALESCE($4, postal_code),
           emergency_contact = COALESCE($5, emergency_contact),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [address || null, city || null, state || null, postalCode || null, emergencyContact || null, customerId]
    );

    return sendSuccess(reply, { id: customerId }, 'Profile updated successfully');
  });
}


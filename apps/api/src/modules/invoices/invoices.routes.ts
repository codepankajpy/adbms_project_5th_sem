import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate, authorizeRole } from '../../middleware/auth.js';

export async function invoiceRoutes(fastify: FastifyInstance) {
  // List invoices
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    let sql = `
      SELECT 
        i.*,
        u.full_name AS customer_name,
        u.email AS customer_email,
        sb.booking_number,
        calculate_invoice_balance(i.id) AS outstanding_balance
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN users u ON u.id = c.user_id
      JOIN service_bookings sb ON sb.id = i.booking_id
    `;
    const params: any[] = [];

    if (user.role === 'customer') {
      sql += ' WHERE i.customer_id = $1';
      params.push(user.customerId);
    }

    sql += ' ORDER BY i.issued_at DESC;';

    const res = await query(sql, params);
    return sendSuccess(reply, res.rows, 'Invoices fetched');
  });

  // Get pending receivables view (Admin only)
  fastify.get('/pending-receivables', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const res = await query('SELECT * FROM pending_payments_view ORDER BY due_date ASC');
    return sendSuccess(reply, res.rows, 'Pending payments view loaded');
  });

  // Get specific invoice with items and payments
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const invoiceId = parseInt(id, 10);

    const invRes = await query(
      `SELECT 
        i.*,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        c.address AS customer_address,
        c.city AS customer_city,
        sb.booking_number,
        sb.booking_date,
        v.registration_number,
        calculate_invoice_balance(i.id) AS outstanding_balance
       FROM invoices i
       JOIN customers c ON c.id = i.customer_id
       JOIN users u ON u.id = c.user_id
       JOIN service_bookings sb ON sb.id = i.booking_id
       JOIN vehicles v ON v.id = sb.vehicle_id
       WHERE i.id = $1`,
      [invoiceId]
    );

    if (invRes.rowCount === 0) {
      return sendError(reply, 'Invoice not found', 404);
    }

    const invoice = invRes.rows[0];

    if (request.user?.role === 'customer' && request.user.customerId !== invoice.customer_id) {
      return sendError(reply, 'Unauthorized access to invoice', 403);
    }

    const itemsRes = await query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [invoiceId]
    );

    const paymentsRes = await query(
      `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
      [invoiceId]
    );

    return sendSuccess(
      reply,
      {
        invoice,
        items: itemsRes.rows,
        payments: paymentsRes.rows,
      },
      'Invoice details loaded'
    );
  });

  // Generate invoice for a booking (Demonstrating Stored Procedure: generate_invoice)
  fastify.post('/generate', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const schema = z.object({
      bookingId: z.number().int(),
      discountAmount: z.number().min(0).default(0),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid payload', 400, parse.error.flatten());
    }

    const { bookingId, discountAmount } = parse.data;

    try {
      // Execute PL/pgSQL Stored Procedure generate_invoice
      const procRes = await query(
        `CALL generate_invoice(
          $1::INT,
          $2::NUMERIC,
          NULL,
          NULL
        );`,
        [bookingId, discountAmount]
      );

      const invoiceId = procRes.rows[0]?.p_invoice_id;
      const invoiceNumber = procRes.rows[0]?.p_invoice_number;

      return sendSuccess(
        reply,
        { invoiceId, invoiceNumber },
        'Invoice generated successfully via database stored procedure',
        201
      );
    } catch (err: any) {
      return sendError(reply, err.message || 'Failed to generate invoice', 400);
    }
  });
}


import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate } from '../../middleware/auth.js';

export async function paymentRoutes(fastify: FastifyInstance) {
  // List payments
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    let sql = `
      SELECT 
        p.*,
        i.invoice_number,
        i.total_amount AS invoice_total,
        u.full_name AS customer_name,
        u.email AS customer_email
      FROM payments p
      JOIN invoices i ON i.id = p.invoice_id
      JOIN customers c ON c.id = i.customer_id
      JOIN users u ON u.id = c.user_id
    `;
    const params: any[] = [];

    if (user.role === 'customer') {
      sql += ' WHERE i.customer_id = $1';
      params.push(user.customerId);
    }

    sql += ' ORDER BY p.payment_date DESC;';

    const res = await query(sql, params);
    return sendSuccess(reply, res.rows, 'Payments fetched');
  });

  // Process payment (Demonstrating Stored Procedure: process_invoice_payment)
  fastify.post('/process', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      invoiceId: z.number().int(),
      amount: z.number().positive(),
      paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'upi', 'bank_transfer']),
      transactionId: z.string().optional(),
      remarks: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid payment details', 400, parse.error.flatten());
    }

    const { invoiceId, amount, paymentMethod, transactionId, remarks } = parse.data;

    try {
      // Execute PL/pgSQL Stored Procedure process_invoice_payment
      const procRes = await query(
        `CALL process_invoice_payment(
          $1::INT,
          $2::NUMERIC,
          $3::payment_method,
          $4::VARCHAR,
          $5::TEXT,
          NULL,
          NULL
        );`,
        [
          invoiceId,
          amount,
          paymentMethod,
          transactionId || `TXN_${Date.now()}`,
          remarks || 'Processed via portal',
        ]
      );

      const paymentId = procRes.rows[0]?.p_payment_id;
      const paymentRef = procRes.rows[0]?.p_payment_reference;

      return sendSuccess(
        reply,
        { paymentId, paymentReference: paymentRef },
        'Payment processed successfully via database transaction & stored procedure',
        201
      );
    } catch (err: any) {
      return sendError(reply, err.message || 'Payment processing failed', 400);
    }
  });
}


import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate, authorizeRole } from '../../middleware/auth.js';

export async function bookingRoutes(fastify: FastifyInstance) {
  // List bookings (Role-aware query using booking_details_view)
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    let sql = 'SELECT * FROM booking_details_view';
    const params: any[] = [];

    if (user.role === 'customer') {
      sql += ' WHERE customer_id = $1';
      params.push(user.customerId);
    } else if (user.role === 'mechanic') {
      sql += ' WHERE mechanic_id = $1';
      params.push(user.mechanicId);
    }

    sql += ' ORDER BY booking_date DESC, booking_id DESC;';

    const res = await query(sql, params);
    return sendSuccess(reply, res.rows, 'Bookings retrieved');
  });

  // Get booking details with timeline, items, and reviews
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const bookingId = parseInt(id, 10);

    const bookingRes = await query('SELECT * FROM booking_details_view WHERE booking_id = $1', [bookingId]);
    if (bookingRes.rowCount === 0) {
      return sendError(reply, 'Booking not found', 404);
    }

    const booking = bookingRes.rows[0];

    // Authorization check
    if (request.user?.role === 'customer' && request.user.customerId !== booking.customer_id) {
      return sendError(reply, 'Unauthorized access to this booking', 403);
    }
    if (request.user?.role === 'mechanic' && request.user.mechanicId !== booking.mechanic_id) {
      return sendError(reply, 'Unauthorized access to this job', 403);
    }

    // Fetch line items
    const servicesRes = await query(
      `SELECT bs.service_id, s.name, s.description, bs.unit_price, bs.notes
       FROM booking_services bs
       JOIN services s ON s.id = bs.service_id
       WHERE bs.booking_id = $1`,
      [bookingId]
    );

    // Fetch lifecycle status history
    const historyRes = await query(
      `SELECT ssh.*, u.full_name AS changed_by_name
       FROM service_status_history ssh
       LEFT JOIN users u ON u.id = ssh.changed_by_user_id
       WHERE ssh.booking_id = $1
       ORDER BY ssh.changed_at ASC`,
      [bookingId]
    );

    // Fetch technical service record if completed
    const recordRes = await query(
      `SELECT sr.*, u.full_name AS mechanic_name
       FROM service_records sr
       JOIN mechanics m ON m.id = sr.mechanic_id
       JOIN users u ON u.id = m.user_id
       WHERE sr.booking_id = $1`,
      [bookingId]
    );

    // Fetch customer review if submitted
    const reviewRes = await query('SELECT * FROM reviews WHERE booking_id = $1', [bookingId]);

    return sendSuccess(
      reply,
      {
        booking,
        services: servicesRes.rows,
        statusHistory: historyRes.rows,
        serviceRecord: recordRes.rows[0] || null,
        review: reviewRes.rows[0] || null,
      },
      'Booking details loaded'
    );
  });

  // Create appointment booking (Demonstrating Stored Procedure: book_service_appointment)
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const schema = z.object({
      customerId: z.number().optional(),
      vehicleId: z.number(),
      bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      timeSlot: z.string().min(3),
      serviceIds: z.array(z.number()).min(1),
      customerNotes: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid booking request', 400, parse.error.flatten());
    }

    const { vehicleId, bookingDate, timeSlot, serviceIds, customerNotes } = parse.data;
    const targetCustomerId = user.role === 'customer' ? user.customerId! : parse.data.customerId || user.customerId!;

    if (!targetCustomerId) {
      return sendError(reply, 'Customer ID is required', 400);
    }

    try {
      // Execute PL/pgSQL Stored Procedure
      // PROCEDURE book_service_appointment(p_customer_id, p_vehicle_id, p_booking_date, p_time_slot, p_service_ids, p_customer_notes, INOUT p_booking_id, INOUT p_booking_number)
      const procRes = await query(
        `CALL book_service_appointment(
          $1::INT,
          $2::INT,
          $3::DATE,
          $4::VARCHAR,
          $5::INT[],
          $6::TEXT,
          NULL,
          NULL
        );`,
        [targetCustomerId, vehicleId, bookingDate, timeSlot, serviceIds, customerNotes || '']
      );

      const createdBookingId = procRes.rows[0]?.p_booking_id;
      const createdBookingNumber = procRes.rows[0]?.p_booking_number;

      return sendSuccess(
        reply,
        {
          bookingId: createdBookingId,
          bookingNumber: createdBookingNumber,
        },
        'Appointment successfully booked via database stored procedure',
        201
      );
    } catch (err: any) {
      return sendError(reply, err.message || 'Failed to book appointment', 400);
    }
  });

  // Assign mechanic to booking (Demonstrating Stored Procedure: assign_mechanic)
  fastify.post('/:id/assign', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const bookingId = parseInt(id, 10);

    const schema = z.object({
      mechanicId: z.number(),
      mechanicNotes: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid assignment payload', 400, parse.error.flatten());
    }

    const { mechanicId, mechanicNotes } = parse.data;

    try {
      // Execute PL/pgSQL Stored Procedure
      await query(
        `CALL assign_mechanic($1::INT, $2::INT, $3::TEXT);`,
        [bookingId, mechanicId, mechanicNotes || null]
      );

      return sendSuccess(reply, { bookingId, mechanicId }, 'Mechanic assigned successfully via stored procedure');
    } catch (err: any) {
      return sendError(reply, err.message || 'Failed to assign mechanic', 400);
    }
  });

  // Complete service (Demonstrating Stored Procedure: complete_service)
  fastify.post('/:id/complete', { preHandler: [authenticate, authorizeRole(['admin', 'mechanic'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const bookingId = parseInt(id, 10);

    const schema = z.object({
      mechanicId: z.number().optional(),
      odometerReading: z.number().int().min(0),
      workPerformed: z.string().min(5),
      partsReplaced: z.string().optional(),
      diagnosticNotes: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid payload', 400, parse.error.flatten());
    }

    const data = parse.data;
    const effectiveMechanicId = request.user?.role === 'mechanic' ? request.user.mechanicId! : data.mechanicId;

    if (!effectiveMechanicId) {
      return sendError(reply, 'Mechanic ID is required to complete service', 400);
    }

    try {
      // Execute PL/pgSQL Stored Procedure complete_service
      await query(
        `CALL complete_service(
          $1::INT,
          $2::INT,
          $3::INT,
          $4::TEXT,
          $5::TEXT,
          $6::TEXT
        );`,
        [
          bookingId,
          effectiveMechanicId,
          data.odometerReading,
          data.workPerformed,
          data.partsReplaced || null,
          data.diagnosticNotes || null,
        ]
      );

      return sendSuccess(reply, { bookingId }, 'Service completed and recorded via stored procedure');
    } catch (err: any) {
      return sendError(reply, err.message || 'Failed to complete service', 400);
    }
  });

  // Update booking status directly (Admin only - triggers trg_validate_booking_status will validate transition!)
  fastify.patch('/:id/status', { preHandler: [authenticate, authorizeRole(['admin', 'mechanic'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const bookingId = parseInt(id, 10);

    const schema = z.object({
      status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
      reason: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid status', 400, parse.error.flatten());
    }

    const { status } = parse.data;

    try {
      // Will fire BEFORE UPDATE trigger trg_validate_booking_status
      // and AFTER UPDATE trigger trg_track_booking_status
      const res = await query(
        `UPDATE service_bookings
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, booking_number, status`,
        [status, bookingId]
      );

      if (res.rowCount === 0) {
        return sendError(reply, 'Booking not found', 404);
      }

      return sendSuccess(reply, res.rows[0], 'Booking status updated successfully');
    } catch (err: any) {
      return sendError(reply, err.message || 'Status transition rejected by database trigger', 400);
    }
  });

  // Add review for a completed booking (Customer only)
  fastify.post('/:id/review', { preHandler: [authenticate, authorizeRole(['customer'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const bookingId = parseInt(id, 10);

    const schema = z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid review payload', 400, parse.error.flatten());
    }

    const { rating, comment } = parse.data;
    const customerId = request.user!.customerId!;

    try {
      const res = await query(
        `INSERT INTO reviews (booking_id, customer_id, rating, comment, review_date)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (booking_id) DO UPDATE
         SET rating = EXCLUDED.rating,
             comment = EXCLUDED.comment,
             review_date = CURRENT_TIMESTAMP
         RETURNING *`,
        [bookingId, customerId, rating, comment || null]
      );

      return sendSuccess(reply, res.rows[0], 'Review submitted successfully');
    } catch (err: any) {
      return sendError(reply, err.message, 400);
    }
  });
}


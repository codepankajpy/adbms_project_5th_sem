import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate, authorizeRole } from '../../middleware/auth.js';

export async function mechanicRoutes(fastify: FastifyInstance) {
  // Get all mechanics with workload metrics (using View: mechanic_workload_view)
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const sql = `
      SELECT * FROM mechanic_workload_view
      ORDER BY mechanic_id ASC;
    `;
    const res = await query(sql);
    return sendSuccess(reply, res.rows, 'Mechanics fetched successfully');
  });

  // Get specific mechanic details and performance function metrics
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const mechanicId = parseInt(id, 10);

    const statsRes = await query('SELECT * FROM get_mechanic_completed_jobs($1)', [mechanicId]);
    if (statsRes.rowCount === 0) {
      return sendError(reply, 'Mechanic not found', 404);
    }

    const assignedJobs = await query(
      `SELECT sa.id AS assignment_id, sa.booking_id, sa.status AS assignment_status,
              sa.assigned_at, sa.started_at, sa.completed_at, sa.mechanic_notes,
              sb.booking_number, sb.booking_date, sb.time_slot, sb.status AS booking_status,
              v.registration_number, vm.model_name
       FROM service_assignments sa
       JOIN service_bookings sb ON sb.id = sa.booking_id
       JOIN vehicles v ON v.id = sb.vehicle_id
       JOIN vehicle_models vm ON vm.id = v.model_id
       WHERE sa.mechanic_id = $1
       ORDER BY sa.assigned_at DESC`,
      [mechanicId]
    );

    return sendSuccess(
      reply,
      {
        metrics: statsRes.rows[0],
        jobs: assignedJobs.rows,
      },
      'Mechanic details loaded'
    );
  });

  // Update mechanic availability or rate (Admin only)
  fastify.put('/:id', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const mechanicId = parseInt(id, 10);

    const schema = z.object({
      specialization: z.string().optional(),
      hourlyRate: z.number().positive().optional(),
      isAvailable: z.boolean().optional(),
      status: z.string().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid payload', 400, parse.error.flatten());
    }

    const { specialization, hourlyRate, isAvailable, status } = parse.data;

    await query(
      `UPDATE mechanics
       SET specialization = COALESCE($1, specialization),
           hourly_rate = COALESCE($2, hourly_rate),
           is_available = COALESCE($3, is_available),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [specialization || null, hourlyRate || null, isAvailable !== undefined ? isAvailable : null, status || null, mechanicId]
    );

    return sendSuccess(reply, { id: mechanicId }, 'Mechanic updated successfully');
  });
}


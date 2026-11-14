import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate, authorizeRole } from '../../middleware/auth.js';

export async function serviceRoutes(fastify: FastifyInstance) {
  // Public/all users can browse active service categories and catalog
  fastify.get('/catalog', async (request, reply) => {
    const categoriesRes = await query(`SELECT * FROM service_categories ORDER BY id ASC`);
    const servicesRes = await query(
      `SELECT s.*, sc.name AS category_name 
       FROM services s
       JOIN service_categories sc ON sc.id = s.category_id
       WHERE s.is_active = TRUE
       ORDER BY sc.name ASC, s.name ASC`
    );
    return sendSuccess(reply, { categories: categoriesRes.rows, services: servicesRes.rows }, 'Services catalog loaded');
  });

  // Admin: get all services including inactive
  fastify.get('/', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const sql = `
      SELECT 
        s.*,
        sc.name AS category_name,
        COUNT(bs.booking_id) AS total_times_booked,
        COALESCE(SUM(bs.unit_price), 0.00) AS total_revenue_earned
      FROM services s
      JOIN service_categories sc ON sc.id = s.category_id
      LEFT JOIN booking_services bs ON bs.service_id = s.id
      GROUP BY s.id, sc.name
      ORDER BY s.id ASC;
    `;
    const res = await query(sql);
    return sendSuccess(reply, res.rows, 'All services loaded');
  });

  // Create new service (Admin only)
  fastify.post('/', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const schema = z.object({
      categoryId: z.number().int(),
      name: z.string().min(3).max(150),
      description: z.string().optional(),
      basePrice: z.number().positive(),
      estimatedDurationMinutes: z.number().int().positive().default(60),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid service details', 400, parse.error.flatten());
    }

    const { categoryId, name, description, basePrice, estimatedDurationMinutes } = parse.data;

    try {
      const res = await query(
        `INSERT INTO services (category_id, name, description, base_price, estimated_duration_minutes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [categoryId, name, description || null, basePrice, estimatedDurationMinutes]
      );
      return sendSuccess(reply, res.rows[0], 'Service created successfully', 201);
    } catch (err: any) {
      if (err.code === '23505') {
        return sendError(reply, 'A service with this name already exists in this category', 409);
      }
      return sendError(reply, err.message, 400);
    }
  });

  // Update service (Admin only)
  fastify.put('/:id', { preHandler: [authenticate, authorizeRole(['admin'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const serviceId = parseInt(id, 10);

    const schema = z.object({
      name: z.string().min(3).optional(),
      description: z.string().optional(),
      basePrice: z.number().positive().optional(),
      estimatedDurationMinutes: z.number().int().positive().optional(),
      isActive: z.boolean().optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid payload', 400, parse.error.flatten());
    }

    const { name, description, basePrice, estimatedDurationMinutes, isActive } = parse.data;

    const res = await query(
      `UPDATE services
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           base_price = COALESCE($3, base_price),
           estimated_duration_minutes = COALESCE($4, estimated_duration_minutes),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name || null,
        description !== undefined ? description : null,
        basePrice || null,
        estimatedDurationMinutes || null,
        isActive !== undefined ? isActive : null,
        serviceId,
      ]
    );

    if (res.rowCount === 0) {
      return sendError(reply, 'Service not found', 404);
    }

    return sendSuccess(reply, res.rows[0], 'Service updated successfully');
  });
}


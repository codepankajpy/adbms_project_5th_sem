import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { authenticate } from '../../middleware/auth.js';

export async function vehicleRoutes(fastify: FastifyInstance) {
  // Public/Authenticated catalog of brands and models
  fastify.get('/catalog', { preHandler: [authenticate] }, async (request, reply) => {
    const brandsRes = await query('SELECT * FROM vehicle_brands ORDER BY name ASC');
    const modelsRes = await query(
      `SELECT vm.*, vb.name AS brand_name 
       FROM vehicle_models vm
       JOIN vehicle_brands vb ON vb.id = vm.brand_id
       ORDER BY vb.name ASC, vm.model_name ASC`
    );
    return sendSuccess(reply, { brands: brandsRes.rows, models: modelsRes.rows }, 'Catalog loaded');
  });

  // Get vehicles (Customer: own vehicles, Admin: all vehicles)
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    let sql = `
      SELECT 
        v.id,
        v.customer_id,
        u.full_name AS customer_name,
        u.email AS customer_email,
        v.registration_number,
        v.vin,
        v.year,
        v.color,
        v.mileage_km,
        v.transmission,
        vm.model_name,
        vm.body_type,
        vm.fuel_type,
        vb.name AS brand_name,
        calculate_vehicle_service_cost(v.id) AS lifetime_service_cost,
        v.created_at
      FROM vehicles v
      JOIN customers c ON c.id = v.customer_id
      JOIN users u ON u.id = c.user_id
      JOIN vehicle_models vm ON vm.id = v.model_id
      JOIN vehicle_brands vb ON vb.id = vm.brand_id
    `;
    const params: any[] = [];

    if (user.role === 'customer') {
      sql += ' WHERE v.customer_id = $1';
      params.push(user.customerId);
    }

    sql += ' ORDER BY v.id DESC;';

    const res = await query(sql, params);
    return sendSuccess(reply, res.rows, 'Vehicles retrieved');
  });

  // Get specific vehicle with historical service records (Calling PL/pgSQL function get_vehicle_service_history)
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const vehicleId = parseInt(id, 10);

    const vehicleRes = await query(
      `SELECT 
        v.*,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        vm.model_name,
        vm.body_type,
        vm.fuel_type,
        vb.name AS brand_name,
        calculate_vehicle_service_cost(v.id) AS lifetime_service_cost
       FROM vehicles v
       JOIN customers c ON c.id = v.customer_id
       JOIN users u ON u.id = c.user_id
       JOIN vehicle_models vm ON vm.id = v.model_id
       JOIN vehicle_brands vb ON vb.id = vm.brand_id
       WHERE v.id = $1`,
      [vehicleId]
    );

    if (vehicleRes.rowCount === 0) {
      return sendError(reply, 'Vehicle not found', 404);
    }

    const vehicle = vehicleRes.rows[0];

    // Authorization check for customer
    if (request.user?.role === 'customer' && request.user.customerId !== vehicle.customer_id) {
      return sendError(reply, 'Unauthorized access to vehicle record', 403);
    }

    // Call PostgreSQL Table-Returning Function: get_vehicle_service_history
    const historyRes = await query('SELECT * FROM get_vehicle_service_history($1)', [vehicleId]);

    return sendSuccess(
      reply,
      {
        vehicle,
        history: historyRes.rows,
      },
      'Vehicle details with service history loaded'
    );
  });

  // Add new vehicle
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const schema = z.object({
      customerId: z.number().optional(),
      modelId: z.number(),
      registrationNumber: z.string().min(4).max(20),
      vin: z.string().min(10).max(50),
      year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
      color: z.string().min(2),
      mileageKm: z.number().int().min(0).default(0),
      transmission: z.enum(['manual', 'automatic']).default('manual'),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid vehicle data', 400, parse.error.flatten());
    }

    const data = parse.data;
    const targetCustomerId = user.role === 'customer' ? user.customerId! : data.customerId || user.customerId!;

    if (!targetCustomerId) {
      return sendError(reply, 'Customer ID is required', 400);
    }

    try {
      const res = await query(
        `INSERT INTO vehicles (
          customer_id,
          model_id,
          registration_number,
          vin,
          year,
          color,
          mileage_km,
          transmission
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          targetCustomerId,
          data.modelId,
          data.registrationNumber.toUpperCase().trim(),
          data.vin.toUpperCase().trim(),
          data.year,
          data.color,
          data.mileageKm,
          data.transmission,
        ]
      );

      return sendSuccess(reply, res.rows[0], 'Vehicle registered successfully', 201);
    } catch (err: any) {
      if (err.code === '23505') {
        // Unique violation
        return sendError(reply, 'A vehicle with this registration number or VIN already exists', 409);
      }
      return sendError(reply, err.message || 'Failed to register vehicle', 400);
    }
  });

  // Update vehicle
  fastify.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const vehicleId = parseInt(id, 10);

    const schema = z.object({
      color: z.string().min(2).optional(),
      mileageKm: z.number().int().min(0).optional(),
      transmission: z.enum(['manual', 'automatic']).optional(),
    });

    const parse = schema.safeParse(request.body);
    if (!parse.success) {
      return sendError(reply, 'Invalid payload', 400, parse.error.flatten());
    }

    const { color, mileageKm, transmission } = parse.data;

    const res = await query(
      `UPDATE vehicles
       SET color = COALESCE($1, color),
           mileage_km = COALESCE($2, mileage_km),
           transmission = COALESCE($3, transmission),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [color || null, mileageKm !== undefined ? mileageKm : null, transmission || null, vehicleId]
    );

    if (res.rowCount === 0) {
      return sendError(reply, 'Vehicle not found', 404);
    }

    return sendSuccess(reply, res.rows[0], 'Vehicle updated successfully');
  });
}


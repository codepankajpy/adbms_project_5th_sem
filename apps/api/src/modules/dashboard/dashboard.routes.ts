import { FastifyInstance } from 'fastify';
import { query } from '../../db/index.js';
import { sendSuccess } from '../../utils/response.js';
import { authenticate } from '../../middleware/auth.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Role-adaptive dashboard statistics
  fastify.get('/stats', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    if (user.role === 'admin') {
      // Admin global statistics using aggregation queries & views
      const summaryRes = await query(`
        SELECT 
          (SELECT COUNT(*) FROM customers) AS total_customers,
          (SELECT COUNT(*) FROM mechanics) AS total_mechanics,
          (SELECT COUNT(*) FROM vehicles) AS total_vehicles,
          (SELECT COUNT(*) FROM service_bookings) AS total_bookings,
          (SELECT COUNT(*) FROM service_bookings WHERE status IN ('pending', 'confirmed', 'in_progress')) AS active_bookings,
          (SELECT COUNT(*) FROM service_bookings WHERE status = 'completed') AS completed_bookings,
          (SELECT COALESCE(SUM(amount), 0.00) FROM payments WHERE status = 'completed') AS total_revenue_collected,
          (SELECT COALESCE(SUM(total_amount - COALESCE(p.paid, 0)), 0.00) 
           FROM invoices i 
           LEFT JOIN (SELECT invoice_id, SUM(amount) AS paid FROM payments WHERE status = 'completed' GROUP BY invoice_id) p ON p.invoice_id = i.id
           WHERE i.status IN ('issued', 'partially_paid')) AS total_outstanding
      `);

      const revenueMonthlyRes = await query('SELECT * FROM revenue_summary_view LIMIT 6');
      const recentBookingsRes = await query('SELECT * FROM booking_details_view ORDER BY booking_date DESC, booking_id DESC LIMIT 5');
      const mechanicWorkloadRes = await query('SELECT * FROM mechanic_workload_view LIMIT 6');

      return sendSuccess(reply, {
        summary: summaryRes.rows[0],
        revenueMonthly: revenueMonthlyRes.rows,
        recentBookings: recentBookingsRes.rows,
        mechanicWorkload: mechanicWorkloadRes.rows,
      }, 'Admin dashboard metrics loaded');
    }

    if (user.role === 'customer') {
      // Customer specific statistics
      const custId = user.customerId!;
      const summaryRes = await query(`
        SELECT 
          (SELECT COUNT(*) FROM vehicles WHERE customer_id = $1) AS total_vehicles,
          (SELECT COUNT(*) FROM service_bookings WHERE customer_id = $1 AND status IN ('pending', 'confirmed', 'in_progress')) AS active_bookings,
          (SELECT COUNT(*) FROM service_bookings WHERE customer_id = $1 AND status = 'completed') AS completed_bookings,
          (SELECT COUNT(*) FROM invoices WHERE customer_id = $1 AND status IN ('issued', 'partially_paid')) AS pending_invoices_count,
          get_customer_total_spending($1) AS total_spending
      `, [custId]);

      const myVehiclesRes = await query(`
        SELECT v.*, vb.name AS brand_name, vm.model_name
        FROM vehicles v
        JOIN vehicle_models vm ON vm.id = v.model_id
        JOIN vehicle_brands vb ON vb.id = vm.brand_id
        WHERE v.customer_id = $1
        ORDER BY v.id DESC LIMIT 4
      `, [custId]);

      const recentBookingsRes = await query(`
        SELECT * FROM booking_details_view WHERE customer_id = $1 ORDER BY booking_date DESC LIMIT 5
      `, [custId]);

      return sendSuccess(reply, {
        summary: summaryRes.rows[0],
        vehicles: myVehiclesRes.rows,
        recentBookings: recentBookingsRes.rows,
      }, 'Customer dashboard loaded');
    }

    if (user.role === 'mechanic') {
      // Mechanic specific statistics
      const mechId = user.mechanicId!;
      const metricsRes = await query('SELECT * FROM get_mechanic_completed_jobs($1)', [mechId]);
      const activeJobsRes = await query(`
        SELECT * FROM booking_details_view 
        WHERE mechanic_id = $1 AND booking_status IN ('confirmed', 'in_progress')
        ORDER BY booking_date ASC
      `, [mechId]);

      return sendSuccess(reply, {
        metrics: metricsRes.rows[0] || {},
        activeJobs: activeJobsRes.rows,
      }, 'Mechanic dashboard loaded');
    }

    return sendSuccess(reply, {}, 'Dashboard loaded');
  });
}


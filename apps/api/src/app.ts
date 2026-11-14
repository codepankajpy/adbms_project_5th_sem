import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';
import { sendError } from './utils/response.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { customerRoutes } from './modules/customers/customers.routes.js';
import { mechanicRoutes } from './modules/mechanics/mechanics.routes.js';
import { vehicleRoutes } from './modules/vehicles/vehicles.routes.js';
import { serviceRoutes } from './modules/services/services.routes.js';
import { bookingRoutes } from './modules/bookings/bookings.routes.js';
import { invoiceRoutes } from './modules/invoices/invoices.routes.js';
import { paymentRoutes } from './modules/payments/payments.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { dbmsRoutes } from './modules/dbms/dbms.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
    },
  });

  // Enable CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Support empty JSON body if client sends Content-Type: application/json with no payload
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (!body || (typeof body === 'string' && body.trim() === '')) {
      done(null, {});
      return;
    }
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // Register JWT plugin
  await app.register(jwt, {
    secret: config.jwtSecret,
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  // Register modular domain routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(customerRoutes, { prefix: '/api/customers' });
  await app.register(mechanicRoutes, { prefix: '/api/mechanics' });
  await app.register(vehicleRoutes, { prefix: '/api/vehicles' });
  await app.register(serviceRoutes, { prefix: '/api/services' });
  await app.register(bookingRoutes, { prefix: '/api/bookings' });
  await app.register(invoiceRoutes, { prefix: '/api/invoices' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(dbmsRoutes, { prefix: '/api/dbms' });

  // Centralized Error Handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    return sendError(reply, error.message || 'Internal Server Error', statusCode, {
      code: (error as any).code || null,
      detail: (error as any).detail || null,
    });
  });

  return app;
}


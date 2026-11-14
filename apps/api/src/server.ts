import { buildApp } from './app.js';
import { config } from './config/env.js';
import { query } from './db/index.js';

async function start() {
  try {
    // Test database connection
    const dbTest = await query('SELECT current_database(), version();');
    console.log(`Connected to PostgreSQL: ${dbTest.rows[0].current_database}`);

    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`Fastify Backend API is running on http://localhost:${config.port}`);
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

start();


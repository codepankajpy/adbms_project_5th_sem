import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vehicle_service_db',
});

async function runSeed() {
  console.log('--- Seeding PostgreSQL Database with Sample Data ---');
  const seedFile = path.resolve(__dirname, '../../../database/seeds/seed.sql');
  const sql = fs.readFileSync(seedFile, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Database successfully seeded with realistic demo records!');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();


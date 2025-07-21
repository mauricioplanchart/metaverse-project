import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Create a connection pool without SSL (for testing)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false  // Try without SSL
});

// Test database connection
export async function testConnection() {
  try {
    console.log('Attempting to connect without SSL...');
    const client = await pool.connect();
    console.log('Connected! Running test query...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time from database:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database connection failed:', errorMessage);
    return false;
  }
}

// Close the pool
export async function closePool() {
  await pool.end();
}

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Create a connection pool with adjusted settings for pooled connections
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Add connection timeout and other settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Test database connection
export async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log('Connected! Running test query...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time from database:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : 'Unknown';
    console.error('❌ Database connection failed:', errorMessage);
    console.error('Error code:', errorCode);
    return false;
  }
}

// Close the pool
export async function closePool() {
  await pool.end();
}

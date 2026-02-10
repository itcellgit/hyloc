import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  // Default to the documented local DB name so the app points at the same DB as the setup guide
  database: process.env.DB_NAME || 'hyloc_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log connection errors but don't crash the process
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit - just log the error so the server can continue
});

pool.on('connect', () => {
  console.log('Database connection pool successfully initialized');
});

// Test the connection on startup
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection test failed:', err.message);
    console.error('DB Config:', {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'hyloc_db',
      port: process.env.DB_PORT || 5432
    });
  } else {
    console.log('✓ Database connection test passed');
  }
});

export default pool;

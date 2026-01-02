import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hyloc',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    console.log('🔍 Testing Database Connection...');
    console.log(`Database: ${process.env.DB_NAME || 'hyloc'}`);
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`User: ${process.env.DB_USER || 'postgres'}`);
    console.log('---');

    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database Connection Successful!');
    console.log(`Current time from DB: ${result.rows[0].now}`);
    console.log('---');

    // Check users table structure
    console.log('📋 Checking users table structure:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    if (tableInfo.rows.length === 0) {
      console.log('❌ users table does NOT exist!');
      console.log('You need to run: psql -U postgres -d hyloc_db -f server/src/config/db.sql');
    } else {
      console.log('✅ users table exists with columns:');
      tableInfo.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();

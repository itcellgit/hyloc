import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupKpiDataValueTable() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up kpi_data_value table...');
    
    // Read the SQL file
    const sql = fs.readFileSync(join(__dirname, 'create-kpi-data-value-table.sql'), 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✓ kpi_data_value table created successfully');
    console.log('✓ value_type_enum created successfully');
    console.log('✓ Indexes created successfully');
    
    // Verify the table exists
    const result = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'kpi_data_value'
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.udt_name})`);
    });
    
  } catch (error) {
    console.error('Error setting up kpi_data_value table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupKpiDataValueTable()
  .then(() => {
    console.log('\n✓ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Setup failed:', error);
    process.exit(1);
  });

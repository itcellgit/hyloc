import pool from './src/config/database.js';

async function checkKmiSchema() {
  try {
    // Check if kmi table exists and get its structure
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'kmi'
      ORDER BY ordinal_position
    `);
    
    console.log('KMI table schema:');
    console.table(schemaResult.rows);
    
    // Get sample data
    const dataResult = await pool.query('SELECT * FROM kmi LIMIT 5');
    console.log('\nSample KMI data:');
    console.table(dataResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkKmiSchema();

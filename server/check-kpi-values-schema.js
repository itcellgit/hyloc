import pool from './src/config/database.js';

async function checkKpiValuesSchema() {
  try {
    // Check if kpi_values table exists and get its structure
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'kpi_values'
      ORDER BY ordinal_position
    `);
    
    console.log('KPI Values table schema:');
    console.table(schemaResult.rows);
    
    // Get sample data
    const dataResult = await pool.query('SELECT * FROM kpi_values LIMIT 5');
    console.log('\nSample KPI Values data:');
    console.table(dataResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkKpiValuesSchema();

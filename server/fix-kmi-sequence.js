import pool from './src/config/database.js';

async function fixKmiSequence() {
  try {
    console.log('Fixing KMI sequence...');
    
    await pool.query("SELECT setval(pg_get_serial_sequence('kmi', 'id'), (SELECT MAX(id) FROM kmi))");
    
    const result = await pool.query('SELECT last_value FROM kmi_id_seq');
    console.log('Sequence updated. Last value:', result.rows[0].last_value);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixKmiSequence();

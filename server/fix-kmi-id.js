import pool from './src/config/database.js';

async function fixKmiId() {
  try {
    console.log('Checking KMI table...');
    
    // Check current sequence
    const seqCheck = await pool.query(`
      SELECT column_default 
      FROM information_schema.columns 
      WHERE table_name = 'kmi' AND column_name = 'id'
    `);
    
    console.log('Current id column default:', seqCheck.rows[0]);
    
    // Drop the table and recreate with proper auto-increment
    console.log('\nDropping and recreating KMI table...');
    
    // First, save the existing data
    const dataResult = await pool.query('SELECT * FROM kmi');
    const existingData = dataResult.rows;
    console.log(`Found ${existingData.length} existing KMI records`);
    
    await pool.query('DROP TABLE IF EXISTS kmi CASCADE');
    
    await pool.query(`
      CREATE TABLE kmi (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Table recreated successfully!');
    
    // Re-insert the data
    if (existingData.length > 0) {
      console.log('Re-inserting existing data...');
      for (const row of existingData) {
        await pool.query(
          'INSERT INTO kmi (id, title, created_at, updated_at) VALUES ($1, $2, $3, $4)',
          [row.id, row.title, row.created_at, row.updated_at]
        );
      }
      console.log(`Re-inserted ${existingData.length} records`);
    }
    
    // Verify
    const result = await pool.query('SELECT * FROM kmi ORDER BY id');
    console.log('\nKMIs in database:');
    console.table(result.rows);
    
    // Check sequence
    const seqCheck2 = await pool.query(`
      SELECT last_value FROM kmi_id_seq
    `);
    console.log('\nSequence last_value:', seqCheck2.rows[0].last_value);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixKmiId();

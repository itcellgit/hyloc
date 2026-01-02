import pool from './src/config/database.js';

async function fixDepartmentsId() {
  try {
    console.log('Checking departments table...');
    
    // Check current sequence
    const seqCheck = await pool.query(`
      SELECT column_default 
      FROM information_schema.columns 
      WHERE table_name = 'departments' AND column_name = 'id'
    `);
    
    console.log('Current id column default:', seqCheck.rows[0]);
    
    // Drop the table and recreate with proper auto-increment
    console.log('\nDropping and recreating departments table...');
    
    await pool.query('DROP TABLE IF EXISTS departments CASCADE');
    
    await pool.query(`
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Table recreated successfully!');
    
    // Insert sample departments
    const sampleDepts = [
      'Production',
      'Accounts & Finance',
      'Administration',
      'Design & Development',
      'Forgeshop',
      'Human Resource',
      'Marketing & Sales',
      'Management Representative'
    ];
    
    for (const name of sampleDepts) {
      await pool.query(
        'INSERT INTO departments (department_name) VALUES ($1)',
        [name]
      );
    }
    
    console.log('\nSample departments inserted!');
    
    // Verify
    const result = await pool.query('SELECT * FROM departments ORDER BY id');
    console.log('\nDepartments in database:');
    console.table(result.rows);
    
    // Check sequence
    const seqCheck2 = await pool.query(`
      SELECT last_value FROM departments_id_seq
    `);
    console.log('\nSequence last_value:', seqCheck2.rows[0].last_value);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDepartmentsId();

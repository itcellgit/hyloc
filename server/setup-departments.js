import pool from './src/config/database.js';

async function setupDepartmentsTable() {
  try {
    console.log('🔍 Checking departments table...');
    
    // Create departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        head_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Departments table created/verified');
    
    // Check if there are any departments
    const result = await pool.query('SELECT COUNT(*) FROM departments');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      console.log('🌱 Seeding initial departments...');
      
      await pool.query(`
        INSERT INTO departments (name, description) VALUES
        ('Sales', 'Sales and Marketing Department'),
        ('HR', 'Human Resources Department'),
        ('IT', 'Information Technology Department'),
        ('Finance', 'Finance and Accounting Department'),
        ('Operations', 'Operations and Logistics Department')
      `);
      
      console.log('✅ Initial departments added');
    } else {
      console.log(`📊 Found ${count} existing departments`);
    }
    
    // Display departments
    const departments = await pool.query('SELECT * FROM departments ORDER BY id');
    console.log('\n📋 Departments:');
    console.table(departments.rows);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setupDepartmentsTable();

import pool from './src/config/database.js';

async function setupDepartmentsTable() {
  try {
    console.log('Creating departments table...');
    
    // Create departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        head_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Departments table created successfully!');
    
    // Check if users table has department_id column, if not skip that index
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name)');
      console.log('Department name index created successfully!');
    } catch (err) {
      console.log('Could not create department name index:', err.message);
    }
    
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id)');
      console.log('User department_id index created successfully!');
    } catch (err) {
      console.log('Could not create user department_id index (column may not exist)');
    }
    
    // Insert sample departments
    const sampleDepts = [
      ['Human Resources', 'Manages employee relations, recruitment, and benefits'],
      ['Engineering', 'Software development and technical operations'],
      ['Sales', 'Business development and customer relations'],
      ['Finance', 'Financial planning, accounting, and reporting'],
      ['Marketing', 'Brand management and customer outreach']
    ];
    
    for (const [name, description] of sampleDepts) {
      try {
        await pool.query(
          'INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [name, description]
        );
      } catch (err) {
        console.log(`Department ${name} might already exist`);
      }
    }
    
    console.log('Sample departments inserted!');
    
    // Verify
    const result = await pool.query('SELECT * FROM departments ORDER BY id');
    console.log('\nDepartments in database:');
    console.table(result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up departments table:', error);
    process.exit(1);
  }
}

setupDepartmentsTable();

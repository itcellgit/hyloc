import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const roles = [
  { role: 'Admin' },
  { role: 'Manager' },
  { role: 'Employee' },
  { role: 'Management' }
];

async function seedRoles() {
  const client = await pool.connect();
  
  try {
    console.log('Starting to seed roles...');
    
    for (const roleData of roles) {
      // Check if role already exists
      const checkResult = await client.query(
        'SELECT id FROM roles WHERE role = $1',
        [roleData.role]
      );
      
      if (checkResult.rows.length === 0) {
        await client.query(
          'INSERT INTO roles (role) VALUES ($1)',
          [roleData.role]
        );
        console.log(`✓ Created role: ${roleData.role}`);
      } else {
        console.log(`- Role already exists: ${roleData.role}`);
      }
    }
    
    console.log('\n✓ All roles seeded successfully!');
    
    // Display all roles
    const allRoles = await client.query('SELECT * FROM roles ORDER BY id');
    console.log('\nCurrent roles in database:');
    console.table(allRoles.rows);
    
  } catch (error) {
    console.error('Error seeding roles:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedRoles();

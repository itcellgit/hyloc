import bcrypt from 'bcrypt';
import pool from './src/config/database.js';

async function addAdminUser() {
  try {
    console.log('👤 Adding admin user...');
    
    // Hash the password
    const plainPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE empid = $1 OR email = $2',
      [10000, 'admin@hyloc.co.in']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  User with empid 10000 or email admin@hyloc.co.in already exists');
      await pool.end();
      process.exit(0);
    }
    
    // Insert new admin user
    const result = await pool.query(
      `INSERT INTO users (empid, firstname, lastname, email, password) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, empid, firstname, lastname, email`,
      [10000, 'super', 'admin', 'admin@hyloc.co.in', hashedPassword]
    );
    
    console.log('✅ Admin user created successfully:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    console.log('\n📝 Use these credentials to login:');
    console.log('   empid: 10000');
    console.log('   password: password123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addAdminUser();

import pool from './src/config/database.js';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test user...');
    
    // Delete old entry
    await pool.query('DELETE FROM users WHERE empid = 10001');
    console.log('✅ Old entry removed');
    
    // Hash the password
    const plainPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    const result = await pool.query(
      `INSERT INTO users (empid, firstname, middlename, lastname, address, phone, email, bloodgroup, password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, empid, firstname, middlename, lastname, email, phone, address, bloodgroup`
      ,
      [
        70055,
        'Vilas',
        'Keshav',
        'Patil',
        '#656, Vimal Building, Ramghat Road, Sukhasagar Colony, Ganeshpur, Belgaum – 591108.',
        '9980385117',
        'vilaspatil2004@yahoo.com',
        'O +ve',
        hashedPassword
      ]
    );
    
    console.log('✅ Test user created successfully:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    console.log('\n📝 Use these credentials to login:');
    console.log('   empid: 70055');
    console.log('   password: password123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

seedDatabase();

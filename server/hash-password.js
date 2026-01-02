import bcrypt from 'bcrypt';
import pool from './src/config/database.js';

async function hashPasswordInDatabase() {
  try {
    console.log('🔐 Hashing password for user empid 70055...');
    
    // Hash the password
    const plainPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    console.log('✅ Password hashed successfully');
    console.log(`Original: ${plainPassword}`);
    console.log(`Hashed: ${hashedPassword}`);
    
    // Update the database with hashed password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE empid = $2 RETURNING id, empid, firstname, lastname, email',
      [hashedPassword, 70055]
    );
    
    if (result.rows.length === 0) {
      console.error('❌ User not found with empid 70055');
      await pool.end();
      process.exit(1);
    }
    
    console.log('\n✅ Password updated in database:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

hashPasswordInDatabase();

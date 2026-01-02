import pool from '../config/database.js';
import bcrypt from 'bcrypt';

export class Auth {
  static async login(empid, password) {
    const result = await pool.query(
      `SELECT id, empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, password
       FROM users WHERE empid = $1`,
      [empid]
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    // Compare hashed password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  static async register(user) {
    try {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE empid = $1 OR email = $2',
        [user.empid, user.email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this empid or email');
      }

      // Hash password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);

      const result = await pool.query(
        `INSERT INTO users (empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, created_at, updated_at`,
        [
          user.empid,
          user.department_id || null,
          user.phone || null,
          user.address || null,
          user.firstname,
          user.middlename || null,
          user.lastname,
          user.email,
          user.bloodgroup || null,
          hashedPassword
        ]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async verifyToken(token) {
    // Basic token verification (in production, use JWT)
    return { valid: true, userId: parseInt(token) };
  }
}

import pool from '../config/database.js';

export class Log {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, user_id, description, created_at
       FROM log
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, user_id, description, created_at
       FROM log WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUser(userId) {
    const result = await pool.query(
      `SELECT id, user_id, description, created_at
       FROM log WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async create(log) {
    const result = await pool.query(
      `INSERT INTO log (user_id, description)
       VALUES ($1, $2)
       RETURNING id, user_id, description, created_at`,
      [log.user_id || null, log.description]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM log WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

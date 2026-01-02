import pool from '../config/database.js';

export class Kmi {
  static async getAll() {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM kmi 
       ORDER BY id`
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM kmi 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(kmi) {
    const result = await pool.query(
      `INSERT INTO kmi (title) 
       VALUES ($1) 
       RETURNING id, title, created_at, updated_at`,
      [kmi.title]
    );
    return result.rows[0];
  }

  static async update(id, kmi) {
    const result = await pool.query(
      `UPDATE kmi 
       SET title = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, title, created_at, updated_at`,
      [kmi.title, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM kmi WHERE id = $1', [id]);
    return { success: true };
  }
}

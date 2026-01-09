import pool from '../config/database.js';

export class Designation {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, name, shortname, created_at, updated_at
       FROM designations
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, name, shortname, created_at, updated_at
       FROM designations WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(designation) {
    const result = await pool.query(
      `INSERT INTO designations (name, shortname)
       VALUES ($1, $2)
       RETURNING id, name, shortname, created_at, updated_at`,
      [designation.name, designation.shortname]
    );
    return result.rows[0];
  }

  static async update(id, designation) {
    const result = await pool.query(
      `UPDATE designations
       SET name = $1, shortname = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, shortname, created_at, updated_at`,
      [designation.name, designation.shortname, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM designations WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

import pool from '../config/database.js';

// Note: Table name and columns follow provided schema: public.pillers
export class Pillar {
  static async getAll() {
    const result = await pool.query(
      `SELECT id, piller_name, short_name, created_at, updated_at
       FROM pillers
       ORDER BY id`
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(
      `SELECT id, piller_name, short_name, created_at, updated_at
       FROM pillers
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(piller) {
    const result = await pool.query(
      `INSERT INTO pillers (piller_name, short_name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, piller_name, short_name, created_at, updated_at`,
      [piller.piller_name, piller.short_name]
    );
    return result.rows[0];
  }

  static async update(id, piller) {
    const result = await pool.query(
      `UPDATE pillers
       SET piller_name = $1,
           short_name = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, piller_name, short_name, created_at, updated_at`,
      [piller.piller_name, piller.short_name, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM pillers WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}

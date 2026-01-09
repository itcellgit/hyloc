import pool from '../config/database.js';

export class Category {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, category_name, created_at, updated_at
       FROM categories
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, category_name, created_at, updated_at
       FROM categories WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(category) {
    const result = await pool.query(
      `INSERT INTO categories (category_name)
       VALUES ($1)
       RETURNING id, category_name, created_at, updated_at`,
      [category.category_name]
    );
    return result.rows[0];
  }

  static async update(id, category) {
    const result = await pool.query(
      `UPDATE categories
       SET category_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, category_name, created_at, updated_at`,
      [category.category_name, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

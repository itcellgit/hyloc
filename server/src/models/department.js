import pool from '../config/database.js';

export class Department {
  static async getAll() {
    const result = await pool.query(
      `SELECT d.id, d.department_name as name, d.created_at, d.updated_at
       FROM departments d 
       ORDER BY d.id`
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(
      `SELECT d.id, d.department_name as name, d.created_at, d.updated_at
       FROM departments d 
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(department) {
    const result = await pool.query(
      `INSERT INTO departments (department_name) 
       VALUES ($1) 
       RETURNING id, department_name as name, created_at, updated_at`,
      [department.name]
    );
    return result.rows[0];
  }

  static async update(id, department) {
    const result = await pool.query(
      `UPDATE departments 
       SET department_name = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, department_name as name, created_at, updated_at`,
      [department.name, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM departments WHERE id = $1', [id]);
    return { success: true };
  }
}

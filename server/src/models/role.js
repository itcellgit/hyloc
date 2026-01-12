import pool from '../config/database.js';

export class Role {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, role_name
       FROM roles
       ORDER BY id`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, role_name
       FROM roles WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(roleData) {
    const result = await pool.query(
      `INSERT INTO roles (role_name)
       VALUES ($1)
       RETURNING id, role_name`,
      [roleData.role_name]
    );
    return result.rows[0];
  }

  static async update(id, roleData) {
    const result = await pool.query(
      `UPDATE roles
       SET role_name = $1
       WHERE id = $2
       RETURNING id, role_name`,
      [roleData.role_name, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

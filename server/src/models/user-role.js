import pool from '../config/database.js';

export class UserRole {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, user_id, role_id, status, created_at, updated_at
       FROM user_roles
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, user_id, role_id, status, created_at, updated_at
       FROM user_roles WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUser(userId) {
    const result = await pool.query(
      `SELECT id, user_id, role_id, status, created_at, updated_at
       FROM user_roles WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  static async findByRole(roleId) {
    const result = await pool.query(
      `SELECT id, user_id, role_id, status, created_at, updated_at
       FROM user_roles WHERE role_id = $1`,
      [roleId]
    );
    return result.rows;
  }

  static async create(userRole) {
    const result = await pool.query(
      `INSERT INTO user_roles (user_id, role_id, status)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, role_id, status, created_at, updated_at`,
      [userRole.user_id, userRole.role_id, userRole.status || null]
    );
    return result.rows[0];
  }

  static async update(id, userRole) {
    const result = await pool.query(
      `UPDATE user_roles
       SET user_id = COALESCE($1, user_id),
           role_id = COALESCE($2, role_id),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, user_id, role_id, status, created_at, updated_at`,
      [userRole.user_id || null, userRole.role_id || null, userRole.status || null, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM user_roles WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

import pool from '../config/database.js';

export class KPIDepartment {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, kpi_id, department_id, created_at, updated_at
       FROM kpi_departments
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, kpi_id, department_id, created_at, updated_at
       FROM kpi_departments WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByKPI(kpiId) {
    const result = await pool.query(
      `SELECT id, kpi_id, department_id, created_at, updated_at
       FROM kpi_departments WHERE kpi_id = $1`,
      [kpiId]
    );
    return result.rows;
  }

  static async findByDepartment(departmentId) {
    const result = await pool.query(
      `SELECT id, kpi_id, department_id, created_at, updated_at
       FROM kpi_departments WHERE department_id = $1`,
      [departmentId]
    );
    return result.rows;
  }

  static async create(kpiDepartment) {
    const result = await pool.query(
      `INSERT INTO kpi_departments (kpi_id, department_id)
       VALUES ($1, $2)
       RETURNING id, kpi_id, department_id, created_at, updated_at`,
      [kpiDepartment.kpi_id, kpiDepartment.department_id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM kpi_departments WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

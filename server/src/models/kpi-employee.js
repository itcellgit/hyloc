import pool from '../config/database.js';

export class KPIEmployee {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, kpi_id, emp_id, created_at, updated_at
       FROM kpi_emp
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, kpi_id, emp_id, created_at, updated_at
       FROM kpi_emp WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByKPI(kpiId) {
    const result = await pool.query(
      `SELECT id, kpi_id, emp_id, created_at, updated_at
       FROM kpi_emp WHERE kpi_id = $1`,
      [kpiId]
    );
    return result.rows;
  }

  static async findByEmployee(empId) {
    const result = await pool.query(
      `SELECT id, kpi_id, emp_id, created_at, updated_at
       FROM kpi_emp WHERE emp_id = $1`,
      [empId]
    );
    return result.rows;
  }

  static async create(kpiEmployee) {
    const result = await pool.query(
      `INSERT INTO kpi_emp (kpi_id, emp_id)
       VALUES ($1, $2)
       RETURNING id, kpi_id, emp_id, created_at, updated_at`,
      [kpiEmployee.kpi_id, kpiEmployee.emp_id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM kpi_emp WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

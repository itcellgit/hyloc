import pool from '../config/database.js';

export class KPIValue {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, data, kpi_id, month_year, value_type, value, remarks, created_at, updated_at
       FROM kpi_values
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, data, kpi_id, month_year, value_type, value, remarks, created_at, updated_at
       FROM kpi_values WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByKPI(kpiId) {
    const result = await pool.query(
      `SELECT id, data, kpi_id, month_year, value_type, value, remarks, created_at, updated_at
       FROM kpi_values WHERE kpi_id = $1
       ORDER BY month_year DESC`,
      [kpiId]
    );
    return result.rows;
  }

  static async findByKPIAndMonth(kpiId, monthYear) {
    const result = await pool.query(
      `SELECT id, data, kpi_id, month_year, value_type, value, remarks, created_at, updated_at
       FROM kpi_values WHERE kpi_id = $1 AND month_year = $2`,
      [kpiId, monthYear]
    );
    return result.rows;
  }

  static async create(kpiValue) {
    const result = await pool.query(
      `INSERT INTO kpi_values (data, kpi_id, month_year, value_type, value, remarks)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, data, kpi_id, month_year, value_type, value, remarks, created_at, updated_at`,
      [
        kpiValue.data,
        kpiValue.kpi_id,
        kpiValue.month_year,
        kpiValue.value_type,
        kpiValue.value,
        kpiValue.remarks || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, kpiValue) {
    const result = await pool.query(
      `UPDATE kpi_values
       SET data = COALESCE($1, data),
           kpi_id = COALESCE($2, kpi_id),
           month_year = COALESCE($3, month_year),
           value_type = COALESCE($4, value_type),
           value = COALESCE($5, value),
           remarks = COALESCE($6, remarks),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, data, kpi_id, month_year, value_type, value, remarks, created_at, updated_at`,
      [
        kpiValue.data || null,
        kpiValue.kpi_id || null,
        kpiValue.month_year || null,
        kpiValue.value_type || null,
        kpiValue.value || null,
        kpiValue.remarks || null,
        id
      ]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM kpi_values WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

import pool from '../config/database.js';

export class KPIValue {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, data, kpi_id, "data operator", target_required, uom, 
              kpi_type, piller_id, created_at, updated_at
       FROM kpi_values
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, data, kpi_id, "data operator", target_required, uom,
              kpi_type, piller_id, created_at, updated_at
       FROM kpi_values WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByKPI(kpiId) {
    const result = await pool.query(
      `SELECT id, data, kpi_id, "data operator", target_required, uom,
              kpi_type, piller_id, created_at, updated_at
       FROM kpi_values WHERE kpi_id = $1
       ORDER BY created_at DESC`,
      [kpiId]
    );
    return result.rows;
  }

  static async create(kpiValue) {
    const result = await pool.query(
      `INSERT INTO kpi_values (data, kpi_id, "data operator", target_required, uom, kpi_type, piller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, data, kpi_id, "data operator", target_required, uom, kpi_type, piller_id, created_at, updated_at`,
      [
        kpiValue.data,
        kpiValue.kpi_id,
        kpiValue.data_operator || null,
        kpiValue.target_required !== undefined ? kpiValue.target_required : true,
        kpiValue.uom || null,
        kpiValue.kpi_type || 'manual',
        kpiValue.piller_id || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, kpiValue) {
    const result = await pool.query(
      `UPDATE kpi_values
       SET data = COALESCE($1, data),
           kpi_id = COALESCE($2, kpi_id),
           "data operator" = COALESCE($3, "data operator"),
           target_required = COALESCE($4, target_required),
           uom = COALESCE($5, uom),
           kpi_type = COALESCE($6, kpi_type),
           piller_id = CASE WHEN $7::boolean THEN $8 ELSE piller_id END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, data, kpi_id, "data operator", target_required, uom, kpi_type, piller_id, created_at, updated_at`,
      [
        kpiValue.data || null,
        kpiValue.kpi_id || null,
        kpiValue.data_operator || null,
        kpiValue.target_required !== undefined ? kpiValue.target_required : null,
        kpiValue.uom || null,
        kpiValue.kpi_type || null,
        kpiValue.piller_id !== undefined,
        kpiValue.piller_id || null,
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

import pool from '../config/database.js';

export class KPIValue {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, data, kpi_id, "data operator", target_required, uom, 
              kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value, created_at, updated_at
       FROM kpi_values
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, data, kpi_id, "data operator", target_required, uom,
              kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value, created_at, updated_at
       FROM kpi_values WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByKPI(kpiId) {
    const result = await pool.query(
      `SELECT id, data, kpi_id, "data operator", target_required, uom,
              kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value, created_at, updated_at
       FROM kpi_values WHERE kpi_id = $1
       ORDER BY created_at DESC`,
      [kpiId]
    );
    return result.rows;
  }

  static async create(kpiValue) {
    const result = await pool.query(
      `INSERT INTO kpi_values (data, kpi_id, "data operator", target_required, uom, kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, data, kpi_id, "data operator", target_required, uom, kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value, created_at, updated_at`,
      [
        kpiValue.data,
        kpiValue.kpi_id,
        kpiValue.data_operator || null,
        kpiValue.target_required !== undefined ? kpiValue.target_required : true,
        kpiValue.uom || null,
        kpiValue.kpi_type || 'manual',
        kpiValue.piller_id || null,
        kpiValue.formula || null,
        kpiValue.source_kpi_value_ids || null,
        kpiValue.default_target_value || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, kpiValue) {
    const result = await pool.query(
      `UPDATE kpi_values
       SET data = COALESCE($1, data),
           kpi_id = COALESCE($2, kpi_id),
           "data operator" = $3,
           target_required = COALESCE($4, target_required),
           uom = $5,
           kpi_type = COALESCE($6, kpi_type),
           piller_id = $7,
           formula = $8,
           source_kpi_value_ids = $9,
           default_target_value = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING id, data, kpi_id, "data operator", target_required, uom, kpi_type, piller_id, formula, source_kpi_value_ids, default_target_value, created_at, updated_at`,
      [
        kpiValue.data || null,
        kpiValue.kpi_id || null,
        kpiValue.data_operator || null,
        kpiValue.target_required !== undefined ? kpiValue.target_required : null,
        kpiValue.uom || null,
        kpiValue.kpi_type || null,
        kpiValue.piller_id || null,
        kpiValue.formula || null,
        kpiValue.source_kpi_value_ids || null,
        kpiValue.default_target_value || null,
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

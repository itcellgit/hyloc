import pool from '../config/database.js';

export class KPI {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, title, category_id, parent_kpi_id, data_entry_emp_id, unit_id, fin_year, created_at, updated_at
       FROM kpis
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, title, category_id, parent_kpi_id, data_entry_emp_id, unit_id, fin_year, created_at, updated_at
       FROM kpis WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByCategory(categoryId) {
    const result = await pool.query(
      `SELECT id, title, category_id, parent_kpi_id, data_entry_emp_id, unit_id, fin_year, created_at, updated_at
       FROM kpis WHERE category_id = $1
       ORDER BY created_at DESC`,
      [categoryId]
    );
    return result.rows;
  }

  static async create(kpi) {
    const result = await pool.query(
      `INSERT INTO kpis (title, category_id, parent_kpi_id, data_entry_emp_id, unit_id, fin_year)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, category_id, parent_kpi_id, data_entry_emp_id, unit_id, fin_year, created_at, updated_at`,
      [
        kpi.title,
        kpi.category_id,
        kpi.parent_kpi_id || null,
        kpi.data_entry_emp_id || null,
        kpi.unit_id || null,
        kpi.fin_year || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, kpi) {
    const result = await pool.query(
      `UPDATE kpis
       SET title = COALESCE($1, title),
           category_id = COALESCE($2, category_id),
           parent_kpi_id = COALESCE($3, parent_kpi_id),
           data_entry_emp_id = COALESCE($4, data_entry_emp_id),
           unit_id = COALESCE($5, unit_id),
           fin_year = COALESCE($6, fin_year),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, title, category_id, parent_kpi_id, data_entry_emp_id, unit_id, fin_year, created_at, updated_at`,
      [
        kpi.title || null,
        kpi.category_id || null,
        kpi.parent_kpi_id || null,
        kpi.data_entry_emp_id || null,
        kpi.unit_id || null,
        kpi.fin_year || null,
        id
      ]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM kpis WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

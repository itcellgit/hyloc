import pool from '../config/database.js';

export class Kmi {
  static async getAll(finYear = null) {
    let query = `SELECT id, title, fin_year, created_at, updated_at
                 FROM kmi`;
    const params = [];
    
    if (finYear) {
      query += ` WHERE fin_year = $1`;
      params.push(finYear);
    }
    
    query += ` ORDER BY fin_year DESC, id`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(
      `SELECT id, title, fin_year, created_at, updated_at
       FROM kmi 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(kmi) {
    const result = await pool.query(
      `INSERT INTO kmi (title, fin_year) 
       VALUES ($1, $2) 
       RETURNING id, title, fin_year, created_at, updated_at`,
      [kmi.title, kmi.fin_year]
    );
    return result.rows[0];
  }

  static async update(id, kmi) {
    const result = await pool.query(
      `UPDATE kmi 
       SET title = $1, fin_year = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, title, fin_year, created_at, updated_at`,
      [kmi.title, kmi.fin_year, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM kmi WHERE id = $1', [id]);
    return { success: true };
  }

  static async getDistinctFinancialYears() {
    const result = await pool.query(
      `SELECT DISTINCT fin_year FROM kmi WHERE fin_year IS NOT NULL ORDER BY fin_year DESC`
    );
    return result.rows.map(row => row.fin_year);
  }
}

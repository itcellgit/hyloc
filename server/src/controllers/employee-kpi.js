import pool from '../config/database.js';
import { logError } from '../utils/logger.js';

export class EmployeeKPIController {
  // Get all KPI values assigned to an employee as data operator
  static async getEmployeeKPIValues(req, res) {
    try {
      const { empId } = req.params;

      if (!empId) {
        return res.status(400).json({ success: false, error: 'empId is required' });
      }

      // Convert empId to integer to match BIGINT type in database
      const empIdInt = parseInt(empId, 10);

      const valuesResult = await pool.query(
        `SELECT kv.id, kv.data, kv.kpi_id, kv."data operator", kv.target_required, 
                kv.uom, kv.kpi_type, kv.piller_id, kv.created_at, kv.updated_at,
                k.title as kpi_title, u.unit_name
         FROM kpi_values kv
         JOIN kpis k ON k.id = kv.kpi_id
         LEFT JOIN unit_master u ON u.id = kv.uom
         WHERE kv."data operator" = $1
         ORDER BY k.parent_kpi_id NULLS FIRST, k.title, kv.created_at DESC`,
        [empIdInt]
      );

      res.json({ success: true, data: valuesResult.rows });
    } catch (error) {
      await logError(error, 'EmployeeKPIController.getEmployeeKPIValues', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get all KPIs assigned to an employee as data operator
  static async getEmployeeKPIs(req, res) {
    try {
      const { empId } = req.params;

      if (!empId) {
        return res.status(400).json({ success: false, error: 'empId is required' });
      }

      // Convert empId to integer to match BIGINT type in database
      const empIdInt = parseInt(empId, 10);

      // Get all unique KPIs where employee is data operator
      const kpisResult = await pool.query(
        `SELECT DISTINCT k.id, k.title, k.category_id, k.parent_kpi_id, k.fin_year,
                c.category_name
         FROM kpi_values kv
         JOIN kpis k ON k.id = kv.kpi_id
         LEFT JOIN categories c ON c.id = k.category_id
         WHERE kv."data operator" = $1
         ORDER BY k.parent_kpi_id NULLS FIRST, k.title`,
        [empIdInt]
      );

      res.json({ success: true, data: kpisResult.rows });
    } catch (error) {
      await logError(error, 'EmployeeKPIController.getEmployeeKPIs', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get KPI values for a specific KPI for an employee
  static async getKPIValueForEmployee(req, res) {
    try {
      const { kpiId, empId } = req.params;

      if (!kpiId || !empId) {
        return res.status(400).json({ success: false, error: 'kpiId and empId are required' });
      }

      // Convert empId to integer to match BIGINT type in database
      const empIdInt = parseInt(empId, 10);

      const valuesResult = await pool.query(
        `SELECT kv.id, kv.data, kv.kpi_id, kv."data operator", kv.target_required, 
                kv.uom, kv.kpi_type, kv.piller_id, kv.created_at, kv.updated_at,
                k.title as kpi_title, u.unit_name
         FROM kpi_values kv
         JOIN kpis k ON k.id = kv.kpi_id
         LEFT JOIN unit_master u ON u.id = kv.uom
         WHERE kv.kpi_id = $1 AND kv."data operator" = $2
         ORDER BY kv.created_at DESC`,
        [kpiId, empIdInt]
      );

      res.json({ success: true, data: valuesResult.rows });
    } catch (error) {
      await logError(error, 'EmployeeKPIController.getKPIValueForEmployee', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Submit KPI data entry (monthly data)
  static async submitKPIData(req, res) {
    try {
      const { kpiId, empId, month, year, targetValue, actualValue, kpiValueId } = req.body;

      if (!kpiId || !empId || !month || !year) {
        return res.status(400).json({ 
          success: false, 
          error: 'kpiId, empId, month, and year are required' 
        });
      }

      // Check if entry already exists for this month/year
      const existingEntry = await pool.query(
        `SELECT id FROM kpi_monthly_data 
         WHERE kpi_value_id = $1 AND month = $2 AND year = $3`,
        [kpiValueId, month, year]
      );

      let result;
      if (existingEntry.rows.length > 0) {
        // Update existing entry
        result = await pool.query(
          `UPDATE kpi_monthly_data
           SET target_value = $1, actual_value = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3
           RETURNING *`,
          [targetValue || null, actualValue || null, existingEntry.rows[0].id]
        );
      } else {
        // Insert new entry
        result = await pool.query(
          `INSERT INTO kpi_monthly_data (kpi_value_id, month, year, target_value, actual_value)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [kpiValueId, month, year, targetValue || null, actualValue || null]
        );
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      await logError(error, 'EmployeeKPIController.submitKPIData', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get monthly data for a KPI value
  static async getMonthlyData(req, res) {
    try {
      const { kpiValueId, year } = req.params;

      if (!kpiValueId || !year) {
        return res.status(400).json({ 
          success: false, 
          error: 'kpiValueId and year are required' 
        });
      }

      const dataResult = await pool.query(
        `SELECT * FROM kpi_monthly_data
         WHERE kpi_value_id = $1 AND year = $2
         ORDER BY month`,
        [kpiValueId, year]
      );

      res.json({ success: true, data: dataResult.rows });
    } catch (error) {
      await logError(error, 'EmployeeKPIController.getMonthlyData', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

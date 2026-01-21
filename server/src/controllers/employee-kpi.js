import pool from '../config/database.js';
import { logError } from '../utils/logger.js';
import { KPICalculationService } from '../services/kpiCalculationService.js';

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
                kv.uom, kv.kpi_type, kv.piller_id, kv.formula, kv.source_kpi_value_ids,
                kv.created_at, kv.updated_at,
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
                kv.uom, kv.kpi_type, kv.piller_id, kv.formula, kv.source_kpi_value_ids,
                kv.created_at, kv.updated_at,
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

  // Submit KPI data entry (to kpi_data_value table)
  static async submitKPIData(req, res) {
    try {
      const { kpiId, empId, month, year, targetValue, actualValue, kpiValueId } = req.body;

      if (!kpiId || !empId || !month || !year || !kpiValueId) {
        return res.status(400).json({ 
          success: false, 
          error: 'kpiId, empId, month, year, and kpiValueId are required' 
        });
      }

      const results = [];

      // Handle target value
      if (targetValue !== null && targetValue !== undefined && targetValue !== '') {
        // Check if target entry exists
        const existingTarget = await pool.query(
          `SELECT id FROM kpi_data_value 
           WHERE kpi_value_id = $1 AND month = $2 AND year = $3 AND value_type = $4`,
          [kpiValueId, month, year, 'target']
        );

        if (existingTarget.rows.length > 0) {
          // Update existing target
          const targetResult = await pool.query(
            `UPDATE kpi_data_value
             SET value = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [parseFloat(targetValue), existingTarget.rows[0].id]
          );
          results.push(targetResult.rows[0]);
        } else {
          // Insert new target
          const targetResult = await pool.query(
            `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [kpiValueId, parseFloat(targetValue), 'target', month, year]
          );
          results.push(targetResult.rows[0]);
        }
      }

      // Handle actual value
      if (actualValue !== null && actualValue !== undefined && actualValue !== '') {
        // Check if actual entry exists
        const existingActual = await pool.query(
          `SELECT id FROM kpi_data_value 
           WHERE kpi_value_id = $1 AND month = $2 AND year = $3 AND value_type = $4`,
          [kpiValueId, month, year, 'actual']
        );

        if (existingActual.rows.length > 0) {
          // Update existing actual
          const actualResult = await pool.query(
            `UPDATE kpi_data_value
             SET value = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [parseFloat(actualValue), existingActual.rows[0].id]
          );
          results.push(actualResult.rows[0]);
        } else {
          // Insert new actual
          const actualResult = await pool.query(
            `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [kpiValueId, parseFloat(actualValue), 'actual', month, year]
          );
          results.push(actualResult.rows[0]);
        }

        // After saving actual value, recalculate dependent computed KPIs
        try {
          await KPICalculationService.recalculateDependentKPIs(
            parseInt(kpiValueId),
            parseInt(month),
            parseInt(year),
            parseInt(empId)
          );
        } catch (calcError) {
          console.error('Error recalculating dependent KPIs:', calcError);
          // Don't fail the request if calculation fails
        }
      }

      res.json({ success: true, data: results });
    } catch (error) {
      await logError(error, 'EmployeeKPIController.submitKPIData', req.user?.id);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get monthly data for a KPI value (from kpi_data_value table)
  static async getMonthlyData(req, res) {
    try {
      const { kpiValueId, year } = req.params;

      if (!kpiValueId || !year) {
        return res.status(400).json({ 
          success: false, 
          error: 'kpiValueId and year are required' 
        });
      }

      // Get both target and actual values
      const dataResult = await pool.query(
        `SELECT 
           month,
           year,
           MAX(CASE WHEN value_type = 'target' THEN value END) as target_value,
           MAX(CASE WHEN value_type = 'actual' THEN value END) as actual_value
         FROM kpi_data_value
         WHERE kpi_value_id = $1 AND year = $2
         GROUP BY month, year
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

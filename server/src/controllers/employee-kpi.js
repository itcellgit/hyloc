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
                kv.computation_type, kv.target_formula, kv.target_source_kpi_value_ids,
                kv.default_target_value, kv.created_at, kv.updated_at,
                k.title as kpi_title, u.unit_name, u.symbol as unit_symbol
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
                kv.computation_type, kv.target_formula, kv.target_source_kpi_value_ids,
                kv.default_target_value, kv.created_at, kv.updated_at,
                k.title as kpi_title, u.unit_name, u.symbol as unit_symbol
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

      // Get KPI value details to check if it's computed or has target formula
      const kpiValueResult = await pool.query(
        `SELECT kpi_type, default_target_value, target_formula, target_source_kpi_value_ids FROM kpi_values WHERE id = $1`,
        [kpiValueId]
      );
      const kpiValueData = kpiValueResult.rows[0];
      const isComputed = kpiValueData && (kpiValueData.kpi_type || '').toLowerCase() === 'computed';
      const defaultTargetValue = kpiValueData?.default_target_value;
      const targetFormula = kpiValueData?.target_formula;
      const formula = kpiValueData?.formula;
      const hasTargetFormula = targetFormula !== null && targetFormula !== undefined && targetFormula.trim() !== '';
      const hasFormula = formula !== null && formula !== undefined && formula.trim() !== '';

      const results = [];
      let shouldRecalculate = false;
      let shouldComputeTarget = false;
      let shouldComputeActual = false;

      // Handle target value
      let resolvedTargetValue = targetValue;
      
      // For computed KPIs with empty target, use default_target_value if available
      // BUT: if target_formula exists, we'll compute it instead (option 3)
      if (isComputed && (targetValue === null || targetValue === undefined || targetValue === '') && !hasTargetFormula && defaultTargetValue !== null && defaultTargetValue !== undefined) {
        resolvedTargetValue = defaultTargetValue;
      }
      
      // For computed/manual KPIs with target_formula but no targetValue provided, mark for computation (Option 3)
      if (hasTargetFormula && (targetValue === null || targetValue === undefined || targetValue === '')) {
        shouldComputeTarget = true;
      }

      // For computed KPIs with formula but no actualValue provided, mark for computation (Option 2)
      if (isComputed && hasFormula && (actualValue === null || actualValue === undefined || actualValue === '') && (targetValue !== null && targetValue !== undefined && targetValue !== '')) {
        shouldComputeActual = true;
      }

      if (resolvedTargetValue !== null && resolvedTargetValue !== undefined && resolvedTargetValue !== '') {
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
            [parseFloat(resolvedTargetValue), existingTarget.rows[0].id]
          );
          results.push(targetResult.rows[0]);
          shouldRecalculate = true;
        } else {
          // Insert new target
          const targetResult = await pool.query(
            `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [kpiValueId, parseFloat(resolvedTargetValue), 'target', month, year]
          );
          results.push(targetResult.rows[0]);
          shouldRecalculate = true;
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
          shouldRecalculate = true;
        } else {
          // Insert new actual
          const actualResult = await pool.query(
            `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [kpiValueId, parseFloat(actualValue), 'actual', month, year]
          );
          results.push(actualResult.rows[0]);
          shouldRecalculate = true;
        }
        
        // If this KPI has a target_formula (option 3), compute and save target
        if (shouldComputeTarget) {
          try {
            console.log(`[OPTION3] Computing target for KPI Value ${kpiValueId} using target_formula`);
            const computedTarget = await KPICalculationService.calculateKPIValue(kpiValueId, month, year, empId, 'target');
            
            if (computedTarget !== null && computedTarget !== undefined && !Number.isNaN(computedTarget)) {
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
                  [parseFloat(computedTarget), existingTarget.rows[0].id]
                );
                results.push(targetResult.rows[0]);
                console.log(`[OPTION3] Updated target value: ${computedTarget}`);
              } else {
                // Insert new target
                const targetResult = await pool.query(
                  `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
                   VALUES ($1, $2, $3, $4, $5)
                   RETURNING *`,
                  [kpiValueId, parseFloat(computedTarget), 'target', month, year]
                );
                results.push(targetResult.rows[0]);
                console.log(`[OPTION3] Inserted computed target value: ${computedTarget}`);
              }
            }
          } catch (error) {
            console.error(`[OPTION3] Error computing target for KPI Value ${kpiValueId}:`, error);
            // Don't fail the request if target computation fails
          }
        }
      }

      // If this is Option 2 (compute actual value), do it now
      if (shouldComputeActual) {
        try {
          console.log(`[OPTION2] Computing actual for KPI Value ${kpiValueId} using formula`);
          const computedActual = await KPICalculationService.calculateKPIValue(kpiValueId, month, year, empId, 'actual');
          
          if (computedActual !== null && computedActual !== undefined && !Number.isNaN(computedActual)) {
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
                [parseFloat(computedActual), existingActual.rows[0].id]
              );
              results.push(actualResult.rows[0]);
              console.log(`[OPTION2] Updated actual value: ${computedActual}`);
            } else {
              // Insert new actual
              const actualResult = await pool.query(
                `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [kpiValueId, parseFloat(computedActual), 'actual', month, year]
              );
              results.push(actualResult.rows[0]);
              console.log(`[OPTION2] Inserted computed actual value: ${computedActual}`);
            }
          }
        } catch (error) {
          console.error(`[OPTION2] Error computing actual for KPI Value ${kpiValueId}:`, error);
          // Don't fail the request if actual computation fails
        }
      }

      // After saving target/actual values, recalculate dependent computed KPIs once
      if (shouldRecalculate) {
        try {
          console.log(`[AUTO-CALC] ========================================`);
          console.log(`[AUTO-CALC] Triggering recalculation`);
          console.log(`[AUTO-CALC] KPI Value ID: ${kpiValueId}`);
          console.log(`[AUTO-CALC] Month: ${month}, Year: ${year}`);
          console.log(`[AUTO-CALC] Employee ID: ${empId}`);
          console.log(`[AUTO-CALC] ========================================`);
          
          await KPICalculationService.recalculateDependentKPIs(
            parseInt(kpiValueId),
            parseInt(month),
            parseInt(year),
            parseInt(empId)
          );
          console.log(`[AUTO-CALC] ✓ Recalculation completed successfully`);
        } catch (calcError) {
          console.error('[AUTO-CALC] ✗ Error recalculating dependent KPIs:', calcError);
          console.error('[AUTO-CALC] Error message:', calcError.message);
          console.error('[AUTO-CALC] Stack:', calcError.stack);
          // Don't fail the request if calculation fails
        }
      } else {
        console.log(`[AUTO-CALC] No recalculation needed (shouldRecalculate=${shouldRecalculate})`);
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

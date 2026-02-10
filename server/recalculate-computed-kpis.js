import pool from './src/config/database.js';
import { KPICalculationService } from './src/services/kpiCalculationService.js';

async function recalculateAllComputedKPIs() {
  try {
    console.log('Starting recalculation of all computed KPI values...');
    
    // Get all computed KPI values that have formulas
    let computedKPIsResult;
    try {
      computedKPIsResult = await pool.query(
        `SELECT DISTINCT kv.id, kv.data, kv."data operator" as emp_id, kv.formula,
                kv.source_kpi_value_ids, kv.target_formula, kv.target_source_kpi_value_ids,
                kv.kpi_type, kv.target_required
         FROM kpi_values kv
         WHERE LOWER(kv.kpi_type) = 'computed'
           AND kv.formula IS NOT NULL 
           AND kv.formula != ''
         ORDER BY kv.id`
      );
    } catch (error) {
      if (error?.code === '42703') {
        console.warn('target_formula columns not found; falling back to base formula columns.');
        computedKPIsResult = await pool.query(
          `SELECT DISTINCT kv.id, kv.data, kv."data operator" as emp_id, kv.formula,
                  kv.source_kpi_value_ids, kv.kpi_type, kv.target_required
           FROM kpi_values kv
           WHERE LOWER(kv.kpi_type) = 'computed'
             AND kv.formula IS NOT NULL 
             AND kv.formula != ''
           ORDER BY kv.id`
        );
      } else {
        throw error;
      }
    }
    
    console.log(`Found ${computedKPIsResult.rows.length} computed KPI values with formulas`);
    
    // Get all months/years that have data
    const dataPeriodsResult = await pool.query(
      `SELECT DISTINCT month, year
       FROM kpi_data_value
       ORDER BY year, month`
    );
    
    console.log(`Found data for ${dataPeriodsResult.rows.length} month/year periods`);
    
    let recalculated = 0;
    let errors = 0;
    
    // For each computed KPI value and each period, recalculate
    for (const kpi of computedKPIsResult.rows) {
      console.log(`\nProcessing KPI Value: ${kpi.data} (ID: ${kpi.id})`);
      console.log(`  kpi_type: ${kpi.kpi_type}`);
      console.log(`  formula: ${kpi.formula}`);
      console.log(`  source_kpi_value_ids: ${JSON.stringify(kpi.source_kpi_value_ids)}`);
      console.log(`  target_formula: ${kpi.target_formula || ''}`);
      console.log(`  target_source_kpi_value_ids: ${JSON.stringify(kpi.target_source_kpi_value_ids)}`);
      console.log(`  target_required: ${kpi.target_required}`);
      
      for (const period of dataPeriodsResult.rows) {
        try {
          // Delete existing computed data for this period
          await pool.query(
            `DELETE FROM kpi_data_value
             WHERE kpi_value_id = $1 AND month = $2 AND year = $3`,
            [kpi.id, period.month, period.year]
          );
          
          // Recalculate actual value
          const actualValue = await KPICalculationService.calculateKPIValue(
            kpi.id,
            period.month,
            period.year,
            kpi.emp_id,
            'actual'
          );
          
          if (actualValue !== null && actualValue !== undefined) {
            // Save the recalculated actual value
            await pool.query(
              `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
               VALUES ($1, $2, 'actual', $3, $4)`,
              [kpi.id, actualValue, period.month, period.year]
            );
            
            console.log(`  ✓ Recalculated ${period.month}/${period.year}: actual = ${actualValue}`);
            recalculated++;
          }
          
          // Check if target is required
          const kpiValueInfo = await pool.query(
            `SELECT target_required FROM kpi_values WHERE id = $1`,
            [kpi.id]
          );
          
          if (kpiValueInfo.rows[0]?.target_required) {
            // Recalculate target value
            const targetValue = await KPICalculationService.calculateKPIValue(
              kpi.id,
              period.month,
              period.year,
              kpi.emp_id,
              'target'
            );
            
            if (targetValue !== null && targetValue !== undefined) {
              // Save the recalculated target value
              await pool.query(
                `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
                 VALUES ($1, $2, 'target', $3, $4)`,
                [kpi.id, targetValue, period.month, period.year]
              );
              
              console.log(`  ✓ Recalculated ${period.month}/${period.year}: target = ${targetValue}`);
              recalculated++;
            }
          }
        } catch (error) {
          console.error(`  ✗ Error for ${period.month}/${period.year}:`, error.message);
          if (error?.stack) {
            console.error(error.stack);
          }
          errors++;
        }
      }
    }
    
    console.log(`\n✅ Recalculation complete!`);
    console.log(`   Successfully recalculated: ${recalculated} values`);
    console.log(`   Errors: ${errors}`);
    
  } catch (error) {
    console.error('Fatal error during recalculation:', error);
  } finally {
    await pool.end();
  }
}

recalculateAllComputedKPIs();

import pool from './src/config/database.js';

async function computeKPIDataValues() {
  try {
    console.log('🔄 Computing KPI Data Values...\n');

    // Get all KPI values that need data
    const kpiValuesResult = await pool.query(`
      SELECT DISTINCT 
        kv.id,
        kv.data as description,
        k.title as kpi_name,
        kv.kpi_type,
        kv.target_required,
        kv.default_target_value
      FROM kpi_values kv
      JOIN kpis k ON k.id = kv.kpi_id
      ORDER BY k.title, kv.data
    `);

    const kpiValues = kpiValuesResult.rows;
    console.log(`Found ${kpiValues.length} KPI values to compute data for\n`);

    if (kpiValues.length === 0) {
      console.log('❌ No KPI values found in database');
      return;
    }

    // Show all KPI values
    console.log('Available KPI Values:');
    console.log('─'.repeat(80));
    kpiValues.forEach((kv, idx) => {
      console.log(`${idx + 1}. [ID: ${kv.id}] ${kv.kpi_name} → ${kv.description}`);
      console.log(`   Type: ${kv.kpi_type}, Target Required: ${kv.target_required}, Default Target: ${kv.default_target_value}`);
    });
    console.log('─'.repeat(80));

    let totalInserted = 0;

    // Generate fiscal year months (Apr 2025 - Mar 2026)
    const months = [
      { month: 4, year: 2025 },
      { month: 5, year: 2025 },
      { month: 6, year: 2025 },
      { month: 7, year: 2025 },
      { month: 8, year: 2025 },
      { month: 9, year: 2025 },
      { month: 10, year: 2025 },
      { month: 11, year: 2025 },
      { month: 12, year: 2025 },
      { month: 1, year: 2026 },
      { month: 2, year: 2026 },
      { month: 3, year: 2026 },
    ];

    // For each KPI value, generate sample data
    for (const kv of kpiValues) {
      console.log(`\n📊 Processing: ${kv.kpi_name} → ${kv.description}`);

      // Clear existing data for this KPI value
      await pool.query(
        'DELETE FROM kpi_data_value WHERE kpi_value_id = $1',
        [kv.id]
      );
      console.log('  ✓ Cleared existing data');

      let inserted = 0;

      for (const { month, year } of months) {
        try {
          // Generate sample actual value (random between 50-100)
          const actualValue = Math.floor(Math.random() * 50) + 50;

          // Use default target or generate one
          const targetValue = kv.default_target_value || 80;

          // Insert actual value
          await pool.query(
            `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
             VALUES ($1, $2, 'actual', $3, $4)`,
            [kv.id, actualValue, month, year]
          );
          inserted++;

          // Insert target value if required
          if (kv.target_required) {
            await pool.query(
              `INSERT INTO kpi_data_value (kpi_value_id, value, value_type, month, year)
               VALUES ($1, $2, 'target', $3, $4)`,
              [kv.id, targetValue, month, year]
            );
            inserted++;
          }
        } catch (err) {
          console.error(`  ✗ Error inserting data for ${month}/${year}:`, err.message);
        }
      }

      console.log(`  ✓ Inserted ${inserted} data points (${inserted / 2} months)`);
      totalInserted += inserted;
    }

    console.log(`\n✅ Computation Complete!`);
    console.log(`   Total data points inserted: ${totalInserted}`);
    console.log(`   Fiscal period: Apr 2025 - Mar 2026 (12 months)`);

    // Verify the data
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total_records FROM kpi_data_value
    `);
    console.log(`   Total records in kpi_data_value table: ${verifyResult.rows[0].total_records}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

computeKPIDataValues();

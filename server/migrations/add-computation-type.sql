-- Add computation_type column to kpi_values table
ALTER TABLE kpi_values ADD COLUMN IF NOT EXISTS computation_type VARCHAR(50);

-- Add target formula columns
ALTER TABLE kpi_values ADD COLUMN IF NOT EXISTS target_formula TEXT;
ALTER TABLE kpi_values ADD COLUMN IF NOT EXISTS target_source_kpi_value_ids INTEGER[];

-- Add comments
COMMENT ON COLUMN kpi_values.computation_type IS 'Computation type for computed KPIs: "both" (both computed), "actual_computed" (actual auto, target manual), "target_computed" (target auto, actual manual)';
COMMENT ON COLUMN kpi_values.target_formula IS 'Formula for target value calculations (Option 3: manual actual, computed target). Use v{kpi_value_id} syntax. Examples: v1+v2, v1*100/v2, AVERAGE(v1,v2,v3)';
COMMENT ON COLUMN kpi_values.target_source_kpi_value_ids IS 'Array of KPI value IDs that the target formula depends on';

-- Create index for efficient target dependency queries
CREATE INDEX IF NOT EXISTS idx_kpi_values_target_deps ON kpi_values USING gin(target_source_kpi_value_ids);

-- Add target formula and target source KPI value IDs columns to kpi_values table

-- Add target_formula column for target calculations
ALTER TABLE kpi_values 
ADD COLUMN IF NOT EXISTS target_formula TEXT,
ADD COLUMN IF NOT EXISTS target_source_kpi_value_ids INTEGER[];

-- Add comments
COMMENT ON COLUMN kpi_values.formula IS 'Formula for actual value calculations. Use v{kpi_value_id} syntax. Examples: v1+v2, v1*100/v2, AVERAGE(v1,v2,v3)';
COMMENT ON COLUMN kpi_values.source_kpi_value_ids IS 'Array of KPI value IDs that the actual formula depends on';
COMMENT ON COLUMN kpi_values.target_formula IS 'Formula for target value calculations. Use v{kpi_value_id} syntax.';
COMMENT ON COLUMN kpi_values.target_source_kpi_value_ids IS 'Array of KPI value IDs that the target formula depends on';

-- Create index for target dependencies
CREATE INDEX IF NOT EXISTS idx_kpi_values_target_deps ON kpi_values USING gin(target_source_kpi_value_ids);

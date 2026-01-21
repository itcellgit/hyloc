-- Migration: Add formula support for computed KPIs
-- Date: 2026-01-16

-- Add formula column to kpi_values table
ALTER TABLE kpi_values 
ADD COLUMN IF NOT EXISTS formula TEXT,
ADD COLUMN IF NOT EXISTS source_kpi_value_ids INTEGER[];

-- Add comments for clarity
COMMENT ON COLUMN kpi_values.formula IS 'Formula for computed KPIs. Use v{kpi_value_id} syntax. Examples: v1+v2, v1*100/v2, AVERAGE(v1,v2,v3)';
COMMENT ON COLUMN kpi_values.source_kpi_value_ids IS 'Array of KPI value IDs that this computed KPI depends on';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_kpi_values_type ON kpi_values(kpi_type);
CREATE INDEX IF NOT EXISTS idx_kpi_values_source_deps ON kpi_values USING gin(source_kpi_value_ids);

-- Add constraint to ensure computed KPIs have formulas
ALTER TABLE kpi_values 
ADD CONSTRAINT check_computed_has_formula 
CHECK (
  (kpi_type = 'computed' AND formula IS NOT NULL AND formula != '') 
  OR 
  (kpi_type != 'computed')
);

-- Add unique constraint to prevent duplicate monthly entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_data_value_unique 
ON kpi_data_value(kpi_value_id, month, year, value_type);

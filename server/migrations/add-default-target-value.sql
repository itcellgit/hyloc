-- Add default_target_value column to kpi_values table
ALTER TABLE kpi_values
ADD COLUMN IF NOT EXISTS default_target_value INTEGER;

COMMENT ON COLUMN kpi_values.default_target_value IS 'Default target value for KPI comparison';

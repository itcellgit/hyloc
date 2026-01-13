-- Drop existing table and type if they exist
DROP TABLE IF EXISTS kpi_data_value CASCADE;
DROP TYPE IF EXISTS value_type_enum CASCADE;

-- Create kpi_data_value table with VARCHAR for value_type
CREATE TABLE kpi_data_value (
    id SERIAL PRIMARY KEY,
    kpi_value_id INTEGER NOT NULL,
    value BIGINT NOT NULL,
    value_type VARCHAR(10) NOT NULL CHECK (value_type IN ('target', 'actual')),
    month SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
    year SMALLINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kpi_value_id, month, year, value_type)
);

-- Add foreign key constraint if kpi_values table exists
DO $$ BEGIN
    ALTER TABLE kpi_data_value 
    ADD CONSTRAINT fk_kpi_data_value_kpi_value 
    FOREIGN KEY (kpi_value_id) REFERENCES kpi_values(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kpi_data_value_kpi_value_id ON kpi_data_value(kpi_value_id);
CREATE INDEX IF NOT EXISTS idx_kpi_data_value_month_year ON kpi_data_value(month, year);
CREATE INDEX IF NOT EXISTS idx_kpi_data_value_value_type ON kpi_data_value(value_type);

-- Add comments
COMMENT ON TABLE kpi_data_value IS 'Stores KPI data values with separate rows for target and actual values';
COMMENT ON COLUMN kpi_data_value.value_type IS 'Type of value: target or actual (enforced by CHECK constraint)';

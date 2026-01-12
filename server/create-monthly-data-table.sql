-- Create table for monthly KPI data entries
CREATE TABLE IF NOT EXISTS kpi_monthly_data (
    id BIGSERIAL PRIMARY KEY,
    kpi_value_id BIGINT NOT NULL REFERENCES kpi_values(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
    target_value VARCHAR,
    actual_value VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(kpi_value_id, month, year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kpi_monthly_data_kpi_value ON kpi_monthly_data(kpi_value_id);
CREATE INDEX IF NOT EXISTS idx_kpi_monthly_data_year_month ON kpi_monthly_data(year, month);

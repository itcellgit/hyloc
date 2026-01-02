-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  head_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- Insert sample departments
INSERT INTO departments (name, description, head_id) VALUES
  ('Human Resources', 'Manages employee relations, recruitment, and benefits', NULL),
  ('Engineering', 'Software development and technical operations', NULL),
  ('Sales', 'Business development and customer relations', NULL),
  ('Finance', 'Financial planning, accounting, and reporting', NULL),
  ('Marketing', 'Brand management and customer outreach', NULL)
ON CONFLICT (name) DO NOTHING;

SELECT * FROM departments;

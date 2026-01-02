-- Create database (run this first if database doesn't exist)
-- CREATE DATABASE hyloc_db;

-- Sample table structure for getting started
-- Modify this according to your requirements

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  empid BIGINT UNIQUE NOT NULL,
  department_id INTEGER,
  phone VARCHAR(25),
  address TEXT,
  firstname VARCHAR(100) NOT NULL,
  middlename VARCHAR(100),
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  bloodgroup VARCHAR(10),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  head_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_empid ON users(empid);
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_users_department_id ON users(department_id);

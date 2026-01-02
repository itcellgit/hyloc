import pool from '../config/database.js';

export class User {
  static async findAll() {
    const result = await pool.query(
      `SELECT id, empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByEmpId(empid) {
    const result = await pool.query(
      `SELECT id, empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, password, created_at, updated_at
       FROM users WHERE empid = $1`,
      [empid]
    );
    return result.rows[0];
  }

  static async create(user) {
    const {
      empid,
      department_id,
      phone,
      address,
      firstname,
      middlename,
      lastname,
      email,
      bloodgroup,
      password
    } = user;

    const result = await pool.query(
      `INSERT INTO users (empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, created_at, updated_at`,
      [empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, password]
    );
    return result.rows[0];
  }

  static async update(id, user) {
    const {
      department_id,
      phone,
      address,
      firstname,
      middlename,
      lastname,
      email,
      bloodgroup
    } = user;

    const result = await pool.query(
      `UPDATE users
       SET department_id = COALESCE($1, department_id),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           firstname = COALESCE($4, firstname),
           middlename = COALESCE($5, middlename),
           lastname = COALESCE($6, lastname),
           email = COALESCE($7, email),
           bloodgroup = COALESCE($8, bloodgroup),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, empid, department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, created_at, updated_at`,
      [department_id, phone, address, firstname, middlename, lastname, email, bloodgroup, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}

export class Post {
  static async findAll() {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query('SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  }

  static async create(userId, title, content) {
    const result = await pool.query(
      'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, content]
    );
    return result.rows[0];
  }

  static async update(id, title, content) {
    const result = await pool.query(
      'UPDATE posts SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}

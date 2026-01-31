const db = require('../config/database');

class Teacher {
  static async getAll() {
    const [rows] = await db.execute('SELECT id, name, subject, email FROM Teachers ORDER BY id ASC');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute('SELECT id, name, subject, email FROM Teachers WHERE id = ?', [id]);
    return rows[0] || null;
  }

 
  static async create({ name, subject, email = null }) {
    const [result] = await db.execute(
      'INSERT INTO Teachers (name, email, subject) VALUES (?, ?, ?)',
      [name, email, subject]
    );
    return result.insertId;
  }

  static async update(id, { name, subject, email = null }) {
    const [result] = await db.execute(
      'UPDATE Teachers SET name = ?, email = ?, subject = ? WHERE id = ?',
      [name, email, subject, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM Teachers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Teacher;

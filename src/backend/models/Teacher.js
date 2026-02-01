const db = require('../config/database');

class teacher {
  static async getAll() {
    const [rows] = await db.execute('SELECT id, name, subject FROM teachers ORDER BY id ASC');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute('SELECT id, name, subject FROM teachers WHERE id = ?', [id]);
    return rows[0] || null;
  }

 
  static async create({ name, subject}) {
    const [result] = await db.execute(
      'INSERT INTO teachers (name, subject) VALUES (?, ?, ?)',
      [name, subject]
    );
    return result.insertId;
  }

  static async update(id, { name, subject}) {
    const [result] = await db.execute(
      'UPDATE teachers SET name = ?, subject = ? WHERE id = ?',
      [name, subject, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM teachers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = teacher;

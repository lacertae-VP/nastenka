const db = require('../config/database');

class Student {
  static async getAll() {
    const [rows] = await db.execute('SELECT id, name, `class` FROM students ORDER BY id ASC');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute('SELECT id, name, `class` FROM students WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, className }) {
    const [result] = await db.execute(
      'INSERT INTO students (name, `class`) VALUES (?, ?)',
      [name, className]
    );
    return result.insertId;
  }

  static async update(id, { name, className }) {
    const [result] = await db.execute(
      'UPDATE students SET name = ?, `class` = ? WHERE id = ?',
      [name, className, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM students WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Student;

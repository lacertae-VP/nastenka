
const db = require('../config/database');

exports.getAllClasses = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT DISTINCT `class` AS name FROM students ORDER BY `class` ASC');
    res.status(200).json(rows.map(r => r.name));
  } catch (error) {
    console.error('getAllClasses error:', error);
    res.status(500).json({ message: 'Error retrieving classes', error: error.message });
  }
};

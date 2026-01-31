
const Student = require('../models/Student');

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.getAll();
    res.status(200).json(students);
  } catch (error) {
    console.error('getAllStudents error:', error);
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.getById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json(student);
  } catch (error) {
    console.error('getStudentById error:', error);
    res.status(500).json({ message: 'Error retrieving student', error: error.message });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const className = (req.body.class || req.body.className || '').trim();

    if (!name || !className) {
      return res.status(400).json({ message: 'name and class are required' });
    }

    const id = await Student.create({ name, className });
    res.status(201).json({ id, name, class: className });
  } catch (error) {
    console.error('addStudent error:', error);
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const className = (req.body.class || req.body.className || '').trim();

    if (!name || !className) {
      return res.status(400).json({ message: 'name and class are required' });
    }

    const ok = await Student.update(req.params.id, { name, className });
    if (!ok) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('updateStudent error:', error);
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const ok = await Student.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('deleteStudent error:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};

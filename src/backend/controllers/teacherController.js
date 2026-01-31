const Teacher = require('../models/Teacher');

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.getAll();
    res.status(200).json(teachers);
  } catch (error) {
    console.error('getAllTeachers error:', error);
    res.status(500).json({ message: 'Error retrieving teachers', error: error.message });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.getById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json(teacher);
  } catch (error) {
    console.error('getTeacherById error:', error);
    res.status(500).json({ message: 'Error retrieving teacher', error: error.message });
  }
};

exports.addTeacher = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const subject = (req.body.subject || '').trim();
    const emailRaw = (req.body.email || '').trim();
    const email = emailRaw ? emailRaw : null;

    if (!name || !subject) {
      return res.status(400).json({ message: 'name and subject are required' });
    }

    const id = await Teacher.create({ name, subject, email });
    res.status(201).json({ id, name, subject, email });
  } catch (error) {
    console.error('addTeacher error:', error);
    res.status(500).json({ message: 'Error adding teacher', error: error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const subject = (req.body.subject || '').trim();
    const emailRaw = (req.body.email || '').trim();
    const email = emailRaw ? emailRaw : null;

    if (!name || !subject) {
      return res.status(400).json({ message: 'name and subject are required' });
    }

    const ok = await Teacher.update(req.params.id, { name, subject, email });
    if (!ok) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json({ message: 'Teacher updated successfully' });
  } catch (error) {
    console.error('updateTeacher error:', error);
    res.status(500).json({ message: 'Error updating teacher', error: error.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const ok = await Teacher.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('deleteTeacher error:', error);
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
};

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/mark', attendanceController.markAttendance);
router.get('/records', attendanceController.getAttendanceRecords);
router.get('/student/:studentId', attendanceController.getAttendanceByStudent);
router.get('/event/:eventId', attendanceController.getAttendanceByEvent);

module.exports = router;

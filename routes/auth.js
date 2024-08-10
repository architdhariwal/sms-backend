const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { readJsonFile } = require('../utils/fileStorage');

const router = express.Router();
const STUDENT_FILE = '../data/students.json';
const JWT_SECRET = process.env.JWT_SECRET;

// Utility function to get students
const getStudents = () => readJsonFile(STUDENT_FILE);

router.post('/login', [
  body('admissionNumber').notEmpty().withMessage('Admission number is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { admissionNumber, password } = req.body;
  const students = getStudents();
  const student = students.find(s => s.admissionNumber === admissionNumber);

  if (!student) {
    return res.status(400).json({ message: 'Invalid admission number or password' });
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid admission number or password' });
  }

  const token = jwt.sign({ admissionNumber: student.admissionNumber }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;

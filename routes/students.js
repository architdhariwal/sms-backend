const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { readJsonFile, writeJsonFile } = require('../utils/fileStorage');
const authenticate = require('../middleware/authenticate');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const STUDENT_FILE = '../data/students.json';

// Utility function to get students
const getStudents = () => readJsonFile(STUDENT_FILE);

// Utility function to save students
const saveStudents = (students) => writeJsonFile(STUDENT_FILE, students);

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('admissionNumber').notEmpty().withMessage('Admission number is required'),
  body('class').notEmpty().withMessage('Class is required'),
  body('section').notEmpty().withMessage('Section is required'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('mobileNumber').notEmpty().withMessage('Mobile number is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, admissionNumber, class: studentClass, section, gender, mobileNumber, address, password } = req.body;
    const students = getStudents();

    if (students.find(student => student.admissionNumber === admissionNumber)) {
      return res.status(400).json({ message: 'Admission number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = {
      id: uuidv4(), // Generate a unique UUID for each student
      name,
      admissionNumber,
      class: studentClass,
      section,
      gender,
      mobileNumber,
      address,
      password: hashedPassword
    };

    students.push(student);
    saveStudents(students);

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', authenticate, (req, res) => {
  const students = getStudents();
  res.json(students);
});

router.put('/:admissionNumber', authenticate, [
  body('name').optional().notEmpty().withMessage('Name is required'),
  body('class').optional().notEmpty().withMessage('Class is required'),
  body('section').optional().notEmpty().withMessage('Section is required'),
  body('gender').optional().notEmpty().withMessage('Gender is required'),
  body('mobileNumber').optional().notEmpty().withMessage('Mobile number is required'),
  body('address').optional().notEmpty().withMessage('Address is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const students = getStudents();
    const index = students.findIndex(student => student.admissionNumber === req.params.admissionNumber);

    if (index === -1) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const updatedStudent = { ...students[index], ...req.body };
    students[index] = updatedStudent;
    saveStudents(students);

    res.json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:admissionNumber', authenticate, (req, res) => {
  const students = getStudents();
  const filteredStudents = students.filter(student => student.admissionNumber !== req.params.admissionNumber);

  if (students.length === filteredStudents.length) {
    return res.status(404).json({ message: 'Student not found' });
  }

  saveStudents(filteredStudents);
  res.json({ message: 'Student deleted successfully' });
});

module.exports = router;

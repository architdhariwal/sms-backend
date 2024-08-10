const express = require('express');
const { body, validationResult } = require('express-validator');
const { readJsonFile, writeJsonFile } = require('../utils/fileStorage');
const authenticate = require('../middleware/authenticate');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const BOOK_FILE = '../data/books.json';

// Utility function to get books
const getBooks = () => readJsonFile(BOOK_FILE);

// Utility function to save books
const saveBooks = (books) => writeJsonFile(BOOK_FILE, books);

router.post('/add', authenticate, [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('isbn').notEmpty().withMessage('ISBN is required'),
  body('publicationYear').isNumeric().withMessage('Publication year must be a number'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('copiesAvailable').isNumeric().withMessage('Copies available must be a number')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, author, isbn, publicationYear, genre, copiesAvailable } = req.body;
    const books = getBooks();

    if (books.find(book => book.isbn === isbn)) {
      return res.status(400).json({ message: 'ISBN already exists' });
    }

    const book = {
      id: uuidv4(),  
      title,
      author,
      isbn,
      publicationYear,
      genre,
      copiesAvailable
    };

    books.push(book);
    saveBooks(books);

    res.status(201).json({ message: 'Book added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', authenticate, (req, res) => {
  const books = getBooks();
  res.json(books);
});

router.put('/:isbn', authenticate, [
  body('title').optional().notEmpty().withMessage('Title is required'),
  body('author').optional().notEmpty().withMessage('Author is required'),
  body('publicationYear').optional().isNumeric().withMessage('Publication year must be a number'),
  body('genre').optional().notEmpty().withMessage('Genre is required'),
  body('copiesAvailable').optional().isNumeric().withMessage('Copies available must be a number')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const books = getBooks();
    const index = books.findIndex(book => book.isbn === req.params.isbn);

    if (index === -1) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const updatedBook = { ...books[index], ...req.body };
    books[index] = updatedBook;
    saveBooks(books);

    res.json({ message: 'Book updated successfully', book: updatedBook });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:isbn', authenticate, (req, res) => {
  const books = getBooks();
  const filteredBooks = books.filter(book => book.isbn !== req.params.isbn);

  if (books.length === filteredBooks.length) {
    return res.status(404).json({ message: 'Book not found' });
  }

  saveBooks(filteredBooks);
  res.json({ message: 'Book deleted successfully' });
});

module.exports = router;

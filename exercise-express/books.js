// create app 
const express = require("express");
const Book = require("./models/book");
const router = express.Router();

// Get all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Error fetching books" });
  }
});

// Add a new book
router.post("/", async (req, res) => {
  const book = new Book(req.body);
  try {
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: "Error adding book" });
  }
});

module.exports = router;
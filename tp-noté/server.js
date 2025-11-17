
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Book = require('./book.model.js');


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors()); 
app.use(express.json()); 

app.use(express.static(path.join(__dirname, 'public'))); 


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("MongoDB connection error:", err));




app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.post('/api/books', async (req, res) => {
  const book = new Book(req.body);
  try {
    const newBook = await book.save();
    res.status(201).json(newBook); 
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { pagesRead, finished, status } = req.body;

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { pagesRead, finished, status },
      { new: true }
    );
    
    if (!updatedBook) {
      return res.status(440).json({ message: "Book not found" });
    }
    res.json(updatedBook);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.findByIdAndDelete(id);

    if (!deletedBook) {
      return res.status(440).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
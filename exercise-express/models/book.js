// create schema and model for Book
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publishedDate: { type: Date, required: true },
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
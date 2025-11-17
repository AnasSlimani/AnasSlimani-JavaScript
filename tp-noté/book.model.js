const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  numberOfPages: { type: Number, required: true, min: 1 },
  pagesRead: { type: Number, default: 0 },
  finished: { type: Boolean, default: false },
  status: {
    type: String,
    required: true,
    enum: [
      'Read',
      'Re-read',
      'DNF',
      'Currently reading',
      'Returned Unread',
      'Want to read'
    ],
    default: 'Want to read'
  },
  format: {
    type: String,
    required: true,
    enum: ['Print', 'PDF', 'Ebook', 'AudioBook'],
    default: 'Print'
  },
  price: { type: Number, default: 0 },
  suggestedBy: { type: String, default: '' }
}, {
  timestamps: true,
  
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Book', bookSchema);
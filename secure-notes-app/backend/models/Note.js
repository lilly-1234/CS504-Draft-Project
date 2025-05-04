const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);

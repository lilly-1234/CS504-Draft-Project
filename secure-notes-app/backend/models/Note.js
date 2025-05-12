// Import the Mongoose library to define the schema and interact with MongoDB
const mongoose = require('mongoose');

// Define a new schema for the Note model
const NoteSchema = new mongoose.Schema({

  // 'user' field: stores the username of the user who created the note
  // It's a reference to the 'User' model and is required
  user: { type: String, ref: 'User', required: true },
  
  // 'title' field: the title of the note, must be a string and is required
  title: { type: String, required: true },

  // 'content' field: the main text/body of the note, must be a string and is required
  content: { type: String, required: true },

  // 'tags' field: an optional array of strings to categorize the note
  tags: [String],
}, { timestamps: true }); // Enable automatic 'createdAt' and 'updatedA'` timestamps for each note

// Export the Note model
// This creates a 'Note' collection in MongoDB based on the schema
module.exports = mongoose.model('Note', NoteSchema);

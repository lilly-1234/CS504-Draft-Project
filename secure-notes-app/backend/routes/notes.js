const express = require('express');
const Note = require('../models/Note');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'securenotes123';

// Middleware to check token
const authenticate = (req, res, next) => {
  
  // Get token from Authorization header (format: "Bearer <token>")
  const token = req.headers.authorization?.split(' ')[1];
  
  // If no token provided, return 401 Unauthorized
  if (!token) return res.sendStatus(401);

  // Verify token using JWT secret
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user; // Save decoded user info in request
    next(); // Continue to route handler
  });
};

// Create Note
router.post('/', authenticate, async (req, res) => {
  const { title, content, tags } = req.body;
  
  // Create a new note tied to the authenticated user's ID from JWT payload
  const note = new Note({ user: req.user.userId, title, content, tags });
  await note.save(); // Save the note to the database
  res.json(note); // Return the saved note
});

// Get All Notes for Logged-In User
router.get('/', authenticate, async (req, res) => {

  // Find all notes created by the logged-in user
  const notes = await Note.find({ user: req.user.userId });
  res.json(notes);
});

// Update Note
router.put('/:id', authenticate, async (req, res) => {
  // Find note by ID and user, then update it with request body
  const updated = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.userId },
    req.body,
    { new: true }
  );

  // If not found, return 404
  if (!updated) return res.status(404).json({ message: 'Note not found' });
  res.json(updated); // Return updated note
});

// Delete Note
router.delete('/:id', authenticate, async (req, res) => {
  
  // Find and delete note by ID and user
  const deleted = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
  
  // If not found, return 404
  if (!deleted) return res.status(404).json({ message: 'Note not found' });
  
  // Return 204 No Content on success
  res.sendStatus(204);
});

// Export the router so it can be used in main app
module.exports = router;

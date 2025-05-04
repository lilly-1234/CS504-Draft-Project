const express = require('express');
const Note = require('../models/Note');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to check token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Create Note
router.post('/', authenticate, async (req, res) => {
  const { title, content, tags } = req.body;
  const note = new Note({ user: req.user.userId, title, content, tags });
  await note.save();
  res.json(note);
});

// Get All Notes
router.get('/', authenticate, async (req, res) => {
  const notes = await Note.find({ user: req.user.userId });
  res.json(notes);
});

// Update Note
router.put('/:id', authenticate, async (req, res) => {
  const updated = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.userId },
    req.body,
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Note not found' });
  res.json(updated);
});

// Delete Note
router.delete('/:id', authenticate, async (req, res) => {
  const deleted = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
  if (!deleted) return res.status(404).json({ message: 'Note not found' });
  res.sendStatus(204);
});

module.exports = router;

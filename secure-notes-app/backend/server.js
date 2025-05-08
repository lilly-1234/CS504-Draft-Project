require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');
const Note = require('./models/Note');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'securenotes123';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/secure-notes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check
app.get('/', (req, res) => {
  console.log('GET / - Health check OK');
  res.send('API is running with MongoDB!');
});

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.warn('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Invalid token');
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

// Signup
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Signup attempt: ${username}`);

  if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    console.warn(`User ${username} already exists`);
    return res.status(400).json({ message: 'User already exists' });
  }

  const secret = speakeasy.generateSecret({ name: `SecureNotes (${username})` });
  const user = new User({ username, password, secret: secret.base32 });
  await user.save();
  console.log(`User ${username} registered`);

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) {
      console.error('QR generation failed:', err);
      return res.status(500).json({ message: 'QR generation failed' });
    }
    res.json({ qrCode: data_url, secret: secret.base32 });
  });
});

// Verify MFA
app.post('/api/verify-mfa-setup', async (req, res) => {
  const { username, token } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const verified = speakeasy.totp.verify({
    secret: user.secret,
    encoding: 'base32',
    token,
  });

  console.log(`MFA verification for ${username}: ${verified}`);
  res.json({ verified });
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login step 1: ${username}`);

  const user = await User.findOne({ username });
  console.log(user);
  if (!user || user.password !== password) {
    console.warn('Invalid login credentials');
    return res.status(401).json({ success: false });
  }

  res.json({ success: true });
});

// Verify MFA and issue JWT
app.post('/api/verify-mfa-login', async (req, res) => {
  const { username, token } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const verified = speakeasy.totp.verify({
    secret: user.secret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    console.warn('Invalid MFA token');
    return res.status(401).json({ verified: false });
  }

  const jwtToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  console.log(jwtToken)
  console.log(`MFA verified and JWT issued for ${username}`);
  res.json({ verified: true, token: jwtToken });
});

// Create Note
app.post('/api/notes', authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const note = new Note({ title, content, tags, user: req.user.username });
  await note.save();
  console.log(`Note created by ${req.user.username}`);
  res.json(note);
});

// Get Notes
app.get('/api/notes', authenticateToken, async (req, res) => {
  const notes = await Note.find({ user: req.user.username });
  console.log(`📄 Notes fetched for ${req.user.username}`);
  res.json(notes);
});

// Update Note
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.username },
    req.body,
    { new: true }
  );
  if (!note) {
    console.warn(`Note not found: ${req.params.id}`);
    return res.status(404).json({ message: 'Note not found' });
  }
  console.log(`Note updated: ${req.params.id}`);
  res.json(note);
});

// Delete Note
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  const result = await Note.deleteOne({ _id: req.params.id, user: req.user.username });
  if (result.deletedCount === 0) {
    console.warn(`Delete failed: Note ${req.params.id} not found`);
    return res.status(404).json({ message: 'Note not found' });
  }
  console.log(`Note deleted: ${req.params.id}`);
  res.sendStatus(204);
});

//  Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));


app.get('/env-check', (req, res) => {
  res.json({
    JWT_SECRET: process.env.JWT_SECRET,
    MONGODB_URI: process.env.MONGODB_URI ? 'Loaded' : 'Not Found'
  });
});

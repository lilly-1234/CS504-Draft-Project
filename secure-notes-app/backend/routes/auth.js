const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Signup
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const secret = speakeasy.generateSecret({ name: `SecureNotes (${username})` });
  const user = new User({ username, password, totpSecret: secret.base32 });
  await user.save();

  qrcode.toDataURL(secret.otpauth_url, (err, qrCode) => {
    if (err) return res.status(500).json({ message: 'QR code generation failed' });
    res.json({ qrCode });
  });
});

// MFA Setup Verification
router.post('/verify-mfa-setup', async (req, res) => {
  const { username, token } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token
  });

  res.json({ verified });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || user.password !== password) return res.status(401).json({ success: false });

  res.json({ success: true });
});

// Verify MFA & Issue Token
router.post('/verify-mfa-login', async (req, res) => {
  const { username, token } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token
  });

  if (!verified) return res.status(401).json({ verified: false });

  const jwtToken = jwt.sign({ username, userId: user._id }, JWT_SECRET, { expiresIn: '5m' });
  console.log(jwtToken);
  res.json({ verified: true, token: jwtToken });
});

module.exports = router;

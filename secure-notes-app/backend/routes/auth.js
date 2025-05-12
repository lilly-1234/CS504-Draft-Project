// Import dependencies
const express = require('express');
const speakeasy = require('speakeasy'); // For TOTP-based MFA
const qrcode = require('qrcode'); // To generate QR codes for Google Authenticator MFA
const jwt = require('jsonwebtoken'); // To create/verify JWT tokens
const User = require('../models/User'); // Mongoose User model
const router = express.Router();

// Fallback JWT secret in case it's missing in environment
const JWT_SECRET = process.env.JWT_SECRET || 'securenotes123';

// Signup Route
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  // Check if username already exists
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'User already exists' });
  
  // Generate a TOTP MFA secret for the user
  const secret = speakeasy.generateSecret({ name: `SecureNotes (${username})` });
  
  // Create and save the new user with MFA secret
  const user = new User({ username, password, secret: secret.base32 });
  await user.save();
  
  // Generate QR code that can be scanned by MFA apps - Google Authenticator
  qrcode.toDataURL(secret.otpauth_url, (err, qrCode) => {
    if (err) return res.status(500).json({ message: 'QR code generation failed' });
    
    // Send QR code image data to frontend to display
    res.json({ qrCode });
  });
});

// VERIFY MFA SETUP Route (before login)
router.post('/verify-mfa-setup', async (req, res) => {
  const { username, token } = req.body;

  // Find user by username
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });
  
  // Verify TOTP token provided by user using their stored MFA secret
  const verified = speakeasy.totp.verify({
    secret: user.secret,
    encoding: 'base32',
    token
  });
  
  // Return whether the token is valid
  res.json({ verified });
});

// Login Route (password check only, no MFA)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find user and check if password matches
  const user = await User.findOne({ username });
  if (!user || user.password !== password) return res.status(401).json({ success: false });
  
  // Login succeeds, but token is issued only after MFA
  res.json({ success: true });
});

// Verify MFA LOGIN Route (after password success)
router.post('/verify-mfa-login', async (req, res) => {
  const { username, token } = req.body;

  // Find user
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });
  
  // Verify TOTP token using speakeasy
  const verified = speakeasy.totp.verify({
    secret: user.secret,
    encoding: 'base32',
    token
  });

  // If MFA fails, return 401
  if (!verified) 
    return res.status(401).json({ verified: false });

  // If MFA is successful, generate JWT
  const jwtToken = jwt.sign({ username, userId: user._id }, JWT_SECRET, { expiresIn: '1h' }); // Payload, Secret, Token expiry
  console.log(jwtToken);
  
  // Return JWT for authenticated access
  res.json({ verified: true, token: jwtToken });
});

// Export the route handlers
module.exports = router;

// Route to re-built the qr code
router.get('/resend-qr/:username', async (req, res) => {
  const { username } = req.params;

  // Find the user in DB
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Reconstruct the otpauth URL using stored secret
  const otpauthUrl = `otpauth://totp/ (${username})?secret=${user.secret}&issuer=SecureNotes`;

  // Convert URL to QR code image
  qrcode.toDataURL(otpauthUrl, (err, qrCode) => {
    if (err) return res.status(500).json({ message: 'Failed to generate QR code' });
    res.json({ qrCode });
  });
});

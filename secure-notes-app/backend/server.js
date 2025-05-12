// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');


// Import routes
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');

// Initialize Express app
const app = express(); // This must come before app.use

// Middleware
app.use(bodyParser.json()); // Parses incoming JSON requests
app.use(cors()); // Enables CORS for requests from different domains

// Mounting route handlers
app.use('/api', authRoutes);       // Auth routes prefixed with /api
app.use('/api/notes', noteRoutes); // Notes CRUD routes prefixed with /api/notes

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/secure-notes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(' MongoDB connection error:', err));

// Basic route to confirm backend is running
app.get('/', (req, res) => {
  console.log('Backend is running');
  res.send('API is running with MongoDB!');
});

// Debugging route to verify .env variables are loaded
app.get('/env-check', (req, res) => {
  res.json({
    JWT_SECRET: process.env.JWT_SECRET ? 'Loaded' : 'Missing',
    MONGO_URI: process.env.MONGO_URI ? 'Loaded' : 'Missing'
  });
});

//Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

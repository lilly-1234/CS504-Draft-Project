// Import the Mongoose library to define the schema and interact with MongoDB
const mongoose = require('mongoose');

// Define a new Mongoose schema for the User collection
const UserSchema = new mongoose.Schema({
  
  // 'username' and 'password' field: must be a unique string and is required
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // 'secret' field: Used for TOTP/MFA secret keys, required
  secret: { type: String, required: true }
});

// Export the compiled model so it can be used in other files
// This creates a 'User' collection in MongoDB based on the schema
module.exports = mongoose.model('User', UserSchema);

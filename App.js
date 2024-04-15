// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Database connection
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

// User model
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
}));

// Diary entry model
const DiaryEntry = mongoose.model('DiaryEntry', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  location: { type: String, required: true },
  photos: [String],
}));

// Routes
// User registration
app.post('/api/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      // Generate JWT token
      const token = jwt.sign({ username }, process.env.JWT_SECRET);
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Diary entry creation
app.post('/api/diary', async (req, res) => {
  try {
    const diaryEntry = await DiaryEntry.create(req.body);
    res.status(201).json(diaryEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all diary entries
app.get('/api/diary', async (req, res) => {
  try {
    const diaryEntries = await DiaryEntry.find();
    res.json(diaryEntries);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get diary entry by ID
app.get('/api/diary/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const diaryEntry = await DiaryEntry.findById(id);
    if (!diaryEntry) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    res.json(diaryEntry);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update diary entry
app.put('/api/diary/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedDiaryEntry = await DiaryEntry.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedDiaryEntry) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    res.json(updatedDiaryEntry);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete diary entry
app.delete('/api/diary/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedDiaryEntry = await DiaryEntry.findByIdAndDelete(id);
    if (!deletedDiaryEntry) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    res.json({ message: 'Diary entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware for authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

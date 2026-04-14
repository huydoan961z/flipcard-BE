require('dotenv').config();

const express = require('express');
const cors = require('cors');

const uploadRouter = require('./routes/upload');
const reviewRouter = require('./routes/review');
const vocabRouter = require('./routes/vocab');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://flipcard-fe-xi.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/review', reviewRouter);
app.use('/api/vocab', vocabRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Anki JLPT Server running on http://localhost:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import authRoutes from './routes/auth.js';
import gmailRoutes from './routes/gmail.js';
import summarizeRoutes from './routes/summarize.js';
import audioRoutes from './routes/audio.js';
import analysisRoutes from './routes/analysis.js';
import emailRoutes from './routes/email.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-mail-reader';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Middleware
// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [FRONTEND_URL, ...(process.env.ALLOWED_ORIGINS?.split(',') || [])].filter(Boolean)
  : [FRONTEND_URL];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // In production, allow the configured frontend URL
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production' && FRONTEND_URL) {
      // Allow if origin matches the base domain (for subdomains)
      const frontendDomain = new URL(FRONTEND_URL).origin;
      if (origin.startsWith(frontendDomain)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create audio directory if it doesn't exist
const audioDir = join(__dirname, 'audio');
fs.ensureDirSync(audioDir);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/email', emailRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve audio files
app.use('/audio', express.static(audioDir));

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(frontendBuildPath));

  // Serve React app for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve React app for API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/audio')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(frontendBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode: Serving React app from build directory');
  }
});


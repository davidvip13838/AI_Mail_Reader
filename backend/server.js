import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import gmailRoutes from './routes/gmail.js';
import summarizeRoutes from './routes/summarize.js';
import audioRoutes from './routes/audio.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create audio directory if it doesn't exist
const audioDir = join(__dirname, 'audio');
fs.ensureDirSync(audioDir);

// Routes
app.use('/api/gmail', gmailRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/audio', audioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve audio files
app.use('/audio', express.static(audioDir));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


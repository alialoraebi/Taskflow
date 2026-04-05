import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');
dotenv.config({ path: envPath });

import { connectDatabase } from './src/config/database.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import { fetchHolidays, fetchHolidaysForMonth } from './src/utils/holidayApi.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  optionsSuccessStatus: 204,
}));

app.options(/.*/, cors());

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

app.get('/api/holidays', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const holidays = await fetchHolidays({
      country: req.query.country,
      year: req.query.year,
      month: req.query.month,
      day: req.query.day,
    });

    return res.json({ holidays });
  } catch (error) {
    console.error('Holiday API error:', error.message);
    return res.status(502).json({ message: error.message });
  }
});

app.get('/api/holidays/month', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const holidaysByDay = await fetchHolidaysForMonth({
      country: req.query.country,
      year: req.query.year,
      month: req.query.month,
    });

    return res.json({ holidaysByDay });
  } catch (error) {
    console.error('Holiday API month error:', error.message);
    return res.status(502).json({ message: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const port = process.env.PORT || 8080;

const startServer = async () => {
  console.log('Starting server...');

  try {
    await connectDatabase();
  } catch (error) {
    console.warn(`Database connection skipped for now: ${error.message}`);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${port}`);
    console.log(`API available at http://0.0.0.0:${port}/api`);
    console.log(`Health check at http://0.0.0.0:${port}/health`);
  });
};

startServer();

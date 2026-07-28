import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import publicRoutes from './routes/publicRoutes';
import contentRoutes from './routes/contentRoutes';
import chatbotRoutes from './routes/chatbotRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Phase 12 Deployment Lockdown (DONE): CORS restricted to production Vercel
// origin + local dev origin. credentials: true required for httpOnly cookie auth.
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
];

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, mobile apps)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'NPC Backend API',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api', publicRoutes);
app.use('/api', contentRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[NPC Backend] Server running on port ${PORT}`);
  });
}

export default app;

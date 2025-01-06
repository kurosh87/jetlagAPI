import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initializeFirebase } from './config/firebase';
import { errorHandler } from './middleware/errorHandler';
import { jetlagCalculationLimiter } from './middleware/rateLimiter';
import jetlagRoutes from './routes/jetlagRoutes';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/jetlag', jetlagCalculationLimiter, jetlagRoutes);

// Error handling
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import jetlagRoutes from './routes/jetlagRoutes';
import userRoutes from './routes/userRoutes';
import chronotypeRoutes from './routes/chronotypeRoutes';

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Routes
app.use('/api/jetlag', jetlagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chronotype', chronotypeRoutes);

// Error handling
app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app; 
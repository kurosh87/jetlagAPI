import rateLimit from 'express-rate-limit';
import { ApiError } from '../types/api';

export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100 // limit each IP to 100 requests per windowMs
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const error: ApiError = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        details: {
          retryAfter: res.getHeader('Retry-After'),
          limit: max,
          windowMs
        }
      };
      res.status(429).json(error);
    }
  });
};

// Create specific rate limiters for different endpoints
export const jetlagCalculationLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50 // 50 requests per 15 minutes
);

export const userActionLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  100 // 100 requests per hour
);

export const flightSearchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20 // 20 requests per minute
); 
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/api';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  const apiError: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? {
      stack: error.stack,
      name: error.name
    } : undefined
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    apiError.code = 'VALIDATION_ERROR';
    apiError.message = error.message;
  } else if (error.name === 'AuthenticationError') {
    apiError.code = 'AUTHENTICATION_ERROR';
    apiError.message = 'Authentication failed';
  } else if (error.name === 'NotFoundError') {
    apiError.code = 'NOT_FOUND';
    apiError.message = error.message || 'Resource not found';
  }

  const statusCode = getStatusCodeForError(apiError.code);
  res.status(statusCode).json(apiError);
};

const getStatusCodeForError = (code: string): number => {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'AUTHENTICATION_ERROR':
      return 401;
    case 'NOT_FOUND':
      return 404;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    default:
      return 500;
  }
}; 
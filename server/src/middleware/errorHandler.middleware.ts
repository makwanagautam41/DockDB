/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger.util';
import { sendError, sendMongoError } from '../utils/response.util';
import { appConfig } from '../config/app.config';

/**
 * Error handler middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logError('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(error);
  }

  // Handle MongoDB errors
  if (
    error.name === 'MongoServerError' ||
    error.name === 'MongoError' ||
    error.name === 'MongoNetworkError'
  ) {
    return sendMongoError(res, error);
  }

  // Handle Joi validation errors
  if (error.name === 'ValidationError' && error.isJoi) {
    const details = error.details?.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 400, details);
  }

  // Handle JSON parse errors
  if (error instanceof SyntaxError && 'body' in error) {
    return sendError(res, 'Invalid JSON in request body', 'INVALID_JSON', 400);
  }

  // Handle CORS errors
  if (error.message === 'Not allowed by CORS') {
    return sendError(res, 'CORS policy violation', 'CORS_ERROR', 403);
  }

  // Handle custom application errors
  if (error.statusCode) {
    return sendError(
      res,
      error.message || 'An error occurred',
      error.code || 'APPLICATION_ERROR',
      error.statusCode,
      appConfig.isDevelopment ? error.details : undefined
    );
  }

  // Handle unknown errors
  const message = appConfig.isDevelopment
    ? error.message
    : 'An unexpected error occurred';

  const details = appConfig.isDevelopment
    ? { stack: error.stack, ...error }
    : undefined;

  return sendError(res, message, 'INTERNAL_ERROR', 500, details);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  sendError(
    res,
    `Route ${req.method} ${req.path} not found`,
    'NOT_FOUND',
    404
  );
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

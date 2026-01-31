/**
 * Response Utility
 * Standardized API response formatting
 */

import { Response } from 'express';
import { ApiResponse, ApiError } from '../types/api.types';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500,
  details?: any
): Response => {
  const response: ApiError = {
    success: false,
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  message: string,
  details?: any
): Response => {
  return sendError(res, message, 'VALIDATION_ERROR', 400, details);
};

/**
 * Send not found error response
 */
export const sendNotFound = (
  res: Response,
  resource: string = 'Resource'
): Response => {
  return sendError(res, `${resource} not found`, 'NOT_FOUND', 404);
};

/**
 * Send unauthorized error response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return sendError(res, message, 'UNAUTHORIZED', 401);
};

/**
 * Send forbidden error response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return sendError(res, message, 'FORBIDDEN', 403);
};

/**
 * Send rate limit error response
 */
export const sendRateLimitError = (res: Response): Response => {
  return sendError(
    res,
    'Too many requests, please try again later',
    'RATE_LIMIT_EXCEEDED',
    429
  );
};

/**
 * Send MongoDB error response
 */
export const sendMongoError = (
  res: Response,
  error: any,
  operation: string = 'operation'
): Response => {
  let message = `MongoDB ${operation} failed`;
  let code = 'MONGODB_ERROR';
  let statusCode = 500;

  // Handle specific MongoDB errors
  if (error.code === 11000) {
    message = 'Duplicate key error';
    code = 'DUPLICATE_KEY';
    statusCode = 409;
  } else if (error.name === 'MongoServerError') {
    message = error.message;
  } else if (error.name === 'MongoNetworkError') {
    message = 'Database connection failed';
    code = 'CONNECTION_ERROR';
    statusCode = 503;
  }

  return sendError(res, message, code, statusCode, error);
};

/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting request rates
 */

import rateLimit from 'express-rate-limit';
import { appConfig } from '../config/app.config';
import { sendRateLimitError } from '../utils/response.util';

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: appConfig.rateLimitWindow,
  max: appConfig.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendRateLimitError(res);
  },
});

/**
 * Connection test rate limiter (stricter)
 */
export const connectionTestLimiter = rateLimit({
  windowMs: appConfig.rateLimitWindow,
  max: appConfig.rateLimitConnectionTest,
  message: 'Too many connection test requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendRateLimitError(res);
  },
  skipSuccessfulRequests: false,
});

/**
 * Query execution rate limiter
 */
export const queryExecutionLimiter = rateLimit({
  windowMs: appConfig.rateLimitWindow,
  max: appConfig.rateLimitQueryExec,
  message: 'Too many query execution requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendRateLimitError(res);
  },
});

/**
 * Document CRUD rate limiter
 */
export const documentCRUDLimiter = rateLimit({
  windowMs: appConfig.rateLimitWindow,
  max: appConfig.rateLimitDocumentCRUD,
  message: 'Too many document operation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendRateLimitError(res);
  },
});

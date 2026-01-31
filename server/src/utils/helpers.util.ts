/**
 * Helper Utilities
 * Common helper functions used throughout the application
 */

import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { logError } from './logger.util';

/**
 * Check if a string is a valid ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

/**
 * Convert string to ObjectId
 */
export const toObjectId = (id: string): ObjectId => {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new ObjectId(id);
};

/**
 * Safely parse JSON string
 */
export const safeJsonParse = (jsonString: string, defaultValue: any = {}): any => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError('JSON parse error', error);
    return defaultValue;
  }
};

/**
 * Read JSON file
 */
export const readJsonFile = async <T>(filePath: string, defaultValue: T): Promise<T> => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with default value
      await writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }
    logError(`Error reading JSON file: ${filePath}`, error);
    return defaultValue;
  }
};

/**
 * Write JSON file
 */
export const writeJsonFile = async (filePath: string, data: any): Promise<void> => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    logError(`Error writing JSON file: ${filePath}`, error);
    throw error;
  }
};

/**
 * Sanitize database/collection name
 */
export const sanitizeName = (name: string): string => {
  // Remove any characters that are not alphanumeric, underscore, or hyphen
  return name.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Validate pagination parameters
 */
export const validatePaginationParams = (
  page: any,
  limit: any
): { page: number; limit: number } => {
  const parsedPage = parseInt(page) || 1;
  const parsedLimit = parseInt(limit) || 20;

  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit)),
  };
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Retry async function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

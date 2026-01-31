/**
 * Validation Service
 * Handles input validation and sanitization for security
 */

import { logWarn } from '../utils/logger.util';

class ValidationService {
  private readonly DANGEROUS_OPERATORS = [
    '$where',
    '$function',
    'mapReduce',
    '$accumulator',
    'eval',
  ];

  private readonly MAX_QUERY_DEPTH = 5;
  private readonly MAX_DOCUMENT_SIZE = 16 * 1024 * 1024; // 16MB

  /**
   * Validate MongoDB connection string format
   */
  validateConnectionString(connectionString: string): {
    valid: boolean;
    error?: string;
  } {
    // Check if empty
    if (!connectionString || connectionString.trim().length === 0) {
      return { valid: false, error: 'Connection string cannot be empty' };
    }

    // Check if starts with mongodb:// or mongodb+srv://
    if (
      !connectionString.startsWith('mongodb://') &&
      !connectionString.startsWith('mongodb+srv://')
    ) {
      return {
        valid: false,
        error: 'Connection string must start with mongodb:// or mongodb+srv://',
      };
    }

    // Check for potential code injection
    const dangerousPatterns = [
      /javascript:/i,
      /<script/i,
      /eval\(/i,
      /function\(/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(connectionString)) {
        logWarn('Potential code injection attempt detected in connection string');
        return {
          valid: false,
          error: 'Connection string contains invalid characters',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Sanitize database or collection name
   */
  sanitizeName(name: string): string {
    // Only allow alphanumeric characters, underscores, and hyphens
    return name.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  /**
   * Validate database or collection name
   */
  validateName(name: string, type: 'database' | 'collection'): {
    valid: boolean;
    error?: string;
  } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: `${type} name cannot be empty` };
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return {
        valid: false,
        error: `${type} name can only contain alphanumeric characters, underscores, and hyphens`,
      };
    }

    // Check length
    if (name.length > 64) {
      return {
        valid: false,
        error: `${type} name cannot exceed 64 characters`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate query object for dangerous operators
   */
  validateQuery(query: any): { valid: boolean; error?: string } {
    if (!query || typeof query !== 'object') {
      return { valid: true }; // Empty or non-object queries are safe
    }

    // Check for dangerous operators
    const hasDangerousOp = this.containsDangerousOperators(query);
    if (hasDangerousOp) {
      logWarn('Dangerous operator detected in query', { query });
      return {
        valid: false,
        error: 'Query contains dangerous operators that are not allowed',
      };
    }

    // Check query depth
    const depth = this.getObjectDepth(query);
    if (depth > this.MAX_QUERY_DEPTH) {
      return {
        valid: false,
        error: `Query depth exceeds maximum allowed depth of ${this.MAX_QUERY_DEPTH}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate document size
   */
  validateDocumentSize(document: any): { valid: boolean; error?: string } {
    const size = Buffer.byteLength(JSON.stringify(document));
    
    if (size > this.MAX_DOCUMENT_SIZE) {
      return {
        valid: false,
        error: `Document size (${size} bytes) exceeds maximum allowed size of 16MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(page: any, limit: any): {
    valid: boolean;
    error?: string;
    page?: number;
    limit?: number;
  } {
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    if (isNaN(parsedPage) || parsedPage < 1) {
      return { valid: false, error: 'Page must be a positive integer' };
    }

    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return { valid: false, error: 'Limit must be a positive integer' };
    }

    if (parsedLimit > 100) {
      return { valid: false, error: 'Limit cannot exceed 100' };
    }

    return { valid: true, page: parsedPage, limit: parsedLimit };
  }

  /**
   * Check if object contains dangerous operators
   */
  private containsDangerousOperators(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    for (const key in obj) {
      // Check if key is a dangerous operator
      if (this.DANGEROUS_OPERATORS.includes(key)) {
        return true;
      }

      // Check if value is a string containing dangerous patterns
      if (typeof obj[key] === 'string') {
        for (const op of this.DANGEROUS_OPERATORS) {
          if (obj[key].includes(op)) {
            return true;
          }
        }
      }

      // Recursively check nested objects
      if (typeof obj[key] === 'object') {
        if (this.containsDangerousOperators(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the depth of a nested object
   */
  private getObjectDepth(obj: any, currentDepth: number = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;

    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const depth = this.getObjectDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }

  /**
   * Sanitize query object by removing dangerous operators
   */
  sanitizeQuery(query: any): any {
    if (typeof query !== 'object' || query === null) {
      return query;
    }

    const sanitized: any = Array.isArray(query) ? [] : {};

    for (const key in query) {
      // Skip dangerous operators
      if (this.DANGEROUS_OPERATORS.includes(key)) {
        logWarn(`Removed dangerous operator: ${key}`);
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof query[key] === 'object' && query[key] !== null) {
        sanitized[key] = this.sanitizeQuery(query[key]);
      } else {
        sanitized[key] = query[key];
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export default new ValidationService();

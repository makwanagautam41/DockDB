/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendValidationError } from '../utils/response.util';
import validationService from '../services/validation.service';

/**
 * Validate request body against Joi schema
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return sendValidationError(res, 'Validation failed', details);
    }

    req.body = value;
    next();
  };
};

/**
 * Validate query parameters against Joi schema
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return sendValidationError(res, 'Validation failed', details);
    }

    req.query = value;
    next();
  };
};

/**
 * Validate URL parameters against Joi schema
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return sendValidationError(res, 'Validation failed', details);
    }

    req.params = value;
    next();
  };
};

// Common Joi Schemas

export const connectionStringSchema = Joi.object({
  connectionString: Joi.string().required().custom((value, helpers) => {
    const validation = validationService.validateConnectionString(value);
    if (!validation.valid) {
      return helpers.error('any.invalid', { message: validation.error });
    }
    return value;
  }),
});

export const saveConnectionSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  connectionString: Joi.string().required().custom((value, helpers) => {
    const validation = validationService.validateConnectionString(value);
    if (!validation.valid) {
      return helpers.error('any.invalid', { message: validation.error });
    }
    return value;
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
});

export const updateConnectionSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  connectionString: Joi.string().custom((value, helpers) => {
    const validation = validationService.validateConnectionString(value);
    if (!validation.valid) {
      return helpers.error('any.invalid', { message: validation.error });
    }
    return value;
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
}).min(1);

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  filter: Joi.string().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);
      const validation = validationService.validateQuery(parsed);
      if (!validation.valid) {
        return helpers.error('any.invalid', { message: validation.error });
      }
      return value;
    } catch (error) {
      return helpers.error('any.invalid', { message: 'Invalid JSON in filter' });
    }
  }),
  sort: Joi.string().custom((value, helpers) => {
    try {
      JSON.parse(value);
      return value;
    } catch (error) {
      return helpers.error('any.invalid', { message: 'Invalid JSON in sort' });
    }
  }),
  projection: Joi.string().custom((value, helpers) => {
    try {
      JSON.parse(value);
      return value;
    } catch (error) {
      return helpers.error('any.invalid', { message: 'Invalid JSON in projection' });
    }
  }),
});

export const documentCreateSchema = Joi.object({
  document: Joi.object().required().custom((value, helpers) => {
    const validation = validationService.validateDocumentSize(value);
    if (!validation.valid) {
      return helpers.error('any.invalid', { message: validation.error });
    }
    return value;
  }),
});

export const documentUpdateSchema = Joi.object({
  document: Joi.object(),
  update: Joi.object(),
}).or('document', 'update');

export const documentPatchSchema = Joi.object({
  update: Joi.object().required(),
});

export const executeQuerySchema = Joi.object({
  operation: Joi.string()
    .valid('find', 'aggregate', 'updateMany', 'deleteMany', 'count')
    .required(),
  query: Joi.alternatives()
    .try(Joi.object(), Joi.array())
    .required()
    .custom((value, helpers) => {
      const validation = validationService.validateQuery(value);
      if (!validation.valid) {
        return helpers.error('any.invalid', { message: validation.error });
      }
      return value;
    }),
  options: Joi.object(),
});

export const aggregateSchema = Joi.object({
  pipeline: Joi.array()
    .items(Joi.object())
    .required()
    .custom((value, helpers) => {
      for (const stage of value) {
        const validation = validationService.validateQuery(stage);
        if (!validation.valid) {
          return helpers.error('any.invalid', { message: validation.error });
        }
      }
      return value;
    }),
  options: Joi.object({
    allowDiskUse: Joi.boolean(),
    maxTimeMS: Joi.number().integer().min(0),
  }),
});

export const createCollectionSchema = Joi.object({
  options: Joi.object({
    capped: Joi.boolean(),
    size: Joi.number().integer().min(1),
    max: Joi.number().integer().min(1),
  }),
});

export const saveQuerySchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500),
  connectionId: Joi.string().required(),
  databaseName: Joi.string().required(),
  collectionName: Joi.string().required(),
  operation: Joi.string()
    .valid('find', 'aggregate', 'updateMany', 'deleteMany', 'count')
    .required(),
  query: Joi.alternatives().try(Joi.object(), Joi.array()).required(),
});

/**
 * Document Routes
 * Routes for document-level CRUD operations
 */

import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  createDocument,
  replaceDocument,
  updateDocument,
  deleteDocument,
  bulkCreateDocuments,
  bulkDeleteDocuments,
} from '../controllers/document.controller';
import {
  validateBody,
  validateQuery,
  documentCreateSchema,
  documentUpdateSchema,
  documentPatchSchema,
  paginationSchema,
} from '../middleware/validation.middleware';
import { documentCRUDLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// List documents with pagination
router.get(
  '/:connectionId/:databaseName/:collectionName',
  validateQuery(paginationSchema),
  listDocuments
);

// Get single document
router.get('/:connectionId/:databaseName/:collectionName/:documentId', getDocument);

// Create new document
router.post(
  '/:connectionId/:databaseName/:collectionName',
  documentCRUDLimiter,
  validateBody(documentCreateSchema),
  createDocument
);

// Replace document (full update)
router.put(
  '/:connectionId/:databaseName/:collectionName/:documentId',
  documentCRUDLimiter,
  validateBody(documentUpdateSchema),
  replaceDocument
);

// Partial update document
router.patch(
  '/:connectionId/:databaseName/:collectionName/:documentId',
  documentCRUDLimiter,
  validateBody(documentPatchSchema),
  updateDocument
);

// Delete document
router.delete(
  '/:connectionId/:databaseName/:collectionName/:documentId',
  documentCRUDLimiter,
  deleteDocument
);

// Bulk create documents
router.post(
  '/:connectionId/:databaseName/:collectionName/bulk',
  documentCRUDLimiter,
  bulkCreateDocuments
);

// Bulk delete documents
router.delete(
  '/:connectionId/:databaseName/:collectionName/bulk',
  documentCRUDLimiter,
  bulkDeleteDocuments
);

export default router;

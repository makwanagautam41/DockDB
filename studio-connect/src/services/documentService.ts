/**
 * Document API Service
 * Handles document CRUD operations
 */

import api from './api';

export interface Document {
  _id: string;
  [key: string]: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  filter?: string;
  sort?: string;
  projection?: string;
}

export interface PaginatedDocuments {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const documentService = {
  /**
   * List documents with pagination
   */
  async listDocuments(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    params?: PaginationParams
  ): Promise<PaginatedDocuments> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.filter) queryParams.append('filter', params.filter);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.projection) queryParams.append('projection', params.projection);

    const response = await api.get(
      `/documents/${connectionId}/${databaseName}/${collectionName}?${queryParams.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get a single document by ID
   */
  async getDocument(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    documentId: string
  ): Promise<Document> {
    const response = await api.get(`/documents/${connectionId}/${databaseName}/${collectionName}/${documentId}`);
    return response.data.data.document;
  },

  /**
   * Create a new document
   */
  async createDocument(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    document: Omit<Document, '_id'>
  ): Promise<{ insertedId: string; document: Document }> {
    const response = await api.post(`/documents/${connectionId}/${databaseName}/${collectionName}`, { document });
    return response.data.data;
  },

  /**
   * Replace a document (full update)
   */
  async replaceDocument(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    documentId: string,
    document: Omit<Document, '_id'>
  ): Promise<Document> {
    const response = await api.put(`/documents/${connectionId}/${databaseName}/${collectionName}/${documentId}`, {
      document,
    });
    return response.data.data.document;
  },

  /**
   * Update a document (partial update)
   */
  async updateDocument(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    documentId: string,
    update: any
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    const response = await api.patch(`/documents/${connectionId}/${databaseName}/${collectionName}/${documentId}`, {
      update,
    });
    return response.data.data;
  },

  /**
   * Delete a document
   */
  async deleteDocument(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    documentId: string
  ): Promise<void> {
    await api.delete(`/documents/${connectionId}/${databaseName}/${collectionName}/${documentId}`);
  },

  /**
   * Bulk create documents
   */
  async bulkCreateDocuments(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    documents: Omit<Document, '_id'>[]
  ): Promise<{ insertedCount: number; insertedIds: string[] }> {
    const response = await api.post(`/documents/${connectionId}/${databaseName}/${collectionName}/bulk`, {
      documents,
    });
    return response.data.data;
  },

  /**
   * Bulk delete documents
   */
  async bulkDeleteDocuments(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    filter: any
  ): Promise<{ deletedCount: number }> {
    const response = await api.delete(`/documents/${connectionId}/${databaseName}/${collectionName}/bulk`, {
      data: { filter },
    });
    return response.data.data;
  },
};

/**
 * Collection API Service
 * Handles collection-level operations
 */

import api from './api';

export interface Collection {
  name: string;
  type: string;
  options?: any;
  databaseName?: string; // Added for frontend use
  documentCount?: number; // Added for frontend use
  indexes?: Index[]; // Added for frontend use
}

export interface CollectionStats {
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  indexes: number;
  totalIndexSize: number;
  nindexes: number;
}

export interface Index {
  name: string;
  key: Record<string, number>;
  unique?: boolean;
  sparse?: boolean;
}

export const collectionService = {
  /**
   * List all collections in a database
   */
  async listCollections(connectionId: string, databaseName: string): Promise<Collection[]> {
    const response = await api.get(`/collections/${connectionId}/${databaseName}/list`);
    return response.data.data.collections || [];
  },

  /**
   * Get collection statistics
   */
  async getCollectionStats(
    connectionId: string,
    databaseName: string,
    collectionName: string
  ): Promise<CollectionStats> {
    const response = await api.get(`/collections/${connectionId}/${databaseName}/${collectionName}/stats`);
    return response.data.data;
  },

  /**
   * Get collection indexes
   */
  async getCollectionIndexes(
    connectionId: string,
    databaseName: string,
    collectionName: string
  ): Promise<Index[]> {
    const response = await api.get(`/collections/${connectionId}/${databaseName}/${collectionName}/indexes`);
    return response.data.data.indexes || [];
  },

  /**
   * Create a new collection
   */
  async createCollection(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    options?: any
  ): Promise<void> {
    await api.post(`/collections/${connectionId}/${databaseName}/${collectionName}/create`, { options });
  },

  /**
   * Drop a collection
   */
  async dropCollection(
    connectionId: string,
    databaseName: string,
    collectionName: string
  ): Promise<void> {
    await api.delete(`/collections/${connectionId}/${databaseName}/${collectionName}`, {
      data: { confirm: true },
    });
  },

  /**
   * Rename a collection
   */
  async renameCollection(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    newName: string
  ): Promise<void> {
    await api.put(`/collections/${connectionId}/${databaseName}/${collectionName}/rename`, { newName });
  },

  /**
   * Create an index
   */
  async createIndex(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    keys: Record<string, number>,
    options?: any
  ): Promise<string> {
    const response = await api.post(`/collections/${connectionId}/${databaseName}/${collectionName}/indexes`, {
      keys,
      options,
    });
    return response.data.data.indexName;
  },

  /**
   * Drop an index
   */
  async dropIndex(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    indexName: string
  ): Promise<void> {
    await api.delete(`/collections/${connectionId}/${databaseName}/${collectionName}/indexes/${indexName}`);
  },

  /**
   * Detect collection schema by analyzing existing documents
   */
  async detectSchema(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    sampleSize: number = 10
  ): Promise<{ fields: SchemaField[]; sampleSize: number }> {
    const response = await api.get(
      `/collections/${connectionId}/${databaseName}/${collectionName}/schema`,
      { params: { sampleSize } }
    );
    return response.data.data;
  },
};

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  example: any;
}

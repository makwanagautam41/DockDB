/**
 * Query API Service
 * Handles custom query execution and aggregation
 */

import api from './api';

export type QueryOperation = 'find' | 'aggregate' | 'updateMany' | 'deleteMany' | 'count';

export interface QueryExecuteRequest {
  operation: QueryOperation;
  query: any;
  options?: any;
}

export interface AggregateRequest {
  pipeline: any[];
  options?: {
    allowDiskUse?: boolean;
    maxTimeMS?: number;
  };
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  connectionId: string;
  databaseName: string;
  collectionName: string;
  operation: QueryOperation;
  query: any;
  createdAt: string;
  updatedAt?: string;
}

export interface QueryHistoryEntry {
  id: string;
  connectionId: string;
  databaseName: string;
  collectionName: string;
  operation: QueryOperation;
  query: any;
  executionTime: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

export const queryService = {
  /**
   * Execute a custom query
   */
  async executeQuery(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    request: QueryExecuteRequest
  ): Promise<{ result: any; executionTime: number; operation: string }> {
    const response = await api.post(`/query/${connectionId}/${databaseName}/${collectionName}/execute`, request);
    return response.data.data;
  },

  /**
   * Execute an aggregation pipeline
   */
  async executeAggregation(
    connectionId: string,
    databaseName: string,
    collectionName: string,
    request: AggregateRequest
  ): Promise<{ result: any[]; executionTime: number }> {
    const response = await api.post(`/query/${connectionId}/${databaseName}/${collectionName}/aggregate`, request);
    return response.data.data;
  },

  /**
   * Save a query for later use
   */
  async saveQuery(query: {
    name: string;
    description?: string;
    connectionId: string;
    databaseName: string;
    collectionName: string;
    operation: QueryOperation;
    query: any;
  }): Promise<SavedQuery> {
    const response = await api.post('/query/save', query);
    return response.data.data.query;
  },

  /**
   * Get all saved queries
   */
  async getSavedQueries(): Promise<SavedQuery[]> {
    const response = await api.get('/query/saved');
    return response.data.data.queries || [];
  },

  /**
   * Get a saved query by ID
   */
  async getSavedQuery(queryId: string): Promise<SavedQuery> {
    const response = await api.get(`/query/saved/${queryId}`);
    return response.data.data.query;
  },

  /**
   * Update a saved query
   */
  async updateSavedQuery(queryId: string, updates: Partial<SavedQuery>): Promise<SavedQuery> {
    const response = await api.put(`/query/saved/${queryId}`, updates);
    return response.data.data.query;
  },

  /**
   * Delete a saved query
   */
  async deleteSavedQuery(queryId: string): Promise<void> {
    await api.delete(`/query/saved/${queryId}`);
  },

  /**
   * Execute a saved query
   */
  async executeSavedQuery(queryId: string): Promise<{
    result: any;
    executionTime: number;
    operation: string;
    queryName: string;
  }> {
    const response = await api.post(`/query/saved/${queryId}/execute`);
    return response.data.data;
  },

  /**
   * Get query execution history
   */
  async getQueryHistory(limit?: number, connectionId?: string): Promise<QueryHistoryEntry[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (connectionId) params.append('connectionId', connectionId);

    const response = await api.get(`/query/history?${params.toString()}`);
    return response.data.data.history || [];
  },

  /**
   * Clear query history
   */
  async clearQueryHistory(): Promise<void> {
    await api.delete('/query/history');
  },
};

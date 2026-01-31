/**
 * Query Types
 * Defines all types related to query operations
 */

export type QueryOperation = 'find' | 'aggregate' | 'updateMany' | 'deleteMany' | 'count';

export interface ExecuteQueryRequest {
  operation: QueryOperation;
  query: Record<string, any>;
  options?: Record<string, any>;
}

export interface ExecuteQueryResponse {
  success: boolean;
  result: any;
  executionTime: number;
  operation: string;
}

export interface AggregateRequest {
  pipeline: Record<string, any>[];
  options?: {
    allowDiskUse?: boolean;
    maxTimeMS?: number;
  };
}

export interface AggregateResponse {
  success: boolean;
  result: any[];
  executionTime: number;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  connectionId: string;
  databaseName: string;
  collectionName: string;
  operation: QueryOperation;
  query: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface QueryHistoryEntry {
  id: string;
  connectionId: string;
  databaseName: string;
  collectionName: string;
  operation: QueryOperation;
  query: Record<string, any>;
  executionTime: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface SaveQueryRequest {
  name: string;
  description?: string;
  connectionId: string;
  databaseName: string;
  collectionName: string;
  operation: QueryOperation;
  query: Record<string, any>;
}

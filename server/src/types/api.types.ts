/**
 * API Types
 * Defines standard API response structures and common types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  filter?: Record<string, any>;
  sort?: Record<string, any>;
  projection?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  documents: T[];
  pagination: PaginationMeta;
}

export interface DocumentCreateRequest {
  document: Record<string, any>;
}

export interface DocumentUpdateRequest {
  document?: Record<string, any>;
  update?: Record<string, any>;
}

export interface DocumentPatchRequest {
  update: Record<string, any>;
}

export interface ExportRequest {
  format: 'json' | 'csv';
  filter?: Record<string, any>;
}

export interface ImportRequest {
  format: 'json' | 'csv';
  batchSize?: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  activeConnections?: number;
}

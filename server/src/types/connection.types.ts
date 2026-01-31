/**
 * Connection Types
 * Defines all types related to MongoDB connections
 */

export interface ConnectionString {
  raw: string;
  encrypted?: string;
}

export interface SavedConnection {
  id: string;
  name: string;
  connectionString: string; // Encrypted
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionInfo {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestConnectionRequest {
  connectionString: string;
}

export interface TestConnectionResponse {
  success: boolean;
  databases?: string[];
  message?: string;
  serverInfo?: {
    version: string;
    host: string;
  };
}

export interface SaveConnectionRequest {
  name: string;
  connectionString: string;
  color?: string;
}

export interface SaveConnectionResponse {
  success: boolean;
  connectionId: string;
  connection: ConnectionInfo;
}

export interface UpdateConnectionRequest {
  name?: string;
  connectionString?: string;
  color?: string;
}

export interface DatabaseInfo {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export interface DatabaseStats {
  collections: number;
  views: number;
  objects: number;
  avgObjSize: number;
  dataSize: number;
  indexes: number;
  indexSize: number;
}

export interface CollectionInfo {
  name: string;
  type: string;
  options: Record<string, any>;
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

export interface IndexInfo {
  name: string;
  key: Record<string, any>;
  unique?: boolean;
  sparse?: boolean;
  [key: string]: any;
}

export interface CreateCollectionRequest {
  options?: {
    capped?: boolean;
    size?: number;
    max?: number;
  };
}

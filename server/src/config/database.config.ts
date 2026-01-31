/**
 * Database Configuration
 * MongoDB-specific configuration and constants
 */

export const databaseConfig = {
  // MongoDB Limits
  maxDocumentSize: 16 * 1024 * 1024, // 16MB
  maxQueryDepth: 5,
  maxResultLimit: 1000,

  // Pagination Defaults
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,

  // Query Timeouts
  queryTimeout: parseInt(process.env.MAX_QUERY_TIMEOUT || '60000'),
  
  // Dangerous Operators (not allowed in queries)
  dangerousOperators: [
    '$where',
    '$function',
    'mapReduce',
    '$accumulator',
    'eval',
  ],

  // System Databases (read-only)
  systemDatabases: ['admin', 'local', 'config'],

  // System Collections (read-only)
  systemCollections: ['system.'],
};

export const getMongoClientOptions = () => ({
  maxPoolSize: parseInt(process.env.CONNECTION_POOL_SIZE || '10'),
  minPoolSize: 2,
  serverSelectionTimeoutMS: parseInt(process.env.MAX_CONNECTION_TIMEOUT || '30000'),
  socketTimeoutMS: 60000,
  connectTimeoutMS: parseInt(process.env.MAX_CONNECTION_TIMEOUT || '30000'),
  retryWrites: true,
  retryReads: true,
});

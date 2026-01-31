// MongoDB Mock Data - Realistic fake data for the database management interface

export interface Workspace {
  id: string;
  name: string;
  password: string; // hashed password for workspace access
  color: string;
  createdAt: string;
  lastAccessedAt?: string;
  connections: WorkspaceConnection[];
}

export interface WorkspaceConnection {
  id: string;
  name: string; // database name
  uri: string; // connection string (1 connection = 1 database)
  workspaceId: string;
  status: 'connected' | 'disconnected' | 'loading';
  lastConnected?: string;
  sizeOnDisk: number;
  collections: Collection[]; // collections directly on connection (not nested databases)
}

// Legacy type aliases for backwards compatibility
export type Connection = WorkspaceConnection;
export type Database = WorkspaceConnection; // Database is now the same as Connection

export interface Collection {
  id: string;
  name: string;
  databaseId: string;
  documentCount: number;
  avgDocumentSize: number;
  indexes: Index[];
}

export interface Index {
  name: string;
  keys: Record<string, number>;
  unique: boolean;
}

export interface Document {
  _id: string;
  [key: string]: any;
}

// Helper functions
const generateId = () => Math.random().toString(36).substring(2, 15);

const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Simple hash function for passwords (for demo purposes - use bcrypt in production)
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

// User document generator
const generateUser = (index: number): Document => ({
  _id: `user_${generateId()}`,
  name: randomElement(['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis', 'Emma Johnson', 'Michael Chen', 'Sarah Williams', 'David Lee', 'Lisa Anderson']),
  email: `user${index}@${randomElement(['gmail.com', 'outlook.com', 'company.io', 'example.org'])}`,
  age: Math.floor(Math.random() * 50) + 18,
  createdAt: randomDate(new Date(2020, 0, 1), new Date()).toISOString(),
  role: randomElement(['admin', 'user', 'moderator', 'viewer']),
  preferences: {
    theme: randomElement(['dark', 'light', 'system']),
    notifications: Math.random() > 0.3,
    language: randomElement(['en', 'es', 'fr', 'de', 'ja']),
  },
  isActive: Math.random() > 0.2,
  lastLogin: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
});

// Product document generator
const generateProduct = (index: number): Document => ({
  _id: `prod_${generateId()}`,
  title: `${randomElement(['Premium', 'Basic', 'Pro', 'Elite', 'Standard'])} ${randomElement(['Widget', 'Gadget', 'Tool', 'Device', 'Kit'])} ${randomElement(['X1', 'Pro', 'Max', 'Plus', 'Lite'])}`,
  price: Math.round((Math.random() * 500 + 9.99) * 100) / 100,
  category: randomElement(['Electronics', 'Home & Garden', 'Sports', 'Clothing', 'Books', 'Toys']),
  stock: Math.floor(Math.random() * 1000),
  tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => 
    randomElement(['bestseller', 'new', 'sale', 'limited', 'popular', 'trending', 'eco-friendly'])
  ),
  ratings: {
    average: Math.round((Math.random() * 2 + 3) * 10) / 10,
    count: Math.floor(Math.random() * 5000),
  },
  sku: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  createdAt: randomDate(new Date(2022, 0, 1), new Date()).toISOString(),
});

// Order document generator
const generateOrder = (index: number): Document => {
  const itemCount = Math.floor(Math.random() * 5) + 1;
  const items = Array.from({ length: itemCount }, () => ({
    productId: `prod_${generateId()}`,
    name: `Product ${Math.floor(Math.random() * 100)}`,
    quantity: Math.floor(Math.random() * 5) + 1,
    price: Math.round((Math.random() * 200 + 10) * 100) / 100,
  }));
  
  return {
    _id: `order_${generateId()}`,
    userId: `user_${generateId()}`,
    items,
    total: Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100,
    status: randomElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    shippingAddress: {
      street: `${Math.floor(Math.random() * 9999) + 1} ${randomElement(['Main', 'Oak', 'Maple', 'Cedar', 'Pine'])} ${randomElement(['St', 'Ave', 'Blvd', 'Rd'])}`,
      city: randomElement(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
      state: randomElement(['NY', 'CA', 'IL', 'TX', 'AZ']),
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
    },
    createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    updatedAt: randomDate(new Date(2024, 6, 1), new Date()).toISOString(),
  };
};

// Analytics document generator
const generateAnalytics = (index: number): Document => ({
  _id: `event_${generateId()}`,
  event: randomElement(['page_view', 'click', 'purchase', 'signup', 'login', 'search', 'add_to_cart', 'checkout']),
  userId: Math.random() > 0.3 ? `user_${generateId()}` : null,
  sessionId: `session_${generateId()}`,
  timestamp: randomDate(new Date(2024, 10, 1), new Date()).toISOString(),
  metadata: {
    page: randomElement(['/', '/products', '/cart', '/checkout', '/profile', '/settings']),
    referrer: randomElement(['google', 'facebook', 'direct', 'email', 'twitter', null]),
    device: randomElement(['desktop', 'mobile', 'tablet']),
    browser: randomElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
    country: randomElement(['US', 'UK', 'DE', 'FR', 'JP', 'AU', 'CA']),
  },
  duration: Math.floor(Math.random() * 300000),
});

// Logs document generator
const generateLog = (index: number): Document => ({
  _id: `log_${generateId()}`,
  level: randomElement(['info', 'warn', 'error', 'debug']),
  message: randomElement([
    'User authentication successful',
    'Database query executed',
    'Cache miss - fetching from source',
    'API rate limit warning',
    'Connection pool exhausted',
    'Request timeout exceeded',
    'File upload completed',
    'Background job started',
  ]),
  service: randomElement(['api-gateway', 'auth-service', 'user-service', 'order-service', 'payment-service']),
  timestamp: randomDate(new Date(2024, 11, 1), new Date()).toISOString(),
  traceId: `trace_${generateId()}`,
  metadata: {
    requestId: `req_${generateId()}`,
    latency: Math.floor(Math.random() * 2000),
    statusCode: randomElement([200, 201, 400, 401, 403, 404, 500]),
  },
});

// Sessions collection generator
const generateSession = (index: number): Document => ({
  _id: `sess_${generateId()}`,
  userId: `user_${generateId()}`,
  token: `tok_${generateId()}${generateId()}`,
  userAgent: randomElement([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  ]),
  ipAddress: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
  createdAt: randomDate(new Date(2024, 11, 1), new Date()).toISOString(),
  expiresAt: randomDate(new Date(), new Date(2025, 1, 1)).toISOString(),
  isValid: Math.random() > 0.1,
});

// Categories collection generator
const generateCategory = (index: number): Document => ({
  _id: `cat_${generateId()}`,
  name: randomElement(['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Beauty', 'Automotive']),
  slug: `category-${index}`,
  description: 'Category description goes here',
  parentId: Math.random() > 0.7 ? `cat_${generateId()}` : null,
  imageUrl: `https://picsum.photos/seed/${index}/200/200`,
  isActive: Math.random() > 0.1,
  sortOrder: index,
  createdAt: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
});

// Reviews collection generator
const generateReview = (index: number): Document => ({
  _id: `review_${generateId()}`,
  productId: `prod_${generateId()}`,
  userId: `user_${generateId()}`,
  rating: Math.floor(Math.random() * 5) + 1,
  title: randomElement(['Great product!', 'Not what I expected', 'Highly recommend', 'Average quality', 'Best purchase ever']),
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
  helpful: Math.floor(Math.random() * 100),
  verified: Math.random() > 0.3,
  createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
});

// Collection configurations
type DocumentGenerator = (index: number) => Document;

interface CollectionConfig {
  name: string;
  generator: DocumentGenerator;
  count: number;
  indexes: Index[];
}

const collectionConfigs: Record<string, CollectionConfig[]> = {
  users_db: [
    { 
      name: 'users', 
      generator: generateUser, 
      count: 87,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'email_1', keys: { email: 1 }, unique: true },
        { name: 'role_1', keys: { role: 1 }, unique: false },
      ]
    },
    { 
      name: 'sessions', 
      generator: generateSession, 
      count: 156,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'userId_1', keys: { userId: 1 }, unique: false },
        { name: 'token_1', keys: { token: 1 }, unique: true },
      ]
    },
    { 
      name: 'preferences', 
      generator: generateUser, 
      count: 45,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
  ],
  products_db: [
    { 
      name: 'products', 
      generator: generateProduct, 
      count: 234,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'category_1', keys: { category: 1 }, unique: false },
        { name: 'price_1', keys: { price: 1 }, unique: false },
        { name: 'sku_1', keys: { sku: 1 }, unique: true },
      ]
    },
    { 
      name: 'categories', 
      generator: generateCategory, 
      count: 24,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'slug_1', keys: { slug: 1 }, unique: true },
      ]
    },
    { 
      name: 'reviews', 
      generator: generateReview, 
      count: 567,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'productId_1', keys: { productId: 1 }, unique: false },
      ]
    },
    { 
      name: 'inventory', 
      generator: generateProduct, 
      count: 189,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
  ],
  orders_db: [
    { 
      name: 'orders', 
      generator: generateOrder, 
      count: 423,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'userId_1', keys: { userId: 1 }, unique: false },
        { name: 'status_1', keys: { status: 1 }, unique: false },
        { name: 'createdAt_-1', keys: { createdAt: -1 }, unique: false },
      ]
    },
    { 
      name: 'order_items', 
      generator: generateOrder, 
      count: 1256,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'orderId_1', keys: { orderId: 1 }, unique: false },
      ]
    },
    { 
      name: 'shipments', 
      generator: generateOrder, 
      count: 387,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
  ],
  analytics_db: [
    { 
      name: 'events', 
      generator: generateAnalytics, 
      count: 5678,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'event_1_timestamp_-1', keys: { event: 1, timestamp: -1 }, unique: false },
        { name: 'userId_1', keys: { userId: 1 }, unique: false },
      ]
    },
    { 
      name: 'pageviews', 
      generator: generateAnalytics, 
      count: 12453,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'timestamp_-1', keys: { timestamp: -1 }, unique: false },
      ]
    },
    { 
      name: 'conversions', 
      generator: generateAnalytics, 
      count: 234,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
    { 
      name: 'sessions_analytics', 
      generator: generateAnalytics, 
      count: 3456,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
  ],
  logs_db: [
    { 
      name: 'application_logs', 
      generator: generateLog, 
      count: 15678,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'level_1_timestamp_-1', keys: { level: 1, timestamp: -1 }, unique: false },
        { name: 'service_1', keys: { service: 1 }, unique: false },
      ]
    },
    { 
      name: 'error_logs', 
      generator: generateLog, 
      count: 456,
      indexes: [
        { name: '_id_', keys: { _id: 1 }, unique: true },
        { name: 'timestamp_-1', keys: { timestamp: -1 }, unique: false },
      ]
    },
    { 
      name: 'access_logs', 
      generator: generateLog, 
      count: 8765,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
    { 
      name: 'audit_logs', 
      generator: generateLog, 
      count: 2345,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
    { 
      name: 'performance_logs', 
      generator: generateLog, 
      count: 5678,
      indexes: [{ name: '_id_', keys: { _id: 1 }, unique: true }]
    },
  ],
};

// Generate initial workspaces (empty by default - users create their own)
export const initialWorkspaces: Workspace[] = [];

// Generate collections for a connection (1 connection = 1 database)
export const generateCollectionsForConnection = (connectionId: string): Collection[] => {
  // Pick a random database config to generate collections from
  const dbNames = ['users_db', 'products_db', 'orders_db', 'analytics_db', 'logs_db'];
  const randomDb = dbNames[Math.floor(Math.random() * dbNames.length)];
  const configs = collectionConfigs[randomDb] || [];
  
  return configs.map((config) => ({
    id: `${connectionId}_${config.name}`,
    name: config.name,
    databaseId: connectionId, // databaseId is now connectionId
    documentCount: config.count,
    avgDocumentSize: Math.floor(Math.random() * 2000) + 200,
    indexes: config.indexes,
  }));
};

// Generate sample workspace connections for demo
export const generateSampleConnections = (workspaceId: string): WorkspaceConnection[] => {
  const prodConnId = `${workspaceId}_conn_prod`;
  const stagingConnId = `${workspaceId}_conn_staging`;
  const localConnId = `${workspaceId}_conn_local`;
  
  return [
    {
      id: prodConnId,
      name: 'Production DB',
      uri: 'mongodb+srv://admin:****@prod-cluster.mongodb.net/production',
      workspaceId,
      status: 'connected',
      lastConnected: new Date().toISOString(),
      sizeOnDisk: Math.floor(Math.random() * 500000000) + 10000000,
      collections: generateCollectionsForConnection(prodConnId),
    },
    {
      id: stagingConnId,
      name: 'Staging DB',
      uri: 'mongodb+srv://admin:****@staging-cluster.mongodb.net/staging',
      workspaceId,
      status: 'disconnected',
      lastConnected: new Date(Date.now() - 86400000).toISOString(),
      sizeOnDisk: Math.floor(Math.random() * 200000000) + 5000000,
      collections: generateCollectionsForConnection(stagingConnId),
    },
    {
      id: localConnId,
      name: 'Local Dev',
      uri: 'mongodb://localhost:27017/localdev',
      workspaceId,
      status: 'disconnected',
      lastConnected: new Date(Date.now() - 3600000).toISOString(),
      sizeOnDisk: Math.floor(Math.random() * 100000000) + 1000000,
      collections: generateCollectionsForConnection(localConnId),
    },
  ];
};

// Legacy: For backwards compatibility (deprecated, use workspaces instead)
export const initialConnections: WorkspaceConnection[] = [];

// Legacy: Generate databases for a connection (deprecated - connection now IS the database)
// Kept for backwards compatibility but now returns the connection as a single database
export const generateDatabases = (connectionId: string): Database[] => {
  // In the new model, 1 connection = 1 database, so this returns empty
  // Collections are now directly on the connection
  return [];
};

// Document cache for performance
const documentCache: Map<string, Document[]> = new Map();

// Generate documents for a collection
export const generateDocuments = (collectionId: string): Document[] => {
  if (documentCache.has(collectionId)) {
    return documentCache.get(collectionId)!;
  }

  // Extract db name and collection name from ID
  const parts = collectionId.split('_');
  const dbName = parts.slice(1, -1).join('_');
  const collectionName = parts[parts.length - 1];
  
  const configs = collectionConfigs[dbName] || [];
  const config = configs.find((c) => c.name === collectionName);
  
  if (!config) {
    // Default fallback
    const docs = Array.from({ length: 50 }, (_, i) => generateUser(i));
    documentCache.set(collectionId, docs);
    return docs;
  }
  
  const docs = Array.from({ length: config.count }, (_, i) => config.generator(i));
  documentCache.set(collectionId, docs);
  return docs;
};

// Clear document cache (for testing)
export const clearDocumentCache = () => {
  documentCache.clear();
};

// Example queries for the query editor
export const exampleQueries = [
  {
    name: 'Find all active users',
    query: `db.users.find({ isActive: true })`,
  },
  {
    name: 'Find products by category',
    query: `db.products.find({ category: "Electronics" })`,
  },
  {
    name: 'Aggregate orders by status',
    query: `db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])`,
  },
  {
    name: 'Find recent events',
    query: `db.events.find({
  timestamp: { $gte: new Date(Date.now() - 86400000) }
}).sort({ timestamp: -1 }).limit(100)`,
  },
  {
    name: 'Search logs by level',
    query: `db.application_logs.find({
  level: "error",
  service: "api-gateway"
}).sort({ timestamp: -1 })`,
  },
];

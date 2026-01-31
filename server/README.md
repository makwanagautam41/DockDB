# MongoDB Database Management Backend

A production-ready backend API for managing MongoDB databases, collections, and documents with advanced features like connection pooling, query execution, and comprehensive security measures.

## 🚀 Features

- **Connection Management**: Test, save, and manage multiple MongoDB connections with encryption
- **Database Operations**: List databases, get statistics, create/drop databases
- **Collection Management**: CRUD operations on collections, index management
- **Document Operations**: Full CRUD with pagination, filtering, sorting, and projection
- **Query Execution**: Execute custom queries and aggregation pipelines
- **Query History**: Track and save frequently used queries
- **Security**: Input validation, rate limiting, encryption, CORS protection
- **Logging**: Comprehensive Winston-based logging system
- **Error Handling**: Centralized error handling with detailed error messages
- **Connection Pooling**: Efficient connection reuse with automatic cleanup
- **TypeScript**: Full type safety and IntelliSense support

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn
- MongoDB instance (local or remote)

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Generate encryption key**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```
   Copy the output and paste it as `ENCRYPTION_KEY` in `.env`

5. **Update `.env` file**:
   ```env
   PORT=5000
   NODE_ENV=development
   ENCRYPTION_KEY=your-32-character-key-here
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## 📡 API Endpoints

### Health Check

#### GET /health
Check server status
```bash
curl http://localhost:5000/health
```

#### GET /health/db
Check database connections
```bash
curl http://localhost:5000/health/db
```

---

### Connection Management

#### POST /api/connections/test
Test MongoDB connection
```bash
curl -X POST http://localhost:5000/api/connections/test \
  -H "Content-Type: application/json" \
  -d '{"connectionString": "mongodb://localhost:27017"}'
```

#### POST /api/connections/save
Save a new connection
```bash
curl -X POST http://localhost:5000/api/connections/save \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local MongoDB",
    "connectionString": "mongodb://localhost:27017",
    "color": "#3b82f6"
  }'
```

#### GET /api/connections/list
List all saved connections
```bash
curl http://localhost:5000/api/connections/list
```

#### GET /api/connections/:connectionId
Get specific connection
```bash
curl http://localhost:5000/api/connections/{connectionId}
```

#### PUT /api/connections/:connectionId
Update connection
```bash
curl -X PUT http://localhost:5000/api/connections/{connectionId} \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "color": "#ff5733"}'
```

#### DELETE /api/connections/:connectionId
Delete connection
```bash
curl -X DELETE http://localhost:5000/api/connections/{connectionId}
```

---

### Database Operations

#### GET /api/databases/:connectionId/list
List all databases
```bash
curl http://localhost:5000/api/databases/{connectionId}/list
```

#### GET /api/databases/:connectionId/:databaseName/stats
Get database statistics
```bash
curl http://localhost:5000/api/databases/{connectionId}/myDatabase/stats
```

#### DELETE /api/databases/:connectionId/:databaseName
Drop database (requires confirmation)
```bash
curl -X DELETE http://localhost:5000/api/databases/{connectionId}/myDatabase \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

---

### Collection Operations

#### GET /api/collections/:connectionId/:databaseName/list
List all collections
```bash
curl http://localhost:5000/api/collections/{connectionId}/myDatabase/list
```

#### GET /api/collections/:connectionId/:databaseName/:collectionName/stats
Get collection statistics
```bash
curl http://localhost:5000/api/collections/{connectionId}/myDatabase/users/stats
```

#### GET /api/collections/:connectionId/:databaseName/:collectionName/indexes
List collection indexes
```bash
curl http://localhost:5000/api/collections/{connectionId}/myDatabase/users/indexes
```

#### POST /api/collections/:connectionId/:databaseName/:collectionName/create
Create new collection
```bash
curl -X POST http://localhost:5000/api/collections/{connectionId}/myDatabase/newCollection/create \
  -H "Content-Type: application/json" \
  -d '{"options": {"capped": false}}'
```

#### DELETE /api/collections/:connectionId/:databaseName/:collectionName
Drop collection (requires confirmation)
```bash
curl -X DELETE http://localhost:5000/api/collections/{connectionId}/myDatabase/users \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

---

### Document Operations

#### GET /api/documents/:connectionId/:databaseName/:collectionName
List documents with pagination
```bash
# Basic listing
curl "http://localhost:5000/api/documents/{connectionId}/myDatabase/users?page=1&limit=20"

# With filter
curl "http://localhost:5000/api/documents/{connectionId}/myDatabase/users?filter={\"status\":\"active\"}"

# With sort
curl "http://localhost:5000/api/documents/{connectionId}/myDatabase/users?sort={\"createdAt\":-1}"

# With projection
curl "http://localhost:5000/api/documents/{connectionId}/myDatabase/users?projection={\"name\":1,\"email\":1}"
```

#### GET /api/documents/:connectionId/:databaseName/:collectionName/:documentId
Get single document
```bash
curl http://localhost:5000/api/documents/{connectionId}/myDatabase/users/{documentId}
```

#### POST /api/documents/:connectionId/:databaseName/:collectionName
Create new document
```bash
curl -X POST http://localhost:5000/api/documents/{connectionId}/myDatabase/users \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    }
  }'
```

#### PUT /api/documents/:connectionId/:databaseName/:collectionName/:documentId
Replace document
```bash
curl -X PUT http://localhost:5000/api/documents/{connectionId}/myDatabase/users/{documentId} \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "name": "John Updated",
      "email": "john.updated@example.com",
      "age": 31
    }
  }'
```

#### PATCH /api/documents/:connectionId/:databaseName/:collectionName/:documentId
Partial update
```bash
curl -X PATCH http://localhost:5000/api/documents/{connectionId}/myDatabase/users/{documentId} \
  -H "Content-Type: application/json" \
  -d '{
    "update": {
      "$set": {"age": 32},
      "$unset": {"oldField": ""}
    }
  }'
```

#### DELETE /api/documents/:connectionId/:databaseName/:collectionName/:documentId
Delete document
```bash
curl -X DELETE http://localhost:5000/api/documents/{connectionId}/myDatabase/users/{documentId}
```

---

### Query Operations

#### POST /api/query/:connectionId/:databaseName/:collectionName/execute
Execute custom query
```bash
curl -X POST http://localhost:5000/api/query/{connectionId}/myDatabase/users/execute \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "find",
    "query": {"status": "active"},
    "options": {"limit": 10}
  }'
```

#### POST /api/query/:connectionId/:databaseName/:collectionName/aggregate
Execute aggregation pipeline
```bash
curl -X POST http://localhost:5000/api/query/{connectionId}/myDatabase/users/aggregate \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline": [
      {"$match": {"status": "active"}},
      {"$group": {"_id": "$country", "count": {"$sum": 1}}}
    ],
    "options": {"allowDiskUse": true}
  }'
```

#### POST /api/query/save
Save a query for later use
```bash
curl -X POST http://localhost:5000/api/query/save \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Active Users",
    "description": "Get all active users",
    "connectionId": "{connectionId}",
    "databaseName": "myDatabase",
    "collectionName": "users",
    "operation": "find",
    "query": {"status": "active"}
  }'
```

#### GET /api/query/history
Get query execution history
```bash
curl "http://localhost:5000/api/query/history?limit=50"
```

---

## 🔒 Security Features

### Input Validation
- Connection string format validation
- Query sanitization (prevents NoSQL injection)
- Document size limits (16MB max)
- Query depth limits (5 levels max)

### Rate Limiting
- Connection test: 10 requests/minute
- Query execution: 30 requests/minute
- Document CRUD: 60 requests/minute
- General API: 100 requests/minute

### Encryption
- AES-256-CBC encryption for connection strings
- Random IV for each encryption
- Secure key storage in environment variables

### CORS Protection
- Configurable allowed origins
- Credentials support
- Proper headers and methods

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-31T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "timestamp": "2024-01-31T12:00:00.000Z"
}
```

## 🗂️ Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── logs/                # Log files
├── data/                # JSON data files
├── .env                 # Environment variables
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## 🐛 Troubleshooting

### Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network access to MongoDB server
- Check firewall settings

### Authentication Errors
- Verify MongoDB credentials
- Check user permissions
- Ensure authentication database is correct

### Rate Limit Errors
- Wait for rate limit window to reset
- Adjust rate limits in `.env` if needed

### Memory Issues
- Reduce `CONNECTION_POOL_SIZE`
- Lower `CLIENT_CACHE_TTL`
- Implement pagination for large datasets

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `ENCRYPTION_KEY` | 32-char encryption key | Required |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhost:3000,localhost:5173 |
| `LOG_LEVEL` | Logging level | debug |
| `MAX_QUERY_TIMEOUT` | Query timeout (ms) | 60000 |
| `MAX_CONNECTION_TIMEOUT` | Connection timeout (ms) | 30000 |
| `CONNECTION_POOL_SIZE` | Max connections per client | 10 |
| `CLIENT_CACHE_TTL` | Client cache TTL (ms) | 300000 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

- MongoDB Node.js Driver
- Express.js
- TypeScript
- Winston Logger

---

**Built with ❤️ for MongoDB Database Management**

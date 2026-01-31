# MongoDB Manager Backend - API Testing Guide

## Quick Test Commands

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Test MongoDB Connection (Local)
```bash
curl -X POST http://localhost:5000/api/connections/test \
  -H "Content-Type: application/json" \
  -d "{\"connectionString\": \"mongodb://localhost:27017\"}"
```

### 3. Test MongoDB Connection (MongoDB Atlas - Example)
```bash
curl -X POST http://localhost:5000/api/connections/test \
  -H "Content-Type: application/json" \
  -d "{\"connectionString\": \"mongodb+srv://username:password@cluster.mongodb.net/\"}"
```

### 4. Save a Connection
```bash
curl -X POST http://localhost:5000/api/connections/save \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Local MongoDB\", \"connectionString\": \"mongodb://localhost:27017\", \"color\": \"#3b82f6\"}"
```

### 5. List All Saved Connections
```bash
curl http://localhost:5000/api/connections/list
```

### 6. Get Connection Stats
```bash
curl http://localhost:5000/api/connections/stats
```

## PowerShell Test Commands

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```

### Test Connection
```powershell
$body = @{
    connectionString = "mongodb://localhost:27017"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/connections/test" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Save Connection
```powershell
$body = @{
    name = "Local MongoDB"
    connectionString = "mongodb://localhost:27017"
    color = "#3b82f6"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/connections/save" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### List Connections
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/connections/list" -Method Get
```

## Testing with Frontend

The backend is now ready to be connected with your frontend application. Make sure your frontend is configured to use:

```
API_BASE_URL=http://localhost:5000
```

## Next Steps

1. ✅ Backend is running on port 5000
2. ✅ All endpoints are available
3. ✅ Security measures are in place
4. ⏭️ Connect your frontend to the backend
5. ⏭️ Test all CRUD operations
6. ⏭️ Deploy to production

## Troubleshooting

If you encounter any issues:

1. **Port already in use**: Change PORT in .env file
2. **MongoDB connection fails**: Verify MongoDB is running
3. **CORS errors**: Add your frontend URL to ALLOWED_ORIGINS in .env
4. **Rate limit errors**: Adjust rate limits in .env

## Production Deployment

Before deploying to production:

1. Generate a new ENCRYPTION_KEY
2. Set NODE_ENV=production
3. Update ALLOWED_ORIGINS with your production domain
4. Use environment variables for sensitive data
5. Enable HTTPS
6. Set up proper logging and monitoring

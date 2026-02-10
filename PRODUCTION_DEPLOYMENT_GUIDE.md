# Production Deployment & Troubleshooting Guide

## 502 Bad Gateway Error - Diagnosis & Resolution

A 502 Bad Gateway error typically means the Node.js backend server is unable to process requests. Here are the most common causes and solutions:

### Common Causes & Fixes

#### 1. **Database Connection Issues** (Most Common)
The server cannot connect to PostgreSQL.

**Check:**
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT NOW();"

# Check connection details in .env
cat server/.env
```

**Solution:**
- Ensure PostgreSQL is running and accessible
- Verify `.env` file has correct database credentials
- Use `.env.example` as a template:
  ```bash
  cp server/.env.example server/.env
  # Edit with correct credentials
  nano server/.env
  ```

**Required ENV variables:**
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hyloc_db
```

#### 2. **Server Application Crashes**
The Node.js process crashes instead of handling the request.

**Check logs:**
```bash
# Check recent errors
tail -f /var/log/hyloc-server.log

# Or start server manually to see errors
cd server
npm install
npm start
```

**Common error patterns:**
- `Cannot find module` - Run `npm install` in server directory
- `connect ECONNREFUSED` - Database is not running
- `listen EADDRINUSE` - Port 5000 is already in use

**Solution:**
```bash
cd server
npm install
# Kill any existing node process on port 5000
lsof -i :5000
kill -9 <PID>
# Start fresh
npm start
```

#### 3. **Timeout Issues**
Requests timeout before the server responds.

**Check:**
- Database query is too slow
- Network connectivity issues
- Reverse proxy timeout settings

**Solution in Nginx/Apache:**
```nginx
# For Nginx, increase proxy timeout
proxy_connect_timeout 30s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;
```

#### 4. **Memory or Resource Issues**
Server runs out of memory or hits process limits.

**Check:**
```bash
free -h           # Check available RAM
ps aux | grep node # Check node process memory usage
```

**Solution:**
- Restart the server: `npm start`
- Increase container/VM memory limits
- Check for memory leaks in logs

### Step-by-Step Troubleshooting

1. **Verify Backend Server is Running**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status": "Server is running", "timestamp": "..."}
   ```

2. **Check Server Logs**
   ```bash
   # Look for error messages
   journalctl -u hyloc-server -n 50
   # Or if running with npm start, check console output
   ```

3. **Test Database Connection**
   ```bash
   # From server directory
   node test-db-connection.js
   ```

4. **Verify Environment Variables**
   ```bash
   # Check if .env exists
   ls -la server/.env
   # Check values (be careful with passwords)
   grep -E 'DB_|PORT' server/.env
   ```

5. **Check Network Connectivity**
   ```bash
   # Verify client can reach API
   curl -X POST https://hyloc.git.edu/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"empid":"test","password":"test"}'
   ```

### Monitoring & Health Checks

**Health check endpoint:**
```bash
curl https://hyloc.git.edu/health
```

**Enable detailed logging** (edit server/.env):
```
NODE_ENV=development
```

This will log all requests and errors to the console for debugging.

### Prevention Tips

1. ✅ Always use `.env` file with proper database credentials
2. ✅ Run `npm install` after pulling new code
3. ✅ Test with `npm start` before deploying
4. ✅ Check logs periodically: `npm install && npm start > server.log 2>&1 &`
5. ✅ Use process manager like PM2 to auto-restart on crash:
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name hyloc-server
   pm2 logs hyloc-server
   ```

### Recent Fixes Applied (Feb 2026)

The following improvements were made to handle 502 errors better:

1. **Improved Database Connection Handling**
   - Server no longer crashes on database errors
   - Connection pool retries and error logging added
   - On startup, server tests database connection

2. **Better Error Handling**
   - Global error handler catches all errors
   - Errors are logged with full context (timestamp, method, path, stack trace)
   - Unhandled rejections are caught and logged

3. **Request Timeout Protection**
   - 30-second timeout prevents hanging requests
   - Prevents reverse proxy timeout issues

4. **Enhanced Logging**
   - All requests are logged with timestamp
   - Errors include full error messages, stack traces, request details

### Quick Restart Script

Create `restart-server.sh`:
```bash
#!/bin/bash
cd /path/to/hyloc/server
npm install
pkill -f "node src/index.js"
sleep 2
npm start > server.log 2>&1 &
echo "Server restarted"
```

Run with: `bash restart-server.sh`

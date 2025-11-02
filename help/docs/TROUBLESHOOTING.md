# Troubleshooting Guide

Quick reference for common issues and solutions.

## 🚀 Quick Diagnostic Commands

```bash
# Check all services are running
docker-compose ps

# View recent errors
docker-compose logs --tail=50 -f

# Health check all services
curl http://localhost:6060/actuator/health

# Check Eureka registration
curl http://localhost:8761/eureka/apps | grep "instance"
```

---

## 🔴 Critical Issues

### Issue: "Service Not Found" or 503 Service Unavailable

**Symptoms:**
- Get 503 error from Gateway
- Specific service returns 503

**Root Causes & Solutions:**

1. **Service is down**
   ```bash
   # Check status
   docker-compose ps

   # Restart service
   docker-compose restart auth-service

   # Check logs
   docker-compose logs -f auth-service
   ```

2. **Service not registered with Eureka**
   ```bash
   # Check Eureka dashboard
   curl http://localhost:8761/eureka/apps/auth-service

   # If missing: Service didn't start properly
   # Check service logs for errors during startup
   docker-compose logs auth-service | grep -i "error\|exception\|failed"
   ```

3. **Gateway routing misconfigured**
   ```bash
   # Check gateway config
   curl http://localhost:8888/gateway-service/default | jq '.spring.cloud.gateway.routes'

   # Verify route paths match service names
   # Routes should be: /auth/** -> auth-service, /access/** -> access-management, etc.
   ```

**Solution:**
```bash
# Full restart (nuclear option)
docker-compose down
docker-compose up -d
sleep 30
curl http://localhost:6060/actuator/health
```

---

### Issue: Database Connection Failed

**Symptoms:**
```
Exception: Unable to connect to database
ERROR: datasource - Failed to initialize pool
ERROR: JDBC Connection refused
```

**Root Causes & Solutions:**

1. **Database not running**
   ```bash
   # Check if postgres container is running
   docker-compose ps postgres

   # If not running, start it
   docker-compose up -d postgres

   # Wait for it to be healthy
   sleep 10
   ```

2. **Wrong credentials**
   ```bash
   # Verify connection string
   echo $DB_PASSWORD

   # Test manually
   psql -h localhost -U postgres -d cms_db

   # If fails: Update environment variables
   export DB_PASSWORD=CorrectPassword
   docker-compose down && docker-compose up -d
   ```

3. **Database not initialized**
   ```bash
   # Create databases if they don't exist
   psql -h localhost -U postgres -c "CREATE DATABASE cms_db;"
   psql -h localhost -U postgres -c "CREATE DATABASE das_db;"

   # Services will auto-create tables on startup
   ```

4. **Port conflict**
   ```bash
   # Check if port 5432 is already in use
   netstat -an | grep 5432

   # If yes: Kill the process or change port in docker-compose.yml
   # Change: ports: ["5432:5432"] to ["5433:5432"]
   ```

**Full Recovery:**
```bash
# Nuke everything and restart
docker-compose down -v
docker-compose up -d postgres
sleep 5
docker-compose up -d auth-service
docker-compose logs -f auth-service
```

---

### Issue: JWT Token Validation Failed

**Symptoms:**
```
401 Unauthorized
Invalid JWT token
JWT signature verification failed
```

**Root Causes & Solutions:**

1. **JWT secret mismatch**
   ```bash
   # All services must use SAME JWT secret
   echo "Auth Service JWT: $JWT_SECRET"
   docker-compose exec auth-service echo $JWT_SECRET
   docker-compose exec gateway-service echo $JWT_SECRET

   # If different: Update environment
   export JWT_SECRET="YourSecureKeyAtLeast64Characters"
   docker-compose down && docker-compose up -d
   ```

2. **Token expired**
   ```bash
   # Check token expiration
   curl -X POST http://localhost:6061/auth/validate \
     -H "Authorization: Bearer YOUR_TOKEN"

   # If expired: Get new token
   curl -X POST http://localhost:6061/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password"}'
   ```

3. **Token format wrong**
   ```bash
   # Must use: Authorization: Bearer <token>
   # Not: Authorization: <token>

   curl -H "Authorization: Bearer eyJhbGc..." http://localhost:6060/api/users
   ```

**Solution:**
```bash
# Regenerate JWT secret
openssl rand -base64 64

# Update all services
export JWT_SECRET=$(openssl rand -base64 64)
docker-compose down
docker-compose up -d
```

---

## 🟡 Common Issues

### Issue: Slow Response Times (>5 seconds)

**Symptoms:**
- API responses are slow
- Requests timeout
- Services appear to be hanging

**Diagnostic:**
```bash
# Check service logs for slowness
docker-compose logs auth-service | grep -i "took\|duration\|slow"

# Check resource usage
docker stats

# Check database for slow queries
docker-compose exec postgres psql -U postgres -d cms_db
\c cms_db
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;
```

**Solutions:**

1. **Increase JVM heap size**
   ```bash
   # Edit docker-compose.yml
   # Change JAVA_OPTS: "-Xmx512m" to "-Xmx1024m"
   docker-compose down
   docker-compose up -d
   ```

2. **Increase database connection pool**
   ```yaml
   # application.yml
   spring:
     datasource:
       hikari:
         maximum-pool-size: 30
         minimum-idle: 5
   ```

3. **Enable caching**
   ```yaml
   spring:
     cache:
       type: simple
       cache-names:
         - permissions
         - users
   ```

4. **Optimize database queries**
   ```bash
   # Add indexes
   psql -d cms_db
   CREATE INDEX idx_user_id ON permissions(user_id);
   CREATE INDEX idx_role_id ON user_roles(role_id);
   ```

---

### Issue: Memory Leaks / Growing Memory Usage

**Symptoms:**
- Memory usage increases over time
- OutOfMemoryError eventually occurs
- Restart fixes issue temporarily

**Diagnostic:**
```bash
# Monitor memory usage
docker stats

# Check heap usage
curl http://localhost:6061/actuator/metrics/jvm.memory.used | jq

# Get heap dump
jmap -dump:live,format=b,file=heap.bin PID
```

**Solutions:**

1. **Increase heap size**
   ```bash
   export JAVA_OPTS="-Xmx2048m -Xms1024m"
   docker-compose down && docker-compose up -d
   ```

2. **Add GC tuning**
   ```bash
   export JAVA_OPTS="-Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
   ```

3. **Check for resource leaks in code**
   - Ensure database connections are closed
   - Clear caches periodically
   - Check for circular references

---

### Issue: High CPU Usage

**Symptoms:**
- CPU constantly at 80%+
- Service slow even with available memory
- Fan noise increases

**Diagnostic:**
```bash
# Check CPU usage
docker stats

# Find which process is using CPU
top -p $(docker inspect -f {{.State.Pid}} care-auth-service)

# Check thread count
jps -l
jstack PID | grep -c "runnable"
```

**Solutions:**

1. **Check for infinite loops**
   ```bash
   # Review recent code changes
   git log --oneline -10
   git diff HEAD~1
   ```

2. **Reduce log level**
   ```yaml
   logging:
     level:
       root: WARN
       com.care: INFO
   ```

3. **Disable debug endpoints**
   ```yaml
   management:
     endpoints:
       web:
         exposure:
           include: health,metrics
   ```

---

### Issue: CORS Errors in Frontend

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:6060/auth/login' blocked by CORS policy
No 'Access-Control-Allow-Origin' header
```

**Root Causes & Solutions:**

1. **Frontend and backend on different origins**
   ```bash
   # Frontend: http://localhost:3000
   # Backend: http://localhost:6060

   # They need CORS headers
   # Gateway is configured for: localhost:3000, localhost:5173
   ```

2. **Gateway CORS not configured**
   ```bash
   # Check gateway config
   curl http://localhost:8888/gateway-service/default | jq '.spring.cloud.gateway.globalcors'

   # Should show:
   # "allowedOrigins": ["http://localhost:3000", "http://localhost:5173"]
   ```

3. **Request method not allowed**
   ```bash
   # Check allowed methods
   # Should include: GET,POST,PUT,DELETE,OPTIONS,PATCH

   # If missing PATCH: Add to gateway config
   ```

**Solution:**
```yaml
# application.yml (gateway-service)
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:3000"
              - "http://localhost:5173"
              - "http://localhost:5174"
            allowedMethods: GET,POST,PUT,DELETE,OPTIONS,PATCH
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
```

---

### Issue: WebSocket Connection Fails

**Symptoms:**
```
WebSocket connection failed
ERR_CONNECTION_REFUSED
```

**Solution:**
```bash
# WebSockets need separate port configuration
# Check if service supports WebSockets
grep -r "websocket\|WebSocket" --include="*.java"

# Enable in Spring
spring:
  websocket:
    enabled: true
```

---

## 🟢 Performance Tuning

### Slow Query Optimization

```sql
-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Add indexes
CREATE INDEX idx_user_permissions ON user_permissions(user_id);
CREATE INDEX idx_role_actions ON role_actions(role_id, action_id);

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM users WHERE username = 'john';
```

### Connection Pool Optimization

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-timeout: 30000
      leak-detection-threshold: 60000
```

### Cache Configuration

```yaml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: "maximumSize=1000,expireAfterWrite=10m"
    cache-names:
      - permissions
      - users
      - roles
```

---

## 🛠️ Debugging Commands

### View Service Logs

```bash
# Last 50 lines
docker-compose logs --tail=50 auth-service

# Follow in real-time
docker-compose logs -f auth-service

# Specific service with timestamps
docker-compose logs -f --timestamps auth-service

# Filter by keyword
docker-compose logs auth-service | grep -i "error\|exception"
```

### Execute Commands in Container

```bash
# Open shell
docker-compose exec auth-service /bin/sh

# Run command
docker-compose exec auth-service curl http://localhost:6061/actuator/health

# Check environment
docker-compose exec auth-service env | grep JAVA
```

### Check Service Configuration

```bash
# Get current config
curl http://localhost:8888/auth-service/prod | jq

# Check active profile
curl http://localhost:6061/actuator/env | jq '.propertySources[] | select(.name | contains("systemProperties")) | .properties'
```

### Database Debugging

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d cms_db

# Inside psql:
\dt                                    # List tables
\d users                              # Describe table
SELECT * FROM users LIMIT 5;          # Query
\timing                                # Show query time
```

---

## 🚨 Emergency Procedures

### Complete System Reset

```bash
# WARNING: This deletes all data!
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Restart Specific Service

```bash
# Restart
docker-compose restart auth-service

# Or
docker-compose stop auth-service
docker-compose start auth-service
```

### View Container Logs Before Crash

```bash
# Get logs before container stops
docker-compose logs auth-service > auth-logs.txt

# View crash logs
docker inspect care-auth-service | grep -A 50 "State"
```

### Force Remove Stuck Container

```bash
# Kill container
docker kill care-auth-service

# Remove
docker rm care-auth-service

# Restart
docker-compose up -d auth-service
```

---

## 📞 Getting Help

If issue persists:

1. **Check logs in detail**
   ```bash
   docker-compose logs -f --timestamps
   ```

2. **Check system resources**
   ```bash
   docker stats
   ```

3. **Check external dependencies**
   - Database connectivity
   - Network connectivity
   - Service registry availability

4. **Review recent changes**
   ```bash
   git log --oneline -20
   git diff HEAD~1
   ```

5. **Check documentation**
   - [SERVICE_RUNBOOK.md](./SERVICE_RUNBOOK.md)
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - [ARCHITECTURE.md](./ARCHITECTURE.md)

6. **Enable debug logging**
   ```yaml
   logging:
     level:
       root: DEBUG
       com.care: TRACE
   ```

7. **Collect diagnostic info**
   ```bash
   # Run diagnostic script
   docker-compose exec auth-service curl http://localhost:6061/actuator/health > health.json
   docker-compose logs --timestamps > full-logs.txt
   docker stats --no-stream > stats.txt
   # Share these files with support
   ```

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Service/DB not running | `docker-compose up -d` |
| `Connection timeout` | Firewall/Network issue | Check firewall, restart service |
| `Out of memory` | Heap too small | Increase `JAVA_OPTS -Xmx` |
| `Too many connections` | Pool exhausted | Increase `maximum-pool-size` |
| `JWT signature invalid` | Wrong secret | Verify `JWT_SECRET` matches |
| `404 Not Found` | Wrong endpoint | Check API documentation |
| `503 Service Unavailable` | Service down | Restart service |
| `Deadlock detected` | DB concurrency issue | Check for long transactions |
| `CORS error` | Wrong origin | Update gateway CORS config |
| `Port already in use` | Port conflict | Change port or kill process |

---

**Last updated:** 2025-10-28
**For questions:** See [CONTRIBUTING.md](./CONTRIBUTING.md) or contact the team
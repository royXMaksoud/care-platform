# 🌐 Gateway Setup for DAS Module

## Overview
The DAS frontend module sends all API requests to `/das/*`. The gateway must route these requests to `data-analysis-service:6072`.

---

## Gateway Configuration

### Option 1: Spring Cloud Gateway (Recommended)

**File**: `gateway-service/src/main/resources/application.yml`

```yaml
spring:
  cloud:
    gateway:
      routes:
        # ... existing routes ...
        
        # Data Analysis Service Route
        - id: data-analysis-service
          uri: http://localhost:6072
          predicates:
            - Path=/das/**
          filters:
            - StripPrefix=1  # Remove /das prefix before forwarding
            - name: CircuitBreaker
              args:
                name: dasCircuitBreaker
                fallbackUri: forward:/fallback/das
```

**With Docker/Kubernetes**:
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: data-analysis-service
          uri: http://data-analysis-service:6072  # Service name
          predicates:
            - Path=/das/**
          filters:
            - StripPrefix=1
```

---

### Option 2: Nginx

**File**: `/etc/nginx/conf.d/care-portal.conf`

```nginx
server {
    listen 6060;
    server_name localhost;

    # ... existing routes ...

    # Data Analysis Service
    location /das/ {
        proxy_pass http://localhost:6072/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS Headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type,Accept-Language,X-User-Id' always;
        
        # WebSocket support for SSE
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

---

### Option 3: Apache HTTP Server

**File**: `/etc/httpd/conf.d/care-portal.conf`

```apache
<VirtualHost *:6060>
    ServerName localhost
    
    # ... existing routes ...
    
    # Data Analysis Service
    <Location /das>
        ProxyPass http://localhost:6072
        ProxyPassReverse http://localhost:6072
        
        # Headers
        RequestHeader set X-Forwarded-Proto "http"
        RequestHeader set X-Forwarded-Host "localhost:6060"
        
        # CORS
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header set Access-Control-Allow-Headers "Authorization,Content-Type,Accept-Language,X-User-Id"
    </Location>
</VirtualHost>
```

---

## Request Flow

### Frontend → Gateway → Backend

```
1. Frontend Request:
   POST http://localhost:6060/das/api/files/upload
   Headers:
     - Authorization: Bearer eyJhbG...
     - Accept-Language: en
     - X-User-Id: uuid-1234...

2. Gateway Receives:
   POST /das/api/files/upload

3. Gateway Strips Prefix (/das):
   POST /api/files/upload

4. Gateway Forwards to Backend:
   POST http://localhost:6072/api/files/upload
   Headers:
     - Authorization: Bearer eyJhbG...
     - Accept-Language: en
     - X-User-Id: uuid-1234...

5. Backend Processes:
   - Validates JWT
   - Reads Accept-Language for i18n
   - Reads X-User-Id for context
   - Returns response

6. Gateway Returns to Frontend:
   Response with data
```

---

## Testing Gateway Configuration

### 1. Check Health Endpoint
```bash
# Direct backend call (should work)
curl http://localhost:6072/actuator/health

# Through gateway (should work after configuration)
curl http://localhost:6060/das/actuator/health
```

### 2. Test with Authentication
```bash
# Get JWT token first
TOKEN="your-jwt-token-here"

# Test file list endpoint
curl -H "Authorization: Bearer $TOKEN" \
     -H "Accept-Language: en" \
     http://localhost:6060/das/api/files
```

### 3. Test Upload (from frontend)
```javascript
// Open browser console on http://localhost:5173/das
// Upload a file through UI
// Check Network tab:
// - Request URL should be: /das/api/files/upload
// - Request headers should include Authorization, Accept-Language, X-User-Id
```

---

## Troubleshooting

### Issue: 404 Not Found
**Cause**: Gateway route not configured  
**Solution**: Add DAS route configuration to gateway

### Issue: 502 Bad Gateway
**Cause**: Backend service not running  
**Solution**: Start data-analysis-service on port 6072

### Issue: CORS Error
**Cause**: Gateway not allowing frontend origin  
**Solution**: Add CORS configuration to gateway route

### Issue: 401 Unauthorized
**Cause**: JWT token not being forwarded  
**Solution**: Ensure gateway forwards Authorization header

### Issue: Headers Missing (Accept-Language, X-User-Id)
**Cause**: Axios interceptor not working  
**Solution**: Check that `authStorage.getUser()` returns user object with `userId` and `lang`

---

## Development vs Production

### Development (localhost)
```yaml
# gateway-service/application-dev.yml
spring:
  cloud:
    gateway:
      routes:
        - id: data-analysis-service
          uri: http://localhost:6072
          predicates:
            - Path=/das/**
          filters:
            - StripPrefix=1
```

### Production (Docker)
```yaml
# gateway-service/application-prod.yml
spring:
  cloud:
    gateway:
      routes:
        - id: data-analysis-service
          uri: http://data-analysis-service:6072
          predicates:
            - Path=/das/**
          filters:
            - StripPrefix=1
          metadata:
            response-timeout: 30000
            connect-timeout: 5000
```

### Docker Compose
```yaml
version: '3.8'
services:
  gateway:
    image: care/gateway-service
    ports:
      - "6060:6060"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    depends_on:
      - data-analysis-service

  data-analysis-service:
    image: care/data-analysis-service
    ports:
      - "6072:6072"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/das
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=das
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
```

---

## Kubernetes Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: data-analysis-service
spec:
  selector:
    app: data-analysis-service
  ports:
    - port: 6072
      targetPort: 6072

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: care-portal-ingress
spec:
  rules:
    - host: portal.care.com
      http:
        paths:
          - path: /das
            pathType: Prefix
            backend:
              service:
                name: data-analysis-service
                port:
                  number: 6072
```

---

## Load Balancing (Optional)

For high availability:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: data-analysis-service
          uri: lb://data-analysis-service  # Use service discovery
          predicates:
            - Path=/das/**
          filters:
            - StripPrefix=1
            - name: Retry
              args:
                retries: 3
                statuses: BAD_GATEWAY,SERVICE_UNAVAILABLE
```

---

## Monitoring

### Health Check
```bash
# Gateway health
curl http://localhost:6060/actuator/health

# DAS health (through gateway)
curl http://localhost:6060/das/actuator/health

# DAS health (direct)
curl http://localhost:6072/actuator/health
```

### Metrics
```bash
# Gateway metrics
curl http://localhost:6060/actuator/metrics

# DAS metrics (through gateway)
curl http://localhost:6060/das/actuator/prometheus
```

---

## ✅ Configuration Checklist

### Gateway Service
- [ ] DAS route added to application.yml
- [ ] StripPrefix filter configured
- [ ] CORS enabled for frontend origin
- [ ] Circuit breaker configured (optional)
- [ ] Load balancing enabled (optional)
- [ ] Timeout values set appropriately

### Data Analysis Service
- [ ] Running on port 6072
- [ ] Database connection working
- [ ] JWT secret configured
- [ ] CORS allowed origins set
- [ ] Actuator endpoints exposed

### Frontend
- [ ] VITE_API_URL environment variable set
- [ ] Axios interceptor configured
- [ ] authStorage working correctly
- [ ] Build successful

---

## 🚀 Quick Start

### 1. Start Services (Development)
```bash
# Terminal 1: Data Analysis Service
cd data-analysis-service
./mvnw spring-boot:run

# Terminal 2: Gateway (if not running)
cd gateway-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Terminal 3: Frontend
cd web-portal
npm run dev
```

### 2. Verify
```bash
# Check all services are running
curl http://localhost:6072/actuator/health  # DAS direct
curl http://localhost:6060/das/actuator/health  # DAS through gateway
curl http://localhost:5173  # Frontend
```

### 3. Test
Open browser: `http://localhost:5173/das`

---

## 📝 Notes

- Gateway **must** strip the `/das` prefix before forwarding to backend
- Backend listens on `/api/**`, not `/das/api/**`
- Frontend **always** includes `/das` prefix in requests
- JWT token automatically attached by axios interceptor
- All services must be running for full functionality

---

**Configuration Status**: ⚠️ **Gateway configuration required**  
**Frontend Status**: ✅ **Ready**  
**Backend Status**: ✅ **Ready**

Once gateway is configured, the system will be **fully operational**! 🚀


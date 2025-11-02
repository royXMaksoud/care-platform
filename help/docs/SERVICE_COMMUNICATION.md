# Service Communication Guide

Detailed guide on how microservices communicate with each other in the CARE platform.

## 📋 Table of Contents

- [Communication Patterns](#communication-patterns)
- [Service-to-Service Calls](#service-to-service-calls)
- [OpenFeign Configuration](#openfeign-configuration)
- [Circuit Breaker Patterns](#circuit-breaker-patterns)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Resilience Strategies](#resilience-strategies)

---

## Communication Patterns

### Architecture Overview

```
┌──────────────────────┐
│   Client/Frontend    │
└──────────────┬───────┘
               │ HTTP REST
               ▼
┌──────────────────────────────────┐
│      API Gateway (6060)           │
│ Spring Cloud Gateway (WebFlux)    │
│ - Routes requests                │
│ - Validates JWT                  │
│ - Rate limiting                  │
│ - CORS handling                  │
└──────────────────────────────────┘
               │
        ┌──────┼──────┬──────────┬──────────┐
        │      │      │          │          │
        ▼      ▼      ▼          ▼          ▼
    ┌────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐
    │Auth│ │Access│ │Ref   │ │Appt  │ │DAS     │
    │    │ │Mgmt  │ │Data  │ │      │ │        │
    └────┘ └──────┘ └──────┘ └──────┘ └────────┘
      │      │         │        │         │
      └──────┼─────────┴────────┴─────────┘
             │
        ┌────▼─────────────────┐
        │  PostgreSQL Database │
        │  Shared (cms_db)     │
        └──────────────────────┘
```

### Communication Types

#### **1. Client to Service (REST)**
```
Client Request
    ↓
API Gateway (port 6060)
    ↓
Microservice (port 606x)
    ↓
Database Query
    ↓
Response → Client
```

#### **2. Service to Service (OpenFeign)**
```
Service A
    ↓ (REST call via OpenFeign)
Service B
    ↓
Response → Service A
```

#### **3. Service to Config Server**
```
Service Startup
    ↓
Config Server (8888)
    ↓
Load application properties
    ↓
Service starts with config
```

#### **4. Service to Service Registry (Eureka)**
```
Service A
    ↓ (Needs Service B location)
Eureka Server (8761)
    ↓ (Returns Service B URL/IP)
Service B location discovered
    ↓
Call Service B
```

---

## Service-to-Service Calls

### Dependency Chain

```
┌──────────────────────────┐
│  API Gateway (6060)      │
│  Routes to:              │
│  - /auth/**              │
│  - /access/**            │
│  - /appointment/**       │
│  - /das/**               │
│  - /v3/api-docs/**       │
└──────────────────────────┘
        │         │         │         │
        ▼         ▼         ▼         ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ Auth   │ │Access  │ │ Ref    │ │ DAS    │
   │Service │ │Service │ │ Data   │ │ Service│
   │ 6061   │ │ 6062   │ │ 6063   │ │ 6072   │
   └────────┘ └────────┘ └────────┘ └────────┘
        │         │         │         │
        └─────────┼─────────┘         │
                  │                   │
                  ▼                   ▼
          ┌──────────────┐    ┌──────────────┐
          │   cms_db     │    │   das_db     │
          │              │    │              │
          │ - users      │    │ - reports    │
          │ - roles      │    │ - analysis   │
          │ - permissions│    │ - files      │
          └──────────────┘    └──────────────┘
```

### Call Dependencies

| Caller | Callee | Purpose | Method |
|--------|--------|---------|--------|
| **Gateway** | Auth Service | Validate JWT | REST |
| **Gateway** | Access Mgmt | Check permissions | REST |
| **Access Mgmt** | Auth Service | Validate token, get user | OpenFeign |
| **Any Service** | Reference Data | Get lookup values | OpenFeign/REST |
| **Any Service** | Eureka | Find service location | HTTP |
| **Any Service** | Config Server | Get configuration | HTTP |

---

## OpenFeign Configuration

### What is OpenFeign?

OpenFeign is a declarative REST client that simplifies service-to-service communication:

```java
// Define interface
@FeignClient(name = "auth-service")
public interface AuthServiceClient {
    @PostMapping("/auth/validate")
    AuthResponse validate(@RequestBody TokenRequest token);
}

// Use it
@Autowired
AuthServiceClient authClient;

// Call it
AuthResponse response = authClient.validate(request);
```

**Benefits:**
- Simple declarative syntax
- Automatic serialization/deserialization
- Integrated with Eureka (service discovery)
- Built-in resilience patterns

### OpenFeign in Each Service

#### **Access Management Service uses Auth Service**

```java
// File: AccessManagementService.java

@FeignClient(
    name = "auth-service",
    url = "${feign.auth-service.url:http://auth-service:6061}",
    fallback = AuthServiceFallback.class
)
public interface AuthServiceClient {
    @PostMapping("/auth/validate")
    ResponseEntity<UserInfo> validateToken(
        @RequestHeader("Authorization") String token
    );

    @GetMapping("/auth/profile")
    ResponseEntity<UserProfile> getUserProfile(
        @RequestParam("userId") UUID userId
    );
}

// Usage in service
public void checkPermission(UUID userId, String action) {
    UserInfo user = authServiceClient.validateToken("Bearer " + token);
    // Process based on user info
}
```

#### **Configuration**

```yaml
# application.yml
feign:
  auth-service:
    url: http://auth-service:6061
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
        loggerLevel: basic

ribbon:
  ConnectTimeout: 5000
  ReadTimeout: 5000
```

#### **Error Handling with Fallback**

```java
@Component
public class AuthServiceFallback implements AuthServiceClient {
    @Override
    public ResponseEntity<UserInfo> validateToken(String token) {
        // Return default/cached response if service is down
        return ResponseEntity.ok(new UserInfo(
            UUID.randomUUID(),
            "Unknown",
            Collections.emptyList()
        ));
    }
}
```

---

## Circuit Breaker Patterns

### Why Circuit Breakers?

Imagine Service A calls Service B repeatedly:
- If Service B is down, Service A wastes time waiting
- If many services call B while it's down, system becomes slow
- **Solution:** Open circuit → fail fast → let B recover

### Circuit Breaker States

```
CLOSED (Normal)
    │
    ├─ Service working fine ✓
    │
    └─ Failure rate exceeds threshold
       │
       ▼
OPEN (Failed)
    │
    ├─ Reject requests immediately
    ├─ No actual calls to downstream service
    │
    └─ Wait duration_in_open_state
       │
       ▼
HALF_OPEN (Testing)
    │
    ├─ Try 1 request
    │
    ├─ If works → CLOSED ✓
    │
    └─ If fails → OPEN again
```

### Configuration in CARE Platform

```yaml
resilience4j:
  circuitbreaker:
    instances:
      auth-service:
        register-health-indicator: true
        sliding-window-size: 10              # Check last 10 calls
        failure-rate-threshold: 50           # If 50% fail, open circuit
        wait-duration-in-open-state: 60000  # Wait 60s before retry
        slow-call-rate-threshold: 50         # If 50% are slow, open
        slow-call-duration-threshold: 2000   # Slow = takes > 2s

      reference-data-service:
        sliding-window-size: 20
        failure-rate-threshold: 40
        wait-duration-in-open-state: 30000
```

### Using Circuit Breaker in Code

```java
@Service
public class AccessManagementService {

    @Autowired
    AuthServiceClient authServiceClient;

    @CircuitBreaker(
        name = "auth-service",
        fallbackMethod = "validateTokenFallback"
    )
    public UserInfo validateToken(String token) {
        return authServiceClient.validateToken(token);
    }

    // Called if circuit is open or call fails
    public UserInfo validateTokenFallback(String token, Exception e) {
        log.warn("Auth service unavailable, using cached user: {}", e.getMessage());
        return userCache.getOrDefault(token, new UserInfo());
    }
}
```

---

## Retry Logic

### Automatic Retries

Resilience4j automatically retries failed calls:

```yaml
resilience4j:
  retry:
    instances:
      reference-data-service:
        max-attempts: 3
        wait-duration: 1000                # Wait 1s between retries
        retry-exceptions:
          - java.io.IOException
          - java.net.ConnectException
        ignore-exceptions:
          - com.care.exceptions.ValidationException
```

### How Retry Works

```
Call Service B
    │
    ├─ Success? → Return response ✓
    │
    └─ Failure (IOException, etc)?
       │
       ├─ Retry #1 (wait 1s)
       │  └─ Success? → Return response ✓
       │  └─ Failure? → Continue
       │
       ├─ Retry #2 (wait 1s)
       │  └─ Success? → Return response ✓
       │  └─ Failure? → Continue
       │
       └─ Retry #3 (wait 1s)
          └─ Success? → Return response ✓
          └─ Failure? → Throw exception ✗
```

---

## Rate Limiting

### Purpose

Prevent one service from overwhelming another with too many requests.

### Configuration

```yaml
resilience4j:
  ratelimiter:
    instances:
      default:
        register-health-indicator: true
        limit-refresh-period: 1m
        limit-for-period: 2000              # 2000 requests per minute
        timeout-duration: 5s

      auth-service:
        limit-for-period: 500               # Stricter limit for auth
```

### Usage

```java
@Service
public class PermissionService {

    @RateLimiter(name = "auth-service")
    public UserPermissions getPermissions(UUID userId) {
        // Only allows 500 calls/minute to auth service
        return authServiceClient.getPermissions(userId);
    }
}
```

---

## Request/Response Examples

### Example 1: User Login Flow

**Client → Gateway → Auth Service**

```
1. Client sends login request:
POST http://localhost:6060/auth/login
Content-Type: application/json

{
    "username": "john@example.com",
    "password": "SecurePassword123"
}

2. Gateway receives request:
- Checks if path matches /auth/**
- Routes to Auth Service at http://auth-service:6061

3. Auth Service processes:
- Validates username/password against database
- Creates JWT token
- Returns token

{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "refreshToken": "refresh_token_here",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "john@example.com",
        "email": "john@example.com"
    }
}

4. Client stores token and uses in future requests:
GET http://localhost:6060/access/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example 2: Permission Check Flow

**Access Management Service → Auth Service (OpenFeign)**

```
1. Client requests protected resource:
GET http://localhost:6060/users
Authorization: Bearer <token>

2. Gateway receives request:
- Extracts JWT token from Authorization header
- Calls Access Management Service to check permission

3. Access Management Service (via OpenFeign):
@FeignClient(name = "auth-service")
public interface AuthServiceClient {
    @PostMapping("/auth/validate")
    UserInfo validateToken(@RequestBody String token);
}

4. Service calls Auth Service:
POST http://auth-service:6061/auth/validate
Content-Type: application/json

{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

5. Auth Service returns user info:
{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john@example.com",
    "permissions": ["READ_USERS", "WRITE_USERS"],
    "roles": ["ADMIN"]
}

6. Access Management Service:
- Receives user info from Auth Service
- Checks if user has "READ_USERS" permission
- Returns authorization decision to Gateway
```

### Example 3: Reference Data Lookup

**Any Service → Reference Data Service (REST)**

```
// In Access Management Service
@GetMapping("/roles")
public List<Role> getRoles() {
    // Call Reference Data Service via REST
    return restTemplate.getForObject(
        "http://reference-data-service:6063/api/roles",
        List.class
    );
}

1. Request:
GET http://reference-data-service:6063/api/roles

2. Response:
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "ADMIN",
        "description": "Administrator role"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "USER",
        "description": "Regular user"
    }
]
```

---

## Error Handling

### Handling Service-to-Service Errors

```java
@Service
public class AccessManagementService {

    @Autowired
    AuthServiceClient authClient;

    public void checkAccess(String token, String action) {
        try {
            // Try to validate token via Auth Service
            UserInfo user = authClient.validateToken(token);

        } catch (FeignException.Unauthorized ex) {
            // Auth Service says token is invalid
            throw new UnauthorizedException("Invalid token");

        } catch (FeignException.Forbidden ex) {
            // Auth Service says user doesn't have permission
            throw new ForbiddenException("Access denied");

        } catch (FeignException.ServiceUnavailable ex) {
            // Auth Service is down (will use circuit breaker fallback)
            throw new ServiceUnavailableException("Auth service is down");

        } catch (Exception ex) {
            // Unknown error
            log.error("Error checking access", ex);
            throw new InternalServerException("System error");
        }
    }
}
```

### HTTP Status Codes

| Status | Meaning | Handling |
|--------|---------|----------|
| **200** | Success | Process response normally |
| **400** | Bad request | Log error, return to client |
| **401** | Unauthorized | Invalid/expired token, ask to login |
| **403** | Forbidden | User doesn't have permission |
| **404** | Not found | Resource doesn't exist |
| **500** | Server error | Retry or use fallback |
| **503** | Service unavailable | Use circuit breaker fallback |

---

## Resilience Strategies

### Complete Resilience Configuration

```yaml
resilience4j:
  # Circuit Breaker
  circuitbreaker:
    instances:
      auth-service:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 60s
        sliding-window-size: 10

  # Retry
  retry:
    instances:
      auth-service:
        max-attempts: 3
        wait-duration: 1s

  # Rate Limiter
  ratelimiter:
    instances:
      auth-service:
        limit-for-period: 500
        limit-refresh-period: 1m

  # Timeout
  timelimiter:
    instances:
      auth-service:
        timeout-duration: 10s
        cancel-running-future: true

  # Bulkhead (Thread Pool Isolation)
  bulkhead:
    instances:
      auth-service:
        max-concurrent-calls: 25
        max-wait-duration: 10s
```

### Real-World Example

```java
@Service
public class AccessManagementService {

    @Autowired
    AuthServiceClient authClient;

    @Bulkhead(name = "auth-service")        // Thread pool isolation
    @CircuitBreaker(
        name = "auth-service",
        fallbackMethod = "getPermissionsFallback"
    )
    @Retry(name = "auth-service")           // Retry on failure
    @TimeLimiter(name = "auth-service")     // Timeout protection
    @RateLimiter(name = "auth-service")     // Rate limiting
    public UserPermissions getPermissions(UUID userId) {
        // This call is protected by all resilience patterns!
        return authClient.getPermissions(userId);
    }

    // Fallback if all retries fail and circuit is open
    public UserPermissions getPermissionsFallback(
        UUID userId,
        Exception ex
    ) {
        log.warn("Auth service down, returning cached permissions");
        return permissionCache.getOrDefault(userId, new UserPermissions());
    }
}
```

---

## Debugging Service Communication

### Enable Feign Logging

```yaml
logging:
  level:
    feign: DEBUG
    org.springframework.cloud.openfeign: DEBUG

feign:
  client:
    config:
      default:
        loggerLevel: FULL  # Log full request/response
```

### View Feign Logs

```bash
# In service logs, you'll see:
[auth-service] ---> POST http://auth-service:6061/auth/validate HTTP/1.1
[auth-service] Content-Type: application/json
[auth-service] Content-Length: 123
[auth-service] {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
[auth-service] ---> END POST (123-byte body)
[auth-service] <--- HTTP/1.1 200 OK (234-byte body)
[auth-service] {
[auth-service]   "userId": "550e8400-e29b-41d4-a716-446655440000",
[auth-service]   "username": "john",
[auth-service]   "permissions": [...]
[auth-service] }
[auth-service] <--- END HTTP (234-byte body)
```

### Test Service-to-Service Call

```bash
# From within container
docker-compose exec access-management-service curl \
  -X POST http://auth-service:6061/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"your_jwt_token"}'

# Or from host (via gateway)
curl http://localhost:6060/auth/validate \
  -H "Authorization: Bearer your_jwt_token"
```

### Monitor Circuit Breaker Status

```bash
# Get circuit breaker status
curl http://localhost:6062/actuator/health/circuitbreakers | jq

# Expected output:
{
  "status": "UP",
  "details": {
    "authServiceCircuitBreaker": {
      "status": "UP",
      "details": {
        "state": "CLOSED",
        "failureRate": "0.0%",
        "slowCallRate": "0.0%"
      }
    }
  }
}
```

---

## Best Practices

1. **Always use circuit breakers** for external service calls
2. **Implement fallbacks** for non-critical operations
3. **Set reasonable timeouts** (3-10 seconds)
4. **Log service calls** for debugging
5. **Monitor service communication** via metrics
6. **Use service discovery** (Eureka) instead of hardcoded URLs
7. **Implement retry with exponential backoff**
8. **Cache responses** when appropriate
9. **Implement rate limiting** to prevent overload
10. **Test failure scenarios** (service down, timeout, etc.)

---

## See Also

- [SERVICE_RUNBOOK.md](./SERVICE_RUNBOOK.md) - Service details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment procedures
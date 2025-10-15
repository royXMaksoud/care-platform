# Resilience4j Quick Start Guide

## 🚀 5-Minute Quick Start

### Prerequisites

✅ All services already have Resilience4j configured!  
✅ Dependencies added to pom.xml  
✅ Configuration in application.yml  
✅ Event listeners configured

### Step 1: Verify Installation

```bash
# Start auth-service
cd auth-service
mvn spring-boot:run

# Check health endpoint (should show circuit breakers)
curl http://localhost:6061/actuator/health | jq
```

Expected output:
```json
{
  "status": "UP",
  "components": {
    "circuitBreakers": {
      "status": "UP",
      "details": {
        "permissionService": {
          "status": "UP",
          "state": "CLOSED"
        }
      }
    }
  }
}
```

### Step 2: Use in Your Code

**Simple Example** - Add to any service method:

```java
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

@Service
public class YourService {

    @CircuitBreaker(name = "permissionService", fallbackMethod = "fallbackMethod")
    @Retry(name = "permissionService")
    public List<Permission> getPermissions(UUID userId) {
        // Your existing code
        return permissionClient.getPermissions(userId);
    }

    // Fallback method (same signature + Exception parameter)
    private List<Permission> fallbackMethod(UUID userId, Exception ex) {
        log.error("Using fallback for user: {}", userId, ex);
        return Collections.emptyList(); // Or return cached data
    }
}
```

### Step 3: Monitor

```bash
# View circuit breaker status
curl http://localhost:6061/actuator/circuitbreakers

# View metrics
curl http://localhost:6061/actuator/metrics/resilience4j.circuitbreaker.calls
```

## 📋 Common Use Cases

### Use Case 1: External API Call

```java
@CircuitBreaker(name = "externalApi", fallbackMethod = "externalApiFallback")
@Retry(name = "externalApi")
@Bulkhead(name = "externalApi")
@RateLimiter(name = "externalApi")
public ExternalData callExternalApi(String request) {
    return externalApiClient.call(request);
}

private ExternalData externalApiFallback(String request, Exception ex) {
    log.error("External API failed, using fallback", ex);
    return ExternalData.empty();
}
```

### Use Case 2: Database Query with Timeout

```java
@TimeLimiter(name = "crudOperations")
@Bulkhead(name = "crudOperations")
public CompletableFuture<List<User>> findUsers(UUID tenantId) {
    return CompletableFuture.supplyAsync(() -> 
        userRepository.findByTenantId(tenantId)
    );
}
```

### Use Case 3: Service-to-Service Call

```java
@CircuitBreaker(name = "accessManagementService", fallbackMethod = "getUserDetailsFallback")
@Retry(name = "accessManagementService")
public UserDetails getUserDetails(UUID userId) {
    return accessManagementClient.getUser(userId);
}

private UserDetails getUserDetailsFallback(UUID userId, Exception ex) {
    log.warn("Access management service unavailable, using cached data");
    return userCache.get(userId).orElse(UserDetails.unknown());
}
```

### Use Case 4: Rate-Limited Public Endpoint

```java
@RateLimiter(name = "publicEndpoint")
@PostMapping("/api/public/register")
public ResponseEntity<UserDTO> register(@RequestBody RegisterRequest request) {
    UserDTO user = userService.register(request);
    return ResponseEntity.ok(user);
}
```

### Use Case 5: Gateway Route Protection

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/auth/**
          filters:
            - name: CircuitBreaker
              args:
                name: authService
                fallbackUri: forward:/fallback/auth
```

## 🎯 Available Instances

### Auth Service

| Instance | Type | Use For |
|----------|------|---------|
| `permissionService` | CB, Retry, Bulkhead, Rate, Time | Permission lookups |
| `accessManagementService` | CB, Retry, Bulkhead, Time | Access management calls |
| `externalApi` | CB, Retry, Bulkhead, Time | External APIs |
| `apiEndpoint` | Rate | API endpoints |
| `publicEndpoint` | Rate | Public endpoints |

### Access Management Service

| Instance | Type | Use For |
|----------|------|---------|
| `referenceDataService` | CB, Retry, Bulkhead, Rate, Time | Reference data |
| `authService` | CB, Retry, Bulkhead, Time | Auth service calls |
| `crudOperations` | Bulkhead, Time | CRUD operations |
| `externalApi` | CB, Retry, Bulkhead, Time | External APIs |
| `apiEndpoint` | Rate | API endpoints |
| `publicEndpoint` | Rate | Public endpoints |
| `internalApi` | Rate | Internal calls |

### Gateway Service

| Instance | Type | Use For |
|----------|------|---------|
| `authService` | CB, Time | Auth service routes |
| `accessManagementService` | CB, Time | Access mgmt routes |
| `appointmentService` | CB, Time | Appointment routes |
| `globalLimit` | Rate | Overall traffic |
| `authEndpoints` | Rate | Auth endpoints |
| `apiEndpoints` | Rate | API traffic |

## 🔍 Testing Your Implementation

### Test 1: Circuit Breaker Opens

```bash
# 1. Stop access-management-service
docker stop access-management-service

# 2. Make 10 requests (will fail, circuit should open)
for i in {1..10}; do
  curl http://localhost:6061/api/permissions/users/test-user-id
done

# 3. Check circuit breaker state
curl http://localhost:6061/actuator/health | jq '.components.circuitBreakers.details.permissionService.details.state'

# Expected: "OPEN"

# 4. Restart service
docker start access-management-service

# 5. Wait 30 seconds (waitDurationInOpenState)
# Circuit should transition to HALF_OPEN then CLOSED
```

### Test 2: Retry Works

```bash
# Enable debug logging to see retries
# Set in application.yml: logging.level.com.ftp.authservice: DEBUG

# Make a request that will trigger retries
curl http://localhost:6061/api/permissions/users/test-user-id

# Check logs for:
# "Retry attempt: permissionService - Attempt #1"
# "Retry attempt: permissionService - Attempt #2"
# "Retry attempt: permissionService - Attempt #3"
```

### Test 3: Rate Limiter Blocks

```bash
# Send 300 requests rapidly (limit is 200/second)
for i in {1..300}; do
  curl -w "%{http_code}\n" http://localhost:6061/api/users &
done

# Expected: Some responses with 429 (Too Many Requests)
```

### Test 4: Fallback Method Called

```bash
# 1. Stop access-management-service
# 2. Make request
curl http://localhost:6061/api/permissions/users/test-user-id

# 3. Check response (should be fallback data)
# 4. Check logs for "Using fallback for user..."
```

## 📊 Monitoring Commands

```bash
# Overall health
curl http://localhost:6061/actuator/health | jq

# Circuit breaker details
curl http://localhost:6061/actuator/circuitbreakers | jq

# Circuit breaker metrics
curl http://localhost:6061/actuator/metrics/resilience4j.circuitbreaker.state | jq

# Rate limiter status
curl http://localhost:6061/actuator/ratelimiters | jq

# Bulkhead status
curl http://localhost:6061/actuator/bulkheads | jq

# All resilience4j metrics
curl http://localhost:6061/actuator/metrics | jq '.names[] | select(contains("resilience4j"))'

# Specific metric value
curl http://localhost:6061/actuator/metrics/resilience4j.circuitbreaker.calls | jq
```

## ⚙️ Configuration Tuning

### Increase Failure Threshold

```yaml
resilience4j:
  circuitbreaker:
    instances:
      permissionService:
        failureRateThreshold: 70  # Default: 50
```

### Reduce Retry Attempts

```yaml
resilience4j:
  retry:
    instances:
      permissionService:
        maxAttempts: 2  # Default: 3
```

### Increase Rate Limit

```yaml
resilience4j:
  ratelimiter:
    instances:
      apiEndpoint:
        limitForPeriod: 500  # Default: 200
```

### Increase Timeout

```yaml
resilience4j:
  timelimiter:
    instances:
      permissionService:
        timeoutDuration: 5s  # Default: 3s
```

## 🎨 Best Practices Checklist

- [ ] Always provide fallback methods
- [ ] Use appropriate instance names (match configuration)
- [ ] Combine patterns wisely (Circuit Breaker + Retry + Bulkhead)
- [ ] Monitor circuit breaker states in production
- [ ] Set up alerts for OPEN state
- [ ] Tune based on metrics
- [ ] Test fallback methods
- [ ] Document service-specific patterns
- [ ] Use Time Limiter for async operations
- [ ] Cache fallback data when possible

## 🆘 Common Issues

### Issue: "No fallback available"

**Solution**: Add fallback method with correct signature

```java
// Service method
@CircuitBreaker(name = "permissionService", fallbackMethod = "getFallback")
public List<Permission> getPermissions(UUID userId) { ... }

// Fallback method (must match signature + Exception)
private List<Permission> getFallback(UUID userId, Exception ex) { ... }
```

### Issue: Circuit breaker not working

**Solution**: Check annotations are on public methods

```java
// ✅ Correct
@CircuitBreaker(name = "permissionService")
public List<Permission> getPermissions(UUID userId) { ... }

// ❌ Wrong
@CircuitBreaker(name = "permissionService")
private List<Permission> getPermissions(UUID userId) { ... }
```

### Issue: Metrics not showing

**Solution**: Enable actuator endpoints

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,circuitbreakers,ratelimiters
```

### Issue: TimeoutException with TimeLimiter

**Solution**: Use CompletableFuture

```java
// ✅ Correct
@TimeLimiter(name = "permissionService")
public CompletableFuture<List<Permission>> getPermissionsAsync(UUID userId) {
    return CompletableFuture.supplyAsync(() -> ...);
}

// ❌ Wrong
@TimeLimiter(name = "permissionService")
public List<Permission> getPermissions(UUID userId) {
    return ...; // Won't work with TimeLimiter
}
```

## 📚 Learn More

- [Full Implementation Guide](RESILIENCE4J_IMPLEMENTATION_SUMMARY.md)
- [Auth Service Guide](auth-service/RESILIENCE4J_GUIDE.md)
- [Access Management Guide](access-management-service/RESILIENCE4J_GUIDE.md)
- [Gateway Guide](gateway-service/RESILIENCE4J_GUIDE.md)
- [Official Resilience4j Docs](https://resilience4j.readme.io/)

## 🤝 Support

For issues or questions:
1. Check logs: `tail -f logs/application.log`
2. Check health: `curl http://localhost:PORT/actuator/health`
3. Review configuration: `application.yml`
4. Check documentation above
5. Contact development team

---

**Quick Start Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: ✅ Ready to Use


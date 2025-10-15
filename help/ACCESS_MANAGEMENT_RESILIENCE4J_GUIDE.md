# Resilience4j Implementation Guide - Access Management Service

## 📋 Overview

This service implements **Resilience4j** for comprehensive fault tolerance patterns. All CRUD operations and external service calls are protected with resilience patterns.

## 🎯 Configured Instances

### Circuit Breakers

| Instance | Sliding Window | Failure Threshold | Wait Duration | Use Case |
|----------|---------------|-------------------|---------------|-----------|
| `referenceDataService` | 10 calls | 50% | 30s | Reference data lookups |
| `authService` | 15 calls | 60% | 45s | Authentication service calls |
| `externalApi` | 20 calls | 40% | 60s | External API integrations |

### Retry Policies

| Instance | Max Attempts | Wait Duration | Backoff | Use Case |
|----------|-------------|---------------|---------|-----------|
| `referenceDataService` | 3 | 1s | Exponential (2x) | Reference data retries |
| `authService` | 4 | 500ms | Exponential (2x) | Auth service retries |
| `externalApi` | 5 | 2s | Exponential (2x) | External API retries |

### Rate Limiters

| Instance | Limit | Period | Use Case |
|----------|-------|--------|-----------|
| `referenceDataService` | 50 | 1s | Reference service calls |
| `apiEndpoint` | 200 | 1s | Standard API endpoints |
| `publicEndpoint` | 300 | 1s | Public endpoints |
| `internalApi` | 500 | 1s | Internal service calls |

### Bulkheads

| Instance | Max Concurrent | Use Case |
|----------|---------------|-----------|
| `referenceDataService` | 25 | Reference data isolation |
| `authService` | 20 | Auth service isolation |
| `crudOperations` | 30 | CRUD operations isolation |
| `externalApi` | 5 | External API isolation |

### Time Limiters

| Instance | Timeout | Use Case |
|----------|---------|-----------|
| `referenceDataService` | 5s | Reference data lookups |
| `authService` | 3s | Auth service calls |
| `crudOperations` | 10s | Complex CRUD operations |
| `externalApi` | 15s | External API calls |

## 🔧 Usage Examples for Common Scenarios

### 1. Tenant Service with Resilience

```java
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.springframework.stereotype.Service;

@Service
public class TenantService {

    // CRUD operations with bulkhead
    @Bulkhead(name = "crudOperations")
    @RateLimiter(name = "apiEndpoint")
    public TenantDTO createTenant(TenantDTO tenantDTO) {
        Tenant tenant = tenantMapper.toEntity(tenantDTO);
        Tenant savedTenant = tenantRepository.save(tenant);
        return tenantMapper.toDTO(savedTenant);
    }

    // External reference data call with full resilience
    @CircuitBreaker(name = "referenceDataService", fallbackMethod = "getDefaultGenderTypes")
    @Retry(name = "referenceDataService")
    @Bulkhead(name = "referenceDataService")
    public List<GenderType> getGenderTypes() {
        return referenceDataClient.getGenderTypes();
    }

    private List<GenderType> getDefaultGenderTypes(Exception ex) {
        log.error("Failed to fetch gender types, using defaults", ex);
        return Arrays.asList(
            new GenderType(1, "Male", "ذكر"),
            new GenderType(2, "Female", "أنثى")
        );
    }
}
```

### 2. User Service with Authentication

```java
@Service
public class UserService {

    // Call to auth service for token validation
    @CircuitBreaker(name = "authService", fallbackMethod = "validateTokenFallback")
    @Retry(name = "authService")
    @Bulkhead(name = "authService")
    @TimeLimiter(name = "authService")
    public CompletableFuture<TokenValidation> validateToken(String token) {
        return CompletableFuture.supplyAsync(() -> 
            authServiceClient.validateToken(token)
        );
    }

    private CompletableFuture<TokenValidation> validateTokenFallback(String token, Exception ex) {
        log.error("Token validation failed, using fallback", ex);
        // Check local cache or reject
        return CompletableFuture.completedFuture(
            tokenCache.get(token).orElse(TokenValidation.invalid())
        );
    }

    // User creation with rate limiting
    @RateLimiter(name = "apiEndpoint")
    @Bulkhead(name = "crudOperations")
    public UserDTO createUser(UserDTO userDTO) {
        // Validate with auth service
        validateUserPermissions();
        
        User user = userMapper.toEntity(userDTO);
        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }
}
```

### 3. Role and Permission Management

```java
@Service
public class RoleService {

    @Bulkhead(name = "crudOperations")
    @RateLimiter(name = "apiEndpoint")
    public RoleDTO createRole(RoleDTO roleDTO) {
        Role role = roleMapper.toEntity(roleDTO);
        Role savedRole = roleRepository.save(role);
        
        // Clear permission cache
        permissionCacheService.invalidate(roleDTO.getId());
        
        return roleMapper.toDTO(savedRole);
    }

    // Fetch role permissions with resilience
    @CircuitBreaker(name = "referenceDataService", fallbackMethod = "getCachedPermissions")
    @Retry(name = "referenceDataService")
    @Bulkhead(name = "referenceDataService")
    public List<Permission> getRolePermissions(UUID roleId) {
        return permissionRepository.findByRoleId(roleId);
    }

    private List<Permission> getCachedPermissions(UUID roleId, Exception ex) {
        log.warn("Using cached permissions for role: {}", roleId, ex);
        return permissionCache.get(roleId).orElse(Collections.emptyList());
    }
}
```

### 4. Audit Log Service

```java
@Service
public class AuditLogService {

    // Non-blocking audit logging with bulkhead
    @Bulkhead(name = "crudOperations")
    @Async
    public void logAudit(AuditLogDTO auditLogDTO) {
        try {
            AuditLog auditLog = auditLogMapper.toEntity(auditLogDTO);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            // Don't fail main operation if audit logging fails
            log.error("Failed to save audit log", e);
        }
    }

    // Query audit logs with pagination
    @Bulkhead(name = "crudOperations")
    @RateLimiter(name = "apiEndpoint")
    public Page<AuditLogDTO> getAuditLogs(UUID tenantId, Pageable pageable) {
        Page<AuditLog> auditLogs = auditLogRepository.findByTenantId(tenantId, pageable);
        return auditLogs.map(auditLogMapper::toDTO);
    }
}
```

### 5. Feign Client with Resilience4j

```java
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
    name = "auth-service",
    url = "${services.auth.base-url}",
    fallback = AuthServiceFallback.class
)
public interface AuthServiceClient {

    @GetMapping("/api/auth/validate")
    @CircuitBreaker(name = "authService")
    @Retry(name = "authService")
    TokenValidation validateToken(@RequestHeader("Authorization") String token);
}

// Fallback implementation
@Component
public class AuthServiceFallback implements AuthServiceClient {
    
    @Override
    public TokenValidation validateToken(String token) {
        log.warn("Using fallback for token validation");
        return TokenValidation.invalid();
    }
}
```

## 📊 Monitoring Endpoints

```bash
# Health check
curl http://localhost:6062/actuator/health

# Circuit breaker metrics
curl http://localhost:6062/actuator/circuitbreakers

# Rate limiter metrics
curl http://localhost:6062/actuator/ratelimiters

# Bulkhead metrics
curl http://localhost:6062/actuator/bulkheads

# Retry metrics
curl http://localhost:6062/actuator/retries

# Prometheus metrics
curl http://localhost:6062/actuator/prometheus | grep resilience4j
```

## 🎨 Best Practices for Access Management Service

### 1. Protect All External Service Calls

```java
// Always wrap external calls
@CircuitBreaker(name = "referenceDataService")
@Retry(name = "referenceDataService")
public List<CodeTable> getCodeTables() {
    return referenceDataClient.getCodeTables();
}
```

### 2. Use Bulkhead for CRUD Operations

```java
// Prevent one slow operation from blocking others
@Bulkhead(name = "crudOperations")
public TenantDTO updateTenant(UUID id, TenantDTO tenantDTO) {
    // Complex update logic
}
```

### 3. Rate Limit Public Endpoints

```java
@RateLimiter(name = "publicEndpoint")
public List<TenantDTO> getPublicTenants() {
    return tenantService.getPublicTenants();
}
```

### 4. Cache Fallback Data

```java
@CircuitBreaker(name = "referenceDataService", fallbackMethod = "getCachedData")
public List<GenderType> getGenderTypes() {
    return referenceDataClient.getGenderTypes();
}

private List<GenderType> getCachedData(Exception ex) {
    return cacheService.getOrDefault("genderTypes", Collections.emptyList());
}
```

### 5. Async Operations for Non-Critical Tasks

```java
@Async
@Bulkhead(name = "crudOperations")
public CompletableFuture<Void> sendNotification(UserDTO user) {
    // Send email/SMS notification
    return CompletableFuture.completedFuture(null);
}
```

## 🔍 Troubleshooting Common Issues

### 1. Feign Client Not Using Circuit Breaker

**Solution**: Ensure annotations are on interface methods or use Feign's built-in Resilience4j support:

```yaml
feign:
  circuitbreaker:
    enabled: true
```

### 2. Bulkhead Rejecting CRUD Operations

**Solution**: Increase concurrent calls or reduce operation complexity:

```yaml
resilience4j:
  bulkhead:
    instances:
      crudOperations:
        maxConcurrentCalls: 50  # Increase if needed
```

### 3. Too Many Retries to Reference Data Service

**Solution**: Adjust retry configuration:

```yaml
resilience4j:
  retry:
    instances:
      referenceDataService:
        maxAttempts: 2  # Reduce attempts
        waitDuration: 2s  # Increase wait time
```

## 📈 Performance Metrics

Monitor these key metrics in production:

```promql
# Circuit breaker state
resilience4j_circuitbreaker_state{name="referenceDataService"}

# Failure rate
resilience4j_circuitbreaker_failure_rate{name="referenceDataService"}

# Call count
resilience4j_circuitbreaker_calls_total{name="referenceDataService"}

# Bulkhead usage
resilience4j_bulkhead_available_concurrent_calls{name="crudOperations"}

# Rate limiter
resilience4j_ratelimiter_available_permissions{name="apiEndpoint"}
```

## 📚 Additional Resources

- [Main Resilience4j Guide](../../RESILIENCE4J_GUIDE.md)
- [Feign with Resilience4j](https://resilience4j.readme.io/docs/feign)
- [Service Integration Patterns](https://microservices.io/patterns/index.html)

---

**Last Updated**: October 2025  
**Version**: 1.0.0


# Resilience4j Implementation Guide - Auth Service

## 📋 Overview

This service implements **Resilience4j** for comprehensive fault tolerance patterns. Resilience4j provides:

- **Circuit Breaker**: Prevents cascading failures
- **Retry**: Automatic retry with exponential backoff
- **Rate Limiter**: Controls request rate
- **Bulkhead**: Isolates resources
- **Time Limiter**: Prevents hanging calls

## 🎯 Configured Instances

### Circuit Breakers

| Instance | Sliding Window | Failure Threshold | Wait Duration | Use Case |
|----------|---------------|-------------------|---------------|-----------|
| `permissionService` | 10 calls | 50% | 30s | Permission lookups from access-management-service |
| `accessManagementService` | 15 calls | 60% | 30s | General calls to access management |
| `externalApi` | 20 calls | 40% | 60s | External API calls |

### Retry Policies

| Instance | Max Attempts | Wait Duration | Backoff | Use Case |
|----------|-------------|---------------|---------|-----------|
| `permissionService` | 3 | 1s | Exponential (2x) | Permission API retries |
| `accessManagementService` | 4 | 500ms | Exponential (2x) | Access management retries |
| `externalApi` | 5 | 2s | Exponential (2x) | External API retries |

### Rate Limiters

| Instance | Limit | Period | Timeout | Use Case |
|----------|-------|--------|---------|-----------|
| `permissionService` | 50 | 1s | 500ms | Permission service calls |
| `apiEndpoint` | 200 | 1s | 500ms | API endpoints |
| `publicEndpoint` | 500 | 1s | 500ms | Public endpoints (login, register) |

### Bulkheads

| Instance | Max Concurrent | Max Wait | Use Case |
|----------|---------------|----------|-----------|
| `permissionService` | 20 | 1s | Permission service isolation |
| `accessManagementService` | 15 | 1s | Access management isolation |
| `externalApi` | 5 | 1s | External API isolation |

### Time Limiters

| Instance | Timeout | Cancel Running | Use Case |
|----------|---------|---------------|-----------|
| `permissionService` | 3s | Yes | Permission lookups |
| `accessManagementService` | 5s | Yes | Access management calls |
| `externalApi` | 10s | Yes | External API calls |

## 🔧 Usage Examples

### 1. Using Annotations (Recommended)

```java
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

@Service
public class PermissionServiceClient {

    // Circuit Breaker + Retry
    @CircuitBreaker(name = "permissionService", fallbackMethod = "getPermissionsFallback")
    @Retry(name = "permissionService")
    public List<Permission> getUserPermissions(UUID userId) {
        // Call to permission service
        return permissionClient.getPermissions(userId);
    }

    // Fallback method
    private List<Permission> getPermissionsFallback(UUID userId, Exception ex) {
        log.error("Failed to get permissions for user: {}, using fallback", userId, ex);
        // Return cached or default permissions
        return cachedPermissions.getOrDefault(userId, Collections.emptyList());
    }

    // Circuit Breaker + Retry + Bulkhead
    @CircuitBreaker(name = "accessManagementService")
    @Retry(name = "accessManagementService")
    @Bulkhead(name = "accessManagementService")
    public UserDetails getUserDetails(UUID userId) {
        return accessManagementClient.getUser(userId);
    }

    // Rate Limiter
    @RateLimiter(name = "apiEndpoint")
    public ResponseEntity<LoginResponse> login(LoginRequest request) {
        return authService.authenticate(request);
    }

    // Time Limiter (requires CompletableFuture)
    @TimeLimiter(name = "permissionService")
    @CircuitBreaker(name = "permissionService")
    public CompletableFuture<List<Permission>> getUserPermissionsAsync(UUID userId) {
        return CompletableFuture.supplyAsync(() -> 
            permissionClient.getPermissions(userId)
        );
    }

    // Combining multiple patterns
    @CircuitBreaker(name = "externalApi", fallbackMethod = "externalApiFallback")
    @Retry(name = "externalApi")
    @Bulkhead(name = "externalApi")
    @RateLimiter(name = "externalApi")
    @TimeLimiter(name = "externalApi")
    public CompletableFuture<ExternalData> callExternalApi(String request) {
        return CompletableFuture.supplyAsync(() -> 
            externalApiClient.call(request)
        );
    }

    private CompletableFuture<ExternalData> externalApiFallback(String request, Exception ex) {
        log.error("External API call failed, using fallback", ex);
        return CompletableFuture.completedFuture(ExternalData.empty());
    }
}
```

### 2. Programmatic Usage

```java
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import java.util.function.Supplier;

@Service
public class ResilientService {

    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final RetryRegistry retryRegistry;
    private final BulkheadRegistry bulkheadRegistry;

    public ResilientService(CircuitBreakerRegistry circuitBreakerRegistry,
                           RetryRegistry retryRegistry,
                           BulkheadRegistry bulkheadRegistry) {
        this.circuitBreakerRegistry = circuitBreakerRegistry;
        this.retryRegistry = retryRegistry;
        this.bulkheadRegistry = bulkheadRegistry;
    }

    public List<Permission> getPermissionsWithResilience(UUID userId) {
        // Get resilience patterns
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("permissionService");
        Retry retry = retryRegistry.retry("permissionService");
        Bulkhead bulkhead = bulkheadRegistry.bulkhead("permissionService");

        // Create supplier
        Supplier<List<Permission>> supplier = () -> permissionClient.getPermissions(userId);

        // Decorate with resilience patterns
        Supplier<List<Permission>> decoratedSupplier = Bulkhead.decorateSupplier(bulkhead,
            Retry.decorateSupplier(retry,
                CircuitBreaker.decorateSupplier(circuitBreaker, supplier)
            )
        );

        // Execute with resilience
        try {
            return decoratedSupplier.get();
        } catch (Exception e) {
            log.error("Failed to get permissions after all resilience attempts", e);
            return Collections.emptyList();
        }
    }
}
```

### 3. RestTemplate/WebClient with Resilience4j

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient permissionServiceWebClient(CircuitBreakerRegistry circuitBreakerRegistry) {
        return WebClient.builder()
            .baseUrl("http://access-management-service")
            .filter((request, next) -> {
                CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker("permissionService");
                return Mono.fromCallable(() -> circuitBreaker.decorateSupplier(() -> next.exchange(request)))
                    .flatMap(Supplier::get);
            })
            .build();
    }
}
```

## 📊 Monitoring Endpoints

Access Resilience4j metrics and health indicators:

```bash
# Health check with circuit breaker status
curl http://localhost:6061/actuator/health

# Circuit breaker metrics
curl http://localhost:6061/actuator/circuitbreakers

# Rate limiter metrics
curl http://localhost:6061/actuator/ratelimiters

# Bulkhead metrics
curl http://localhost:6061/actuator/bulkheads

# Retry metrics
curl http://localhost:6061/actuator/retries

# Prometheus metrics
curl http://localhost:6061/actuator/prometheus | grep resilience4j
```

### Health Check Response Example

```json
{
  "status": "UP",
  "components": {
    "circuitBreakers": {
      "status": "UP",
      "details": {
        "permissionService": {
          "status": "UP",
          "details": {
            "failureRate": "0.0%",
            "slowCallRate": "0.0%",
            "state": "CLOSED",
            "bufferedCalls": 10,
            "failedCalls": 0,
            "slowCalls": 0,
            "notPermittedCalls": 0
          }
        }
      }
    },
    "rateLimiters": {
      "status": "UP",
      "details": {
        "apiEndpoint": {
          "status": "UP",
          "details": {
            "availablePermissions": 200,
            "numberOfWaitingThreads": 0
          }
        }
      }
    }
  }
}
```

## 🎨 Best Practices

### 1. Always Provide Fallback Methods

```java
@CircuitBreaker(name = "permissionService", fallbackMethod = "getPermissionsFallback")
public List<Permission> getUserPermissions(UUID userId) {
    return permissionClient.getPermissions(userId);
}

// Fallback must have same return type and parameters + Exception
private List<Permission> getPermissionsFallback(UUID userId, Exception ex) {
    log.error("Fallback triggered for user: {}", userId, ex);
    return getCachedPermissions(userId);
}
```

### 2. Use Appropriate Instance Names

Match instance names in annotations with configuration in `application.yml`:

```java
@CircuitBreaker(name = "permissionService")  // Must match yaml config
```

### 3. Combine Patterns Wisely

```java
// Good: Circuit Breaker + Retry + Bulkhead
@CircuitBreaker(name = "permissionService")
@Retry(name = "permissionService")
@Bulkhead(name = "permissionService")
public List<Permission> getUserPermissions(UUID userId) { ... }

// Order matters: Bulkhead → Retry → CircuitBreaker (outermost to innermost)
```

### 4. Use Time Limiter for Async Operations

```java
@TimeLimiter(name = "permissionService")
@CircuitBreaker(name = "permissionService")
public CompletableFuture<List<Permission>> getUserPermissionsAsync(UUID userId) {
    return CompletableFuture.supplyAsync(() -> permissionClient.getPermissions(userId));
}
```

### 5. Monitor and Tune

- Monitor circuit breaker states in production
- Adjust thresholds based on actual failure rates
- Use Prometheus + Grafana for visualization
- Set up alerts for circuit breaker state changes

## 🔍 Troubleshooting

### Circuit Breaker is Always Open

- Check if failure rate threshold is too low
- Verify downstream service health
- Review exception types being recorded

### Too Many Retries

- Reduce `maxAttempts`
- Increase `waitDuration`
- Check if retry exceptions are correct

### Rate Limiter Rejecting Valid Requests

- Increase `limitForPeriod`
- Adjust `limitRefreshPeriod`
- Check for traffic spikes

### Bulkhead Rejecting Calls

- Increase `maxConcurrentCalls`
- Reduce call duration
- Check for thread leaks

## 📈 Performance Tuning

### Development Environment

```yaml
resilience4j:
  circuitbreaker:
    instances:
      permissionService:
        slidingWindowSize: 5          # Smaller window for faster testing
        failureRateThreshold: 70      # Higher threshold
```

### Production Environment

```yaml
resilience4j:
  circuitbreaker:
    instances:
      permissionService:
        slidingWindowSize: 100        # Larger window for stability
        failureRateThreshold: 50      # Lower threshold for safety
        slowCallDurationThreshold: 2000ms  # Detect slow calls
```

## 📚 Additional Resources

- [Resilience4j Documentation](https://resilience4j.readme.io/)
- [Spring Boot Integration](https://resilience4j.readme.io/docs/getting-started-3)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Microservice Patterns](https://microservices.io/patterns/reliability/circuit-breaker.html)

---

**Last Updated**: October 2025  
**Version**: 1.0.0


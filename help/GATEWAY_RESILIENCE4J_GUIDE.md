# Resilience4j Implementation Guide - Gateway Service

## 📋 Overview

The Gateway Service implements **Resilience4j** with reactive patterns for WebFlux. This provides fault tolerance at the gateway level, protecting all downstream services.

## 🎯 Configured Instances

### Circuit Breakers (Reactive)

| Instance | Sliding Window | Failure Threshold | Wait Duration | Use Case |
|----------|---------------|-------------------|---------------|-----------|
| `authService` | 50 calls | 50% | 30s | Auth service protection |
| `accessManagementService` | 50 calls | 50% | 30s | Access management protection |
| `appointmentService` | 50 calls | 50% | 30s | Appointment service protection |

### Time Limiters (Reactive)

| Instance | Timeout | Use Case |
|----------|---------|-----------|
| `authService` | 5s | Auth requests (login, validate) |
| `accessManagementService` | 10s | CRUD operations |
| `appointmentService` | 10s | Appointment operations |

### Rate Limiters (Gateway Level)

| Instance | Limit | Period | Use Case |
|----------|-------|--------|-----------|
| `globalLimit` | 1000 | 1s | Overall gateway traffic |
| `authEndpoints` | 500 | 1s | Authentication endpoints |
| `apiEndpoints` | 2000 | 1s | Standard API traffic |

## 🔧 Gateway-Specific Implementation

### 1. Route-Level Circuit Breaker

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
            - name: Retry
              args:
                retries: 3
                statuses: BAD_GATEWAY,GATEWAY_TIMEOUT
                methods: GET,POST
                backoff:
                  firstBackoff: 100ms
                  maxBackoff: 500ms
                  factor: 2
```

### 2. Global Filters with Resilience

```java
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.factory.circuitbreaker.CircuitBreakerFilterFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class ResilientGlobalFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange)
            .timeout(Duration.ofSeconds(10))
            .onErrorResume(TimeoutException.class, e -> {
                log.error("Request timeout", e);
                exchange.getResponse().setStatusCode(HttpStatus.REQUEST_TIMEOUT);
                return exchange.getResponse().setComplete();
            });
    }
}
```

### 3. Fallback Endpoints

```java
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/auth")
    @PostMapping("/auth")
    public Mono<ResponseEntity<ErrorResponse>> authServiceFallback() {
        log.warn("Auth service fallback triggered");
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse(
                "AUTH_SERVICE_UNAVAILABLE",
                "Authentication service is temporarily unavailable. Please try again later.",
                "خدمة المصادقة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً."
            )));
    }

    @GetMapping("/access")
    @PostMapping("/access")
    public Mono<ResponseEntity<ErrorResponse>> accessManagementFallback() {
        log.warn("Access management service fallback triggered");
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse(
                "ACCESS_SERVICE_UNAVAILABLE",
                "Access management service is temporarily unavailable.",
                "خدمة إدارة الوصول غير متاحة مؤقتاً."
            )));
    }

    @GetMapping("/appointment")
    @PostMapping("/appointment")
    public Mono<ResponseEntity<ErrorResponse>> appointmentServiceFallback() {
        log.warn("Appointment service fallback triggered");
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse(
                "APPOINTMENT_SERVICE_UNAVAILABLE",
                "Appointment service is temporarily unavailable.",
                "خدمة المواعيد غير متاحة مؤقتاً."
            )));
    }

    @Data
    @AllArgsConstructor
    static class ErrorResponse {
        private String code;
        private String messageEn;
        private String messageAr;
    }
}
```

### 4. Rate Limiting Filter

```java
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimitConfig {

    // Rate limit by IP
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest()
                .getRemoteAddress()
                .getAddress()
                .getHostAddress()
        );
    }

    // Rate limit by user (from JWT)
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String token = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                // Extract user ID from JWT
                String userId = jwtTokenUtil.extractUserId(token.substring(7));
                return Mono.just(userId);
            }
            return Mono.just("anonymous");
        };
    }

    // Rate limit by API key
    @Bean
    public KeyResolver apiKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getHeaders().getFirst("X-API-Key") != null
                ? exchange.getRequest().getHeaders().getFirst("X-API-Key")
                : "no-api-key"
        );
    }
}
```

### 5. Custom Circuit Breaker Configuration

```java
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory;
import org.springframework.cloud.circuitbreaker.resilience4j.Resilience4JConfigBuilder;
import org.springframework.cloud.client.circuitbreaker.Customizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CircuitBreakerConfiguration {

    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> authServiceCustomizer() {
        return factory -> factory.configure(builder -> builder
            .circuitBreakerConfig(CircuitBreakerConfig.custom()
                .slidingWindowSize(50)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .permittedNumberOfCallsInHalfOpenState(5)
                .slowCallRateThreshold(100)
                .slowCallDurationThreshold(Duration.ofSeconds(3))
                .build())
            .timeLimiterConfig(TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(5))
                .build()), 
            "authService");
    }

    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> accessManagementCustomizer() {
        return factory -> factory.configure(builder -> builder
            .circuitBreakerConfig(CircuitBreakerConfig.custom()
                .slidingWindowSize(50)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .build())
            .timeLimiterConfig(TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(10))
                .build()), 
            "accessManagementService");
    }
}
```

## 📊 Monitoring and Observability

### Health Endpoints

```bash
# Gateway health with circuit breakers
curl http://localhost:6060/actuator/health

# Circuit breaker events
curl http://localhost:6060/actuator/circuitbreakerevents

# Circuit breaker metrics
curl http://localhost:6060/actuator/metrics/resilience4j.circuitbreaker.calls

# Rate limiter metrics
curl http://localhost:6060/actuator/metrics/resilience4j.ratelimiter.available.permissions
```

### Prometheus Metrics

```promql
# Circuit breaker state by service
resilience4j_circuitbreaker_state{name=~".*Service"}

# Request rate
spring_cloud_gateway_requests_total

# Request duration
spring_cloud_gateway_requests_seconds_sum / spring_cloud_gateway_requests_seconds_count

# Circuit breaker failure rate
rate(resilience4j_circuitbreaker_calls_total{kind="failed"}[5m])
```

### Grafana Dashboard

Create dashboards to monitor:
- Circuit breaker states per downstream service
- Request success/failure rates
- Response time percentiles (p50, p95, p99)
- Rate limiter permit usage
- Gateway throughput

## 🎨 Best Practices for Gateway

### 1. Always Provide Fallbacks

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          filters:
            - name: CircuitBreaker
              args:
                name: authService
                fallbackUri: forward:/fallback/auth  # Always provide fallback
```

### 2. Use Appropriate Timeouts

```yaml
# Short timeout for auth
authService:
  timeout: 5s

# Longer timeout for complex operations
accessManagementService:
  timeout: 10s
```

### 3. Rate Limit Strategically

```yaml
# Higher limits for authenticated users
- name: RequestRateLimiter
  args:
    redis-rate-limiter.replenishRate: 100  # tokens per second
    redis-rate-limiter.burstCapacity: 200  # max burst
    key-resolver: "#{@userKeyResolver}"
```

### 4. Monitor Circuit Breaker States

```java
@Component
@Slf4j
public class CircuitBreakerMonitor {

    @Scheduled(fixedRate = 60000) // Every minute
    public void monitorCircuitBreakers() {
        circuitBreakerRegistry.getAllCircuitBreakers().forEach(cb -> {
            var state = cb.getState();
            if (state == CircuitBreaker.State.OPEN || state == CircuitBreaker.State.HALF_OPEN) {
                log.warn("Circuit breaker {} is {}", cb.getName(), state);
                // Send alert
                alertService.sendCircuitBreakerAlert(cb.getName(), state);
            }
        });
    }
}
```

### 5. Graceful Degradation

```java
@GetMapping("/fallback/auth")
public Mono<ResponseEntity<?>> authFallback() {
    // Return cached data or limited functionality
    return Mono.just(ResponseEntity
        .status(HttpStatus.PARTIAL_CONTENT)
        .body(Map.of(
            "status", "degraded",
            "message", "Limited functionality available"
        )));
}
```

## 🔍 Troubleshooting

### Gateway Always Returning 503

**Check**:
1. Circuit breaker state: `GET /actuator/health`
2. Downstream service health
3. Timeout settings

**Solution**:
```yaml
resilience4j:
  timelimiter:
    instances:
      authService:
        timeoutDuration: 10s  # Increase if needed
```

### Rate Limiter Blocking Valid Requests

**Check**:
```bash
curl http://localhost:6060/actuator/metrics/resilience4j.ratelimiter.available.permissions
```

**Solution**:
```yaml
resilience4j:
  ratelimiter:
    instances:
      authEndpoints:
        limitForPeriod: 1000  # Increase limit
```

### Circuit Breaker Opens Too Quickly

**Solution**:
```yaml
resilience4j:
  circuitbreaker:
    instances:
      authService:
        minimumNumberOfCalls: 20  # Require more calls before calculating rate
        failureRateThreshold: 60  # Increase threshold
```

## 📚 Additional Resources

- [Spring Cloud Gateway Docs](https://spring.io/projects/spring-cloud-gateway)
- [Resilience4j Reactive Guide](https://resilience4j.readme.io/docs/getting-started-2)
- [Circuit Breaker Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)

---

**Last Updated**: October 2025  
**Version**: 1.0.0


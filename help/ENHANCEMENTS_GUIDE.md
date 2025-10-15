# Microservices Enhancements Guide

## What Was Added

### 1. Actuator - Health & Monitoring
- Health checks: `http://localhost:6061/actuator/health`
- Metrics: `http://localhost:6061/actuator/metrics`
- Prometheus: `http://localhost:6061/actuator/prometheus`

### 2. Resilience4j - Circuit Breaker & Retry
- Retries failed requests (3 attempts)
- Opens circuit after 50% failures
- Fallback to empty permissions

### 3. Distributed Tracing - Zipkin
- Track requests across services
- Access: `http://localhost:9411`
- View request timeline

### 4. Rate Limiting with Redis
- Limits requests per user
- Prevents DDoS attacks

### 5. Environment Profiles
- `application-dev.yml` - Development
- `application-prod.yml` - Production
- `application-docker.yml` - Docker

### 6. Enhanced Logging
- Structured format
- Per-package levels
- Thread information

## How to Run

### Start Infrastructure
```bash
docker-compose -f docker-compose-infrastructure.yml up -d
```

### Start Services
```bash
# 1. Service Registry
cd service-registry
mvn spring-boot:run

# 2. Auth Service (dev profile)
cd auth-service/auth-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 3. Access Management
cd access-management-system/access-management-service/accessmanagement
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 4. Gateway
cd gateway-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Access Monitoring Tools

| Service | URL |
|---------|-----|
| Eureka | http://localhost:8761 |
| Zipkin | http://localhost:9411 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

## Verify Health

```bash
curl http://localhost:6061/actuator/health
curl http://localhost:6062/actuator/health
curl http://localhost:6060/actuator/health
```


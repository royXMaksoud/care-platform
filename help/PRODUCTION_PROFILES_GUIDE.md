# 🚀 Production Profiles Guide

## 📋 Overview

This guide explains how to use the production profiles (`bootstrap-prod.yml`) that have been created for all microservices.

---

## 🔧 Configuration Files Structure

```
service-name/
├── src/main/resources/
│   ├── bootstrap.yml           # Development (fail-fast: false)
│   ├── bootstrap-prod.yml      # Production (fail-fast: true)
│   ├── application.yml         # Common application config
│   └── application-prod.yml    # Production application config (optional)
```

---

## 📊 Profiles Comparison

### 🟢 Development Profile (bootstrap.yml)

```yaml
spring:
  cloud:
    config:
      fail-fast: false  # Continue even if Config Server is down
      retry:
        max-attempts: 3
        initial-interval: 1000
      request-connect-timeout: 5000
      request-read-timeout: 5000
```

**Behavior:**
- ✅ Service starts even if Config Server is unavailable
- ✅ Falls back to local `application.yml`
- ✅ Good for local development
- ⚠️ May miss configuration updates

---

### 🔴 Production Profile (bootstrap-prod.yml)

```yaml
spring:
  cloud:
    config:
      fail-fast: true   # Fail immediately if Config Server is down
      retry:
        max-attempts: 10
        initial-interval: 2000
        max-interval: 10000
        multiplier: 1.5
      request-connect-timeout: 10000
      request-read-timeout: 10000
```

**Behavior:**
- ⚠️ Service FAILS to start if Config Server is unavailable
- ✅ Ensures all services have the latest configuration
- ✅ More retry attempts with exponential backoff
- ✅ Longer timeouts for production networks
- ✅ Environment variables for flexibility

---

## 🚀 How to Use

### 🖥️ Running in Development (Default)

```bash
# Method 1: Using Maven
cd service-name/
mvnw spring-boot:run

# Method 2: Using JAR
java -jar target/service-name.jar

# Uses bootstrap.yml by default (fail-fast: false)
```

---

### 🏭 Running in Production

#### **Method 1: Using Spring Profile**

```bash
# Using Maven
mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# Using JAR
java -jar target/service-name.jar --spring.profiles.active=prod

# Uses bootstrap-prod.yml (fail-fast: true)
```

#### **Method 2: Using Environment Variable**

```bash
# Linux/Mac
export SPRING_PROFILES_ACTIVE=prod
java -jar target/service-name.jar

# Windows PowerShell
$env:SPRING_PROFILES_ACTIVE="prod"
java -jar target/service-name.jar

# Windows CMD
set SPRING_PROFILES_ACTIVE=prod
java -jar target/service-name.jar
```

#### **Method 3: Using Docker**

```dockerfile
# Dockerfile
FROM openjdk:17-jdk-alpine
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java", "-jar", "/app.jar", "--spring.profiles.active=prod"]
```

```bash
# docker-compose.yml
version: '3.8'
services:
  auth-service:
    image: auth-service:latest
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - CONFIG_SERVER_URI=http://config-server:8888
    ports:
      - "6061:6061"
```

---

## 🔧 Production Environment Variables

All production profiles support these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `CONFIG_SERVER_URI` | `http://localhost:8888` | Config Server URL |
| `SERVER_PORT` | Service specific | Service port |
| `SPRING_PROFILES_ACTIVE` | (none) | Active Spring profile |

### Example:

```bash
# Production with custom Config Server
export CONFIG_SERVER_URI=http://config-server.production.com:8888
export SERVER_PORT=6061
export SPRING_PROFILES_ACTIVE=prod

java -jar auth-service.jar
```

---

## 📝 Services with Production Profiles

All these services now have `bootstrap-prod.yml`:

| Service | Default Port | Production Profile |
|---------|-------------|-------------------|
| **auth-service** | 6061 | ✅ bootstrap-prod.yml |
| **gateway-service** | 6060 | ✅ bootstrap-prod.yml |
| **access-management-service** | 6062 | ✅ bootstrap-prod.yml |
| **data-analysis-service** | 6072 | ✅ bootstrap-prod.yml |
| **reference-data-service** | 6071 | ✅ bootstrap-prod.yml |

---

## 🔍 Verification

### Check Active Profile:

```bash
# Check which profile is active
curl http://localhost:6061/actuator/env | grep "spring.profiles.active"

# Check config source
curl http://localhost:6061/actuator/configprops
```

### Check Logs on Startup:

**Development (fail-fast: false):**
```log
WARN  o.s.c.c.c.ConfigServicePropertySourceLocator : 
      Could not locate PropertySource: Connection refused
INFO  o.s.b.w.e.t.TomcatWebServer : 
      Tomcat started on port(s): 6061 (http)
✅ Service starts successfully
```

**Production (fail-fast: true):**
```log
ERROR o.s.c.c.c.ConfigServicePropertySourceLocator : 
      Could not locate PropertySource and fail fast is set
ERROR o.s.boot.SpringApplication : 
      Application run failed
❌ Service fails to start
```

---

## 🎯 Production Startup Sequence

### ✅ Correct Order:

```
1. Start Service Registry (Eureka)
   → http://localhost:8761

2. Start Config Server
   → http://localhost:8888
   → Verify: curl http://localhost:8888/actuator/health

3. Start Microservices with prod profile
   → java -jar service.jar --spring.profiles.active=prod
```

### ⚠️ If Config Server is Down:

With **`fail-fast: true`** (production):
```
❌ Service will NOT start
✅ This is EXPECTED behavior in production
✅ Ensures configuration consistency
```

Solution:
```bash
# 1. Start Config Server first
cd config-server/
mvnw spring-boot:run

# 2. Wait for it to be ready
curl http://localhost:8888/actuator/health

# 3. Then start other services
cd auth-service/
mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## 🛡️ Best Practices

### ✅ DO:

1. **Always start Config Server first** in production
2. **Use environment variables** for sensitive data:
   ```bash
   export CONFIG_SERVER_URI=http://config-server:8888
   export JWT_SECRET=your-production-secret
   ```
3. **Monitor Config Server** health:
   ```bash
   curl http://config-server:8888/actuator/health
   ```
4. **Use Docker health checks**:
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:8888/actuator/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

### ❌ DON'T:

1. ❌ Use `fail-fast: false` in production
2. ❌ Hardcode secrets in configuration files
3. ❌ Skip Config Server health checks
4. ❌ Start services before Config Server is ready

---

## 🔄 Migration from Dev to Prod

### Quick Checklist:

- [ ] Config Server is running
- [ ] Config Server health check passes
- [ ] Environment variables are set
- [ ] Spring profile is set to `prod`
- [ ] Service Registry is running
- [ ] Database connections are configured
- [ ] Secrets are stored securely (not in files)

### Command:

```bash
# Development
java -jar service.jar

# Production
java -jar service.jar --spring.profiles.active=prod
```

---

## 📞 Troubleshooting

### Problem: Service fails to start with "Could not locate PropertySource"

**Solution:**
```bash
# 1. Check Config Server is running
curl http://localhost:8888/actuator/health

# 2. Check Config Server has the configuration
curl http://localhost:8888/auth-service/prod

# 3. Check environment variables
echo $CONFIG_SERVER_URI
echo $SPRING_PROFILES_ACTIVE
```

### Problem: Service uses wrong configuration

**Solution:**
```bash
# Verify active profile
curl http://localhost:6061/actuator/env | grep "spring.profiles.active"

# Check config source
curl http://localhost:6061/actuator/configprops | grep "configServerProperties"
```

---

## 📚 Related Documentation

- [Spring Cloud Config Documentation](https://docs.spring.io/spring-cloud-config/docs/current/reference/html/)
- [Spring Profiles](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles)
- [Config Server Setup Guide](config-server/README.md)

---

## 🎓 Summary

| Environment | Profile | fail-fast | Behavior |
|------------|---------|-----------|----------|
| **Development** | default | `false` | ✅ Start even if Config Server is down |
| **Production** | `prod` | `true` | ❌ Fail if Config Server is down |

**Use Production Profile when:**
- Deploying to production
- Configuration consistency is critical
- You want to catch configuration issues early
- You have proper monitoring and alerting

**Use Development Profile when:**
- Local development
- Testing individual services
- Config Server is not always available
- Quick iteration is needed

---

**Created:** 2025-10-17  
**Last Updated:** 2025-10-17


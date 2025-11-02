# 🌍 Environment Configuration Guide

## 📖 Overview

This document provides an overview of how to run the microservices in different environments (Development vs Production).

---

## 📁 Project Structure

```
Code/
├── service-registry/          # Eureka Server (Port: 8761)
├── config-server/             # Config Server (Port: 8888)
├── auth-service/              # Authentication (Port: 6061)
├── gateway-service/           # API Gateway (Port: 6060)
├── access-management-service/ # Access Management (Port: 6062)
├── reference-data-service/    # Reference Data (Port: 6071)
├── data-analysis-service/     # Data Analysis (Port: 6072)
├── web-portal/                # React Frontend (Port: 5173)
│
├── 📚 Documentation
│   ├── PRODUCTION_PROFILES_GUIDE.md       # Complete guide (English)
│   ├── PRODUCTION_PROFILES_GUIDE_AR.md    # Complete guide (Arabic)
│   ├── QUICK_START_PROD.md               # Quick reference
│   ├── PRODUCTION_CHANGES_LOG.md         # Change log
│   └── README_ENVIRONMENTS.md            # This file
```

---

## 🎯 Two Environments

### 🟢 Development (Default)

**Purpose:** Local development and testing

**Characteristics:**
- Services work independently
- Config Server optional (falls back to local config)
- Faster startup
- Easier debugging

**Usage:**
```bash
mvnw spring-boot:run
```

---

### 🔴 Production

**Purpose:** Production deployment

**Characteristics:**
- Requires Config Server
- Ensures configuration consistency
- More reliable
- Better monitoring

**Usage:**
```bash
mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## 🚀 Quick Start

### Development Mode (Recommended for Local Work)

```bash
# 1. Start infrastructure services
cd service-registry && mvnw spring-boot:run &
cd config-server && mvnw spring-boot:run &

# 2. Start any microservice
cd auth-service/auth-service && mvnw spring-boot:run
```

**✅ Config Server can be down - services will still work**

---

### Production Mode (Recommended for Deployment)

```bash
# 1. Start infrastructure (REQUIRED)
cd service-registry && mvnw spring-boot:run &
cd config-server && mvnw spring-boot:run &

# 2. Wait for Config Server
curl http://localhost:8888/actuator/health

# 3. Start microservices with prod profile
cd auth-service/auth-service && mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

**⚠️ Config Server MUST be running - services will fail otherwise**

---

## 📊 Comparison Table

| Feature | Development | Production |
|---------|-------------|------------|
| **Config Server Required** | ❌ No | ✅ Yes |
| **Fail if Config Server Down** | ❌ No | ✅ Yes |
| **Configuration Source** | Local fallback | Config Server |
| **Retry Attempts** | 3 | 10 |
| **Timeouts** | 5s | 10s |
| **Exponential Backoff** | ❌ No | ✅ Yes |
| **Environment Variables** | Optional | Recommended |
| **Best For** | Development | Production |

---

## 🔧 Configuration Files

### Each Service Has:

```
service-name/src/main/resources/
├── bootstrap.yml              # Development config (fail-fast: false)
├── bootstrap-prod.yml         # Production config (fail-fast: true)
├── application.yml            # Common application settings
└── application-prod.yml       # Production application settings (optional)
```

---

## 🎓 When to Use Which Mode

### Use **Development Mode** When:

- 🖥️ Working on local machine
- 🔧 Developing a single service
- 🐛 Debugging
- ⚡ Need fast startup
- 🔄 Config Server not always available

### Use **Production Mode** When:

- 🏭 Deploying to production
- 🐳 Using Docker/Kubernetes
- 📦 Staging/QA environment
- ✅ Need configuration consistency
- 🔒 Security is critical

---

## 📚 Documentation

### Quick References

- **[QUICK_START_PROD.md](QUICK_START_PROD.md)** - Quick commands and cheatsheet
- **[PRODUCTION_PROFILES_GUIDE_AR.md](PRODUCTION_PROFILES_GUIDE_AR.md)** - Complete guide in Arabic

### Detailed Guides

- **[PRODUCTION_PROFILES_GUIDE.md](PRODUCTION_PROFILES_GUIDE.md)** - Complete English guide
- **[PRODUCTION_CHANGES_LOG.md](PRODUCTION_CHANGES_LOG.md)** - What changed and why

---

## ⚙️ Environment Variables

### Common Variables

```bash
# Profile
export SPRING_PROFILES_ACTIVE=prod

# Config Server
export CONFIG_SERVER_URI=http://config-server:8888

# Service Port
export SERVER_PORT=6061

# Database (example)
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=auth_db
export DB_USERNAME=postgres
export DB_PASSWORD=SecurePassword

# JWT
export JWT_SECRET=YourSecretKey
```

---

## 🔍 Health Checks

### Check All Services

```bash
# Infrastructure
curl http://localhost:8761                    # Service Registry
curl http://localhost:8888/actuator/health   # Config Server

# Microservices
curl http://localhost:6061/actuator/health   # Auth Service
curl http://localhost:6060/actuator/health   # Gateway
curl http://localhost:6062/actuator/health   # Access Management
curl http://localhost:6071/actuator/health   # Reference Data
curl http://localhost:6072/actuator/health   # Data Analysis
```

---

## 🐳 Docker Support

### Development

```dockerfile
FROM openjdk:17-jdk-alpine
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
# Uses default profile (development)
```

### Production

```dockerfile
FROM openjdk:17-jdk-alpine
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar", "--spring.profiles.active=prod"]
# Uses production profile
```

### Docker Compose

```yaml
version: '3.8'
services:
  config-server:
    image: config-server:latest
    ports:
      - "8888:8888"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/actuator/health"]
      
  auth-service:
    image: auth-service:latest
    depends_on:
      config-server:
        condition: service_healthy
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - CONFIG_SERVER_URI=http://config-server:8888
    ports:
      - "6061:6061"
```

---

## 📞 Troubleshooting

### Service Won't Start in Production Mode

**Problem:** Service fails with "Could not locate PropertySource"

**Solution:**
1. Check Config Server is running: `curl http://localhost:8888/actuator/health`
2. Verify profile is set: `echo $SPRING_PROFILES_ACTIVE`
3. Check network connectivity to Config Server

---

### Service Uses Wrong Configuration

**Problem:** Service not picking up production config

**Solution:**
1. Verify profile is active: `curl http://localhost:6061/actuator/env | grep profiles`
2. Check logs for "The following profiles are active: prod"
3. Ensure `bootstrap-prod.yml` exists

---

## 🎯 Best Practices

### Development

```bash
# ✅ Simple and fast
mvnw spring-boot:run

# ✅ Config Server optional
# ✅ Use H2 for database (if applicable)
# ✅ Debug mode enabled
```

### Production

```bash
# ✅ Always use prod profile
mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# ✅ Config Server required
# ✅ Use PostgreSQL/MySQL
# ✅ Environment variables for secrets
# ✅ Monitoring enabled
```

---

## 🔐 Security Notes

### Development

- ⚠️ Secrets can be in files (for convenience)
- ⚠️ CORS allows localhost
- ⚠️ Debug endpoints enabled

### Production

- ✅ Secrets in environment variables ONLY
- ✅ CORS configured properly
- ✅ Debug endpoints disabled
- ✅ HTTPS enabled
- ✅ JWT secrets strong and rotated

---

## 📊 Port Summary

| Service | Port | Profile |
|---------|------|---------|
| Service Registry | 8761 | Default |
| Config Server | 8888 | Default |
| **Gateway** | **6060** | Default/Prod |
| Auth Service | 6061 | Default/Prod |
| Access Management | 6062 | Default/Prod |
| Reference Data | 6071 | Default/Prod |
| Data Analysis | 6072 | Default/Prod |
| Web Portal | 5173 | N/A (React) |

---

## 🎓 Summary

### Key Takeaways

1. **Development**: Fast, flexible, forgiving
   ```bash
   mvnw spring-boot:run
   ```

2. **Production**: Strict, consistent, reliable
   ```bash
   mvnw spring-boot:run -Dspring-boot.run.profiles=prod
   ```

3. **Config Server**: Optional in dev, required in prod

4. **Environment Variables**: Good in dev, essential in prod

---

## 📖 Further Reading

- [Spring Boot Profiles](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles)
- [Spring Cloud Config](https://docs.spring.io/spring-cloud-config/docs/current/reference/html/)
- [Microservices Patterns](https://microservices.io/patterns/index.html)

---

**Last Updated:** 2025-10-17  
**Version:** 1.0  
**Maintained By:** Development Team


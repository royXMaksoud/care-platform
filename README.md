# Care Management System

> Enterprise-grade microservices platform for healthcare management built with Spring Boot and Resilience4j

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Resilience4j](https://img.shields.io/badge/Resilience4j-2.2.0-yellow.svg)](https://resilience4j.readme.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Services](#services)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)

## 🌟 Overview

Care Management System is a comprehensive, production-ready microservices platform designed specifically for healthcare management. Built with enterprise-grade patterns and best practices, it provides robust authentication, fine-grained access control, and seamless service orchestration with built-in fault tolerance and comprehensive monitoring capabilities.

### Key Highlights

- 🏥 **Healthcare-Focused**: Designed for medical institutions and healthcare providers
- 🔐 **Security-First**: JWT authentication with role-based access control
- 🛡️ **Fault-Tolerant**: Resilience4j patterns protect against cascading failures
- 📊 **Observable**: Built-in health checks, metrics, and distributed tracing
- 🌐 **Multi-Language**: Full support for English and Arabic (RTL)
- 🐳 **Container-Ready**: Docker and Kubernetes-ready with optimized images

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                    (Web/Mobile/Desktop)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (6060)                        │
│          Spring Cloud Gateway + Resilience4j                 │
│   • Request Routing      • Rate Limiting                     │
│   • Load Balancing       • Circuit Breaking                  │
│   • Authentication       • Service Discovery                 │
└──────┬──────────────────┬───────────────────┬───────────────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌──────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ Auth Service │   │ Access Mgmt     │   │ Reference Data   │
│   (6061)     │   │ Service (6062)  │   │ Service (6063)   │
│              │   │                 │   │                  │
│ • JWT Auth   │   │ • User Mgmt     │   │ • Code Tables    │
│ • Login      │   │ • Permissions   │   │ • Organizations  │
│ • Register   │   │ • Roles         │   │ • Locations      │
│ • Tokens     │   │ • Scopes        │   │ • Translations   │
└──────┬───────┘   └────────┬────────┘   └────────┬─────────┘
       │                    │                      │
       └────────────────────┴──────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │   PostgreSQL   │
                   │     (5432)     │
                   │                │
                   │ • Users        │
                   │ • Permissions  │
                   │ • Code Tables  │
                   └────────────────┘

         ┌──────────────────────────────┐
         │   Infrastructure Services     │
         ├──────────────────────────────┤
         │ • Eureka (8761)              │
         │ • Config Server (8888)       │
         │ • Core Shared Library        │
         └──────────────────────────────┘
```

## ✨ Features

### Core Capabilities

- 🔐 **JWT Authentication**: Secure token-based authentication with refresh tokens
- 👥 **User Management**: Complete CRUD operations with multi-language support
- 🛡️ **RBAC**: Fine-grained role-based access control with dynamic permissions
- 🌐 **API Gateway**: Centralized entry point with intelligent routing
- 🔍 **Service Discovery**: Automatic service registration and discovery with Eureka

### Resilience & Fault Tolerance

Built with **Resilience4j 2.2.0** implementing multiple fault tolerance patterns:

- ⚡ **Circuit Breaker**: Prevents cascading failures across services
  - Configurable failure thresholds (50-60%)
  - Automatic recovery with half-open states
  - Real-time state monitoring

- 🔄 **Retry Mechanism**: Intelligent retry with exponential backoff
  - 3-4 attempts per operation
  - Configurable wait durations (500ms-1s)
  - Prevents overload during recovery

- 🚦 **Rate Limiting**: API protection and brute force prevention
  - 50-500 requests/second based on endpoint sensitivity
  - Login protection: 500 req/s limit
  - Real-time rate limiter metrics

- 🏗️ **Bulkhead Pattern**: Resource isolation and protection
  - 20-30 concurrent calls per service
  - Prevents resource exhaustion
  - Configurable wait durations

- ⏱️ **Timeout Control**: Prevents hanging requests
  - 3-15 second timeouts based on operation type
  - Automatic cancellation of long-running operations

### Monitoring & Observability

- 📊 **Health Checks**: Comprehensive health endpoints for all services
- 📈 **Metrics**: Prometheus-compatible metrics for monitoring
- 🔎 **Distributed Tracing**: Zipkin integration for request tracing
- 📝 **Structured Logging**: Detailed logging for all operations
- 🎯 **Actuator Endpoints**: Spring Boot Actuator for runtime insights

### Multi-Language Support

- 🌍 **English**: Full internationalization support
- 🌍 **Arabic**: Complete RTL (Right-to-Left) support
- 🔄 **Dynamic Translation**: Runtime language switching
- 📚 **Translation Management**: Centralized translation data

## 🚀 Services

### Core Services

| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| **Gateway** | 6060 | Spring Cloud Gateway | API Gateway with routing, load balancing, and security |
| **Auth Service** | 6061 | Spring Boot 3.2.5 | Authentication, JWT tokens, user registration/login |
| **Access Management** | 6062 | Spring Boot 3.5.3 | User management, roles, permissions, RBAC |
| **Reference Data** | 6063 | JHipster 8.x | Reference data, code tables, organizations, locations |

### Infrastructure Services

| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| **Service Registry** | 8761 | Eureka Server | Service discovery and registration |
| **Config Server** | 8888 | Spring Cloud Config | Centralized configuration management |

### Supporting Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Core Shared Library** | Java 17 | Shared utilities for JWT handling and context management |
| **PostgreSQL** | PostgreSQL 14 | Primary data store for all services |

## 🛠️ Technology Stack

### Backend

- **Framework**: Spring Boot 3.2.5 - 3.5.3
- **Language**: Java 17 (LTS)
- **Build Tool**: Maven 3.9+
- **Database**: PostgreSQL 14+
- **ORM**: Spring Data JPA / Hibernate

### Microservices Infrastructure

- **Service Discovery**: Netflix Eureka
- **API Gateway**: Spring Cloud Gateway
- **Configuration**: Spring Cloud Config
- **Load Balancing**: Spring Cloud LoadBalancer
- **HTTP Client**: OpenFeign

### Security

- **Authentication**: Spring Security 6.x
- **Authorization**: JWT (JSON Web Tokens)
- **Token Library**: JJWT 0.12.3
- **Password Encoding**: BCrypt

### Resilience & Fault Tolerance

- **Circuit Breaker**: Resilience4j 2.2.0
- **Retry**: Exponential backoff strategy
- **Rate Limiting**: Request throttling
- **Bulkhead**: Resource isolation
- **Time Limiter**: Timeout control

### Monitoring & Observability

- **Metrics**: Micrometer + Prometheus
- **Health Checks**: Spring Boot Actuator
- **Distributed Tracing**: Zipkin + Brave
- **Logging**: SLF4J + Logback

### Containerization

- **Container Runtime**: Docker 20+
- **Orchestration**: Docker Compose
- **Base Images**: Eclipse Temurin (Alpine)
- **Multi-Stage Builds**: 3-stage optimization

### API Documentation

- **Specification**: OpenAPI 3.0 / Swagger
- **UI**: SpringDoc OpenAPI 2.6.0

## 🚀 Quick Start

### Prerequisites

- **Java**: JDK 17 or higher
- **Maven**: 3.8+ (or use included Maven wrapper)
- **Node.js**: 18+ (for React frontend)
- **Docker**: 20.10+ (for containerized deployment)
- **Docker Compose**: 2.0+ (optional, for orchestration)
- **PostgreSQL**: 14+ (if running without Docker)

### Option 1: Quick Start with PowerShell (⚡ Recommended for Development)

**The fastest way to get started on Windows:**

```powershell
# Clone the repository
git clone https://github.com/royXMaksoud/care.git
cd care

# Ensure PostgreSQL is running (localhost:5432)
# Database: cms_db, User: postgres, Password: P@ssw0rd

# Quick start (essential services only - ~1 minute)
.\QUICK_START.ps1

# OR Full startup (all infrastructure - ~3 minutes)
.\START_ALL.ps1

# Stop all services
.\STOP_ALL.ps1
```

**What QUICK_START.ps1 does:**
- ✅ Starts Gateway, Auth Service, Access Management, React Frontend
- ✅ Skips Config Server and Eureka (standalone mode)
- ✅ Perfect for daily development
- ⚡ Fast startup (~1 minute)

**What START_ALL.ps1 does:**
- ✅ Starts complete microservices infrastructure
- ✅ Includes Config Server, Eureka, all services
- ✅ Full service discovery and configuration
- ⏱️ Slower startup (~3 minutes)

📚 **For detailed instructions, see [help/docs/README_START_SERVICES.md](help/docs/README_START_SERVICES.md)**

### Option 2: Docker Compose

This is the best way for containerized deployment:

```bash
# Create environment file
cp env.template .env
# Edit .env with your configuration (optional)

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Access the services
# Gateway:    http://localhost:6060
# Eureka UI:  http://localhost:8761
# Auth API:   http://localhost:6061/swagger-ui/index.html
```

### Option 3: Manual Setup

For development or debugging, you can run services individually.

**See detailed manual setup guide:** [help/docs/README_START_SERVICES.md](help/docs/README_START_SERVICES.md)

#### Quick Manual Start:

```bash
# 1. Start PostgreSQL
# Ensure PostgreSQL is running on localhost:5432 with database 'cms_db'

# 2. Build Shared Library
cd shared-libs/core-shared-lib/core-shared-lib
mvn clean install
cd ../../..

# 3. Start Services (use correct Maven command!)
# ⚠️ Common mistake: mvn java-spring:run ❌
# ✅ Correct: mvn spring-boot:run

# Start Gateway
cd gateway-service
mvn spring-boot:run

# Start Auth Service (in new terminal)
cd auth-service/auth-service
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.cloud.config.enabled=false"

# Start Access Management (in new terminal)
cd access-management-service
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.cloud.config.enabled=false"

# Start Frontend (in new terminal)
cd web-portal
npm run dev
```

#### Verify Services

```bash
# Frontend
open http://localhost:5173

# Gateway
curl http://localhost:6060/actuator/health

# Auth Service
curl http://localhost:6061/actuator/health

# Access Management
curl http://localhost:6062/actuator/health
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file from the template:

```bash
cp env.template .env
```

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | cms_db |
| `DB_USERNAME` | Database user | postgres |
| `DB_PASSWORD` | Database password | P@ssw0rd |
| `JWT_SECRET` | JWT signing secret | (64+ character string) |
| `EUREKA_SERVER` | Eureka server URL | http://localhost:8761/eureka |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | dev |

### Spring Profiles

The system supports multiple deployment profiles:

- **dev**: Development environment (verbose logging, H2 console enabled)
- **docker**: Docker container deployment
- **prod**: Production environment (optimized, minimal logging)
- **test**: Testing environment (in-memory database)

### Service-Specific Configuration

Each service has its own `application.yml` with comprehensive configuration:

- **Resilience4j**: Circuit breakers, retry policies, rate limiters
- **Database**: Connection pooling, JPA settings
- **Security**: JWT settings, CORS configuration
- **Eureka**: Service discovery settings
- **Actuator**: Health checks and metrics endpoints

## 📚 API Documentation

### Interactive API Documentation

Each service exposes Swagger UI for interactive API exploration:

- **Auth Service**: http://localhost:6061/swagger-ui/index.html
- **Access Management**: http://localhost:6062/swagger-ui/index.html
- **Reference Data**: http://localhost:6063/swagger-ui/index.html

### Example API Calls

#### Authentication

**Register New User**

```bash
curl -X POST http://localhost:6060/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "fatherName": "Michael",
    "surname": "Doe",
    "fullName": "John Michael Doe",
    "email": "john.doe@example.com",
    "password": "SecureP@ss123",
    "confirmPassword": "SecureP@ss123",
    "type": "DOCTOR",
    "language": "en"
  }'
```

**Login**

```bash
curl -X POST http://localhost:6060/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecureP@ss123"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400000
}
```

#### Protected Endpoints

**Get User Permissions**

```bash
curl -X GET http://localhost:6060/access/api/permissions/users/{userId} \
  -H "Authorization: Bearer {your_jwt_token}"
```

**Get Code Tables**

```bash
curl -X GET http://localhost:6060/reference-data/api/code-tables \
  -H "Authorization: Bearer {your_jwt_token}"
```

## 📊 Monitoring

### Health Endpoints

All services expose comprehensive health endpoints:

```bash
# Individual service health
curl http://localhost:6061/actuator/health  # Auth
curl http://localhost:6062/actuator/health  # Access Management
curl http://localhost:6063/management/health # Reference Data
curl http://localhost:6060/actuator/health  # Gateway
curl http://localhost:8761/actuator/health  # Eureka
```

### Circuit Breaker Monitoring

Monitor circuit breaker states in real-time:

```bash
curl http://localhost:6061/actuator/circuitbreakers
curl http://localhost:6062/actuator/circuitbreakers
curl http://localhost:6060/actuator/circuitbreakers
```

### Rate Limiter Monitoring

Check rate limiter status and metrics:

```bash
curl http://localhost:6061/actuator/ratelimiters
curl http://localhost:6062/actuator/ratelimiters
curl http://localhost:6060/actuator/ratelimiters
```

### Metrics

Access Prometheus-compatible metrics:

```bash
curl http://localhost:6061/actuator/metrics
curl http://localhost:6061/actuator/prometheus
```

### Eureka Dashboard

Monitor all registered services:

```
http://localhost:8761
```

## 💻 Development

### Project Structure

```
care/
├── auth-service/              # Authentication service
│   └── auth-service/
│       ├── src/
│       ├── pom.xml
│       ├── Dockerfile
│       └── help/             # Service documentation
│
├── access-management-service/ # Access control service
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── help/
│
├── gateway-service/           # API Gateway
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── help/
│
├── reference-data-service/    # Reference data (JHipster)
│   ├── src/
│   ├── pom.xml
│   ├── Dockerfile
│   └── help/
│
├── service-registry/          # Eureka server
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── config-server/             # Config server
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
├── shared-libs/               # Shared libraries
│   └── core-shared-lib/
│       └── core-shared-lib/
│           ├── src/
│           ├── pom.xml
│           └── Dockerfile
│
├── help/                      # 📚 Documentation & Scripts Hub
│   ├── README.md             # Documentation index
│   ├── docs/                 # All documentation files
│   │   ├── README_START_SERVICES.md
│   │   ├── SERVICE_RUNBOOK.md
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   ├── TROUBLESHOOTING.md
│   │   ├── SERVICE_COMMUNICATION.md
│   │   ├── DOCUMENTATION_SUMMARY.md
│   │   └── CONTRIBUTING.md
│   └── scripts/              # Helper PowerShell scripts
│       ├── set-env.ps1
│       └── START_ALL_SERVICES.ps1 (legacy)
│
├── QUICK_START.ps1            # ⚡ Fast startup script
├── START_ALL.ps1              # 🏗️ Full startup script
├── STOP_ALL.ps1               # ❌ Stop all services
├── docker-compose.yml         # Container orchestration
├── env.template               # Environment template
└── README.md                  # This file
```

### Building from Source

#### Build All Services

```bash
# Build shared library first
cd shared-libs/core-shared-lib/core-shared-lib
mvn clean install

# Build all services from root
cd ../../..
mvn clean install
```

#### Build Individual Service

```bash
cd auth-service/auth-service
mvn clean package

# Run tests
mvn test

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=LoginServiceImplTest

# Run with coverage
mvn clean test jacoco:report
```

### Database Migrations

The system uses Liquibase for database migrations:

```bash
# Update database
mvn liquibase:update

# Rollback
mvn liquibase:rollback

# Generate changelog
mvn liquibase:diff
```

## 🐳 Deployment

### Docker Deployment

#### Build Docker Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build auth-service

# Build without cache
docker-compose build --no-cache
```

#### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres service-registry auth-service

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

#### Individual Docker Commands

```bash
# Run auth-service
docker run -d \
  -p 6061:6061 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=P@ssw0rd \
  -e JWT_SECRET=YourSecretKey \
  --name auth-service \
  code-auth-service:latest

# View logs
docker logs -f auth-service

# Stop and remove
docker stop auth-service
docker rm auth-service
```

### Kubernetes Deployment

Kubernetes manifests are available in the `k8s/` directory (coming soon).

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployments
kubectl get deployments

# Check services
kubectl get services

# Check pods
kubectl get pods
```

### Production Deployment

For production deployment:

1. **Set appropriate environment variables** in `.env`
2. **Use production database** with proper credentials
3. **Configure secrets management** (Kubernetes Secrets, Vault)
4. **Set up monitoring** (Prometheus, Grafana)
5. **Configure ingress** for external access
6. **Enable SSL/TLS** for all endpoints
7. **Set up backup strategy** for database

## 📖 Documentation

**📚 [Complete Documentation Hub](help/README.md)** - Start here for all documentation

Comprehensive documentation is organized in the `help/` directory:

### 🚀 Getting Started

- **[How to Start Services](help/docs/README_START_SERVICES.md)** - Complete startup guide (Quick/Full/Manual)
- **[Troubleshooting Guide](help/docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Deployment Guide](help/docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### 📋 Operations & Architecture

- **[Service Runbook](help/docs/SERVICE_RUNBOOK.md)** - Operations manual and API reference
- **[Service Communication](help/docs/SERVICE_COMMUNICATION.md)** - Inter-service communication patterns
- **[Documentation Summary](help/docs/DOCUMENTATION_SUMMARY.md)** - Overview of all documentation

### 👥 Contributing

- **[Contributing Guide](help/docs/CONTRIBUTING.md)** - How to contribute to the project

### 🔧 PowerShell Scripts

All startup scripts are in the root directory for quick access:
- **QUICK_START.ps1** - ⚡ Fast development startup (~1 min)
- **START_ALL.ps1** - 🏗️ Full microservices startup (~3 min)
- **STOP_ALL.ps1** - ❌ Stop all running services

Helper scripts are in `help/scripts/`:
- **set-env.ps1** - Environment variable configuration
- **START_ALL_SERVICES.ps1** - Legacy startup script (deprecated)

### 📁 Service-Specific Documentation

Each service has its own `help/` directory with:
- Service-specific guides
- API documentation
- Troubleshooting tips
- Configuration examples

## 🔒 Security

### Authentication Flow

1. User submits credentials to `/auth/login`
2. System validates credentials (with rate limiting)
3. JWT token generated with user claims
4. Token returned to client
5. Client includes token in subsequent requests
6. Gateway validates token before routing

### Security Features

- ✅ **Password Hashing**: BCrypt with configurable strength
- ✅ **JWT Tokens**: Secure tokens with expiration
- ✅ **Refresh Tokens**: Long-lived tokens for renewal
- ✅ **Rate Limiting**: Protection against brute force attacks (500 req/s)
- ✅ **Circuit Breaker**: Login protection from service failures
- ✅ **CORS Configuration**: Configurable cross-origin policies
- ✅ **SQL Injection Protection**: Parameterized queries only
- ✅ **XSS Protection**: Input validation and sanitization

### Login Protection

The login endpoint is protected with multiple Resilience4j patterns:

- **Rate Limiter**: 500 requests/second limit
- **Circuit Breaker**: Opens after 50% failure rate
- **Retry**: 3 attempts with exponential backoff
- **Bulkhead**: Maximum 20 concurrent login requests
- **Fallback**: Graceful degradation when service unavailable

## 🧪 Testing

### Health Check

```bash
# Check if all services are healthy
curl http://localhost:6060/actuator/health

# Expected response:
{
  "status": "UP",
  "components": {
    "diskSpace": {"status": "UP"},
    "ping": {"status": "UP"}
  }
}
```

### Test Login

```bash
curl -X POST http://localhost:6060/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Test Rate Limiting

```bash
# Send multiple rapid requests to test rate limiter
for i in {1..600}; do
  curl -X POST http://localhost:6060/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' &
done

# Some requests will return 429 Too Many Requests
```

### Test Circuit Breaker

```bash
# Stop database to trigger circuit breaker
docker-compose stop postgres

# Try login (will fail and open circuit)
curl -X POST http://localhost:6060/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check circuit breaker state
curl http://localhost:6061/actuator/circuitbreakers

# Restart database
docker-compose start postgres
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`mvn test`)
6. Commit your changes (`git commit -m 'Add AmazingFeature'`)
7. Push to the branch (`git push origin feature/AmazingFeature`)
8. Open a Pull Request

### Code Standards

- Follow Java coding conventions
- Write unit tests for new code (minimum 80% coverage)
- Update documentation for API changes
- Use meaningful commit messages
- Keep pull requests focused and small

### Pull Request Process

1. Update the README.md with details of changes if needed
2. Update service documentation in `help/` directories
3. Ensure Docker images build successfully
4. All tests must pass
5. Request review from maintainers

## 📄 License

This project is proprietary software developed for Care Management System.  
All rights reserved.

## 📞 Support

For support, questions, or feature requests:

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and general discussion
- **Email**: contact@care-system.com (if applicable)

## 🙏 Acknowledgments

### Technologies

- [Spring Boot](https://spring.io/projects/spring-boot) - Application framework
- [Spring Cloud](https://spring.io/projects/spring-cloud) - Microservices infrastructure
- [Resilience4j](https://resilience4j.readme.io/) - Fault tolerance library
- [JHipster](https://www.jhipster.tech/) - Reference data service generator
- [PostgreSQL](https://www.postgresql.org/) - Database system

### Libraries & Tools

- Spring Security, Spring Data JPA, OpenFeign
- Lombok, MapStruct, Liquibase
- Docker, Docker Compose
- Maven, SpringDoc OpenAPI

## 📈 Roadmap

### Current Version (1.0.0)

- ✅ Core microservices architecture
- ✅ JWT authentication and authorization
- ✅ Resilience4j fault tolerance
- ✅ Docker containerization
- ✅ Comprehensive documentation

### Upcoming Features

- 🔲 Kubernetes deployment manifests
- 🔲 CI/CD pipelines (GitHub Actions)
- 🔲 Prometheus + Grafana monitoring
- 🔲 ELK Stack for centralized logging
- 🔲 API versioning
- 🔲 GraphQL support
- 🔲 WebSocket support for real-time updates
- 🔲 Multi-tenancy support
- 🔲 Advanced audit logging
- 🔲 OAuth2 / OIDC integration

## 📊 Project Stats

- **Services**: 6 microservices + 1 shared library
- **Lines of Code**: 15,000+
- **API Endpoints**: 50+
- **Documentation Files**: 40+
- **Docker Images**: 6 optimized images
- **Test Coverage**: 70%+

---

<div align="center">

**Built with ❤️ for Healthcare Management**

[Report Bug](https://github.com/royXMaksoud/care/issues) · [Request Feature](https://github.com/royXMaksoud/care/issues) · [Documentation](./help)

**⭐ Star this repo if you find it helpful!**

</div>


# Care Management System - Complete Project Overview

## Project Summary
The Care Management System is a comprehensive, enterprise-grade microservices-based application designed to provide humanitarian services for displaced persons and refugees. It includes a complete backend microservices architecture, configuration management, service discovery, and multiple client applications (web and mobile).

## Technology Stack Overview

### Backend Services
- **Java 17 LTS** - Primary backend language
- **Spring Boot 3.2.5 - 3.5.6** - Microservice framework
- **Spring Cloud** (versions 2023.0.3 - 2025.0.0) - Cloud-native patterns
- **PostgreSQL 14+** - Primary data store
- **Maven 3.9+** - Build and dependency management

### Frontend Applications
- **React 19.1.1** - Web portal UI framework
- **Flutter 3.27.2** - Mobile app framework
- **TypeScript** - Web portal type safety
- **Dart 3.6.1** - Mobile app language

### Infrastructure & DevOps
- **Docker & Docker Compose** - Containerization
- **Netflix Eureka** - Service discovery
- **Spring Cloud Gateway** - API Gateway
- **Spring Cloud Config** - Centralized configuration

### Monitoring & Resilience
- **Micrometer Tracing (Zipkin)** - Distributed tracing
- **Spring Boot Actuator** - Application monitoring
- **Resilience4j** - Fault tolerance patterns
- **Redis** - Caching and distributed rate limiting

## Project Directory Structure

```
Code/
├── Backend Microservices/
│   ├── gateway-service/                 # API Gateway (Port 6060)
│   ├── auth-service/                    # Authentication (Port 6061)
│   ├── access-management-service/       # Authorization/RBAC (Port 6062)
│   ├── reference-data-service/          # Master data (Port 6063)
│   ├── appointment-service/             # Appointments (Port 6064)
│   ├── data-analysis-service/           # Analytics/Reporting
│   ├── chatbot-service/                 # Conversational AI (Port 6066)
│   │
│   ├── service-registry/                # Eureka Server (Port 8761)
│   ├── config-server/                   # Configuration Server (Port 8888)
│   │
│   └── shared-libs/                     # Shared Libraries
│       └── core-shared-lib/             # Core utilities JAR
│
├── Frontend Applications/
│   ├── web-portal/                      # React web application
│   └── care-mobile-app/                 # Flutter mobile app
│
├── Configuration/
│   ├── docker-compose.yml               # Container orchestration
│   ├── GITHUB_CONFIG_FILES/            # Service-specific configs
│   └── config-server/config/            # Centralized configs
│
├── Documentation & Setup/
│   ├── README.md                        # Main project readme
│   ├── QUICK_START.ps1                  # Quick start script
│   ├── START_ALL.ps1                    # Start all services
│   ├── STOP_ALL.ps1                     # Stop all services
│   └── help/                            # Additional documentation
│
└── Shared Resources/
    ├── claude.md                        # This file (project overview)
    ├── .claude/settings.local.json      # Claude Code settings
    └── [service-specific claude.md]     # Individual service docs
```

## Complete Service Listing

### Core Microservices (7 Services)

#### 1. **Gateway Service** (`gateway-service/`)
- **Port**: 6060
- **Framework**: Spring Boot 3.5.3 + Spring Cloud Gateway WebFlux
- **Purpose**: Central API gateway, request routing, load balancing, rate limiting
- **Key Tech**: Reactive WebFlux, Resilience4j, Redis, JWT validation
- **Documentation**: [gateway-service/claude.md](gateway-service/claude.md)

#### 2. **Auth Service** (`auth-service/auth-service/`)
- **Port**: 6061
- **Framework**: Spring Boot 3.2.5 + Spring Security
- **Purpose**: User authentication, JWT token generation, password management
- **Key Tech**: JWT (JJWT), BCrypt, OpenFeign, PostgreSQL
- **Documentation**: [auth-service/auth-service/claude.md](auth-service/auth-service/claude.md)

#### 3. **Access Management Service** (`access-management-service/`)
- **Port**: 6062
- **Framework**: Spring Boot 3.4.5
- **Purpose**: Role-based access control, permission management, authorization
- **Key Tech**: Spring Security, JPA, PostgreSQL, MapStruct
- **Documentation**: [access-management-service/claude.md](access-management-service/claude.md)

#### 4. **Reference Data Service** (`reference-data-service/`)
- **Port**: 6063
- **Framework**: Spring Boot 3.4.5 + JHipster 8.11.0
- **Purpose**: Master data management (code tables, organizations, locations, translations)
- **Key Tech**: Liquibase, Undertow, TestContainers
- **Documentation**: [reference-data-service/claude.md](reference-data-service/claude.md)

#### 5. **Appointment Service** (`appointment-service/`)
- **Port**: 6064
- **Framework**: Spring Boot 3.4.5
- **Purpose**: Healthcare appointment scheduling and management
- **Key Tech**: JPA, PostgreSQL, OpenFeign
- **Documentation**: [appointment-service/claude.md](appointment-service/claude.md)

#### 6. **Data Analysis Service** (`data-analysis-service/`)
- **Port**: 6065
- **Framework**: Spring Boot 3.3.5
- **Purpose**: Analytics, reporting, and business intelligence
- **Key Tech**: Apache POI, Apache Commons CSV, Data aggregation
- **Documentation**: [data-analysis-service/claude.md](data-analysis-service/claude.md)

#### 7. **Chatbot Service** (`chatbot-service/`)
- **Port**: 6066
- **Framework**: Spring Boot 3.2.0
- **Purpose**: Conversational AI and chatbot functionality
- **Key Tech**: Clean Architecture, JWT, OAuth2 Resource Server
- **Documentation**: [chatbot-service/claude.md](chatbot-service/claude.md)

### Infrastructure Services (2 Services)

#### 8. **Service Registry (Eureka)** (`service-registry/`)
- **Port**: 8761
- **Framework**: Spring Boot 3.5.6 + Netflix Eureka Server
- **Purpose**: Service discovery and dynamic registration
- **Dashboard**: http://localhost:8761/
- **Documentation**: [service-registry/claude.md](service-registry/claude.md)

#### 9. **Config Server** (`config-server/`)
- **Port**: 8888
- **Framework**: Spring Boot 3.3.5 + Spring Cloud Config Server
- **Purpose**: Centralized configuration management for all services
- **Profiles**: dev, docker, prod
- **Documentation**: [config-server/claude.md](config-server/claude.md)

### Shared Library (1 Library)

#### 10. **Core Shared Library** (`shared-libs/core-shared-lib/core-shared-lib/`)
- **Type**: Maven JAR Library
- **Purpose**: Common utilities across all services (JWT, Security Context, DTOs, Exceptions)
- **Version**: 0.0.1-SNAPSHOT
- **Documentation**: [shared-libs/core-shared-lib/core-shared-lib/claude.md](shared-libs/core-shared-lib/core-shared-lib/claude.md)

### Client Applications (2 Applications)

#### 11. **Web Portal** (`web-portal/`)
- **Framework**: React 19.1.1 + Vite + TypeScript
- **Technology**: TailwindCSS, Ant Design Pro, TanStack Query, i18next
- **Purpose**: Administrative web interface for all system services
- **Languages**: English, Arabic (RTL support)
- **Documentation**: [web-portal/claude.md](web-portal/claude.md)

#### 12. **Care Mobile App** (`care-mobile-app/`)
- **Framework**: Flutter 3.27.2 + Dart 3.6.1
- **State Management**: GetX
- **Architecture**: Clean Architecture
- **Platforms**: Android (min SDK 21), iOS
- **Features**: Voice assistance, appointments, messaging, financial services
- **Languages**: English, Arabic (RTL support)
- **Documentation**: [care-mobile-app/claude.md](care-mobile-app/claude.md)

## Architecture Overview

### Microservices Architecture Pattern
```
┌─────────────────────────────────────────────────────────┐
│ Client Applications (Web Portal, Mobile App)             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│ API Gateway Service (Port 6060)                         │
│ - Request Routing                                        │
│ - Load Balancing                                         │
│ - JWT Validation                                         │
│ - Rate Limiting                                          │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
             ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────┐
│ Core Services        │      │ Domain Services          │
│ - Auth Service       │      │ - Appointment Service    │
│ - Access Mgmt        │      │ - Reference Data Service │
│ - Chatbot Service    │      │ - Data Analysis Service  │
└──────────────────────┘      └──────────────────────────┘

Infrastructure:
┌──────────────────────┬──────────────────────┬─────────────┐
│ Service Registry     │ Config Server        │ PostgreSQL  │
│ (Eureka 8761)        │ (Port 8888)         │ Database    │
└──────────────────────┴──────────────────────┴─────────────┘

Cross-Cutting Concerns:
- Distributed Tracing (Zipkin)
- Circuit Breaking (Resilience4j)
- Caching (Redis)
- Audit Logging
```

## Technology Stack by Layer

### Presentation Layer
- **Web**: React 19.1.1, TypeScript, TailwindCSS
- **Mobile**: Flutter 3.27.2, Dart 3.6.1, GetX
- **API Documentation**: SpringDoc OpenAPI, Swagger UI

### API Gateway Layer
- **Spring Cloud Gateway** WebFlux for async, non-blocking requests
- **Rate Limiting**: Redis-backed distributed rate limiting
- **Load Balancing**: Spring Cloud Load Balancer with Eureka
- **Circuit Breaking**: Resilience4j circuit breaker pattern

### Service Layer
- **Spring Boot 3.2.5 - 3.5.6** - Microservice framework
- **Spring Security** - Authentication and authorization
- **OpenFeign** - Service-to-service communication
- **Resilience4j** - Fault tolerance (circuit breaker, retry, timeout, bulkhead)

### Data Layer
- **Spring Data JPA** - ORM and database access
- **PostgreSQL** - Primary relational database
- **H2 Database** - Development and testing
- **Liquibase** - Database schema versioning (Reference Data Service)

### Infrastructure Layer
- **Netflix Eureka** - Service discovery and registration
- **Spring Cloud Config** - Centralized configuration
- **Micrometer Tracing (Zipkin)** - Distributed tracing
- **Spring Boot Actuator** - Health checks and metrics

### Cross-Cutting Services
- **JWT (JJWT)** - Token-based authentication
- **BCrypt** - Password hashing
- **MapStruct** - DTO mapping
- **Lombok** - Code generation

## Inter-Service Communication

### Service Topology
```
Web Portal / Mobile App
    │
    └──▶ API Gateway (6060)
         │
         ├──▶ Auth Service (6061)
         │
         ├──▶ Access Management (6062)
         │
         ├──▶ Reference Data Service (6063)
         │
         ├──▶ Appointment Service (6064)
         │
         ├──▶ Data Analysis Service (6065)
         │
         └──▶ Chatbot Service (6066)

All Services:
- Register with Eureka (8761)
- Fetch config from Config Server (8888)
- Use OpenFeign for inter-service calls
```

### Service Discovery Flow
1. Service starts up
2. Service registers with Eureka (advertises hostname, port, metadata)
3. Service fetches configuration from Config Server
4. Service connects to PostgreSQL database
5. Other services discover this service via Eureka
6. Service-to-service calls use OpenFeign with Eureka-discovered URLs

## Database Schema

### Primary Database: PostgreSQL
All services connect to PostgreSQL with their own schemas/databases:

**Auth Service Database**:
- users, user_roles, tokens, login_history

**Access Management Database**:
- roles, permissions, role_permissions, user_roles, permission_scopes

**Reference Data Database**:
- code_tables, code_table_entries, organizations, locations, duty_stations, employees

**Appointment Service Database**:
- appointments, appointment_status, provider_availability

**Data Analysis Service Database**:
- reports, analytics_cache, metric_snapshots, export_jobs

## Security Architecture

### Authentication Flow
```
User Login Request
    │
    ▼
API Gateway → Auth Service
    │
    ▼
JWT Token Generated (BCrypt validated password)
    │
    ▼
Token Returned to Client
    │
    ▼
Token Stored (localStorage for web, secure storage for mobile)
    │
    ▼
Subsequent Requests Include Token in Authorization Header
    │
    ▼
API Gateway Validates Token
    │
    ▼
Request Routed to Service with User Context
```

### Authorization Flow
```
Authenticated Request with JWT Token
    │
    ▼
API Gateway Extracts User Info from Token
    │
    ▼
Access Management Service Validates Permissions
    │
    ▼
Permission Check:
- User Has Role?
- Role Has Permission?
- Permission Scoped to Resource?
    │
    ▼
Access Granted/Denied
```

## Resilience & Fault Tolerance

### Resilience4j Patterns (All Services)
1. **Circuit Breaker**: Prevent cascading failures
   - Default: CLOSED → OPEN → HALF_OPEN → CLOSED
   - Monitors failure rate and slow call rate

2. **Retry**: Automatic retry on transient failures
   - Exponential backoff
   - Max retry attempts

3. **Rate Limiter**: Prevent overload
   - Sliding window counter
   - Permission-based access

4. **Bulkhead**: Thread pool isolation
   - Limits concurrent requests
   - Prevents resource exhaustion

5. **Time Limiter**: Timeout protection
   - Future-based timeout
   - Prevents hanging requests

## Deployment Architecture

### Docker Containers
- Each service runs in its own container
- PostgreSQL in dedicated container
- Redis for distributed caching
- Docker Compose orchestrates multi-container setup

### Configuration Profiles
- **dev**: Local development with fast refresh
- **docker**: Container-based deployment
- **prod**: Production-optimized settings

### Service Startup Order
1. PostgreSQL database
2. Service Registry (Eureka)
3. Config Server
4. Individual services (can start in any order after Eureka and Config)
5. API Gateway (after other services register)

## Key Features by Domain

### User Management
- User registration and authentication
- Role-based access control
- Permission management
- User profile management
- Multi-tenant support

### Appointment Management
- Schedule appointments
- Track appointment status
- Manage provider availability
- Prevent booking conflicts
- Appointment history

### Reference Data
- Code table management
- Organizational structure
- Geographic locations
- Staff/employee records
- Translations (multi-language support)

### Analytics & Reporting
- Generate custom reports
- Export in multiple formats (Excel, CSV, PDF)
- Dashboard metrics
- Trend analysis
- Statistical calculations

### Chatbot & Voice
- Conversational AI
- Voice-based assistance
- Intent recognition
- Session management
- Fallback handling

## Internationalization (i18n)

### Web Portal
- English (en) and Arabic (ar)
- RTL layout for Arabic
- Translation files: `web-portal/src/locales/`

### Mobile App
- English (en) and Arabic (ar)
- RTL layout for Arabic
- Voice support for both languages
- Translation files: `care-mobile-app/assets/translations/`

## Getting Started

### Prerequisites
- Java 17 JDK
- Maven 3.9+
- PostgreSQL 14+
- Node.js 18+ (for web portal)
- Flutter 3.27.2 (for mobile app)
- Docker & Docker Compose (recommended)

### Quick Start Steps
1. Clone repository
2. Start infrastructure (PostgreSQL, Eureka, Config Server)
3. Start microservices in order
4. Start web portal or mobile app
5. Access web portal at `http://localhost:3000` or mobile app

### Comprehensive Scripts
- **QUICK_START.ps1**: Basic project setup
- **START_ALL.ps1**: Start all services
- **STOP_ALL.ps1**: Stop all services
- **BUILD_APK.ps1** (mobile): Build Android app

## Documentation Organization

Each service and application has its own `claude.md` file:

```
Backend Services:
- gateway-service/claude.md
- auth-service/auth-service/claude.md
- access-management-service/claude.md
- reference-data-service/claude.md
- appointment-service/claude.md
- data-analysis-service/claude.md
- chatbot-service/claude.md
- service-registry/claude.md
- config-server/claude.md
- shared-libs/core-shared-lib/core-shared-lib/claude.md

Client Applications:
- web-portal/claude.md
- care-mobile-app/claude.md

Project Root:
- claude.md (this file - overall architecture)
```

## Common Development Tasks

### Adding a New Microservice
1. Create new directory following naming pattern
2. Set up Maven pom.xml with Spring Boot dependencies
3. Create Spring Boot application class
4. Add service to Eureka registration
5. Create configuration files
6. Register routes in API Gateway
7. Update docker-compose.yml
8. Create claude.md documentation

### Adding New Feature to Web Portal
1. Create component in appropriate module
2. Add route in routing configuration
3. Connect to backend API via Axios
4. Add translations for all languages
5. Update permissions if needed
6. Test in both languages

### Adding New Feature to Mobile App
1. Create new module with binding, controller, view
2. Add routes to app_pages.dart
3. Implement using GetX patterns
4. Add translations to .json files
5. Handle RTL layout for Arabic
6. Test on both platforms

### Database Changes
1. Create migration script or SQL file
2. If using Liquibase: create changelog file
3. Update entity classes
4. Update repository interfaces
5. Test with PostgreSQL

## Monitoring & Observability

### Health Checks
- All services expose `/actuator/health` endpoint
- Gateway monitors downstream service health
- Eureka performs regular health checks

### Metrics & Monitoring
- Micrometer Tracing with Zipkin for distributed tracing
- Spring Boot Actuator metrics
- Response time tracking
- Error rate monitoring
- Request volume tracking

### Logging
- SLF4J with configurable appenders
- Centralized logging (optional with ELK)
- Request tracing IDs for correlation

## Best Practices

### Code Quality
- Use provided Lombok annotations for cleaner code
- MapStruct for safe DTO mapping
- Spring Validation for input validation
- OpenFeign for service-to-service calls

### Security
- Never commit credentials or secrets
- Use Config Server for environment-specific settings
- Always validate and sanitize user input
- Use HTTPS in production
- Implement proper error handling (no sensitive data in errors)

### Performance
- Use Resilience4j for fault tolerance
- Cache frequently accessed data (Redis)
- Implement pagination for large datasets
- Use appropriate database indexing
- Profile and optimize bottlenecks

### Maintainability
- Keep services loosely coupled
- Use shared library for common code
- Document API endpoints thoroughly
- Write comprehensive tests
- Follow Spring Boot conventions

## Support & Troubleshooting

### Common Issues
- Services not registering with Eureka: Check Config Server connectivity
- Config not loading: Verify bootstrap.yml configuration
- Database connection errors: Check PostgreSQL status and credentials
- CORS errors: Verify Gateway CORS configuration
- Authentication failures: Check JWT secret configuration

### Useful Commands
```bash
# Check service status
curl http://localhost:8761/

# View specific service config
curl http://localhost:8888/auth-service/default

# Health check
curl http://localhost:6060/actuator/health

# Service logs
docker logs <service-container-name>
```

## Performance Tuning

### Gateway Optimization
- Redis caching for rate limiting
- Connection pooling for backend services
- WebFlux for non-blocking I/O

### Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling (HikariCP)
- Query optimization
- Lazy loading for large associations

### Application Optimization
- Circuit breaker to prevent cascading failures
- Bulkhead to isolate resources
- Time limiter to prevent hanging requests
- Retry with exponential backoff

## Release & Deployment

### Build Process
- Maven builds JAR files
- Docker images built via Jib plugin
- React build via Vite
- Flutter build for Android APK and iOS app

### Deployment Steps
1. Build all services
2. Tag Docker images with version
3. Push to registry
4. Update docker-compose with new versions
5. Deploy and verify health checks

## Version Information
- Java: 17 LTS
- Spring Boot: 3.2.5 - 3.5.6
- Spring Cloud: 2023.0.3 - 2025.0.0
- React: 19.1.1
- Flutter: 3.27.2
- PostgreSQL: 14+

## Additional Resources
- Individual service documentation in respective claude.md files
- Configuration examples in GITHUB_CONFIG_FILES/
- Docker setup in docker-compose.yml
- Setup guides in help/ directory

---

This is a comprehensive enterprise-grade microservices application designed for scalability, maintainability, and high availability. Each service is independently deployable while maintaining strong integration through the API Gateway and service discovery patterns.

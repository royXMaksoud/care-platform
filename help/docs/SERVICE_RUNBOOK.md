# Service Runbook

Complete guide to understanding, running, and managing each microservice in the CARE platform.

## 📚 Quick Reference

| Service | Port | Purpose | Database | Status |
|---------|------|---------|----------|--------|
| **Service Registry** | 8761 | Service discovery (Eureka) | N/A | Infrastructure |
| **Config Server** | 8888 | Centralized configuration | N/A | Infrastructure |
| **API Gateway** | 6060 | Request routing & security | N/A | Core |
| **Auth Service** | 6061 | Authentication & JWT tokens | cms_db | Core |
| **Access Management** | 6062 | Permissions & RBAC | cms_db | Core |
| **Reference Data Service** | Dynamic | Lookup tables & code values | referenceDataService | Support |
| **Appointment Service** | Dynamic | Appointment scheduling | Dynamic | Support |
| **Data Analysis Service** | 6072 | Data analysis & reports | das_db | Support |
| **Web Portal** | 5173 | React frontend | N/A | Frontend |
| **Mobile App** | N/A | Flutter mobile app | N/A | Frontend |

---

## 🏛️ Infrastructure Services

### Service Registry (Eureka)
**Purpose:** Dynamic service discovery and health monitoring
**Port:** `8761`
**Key Features:**
- Auto-registers all microservices
- Monitors service health
- Provides dynamic service location

**Run Locally:**
```bash
cd service-registry
mvn clean install
mvn spring-boot:run
# Access at: http://localhost:8761
```

**Health Check:**
```bash
curl http://localhost:8761/actuator/health
```

**Monitor Services:**
Navigate to http://localhost:8761 in browser to see:
- Registered services
- Instance status
- Last heartbeat

---

### Config Server
**Purpose:** Centralized configuration management
**Port:** `8888`
**Key Features:**
- Git-based configuration (external repo)
- Supports multiple profiles (dev, prod, docker)
- Environment variable overrides

**Run Locally:**
```bash
cd config-server
mvn clean install
mvn spring-boot:run
# Access at: http://localhost:8888
```

**Configuration Sources:**
1. **Git Repository:** `https://github.com/royXMaksoud/care-config-repo`
   - Stores environment-specific configs
   - Auth service config
   - Gateway service config
   - Other service configs

2. **Native/Classpath:**
   - Fallback to local `application.yml` if Git unavailable

**Health Check:**
```bash
curl http://localhost:8888/actuator/health
```

**Fetch Service Config:**
```bash
# Get auth-service config
curl http://localhost:8888/auth-service/default

# Get specific profile
curl http://localhost:8888/auth-service/prod
```

---

## 🔐 Core Security Services

### Auth Service
**Purpose:** User authentication, JWT token generation, OAuth2 support
**Port:** `6061`
**Database:** `cms_db`
**Key Features:**
- JWT token generation & validation
- OAuth2 flow support
- User credential management
- Permission caching (900s TTL)
- Integration with Access Management

**Run Locally:**
```bash
cd auth-service/auth-service
mvn clean install
mvn spring-boot:run
```

**Key Endpoints:**
```
POST   /auth/login              → Authenticate user, return JWT
POST   /auth/validate           → Validate JWT token
POST   /auth/refresh            → Refresh expired token
GET    /auth/profile            → Get current user profile
POST   /auth/logout             → Invalidate token
GET    /actuator/health         → Service health
```

**Database Schema:**
- `users` → User credentials
- `user_permissions` → User-role associations
- `tokens` (cache) → Active JWT tokens

**Configuration:**
```yaml
# Location: config-server (external Git repo)
jwt:
  secret: "${JWT_SECRET}"           # 64+ chars
  expiration: 86400000              # 24 hours (ms)
  refresh-expiration: 2592000000    # 30 days (ms)
```

**Typical Flow:**
1. User sends credentials to `/auth/login`
2. Auth Service validates against database
3. Generates JWT token with user info
4. Caches token in Redis/memory
5. Returns token to client
6. Client includes token in `Authorization: Bearer <token>` header
7. Gateway validates token via Auth Service

**Health Check:**
```bash
curl http://localhost:6061/actuator/health
curl http://localhost:6061/actuator/metrics
```

---

### Access Management Service
**Purpose:** Role-based access control (RBAC), permission management
**Port:** `6062`
**Database:** `cms_db` (shared with Auth)
**Key Features:**
- User role assignment
- Permission definition & assignment
- Fine-grained access control
- Action-scope hierarchy management
- Integration with Auth Service

**Run Locally:**
```bash
cd access-management-service
mvn clean install
mvn spring-boot:run
```

**Key Endpoints:**
```
GET    /access/permissions/{userId}    → Get user permissions
GET    /access/roles                    → List all roles
GET    /access/actions                  → List available actions
POST   /access/assign-role             → Assign role to user
POST   /access/revoke-role             → Remove role from user
GET    /actuator/health                → Service health
```

**Database Schema:**
- `roles` → Role definitions
- `permissions` → Permission definitions
- `user_roles` → User-role mappings
- `action_scope_hierarchy` → Action-scope relationships

**Integration:**
- **Calls Auth Service:** To validate user and cache permissions
- **Called By:** Gateway for authorization checks
- **Used By:** All services to check user permissions

**Typical Permission Check Flow:**
```
1. User makes API request with JWT token
2. Gateway extracts JWT and calls Access Management
3. Access Management asks Auth Service to validate token
4. Auth Service returns user info
5. Access Management queries permissions from DB
6. Caches result (900s TTL)
7. Returns permission list to Gateway
8. Gateway allows/denies request
```

**Health Check:**
```bash
curl http://localhost:6062/actuator/health
curl -H "Authorization: Bearer <token>" http://localhost:6062/access/permissions/user-id
```

---

## 🌍 Support Services

### Reference Data Service
**Purpose:** Provides lookup tables, code values, and reference data
**Port:** Dynamic (via Eureka)
**Database:** `referenceDataService`
**Technology:** JHipster framework + Liquibase migrations

**Key Data:**
- Countries & regions
- Organizations & branches
- Code tables (status codes, types, etc.)
- Locations & duty stations
- Dynamic dropdowns for UI

**Run Locally:**
```bash
cd reference-data-service
mvn clean install
mvn spring-boot:run
```

**Key Endpoints:**
```
GET    /api/countries              → List countries
GET    /api/organizations          → List organizations
GET    /api/code-values/{type}    → Get code table values
GET    /api/branches              → List organization branches
GET    /api/locations             → List locations
```

**Database Migrations:**
- Managed by Liquibase
- Migration files in `src/main/resources/db/changelog/`
- Auto-applied on startup

**Health Check:**
```bash
curl http://service-registry:8761/eureka/apps/reference-data-service
# Then get dynamic port and check health
curl http://localhost:DYNAMIC_PORT/actuator/health
```

---

### Appointment Service
**Purpose:** Appointment scheduling and management
**Port:** Dynamic (via Eureka)
**Database:** Dynamic

**Key Features:**
- Appointment creation & updates
- Calendar management
- Appointment status tracking
- Booking availability

**Run Locally:**
```bash
cd appointment-service
mvn clean install
mvn spring-boot:run
```

**Key Endpoints:**
```
GET    /api/appointments                    → List appointments
POST   /api/appointments                    → Create appointment
GET    /api/appointments/{id}              → Get appointment details
PUT    /api/appointments/{id}              → Update appointment
DELETE /api/appointments/{id}              → Cancel appointment
GET    /api/appointments/availability     → Check availability
```

**Health Check:**
```bash
# First find dynamic port from Eureka
curl http://localhost:8761/eureka/apps/appointment-service
```

---

### Data Analysis Service (DAS)
**Purpose:** Data analysis, file processing, and report generation
**Port:** `6072`
**Database:** `das_db`
**Key Features:**
- File upload & processing (Excel, CSV)
- Data analysis & aggregation
- Report generation
- File storage management
- Max file size: 200MB

**Run Locally:**
```bash
cd data-analysis-service
mvn clean install
mvn spring-boot:run
```

**Key Endpoints:**
```
POST   /das/upload                      → Upload file for analysis
POST   /das/analyze                     → Analyze uploaded file
GET    /das/reports/{reportId}         → Get analysis report
GET    /das/reports                     → List all reports
DELETE /das/reports/{reportId}         → Delete report
GET    /actuator/health                → Service health
```

**File Processing:**
- **Formats Supported:** .xlsx, .csv, .xls
- **Max Size:** 200MB
- **Processing:**
  1. User uploads file via `/das/upload`
  2. Service validates & parses file
  3. Performs analysis/aggregation
  4. Stores results in `das_db`
  5. Returns report ID

**Configuration:**
```yaml
das:
  upload:
    max-file-size: 200MB
    allowed-types: "*.xlsx, *.csv, *.xls"
  storage:
    path: "/data/uploads"
```

**Database Schema:**
- `reports` → Report metadata
- `analysis_results` → Analysis data
- `file_storage` → Uploaded files

**Health Check:**
```bash
curl http://localhost:6072/actuator/health
curl http://localhost:6072/actuator/metrics
```

---

## 🌐 API Gateway

**Purpose:** Central entry point, routing, CORS, rate limiting
**Port:** `6060`
**Technology:** Spring Cloud Gateway (WebFlux/Reactive)

**Key Features:**
- Request routing to microservices
- CORS handling
- Rate limiting
- Circuit breaker integration
- Request/response logging
- Authentication token validation

**Run Locally:**
```bash
cd gateway-service
mvn clean install
mvn spring-boot:run
```

**Routing Rules:**
```
/auth/**              → Auth Service (6061)
/access/**           → Access Management (6062)
/appointment/**      → Appointment Service (dynamic)
/das/**              → Data Analysis Service (6072)
/reference/**        → Reference Data Service (dynamic)
/v3/api-docs/**      → OpenAPI documentation
/actuator/**         → Monitoring endpoints
```

**CORS Configuration:**
```yaml
cors:
  allowed-origins:
    - "http://localhost:3000"      # Web portal
    - "http://localhost:5173"      # Vite dev server
    - "http://localhost:5174"      # Alternative dev port
  allowed-methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH"
  allowed-headers: "Content-Type, Authorization"
  credentials: true
  max-age: 3600
```

**Request Flow:**
```
1. Client sends request to http://localhost:6060/auth/login
2. Gateway receives request
3. Checks CORS headers
4. Applies rate limiting
5. Routes to Auth Service (6061)
6. Returns response to client
```

**Rate Limiting:**
```yaml
resilience4j:
  ratelimiter:
    instances:
      default:
        register-health-indicator: true
        limit-periodic-invocations: 2000
        limit-refresh-period: 1m
```

**Circuit Breaker:**
```yaml
resilience4j:
  circuitbreaker:
    instances:
      default:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 60s
        sliding-window-size: 10
```

**Health Check:**
```bash
curl http://localhost:6060/actuator/health
```

---

## 💻 Frontend Services

### Web Portal
**Purpose:** React-based web application for healthcare management
**Port:** `5173` (Vite dev server) / `80` (production)
**Technology:** React 19 + TypeScript + Vite + Ant Design

**Key Features:**
- User authentication & login
- Dashboard & analytics
- User management
- Role & permission management
- Code table management
- Tenant management
- Arabic (RTL) & English support
- Real-time data tables

**Run Locally:**
```bash
cd web-portal
npm install
npm run dev
# Access at: http://localhost:5173
```

**Build for Production:**
```bash
npm run build
# Output: dist/ folder
```

**Key Pages:**
- `/login` → User authentication
- `/dashboard` → Analytics & overview
- `/users` → User management
- `/roles` → Role management
- `/permissions` → Permission configuration
- `/tenants` → Tenant management
- `/code-tables` → Manage code values

**Environment Configuration:**
```
.env.development    → Dev API endpoints
.env.production     → Prod API endpoints
```

**Health Check:**
```bash
# Check if portal is accessible
curl http://localhost:5173
```

---

### Mobile App
**Purpose:** Flutter-based mobile application
**Technology:** Flutter (Dart)
**Platforms:** iOS & Android

**Build & Run:**
```bash
cd care-mobile-app
flutter pub get
flutter run       # Run on connected device/emulator
```

**Build for Release:**
```bash
# Android
flutter build apk --release

# iOS
flutter build ipa --release
```

---

## 📊 Shared Library

**Location:** `shared-libs/core-shared-lib/`
**Purpose:** Common utilities used by all services

**Core Components:**
- JWT utilities & token validation
- Security filters & authentication
- CRUD patterns & base classes
- Exception handling & custom exceptions
- Validation utilities
- Internationalization (i18n)
- Context management (CurrentUserContext)
- DTO definitions

**Usage in Services:**
```xml
<dependency>
    <groupId>com.sharedlib</groupId>
    <artifactId>core-shared-lib</artifactId>
    <version>0.0.1-SNAPSHOT</version>
</dependency>
```

---

## 🚀 Starting All Services Locally

### Option 1: Using Docker Compose (Recommended)
```bash
cd /c/Java/care/Code
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f auth-service
```

### Option 2: Using PowerShell Script
```powershell
cd C:\Java\care\Code
./START_ALL_SERVICES.ps1
```

### Option 3: Manual Terminal Windows
Open separate terminals and run:
```bash
# Terminal 1: Service Registry
cd service-registry && mvn spring-boot:run

# Terminal 2: Config Server
cd config-server && mvn spring-boot:run

# Terminal 3: API Gateway
cd gateway-service && mvn spring-boot:run

# Terminal 4: Auth Service
cd auth-service/auth-service && mvn spring-boot:run

# Terminal 5: Access Management
cd access-management-service && mvn spring-boot:run

# Terminal 6: Data Analysis
cd data-analysis-service && mvn spring-boot:run

# Terminal 7: Web Portal
cd web-portal && npm run dev
```

---

## 🔍 Monitoring & Health Checks

### All Services Health Status
```bash
# Via Gateway
curl http://localhost:6060/actuator/health

# Individual services
curl http://localhost:6061/actuator/health  # Auth
curl http://localhost:6062/actuator/health  # Access Mgmt
curl http://localhost:6072/actuator/health  # DAS
curl http://localhost:8761/actuator/health  # Eureka
curl http://localhost:8888/actuator/health  # Config Server
```

### Metrics
```bash
# Via Gateway
curl http://localhost:6060/actuator/metrics

# Prometheus format
curl http://localhost:6060/actuator/prometheus
```

### Service Registry
```bash
# View all registered services
http://localhost:8761

# API view
curl http://localhost:8761/eureka/apps
```

---

## 🛠️ Common Operations

### Check Service Status
```bash
# Via Eureka dashboard
curl http://localhost:8761/eureka/apps

# Via Gateway health
curl http://localhost:6060/actuator/health
```

### View Service Logs
```bash
# Docker
docker-compose logs -f service-name

# Console output (if running in terminal)
# Logs appear directly in the terminal
```

### Restart a Service
```bash
# Docker
docker-compose restart auth-service

# Manual: Stop (Ctrl+C) and run again
cd auth-service/auth-service && mvn spring-boot:run
```

### Stop All Services
```bash
# Docker
docker-compose down

# Manual: Ctrl+C in each terminal
```

---

## 🐛 Debugging

### Enable Debug Logging
Edit `application.yml`:
```yaml
logging:
  level:
    root: INFO
    com.care: DEBUG
    org.springframework.security: DEBUG
    org.springframework.web: DEBUG
```

### View Active Configuration
```bash
curl http://localhost:8888/auth-service/default | jq
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost

# List databases
\l

# Connect to cms_db
\c cms_db
\dt  # List tables
```

### Service Discovery Issues
```bash
# Check Eureka registration
curl http://localhost:8761/eureka/apps/auth-service

# Expected: Instance status = UP
```

---

## 📝 Notes

- **Database per Service:** Each service has its own database for independence
- **Async Communication:** Services communicate via REST/OpenFeign (not message queues)
- **JWT Tokens:** Valid for 24 hours, can be refreshed for 30 days
- **Rate Limits:** Gateway enforces 2000 req/sec globally, 50-500 per endpoint
- **Circuit Breaker:** Auto-opens if failure rate exceeds 50% within 60s window

---

## 📞 Getting Help

- **Architecture Questions?** See: `ARCHITECTURE.md`
- **Deployment Issues?** See: `DEPLOYMENT_GUIDE.md`
- **Common Problems?** See: `TROUBLESHOOTING.md`
- **Inter-Service Calls?** See: `SERVICE_COMMUNICATION.md`
- **Team Guidelines?** See: `CONTRIBUTING.md`
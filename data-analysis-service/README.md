# Data Analysis Service

## 🎯 Overview

**data-analysis-service** is a Spring Boot microservice that provides data analysis capabilities for the Care platform. It handles file uploads (CSV, Excel), dataset management, and provides pandas-like data type inference and profiling.

## 📦 Service Information

- **Package**: `com.portal.das`
- **Port**: 6072
- **Spring Boot**: 3.3.5
- **Java**: 17
- **Architecture**: Clean Architecture / Hexagonal Pattern

## ✨ Features

### 📁 File Management
- Upload CSV, XLSX, XLS files (up to 200MB)
- Automatic Excel → CSV normalization
- Metadata tracking (rows, columns, size, format)
- Soft & permanent delete
- File storage in configurable directory

### 📊 Dataset Management
- Register datasets from uploaded files
- Automatic header extraction
- Row/column counting
- Auto-profiling on registration
- Profile stored as JSON

### 🔍 Data Type Inference
- Pandas-like dtype detection
- 6 types: STRING, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME
- Multiple date format support
- Confidence scores (0.0-1.0)
- Invalid value tracking

### 🔐 Security
- JWT authentication (from auth-service)
- Role-based authorization (ADMIN, ANALYST)
- CORS support for frontend
- Stateless sessions
- All `/api/**` endpoints protected

### 🌐 Internationalization
- English and Arabic messages
- Language from JWT token
- Consistent error responses

## 🏗️ Architecture

### Clean Architecture / Hexagonal Pattern

```
com.portal.das/
├── domain/              # Core business logic (framework-independent)
│   ├── model/           # Business entities
│   └── ports/           # Interfaces (use cases + output ports)
│
├── application/         # Application services
│   └── {module}/
│       ├── command/     # Write operations
│       ├── query/       # Read operations
│       ├── service/     # Use case implementations
│       ├── mapper/      # Data transformation
│       └── validation/  # Business rules
│
├── infrastructure/      # External concerns
│   ├── db/              # Database (JPA)
│   └── storage/         # File system
│
├── web/                 # HTTP/REST
│   ├── controller/      # REST endpoints
│   ├── dto/             # Request/Response
│   └── mapper/          # Web mappers
│
├── service/             # Shared services
│   └── profile/         # Profiling services
│
└── util/                # Utilities
```

### Dependency Rule
All dependencies point **INWARD** (toward domain).

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=das
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT (must match auth-service)
JWT_SECRET=SuperSecureKeyThatIsAtLeast64CharactersLong...

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Application Profiles
- **default**: Production settings (ddl-auto=none)
- **dev**: Development (ddl-auto=update, show-sql=true)
- **test**: Testing configuration

## 🚀 Quick Start

### 1. Prerequisites
```bash
# PostgreSQL database
psql -U postgres -c "CREATE DATABASE das;"

# Set JWT_SECRET (must match auth-service)
export JWT_SECRET="your-shared-secret"
```

### 2. Build & Run
```bash
cd C:\Java\care\Code\data-analysis-service

# Build
.\mvnw.cmd clean package

# Run
.\mvnw.cmd spring-boot:run

# Or with profile
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. Verify
```bash
# Health check
curl http://localhost:6072/actuator/health

# Swagger UI
http://localhost:6072/swagger-ui.html
```

## 📡 API Endpoints

### File Management
```bash
POST   /api/files/upload              # Upload files
GET    /api/files/{id}                # Get file info
DELETE /api/files/{id}                # Soft delete
DELETE /api/files/{id}/permanent      # Hard delete
```

### Dataset Management
```bash
POST   /api/datasets/from-file/{fileId}  # Register dataset
GET    /api/datasets/{id}                # Get dataset info
GET    /api/datasets/{id}/profile        # Get dataset profile
```

### Testing
```bash
GET    /api/test/auth                 # Test JWT
GET    /api/test/admin                # Test ADMIN role
GET    /api/test/analyst              # Test ANALYST role
```

### Public (No Auth)
```bash
GET    /actuator/health               # Health check
GET    /swagger-ui.html               # API docs
```

## 🔐 Authentication

All `/api/**` endpoints require JWT authentication:

```bash
curl -X GET http://localhost:6072/api/files \
  -H "Authorization: Bearer <jwt-token>"
```

### Get JWT Token
```bash
# Login via auth-service
curl -X POST http://localhost:6060/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst@example.com",
    "password": "password123"
  }'
```

## 📊 Complete Workflow Example

```bash
# 1. Upload Excel file
curl -X POST http://localhost:6072/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@sales_2024.xlsx"

# Returns: { "data": { "fileIds": ["file-uuid"] } }

# 2. Register dataset
curl -X POST http://localhost:6072/api/datasets/from-file/file-uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Q4 Sales", "description": "Fourth quarter sales"}'

# Returns: { "data": { "id": "dataset-uuid" } }

# 3. Get dataset metadata
curl -X GET http://localhost:6072/api/datasets/dataset-uuid \
  -H "Authorization: Bearer $TOKEN"

# Returns: Dataset with headers ["product", "quantity", "price", "date"]

# 4. Get dataset profile
curl -X GET http://localhost:6072/api/datasets/dataset-uuid/profile \
  -H "Authorization: Bearer $TOKEN"

# Returns: Full profile with type inference for each column
```

## 🔗 Integration with Care Platform

### Shared Components from core-shared-lib
- **JWT Authentication**: Token validation and user context
- **Global Exception Handler**: Consistent error responses
- **i18n**: Multi-language support
- **Validation**: Custom validators
- **Common DTOs**: ApiResponse, ErrorResponse, etc.

### Related Services
- **auth-service** (Port 6060): Authentication
- **access-management-service** (Port 6062): Permissions
- **reference-data-service**: Shared reference data
- **gateway-service**: API Gateway

## 📚 Documentation

Comprehensive documentation in `help/` directory:

- **API_DOCUMENTATION.md** - Complete API reference
- **STEPS_3_TO_6_COMPLETE.md** - Implementation details
- **JWT_SECURITY_GUIDE.md** - Security guide
- **SHARED_LIB_INTEGRATION.md** - Using shared library
- **QUICKSTART.md** - Quick start guide

For Arabic documentation, see:
- **IMPLEMENTATION_COMPLETE_AR.md**
- **SECURITY_IMPLEMENTATION_AR.md**
- **FINAL_STATUS_AR.md**

## 🧪 Testing

### Test Endpoints
```bash
# Test JWT authentication
curl http://localhost:6072/api/test/auth \
  -H "Authorization: Bearer $TOKEN"

# Test ADMIN role
curl http://localhost:6072/api/test/admin \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Integration Testing
See `help/API_DOCUMENTATION.md` for complete test scenarios.

## 📦 Technology Stack

- **Spring Boot 3.3.5** - Framework
- **Spring Security** - JWT authentication
- **Spring Data JPA** - Database access
- **PostgreSQL** - Database
- **Apache POI** - Excel file processing
- **Apache Commons CSV** - CSV processing
- **MapStruct** - Object mapping
- **Lombok** - Boilerplate reduction
- **SpringDoc OpenAPI** - API documentation
- **Jackson** - JSON processing
- **core-shared-lib** - Shared components

## 📊 Database

### Tables
- **uploaded_file**: File metadata and storage info
- **dataset**: Dataset metadata and profiles

### Migrations
- Flyway or manual SQL in `src/main/resources/db/migration/`

## 🎯 Current Status

✅ **Steps 0-6**: COMPLETE  
✅ **Build**: SUCCESS  
✅ **Linter**: 0 Errors  
✅ **Tests**: Ready  
✅ **Documentation**: Complete  
✅ **Pattern**: Clean Architecture  

**Status**: PRODUCTION READY 🚀

## 📞 Support

For issues or questions:
1. Check `help/` documentation
2. Review Swagger UI: `http://localhost:6072/swagger-ui.html`
3. Check application logs

---

**Version**: 0.0.1-SNAPSHOT  
**Last Updated**: October 16, 2025  
**Build Status**: SUCCESS ✅


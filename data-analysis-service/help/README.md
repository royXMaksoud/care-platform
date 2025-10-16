# Data Analysis Service Documentation

## Overview

The Data Analysis Service is part of the Care platform ecosystem. It provides data analysis capabilities including file processing (Excel, CSV) and data analytics features.

## Service Information

- **Service Name**: data-analysis-service
- **Port**: 6072
- **Package**: com.portal.das
- **Spring Boot**: 3.3.5
- **Java**: 17

## Shared Library Integration

This service uses `core-shared-lib` which provides:

### 1. Global Exception Handling
- Centralized exception handling with i18n support
- Consistent error responses across all services
- Field-level validation error details

### 2. i18n (Internationalization)
- Multi-language support (English, Arabic)
- Language context from JWT token
- Message resolution with fallback

### 3. JWT Authentication
- Token validation
- User context management
- Role-based access control

### 4. Security
- JWT authentication filter
- Stateless session management
- Method-level security

### 5. Dropdown Providers
- Simple list providers
- Cascade dropdown support
- SQL-based providers

### 6. Validation
- Custom validators (Email, Phone, UUID, etc.)
- Date range validation
- Enum validation

### 7. Common DTOs
- ErrorResponse
- ApiResponse
- PageResponse
- CodeValueDto

## Configuration

### Required Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=das
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT (shared with other Care services)
JWT_SECRET=<your-secret-key>
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=2592000000
```

### Application Profiles

- **default**: Production settings (ddl-auto=none)
- **dev**: Development with auto-DDL and enhanced logging
- **test**: Testing configuration

## Dependencies

### Core Spring Boot
- spring-boot-starter-web
- spring-boot-starter-validation
- spring-boot-starter-actuator
- spring-boot-starter-security
- spring-boot-starter-data-jpa

### Shared Library
- core-shared-lib (JWT, i18n, exceptions, etc.)

### File Processing
- Apache POI (Excel)
- Apache Commons CSV

### Database
- PostgreSQL

### Utilities
- MapStruct (object mapping)
- Lombok (boilerplate reduction)
- Jackson (JSON)

### API Documentation
- SpringDoc OpenAPI (Swagger)

## Endpoints

### Health & Monitoring
- `GET /actuator/health` - Health check
- `GET /actuator/info` - Application info
- `GET /actuator/metrics` - Metrics

### API Documentation
- `GET /swagger-ui.html` - Swagger UI
- `GET /v3/api-docs` - OpenAPI specification

## Security

### Authentication
All API endpoints (except health and docs) require JWT authentication:

```bash
Authorization: Bearer <jwt-token>
```

The JWT token should include:
- `sub`: User ID (UUID)
- `email`: User email
- `userType`: User type
- `lang`: Language (en/ar)
- `roles`: User roles
- `permissions`: User permissions

### Public Endpoints
- `/actuator/**` - Health and monitoring
- `/swagger-ui/**` - API documentation
- `/v3/api-docs/**` - OpenAPI specification
- `/error` - Error page

## i18n Support

The service supports multiple languages through the shared library:

### Language Selection
Language is extracted from the JWT token `lang` field or from `Accept-Language` header.

### Message Files
- `i18n/messages_en.properties` - English messages
- `i18n/messages_ar.properties` - Arabic messages

### Adding New Messages
1. Add message key to both properties files
2. Use `MessageResolver` to get localized messages
3. Exceptions are automatically localized by `GlobalExceptionHandler`

## File Upload

The service supports file uploads up to **200MB**:

- **Supported formats**: Excel (.xlsx), CSV (.csv)
- **Max file size**: 200MB
- **Max request size**: 200MB
- **Storage location**: `storage/` directory

## Development

### Running Locally

```bash
# Build
./mvnw clean package

# Run
./mvnw spring-boot:run

# Run with profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Testing

```bash
# Run all tests
./mvnw test

# Run specific test
./mvnw test -Dtest=DataAnalysisServiceApplicationTests
```

### Health Check

```bash
curl http://localhost:6072/actuator/health
```

## Integration with Care Platform

This service is part of the Care platform and integrates with:

- **auth-service**: Authentication and authorization
- **access-management-service**: User permissions and roles
- **reference-data-service**: Shared reference data

All services use the same `core-shared-lib` for consistency.

## Error Handling

All errors follow a consistent format from the shared library:

```json
{
  "code": "error.code",
  "message": "Localized error message",
  "status": 400,
  "timestamp": "2025-10-15T23:00:00",
  "path": "/api/endpoint",
  "details": [
    {
      "field": "fieldName",
      "code": "validation.code",
      "message": "Field validation message"
    }
  ]
}
```

## Logging

Logging levels can be configured in `application.yml`:

```yaml
logging:
  level:
    root: INFO
    com.portal.das: DEBUG
    com.sharedlib.core: DEBUG
```

## Further Documentation

See the other files in this directory for more details:
- `QUICKSTART.md` - Quick start guide
- `PROJECT_STRUCTURE.md` - Project structure
- `BOOTSTRAP_COMPLETE.md` - Bootstrap completion checklist

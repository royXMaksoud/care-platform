# Data Analysis Service - Project Structure

## Overview

This document describes the structure and organization of the Data Analysis Service project.

## Directory Structure

```
data-analysis-service/
├── .mvn/
│   └── wrapper/
│       └── maven-wrapper.properties     # Maven wrapper configuration
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/portal/das/
│   │   │       ├── DataAnalysisServiceApplication.java  # Main application class
│   │   │       ├── config/
│   │   │       │   └── SecurityConfig.java             # Security configuration
│   │   │       └── controller/
│   │   │           └── HealthController.java           # Basic health endpoint
│   │   └── resources/
│   │       ├── application.yml          # Default configuration
│   │       ├── application-dev.yml      # Development profile
│   │       └── application-test.yml     # Test profile
│   └── test/
│       └── java/
│           └── com/portal/das/
│               └── DataAnalysisServiceApplicationTests.java  # Basic test
├── storage/                             # File storage directory (created at runtime)
├── .dockerignore                        # Docker ignore file
├── .gitignore                           # Git ignore file
├── docker-compose.yml                   # Docker Compose configuration
├── Dockerfile                           # Docker build file
├── env.properties                       # Environment variables template
├── mvnw                                 # Maven wrapper (Unix)
├── mvnw.cmd                             # Maven wrapper (Windows)
├── pom.xml                              # Maven project configuration
├── PROJECT_STRUCTURE.md                 # This file
├── QUICKSTART.md                        # Quick start guide
└── README.md                            # Main documentation

```

## Key Components

### Application Entry Point

- **DataAnalysisServiceApplication.java**: Main Spring Boot application class with `@SpringBootApplication` annotation

### Configuration

- **SecurityConfig.java**: Configures Spring Security to allow public access to actuator and API documentation endpoints
- **application.yml**: Main application configuration including:
  - Server port (6072)
  - Database connection settings
  - JPA/Hibernate configuration
  - File upload limits (200MB)
  - Storage directory
  - Actuator endpoints

### Controllers

- **HealthController.java**: Provides a simple root endpoint (`/`) to verify the service is running

### Dependencies (pom.xml)

#### Core Spring Boot
- `spring-boot-starter-web`: Web application support
- `spring-boot-starter-validation`: Bean validation
- `spring-boot-starter-actuator`: Production monitoring
- `spring-boot-starter-security`: Security framework
- `spring-boot-starter-data-jpa`: JPA data access

#### Database
- `postgresql`: PostgreSQL JDBC driver

#### File Processing
- `poi-ooxml` (5.2.5): Excel file processing
- `commons-csv` (1.10.0): CSV file processing

#### Utilities
- `jackson-databind`: JSON serialization/deserialization
- `mapstruct` (1.5.5.Final): Object mapping
- `lombok` (1.18.30): Boilerplate code reduction

#### Documentation
- `springdoc-openapi-starter-webmvc-ui` (2.3.0): OpenAPI/Swagger documentation

#### Testing
- `spring-boot-starter-test`: Testing framework
- `spring-security-test`: Security testing support

## Configuration Profiles

### Default Profile (application.yml)
- Uses environment variables for database configuration
- Production-ready settings
- `hibernate.ddl-auto=none` (requires manual schema management)
- Minimal logging

### Development Profile (application-dev.yml)
- `hibernate.ddl-auto=update` (auto-creates/updates schema)
- `show-sql=true` (logs SQL statements)
- Enhanced logging (DEBUG level)
- Full health details exposed

### Test Profile (application-test.yml)
- Similar to development but with test-specific settings
- Full health details always visible

## Ports

- **6072**: Main application port
- **5432**: PostgreSQL database (when using docker-compose)

## Storage

The application uses a configurable storage directory (default: `storage/`) for uploaded files. This directory is created automatically if it doesn't exist.

## Docker Support

### Dockerfile
Multi-stage build:
1. **Build stage**: Compiles the application using Maven
2. **Runtime stage**: Creates a minimal runtime image with JRE 17
   - Uses non-root user for security
   - Includes health check
   - Exposes port 6072

### docker-compose.yml
Provides:
- PostgreSQL database service
- Data Analysis Service
- Networking between services
- Persistent volume for database data
- Health checks

## API Documentation

Once running, access:
- Swagger UI: `http://localhost:6072/swagger-ui.html`
- OpenAPI Spec: `http://localhost:6072/v3/api-docs`

## Monitoring

Actuator endpoints available at:
- Health: `http://localhost:6072/actuator/health`
- Info: `http://localhost:6072/actuator/info`
- Metrics: `http://localhost:6072/actuator/metrics`

## Build and Package

The project uses Maven for dependency management and building:

```bash
# Compile only
./mvnw compile

# Run tests
./mvnw test

# Package (creates JAR in target/)
./mvnw package

# Clean and package
./mvnw clean package
```

## Maven Wrapper

The project includes Maven Wrapper to ensure consistent Maven version across development environments. No separate Maven installation required.

## Future Expansion

This is the bootstrap structure. Future additions will include:
- Entity models for data storage
- Repository interfaces
- Service layer for business logic
- REST controllers for API endpoints
- File upload/processing services
- Data analysis utilities
- Additional security configurations
- Comprehensive test suite


# Config Server

## Overview
The Config Server provides centralized configuration management for all microservices in the Care Management System. It allows services to retrieve their configuration from a single source, supporting environment-specific profiles (dev, docker, prod) and enabling configuration updates without redeploying services.

## Service Details
- **Port**: 8888
- **Framework**: Spring Boot 3.3.5
- **Technology Stack**: Spring Cloud 2023.0.3
- **Type**: Centralized Configuration Server
- **Language**: Java 17

## Key Technologies & Dependencies
- **Spring Cloud Config Server**: Centralized configuration management
- **Netflix Eureka Client**: Registers itself for service discovery
- **Spring Boot Actuator**: Monitoring and health checks

## Core Responsibilities
1. **Configuration Management**: Stores and serves configuration for all services
2. **Environment-Specific Configs**: Supports multiple profiles (dev, docker, prod)
3. **Version Control Integration**: Can integrate with Git for configuration versioning
4. **Configuration Distribution**: Serves configuration to client services
5. **Health Monitoring**: Provides health check endpoints
6. **Configuration Refresh**: Supports dynamic configuration refresh (optional)

## Key Configuration Files
- `pom.xml`: Maven dependencies and build configuration
- `application.yml`: Spring Boot application configuration
- Configuration directory: `src/main/resources/config/`
  - `application.yml`: Default configuration
  - `auth-service.yml`: Auth Service configuration
  - `access-management-service.yml`: Access Management Service configuration
  - `appointment-service.yml`: Appointment Service configuration
  - `data-analysis-service.yml`: Data Analysis Service configuration
  - `gateway-service.yml`: Gateway Service configuration
  - `reference-data-service.yml`: Reference Data Service configuration

## Configuration Structure

### Config Server Config File Hierarchy
```
application.yml                 # Default/shared configuration
auth-service.yml               # Auth Service specific
access-management-service.yml  # Access Management specific
appointment-service.yml        # Appointment Service specific
data-analysis-service.yml      # Data Analysis specific
gateway-service.yml            # Gateway specific
reference-data-service.yml     # Reference Data specific
```

### Environment Profiles
- **dev**: Development environment configuration
- **docker**: Docker container environment configuration
- **prod**: Production environment configuration

### Client Application Name Mapping
When a service starts with `spring.application.name=auth-service`, it requests:
1. `application.yml` (default)
2. `application-{profile}.yml` (profile-specific)
3. `auth-service.yml` (service-specific)
4. `auth-service-{profile}.yml` (service + profile specific)

## API Endpoints
```
# Configuration Retrieval
GET /{application}/default - Get default config for application
GET /{application}/{profile} - Get config for application + profile
GET /{application}-{profile}.yml - Get config as YAML format
GET /{application}-{profile}.properties - Get config as properties format

# Health Check
GET /actuator/health - Health check endpoint

# Environment Info
GET /actuator/env - Environment properties
```

## Example Configuration Requests
```
# Auth Service requesting default config
GET /auth-service/default

# Auth Service requesting docker profile config
GET /auth-service/docker

# Access Management Service requesting prod config
GET /access-management-service/prod

# Gateway Service requesting dev config
GET /gateway-service/dev
```

## Typical Configuration Contents

### Database Configuration
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/database_name
    username: db_user
    password: db_password
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQL10Dialect
```

### Eureka Configuration
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://service-registry:8761/eureka/
  instance:
    prefer-ip-address: true
```

### Server Configuration
```yaml
server:
  port: 6061
  servlet:
    context-path: /
```

### Security Configuration
```yaml
security:
  jwt:
    secret: your-secret-key
    expiration: 86400000
```

## Service-Specific Configuration Examples

### Gateway Service Config
- Route definitions
- Rate limiting configurations
- JWT validation settings
- Circuit breaker settings
- CORS configuration

### Auth Service Config
- Database credentials
- JWT secret and expiration
- Password hashing settings
- Token refresh settings
- Security properties

### Appointment Service Config
- Database credentials
- Service endpoints
- Scheduling constraints
- Notification settings

## Development & Deployment
- **Build**: `mvn clean package`
- **Run**: `java -jar config-server-0.0.1-SNAPSHOT.jar`
- **Default Port**: 8888
- **Docker**: Dockerfile available for containerization
- **Configuration Files Location**: `src/main/resources/config/`

## Configuration File Updates
1. Update configuration file in `src/main/resources/config/`
2. Commit changes to Git (if using Git backend)
3. Services can pull new configuration via:
   - Restarting service (will fetch new config on startup)
   - Calling `/actuator/refresh` endpoint (if configured)
   - Spring Cloud Bus for broadcast refresh (advanced)

## Important Notes
- **Server Registration**: Config Server registers itself with Eureka
- **Service Startup**: Services retrieve configuration on startup
- **Property Precedence**: Local properties override remote config
- **Bootstrap Configuration**: Services need `bootstrap.yml` with config server URL
- **Fallback**: Services should have fallback properties if config server is unavailable

## Bootstrap Configuration Pattern (in each service)
```yaml
spring:
  application:
    name: auth-service
  cloud:
    config:
      uri: http://config-server:8888
      fail-fast: false
      retry:
        initial-interval: 1000
        max-interval: 2000
        max-attempts: 6
```

## Security Considerations
- **Config Server Access**: Should be restricted to internal services only
- **Sensitive Data**: Encrypt sensitive properties (passwords, secrets)
- **HTTPS**: Use HTTPS in production for config retrieval
- **Authentication**: Can be secured with Spring Security

## Monitoring & Health
- **Health Endpoint**: `/actuator/health` for health checks
- **Metrics Endpoint**: `/actuator/metrics` for detailed metrics
- **Configuration Validation**: Services validate config on startup

## Troubleshooting
- **Services Can't Connect**: Check config server URL and network connectivity
- **Config Not Updating**: Restart service or use refresh endpoint
- **YAML Parsing Errors**: Validate YAML syntax in config files
- **Missing Properties**: Check config file naming and profile names

## Git Integration (Optional)
- Config files can be stored in Git repository
- Config Server can pull from Git on startup
- Version control for configuration changes
- Rollback capability for config versions

## High Availability
For production HA setup:
1. Run multiple Config Server instances
2. Load balance between instances
3. Use shared backend (Git or file system)
4. Configure all services to use load-balanced URL

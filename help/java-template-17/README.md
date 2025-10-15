# Java Template 17 - Clean Architecture

A reusable Java 17 project template using Clean Architecture (Hexagonal Architecture) with Spring Boot 3.x.

## 🏗️ Architecture Overview

This template follows Clean Architecture principles with the following layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Layer (Controllers)                 │
├─────────────────────────────────────────────────────────────┤
│                Application Layer (Services)                │
├─────────────────────────────────────────────────────────────┤
│                   Domain Layer (Entities)                  │
├─────────────────────────────────────────────────────────────┤
│              Infrastructure Layer (Adapters)               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/main/java/com/template/
├── domain/                    # Domain Layer
│   ├── model/                # Domain Entities
│   └── port/                 # Port Interfaces
│       ├── in/               # Input Ports (Read Operations)
│       └── out/              # Output Ports (Write Operations)
├── application/              # Application Layer
│   └── service/              # Business Logic Services
├── infrastructure/           # Infrastructure Layer
│   └── adapters/            # External Adapters
│       ├── db/              # Database Adapters
│       └── http/            # HTTP Client Adapters
├── web/                     # Web Layer
│   └── controller/          # REST Controllers
├── shared/                  # Shared Components
│   ├── dto/                # Data Transfer Objects
│   └── mapper/             # Object Mappers
├── config/                  # Configuration
└── constants/               # Constants
```

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+

### Running the Application

```bash
# Clone and navigate to the project
cd java-template-17

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

### Access Points
- **Application**: http://localhost:8080
- **H2 Console**: http://localhost:8080/h2-console
- **Actuator Health**: http://localhost:8080/actuator/health

## 📋 Features

### ✅ Core Features
- **Clean Architecture**: Hexagonal architecture with clear separation of concerns
- **Spring Boot 3.x**: Latest Spring Boot with Java 17
- **JPA/Hibernate**: Database persistence with H2 in-memory database
- **MapStruct**: Object mapping between layers
- **Lombok**: Reduces boilerplate code
- **Resilience4j**: Circuit breaker and retry patterns
- **Actuator**: Health checks and metrics

### ✅ Template Examples
- **Domain Entity**: `SampleEntity` with business logic
- **Input Port**: `LoadSamplePort` for read operations
- **Output Port**: `SaveSamplePort` for write operations
- **Application Service**: `SampleService` with use cases
- **REST Controller**: `SampleController` with CRUD operations
- **Database Adapter**: `SampleDbAdapter` implementing ports
- **Object Mappers**: `SampleMapper` and `SampleJpaMapper`

## 🔧 Configuration

### Database
- **H2 In-Memory**: Default for development
- **JPA/Hibernate**: Auto-create tables
- **H2 Console**: Available at `/h2-console`

### Logging
- **Debug Level**: For development
- **SQL Logging**: Hibernate SQL queries
- **Custom Pattern**: Timestamp and message

### Resilience4j
- **Circuit Breaker**: Default configuration
- **Retry**: 3 attempts with 1s delay

## 📚 API Documentation

### Sample Entity Endpoints

#### Create Sample
```http
POST /api/samples
Content-Type: application/json

{
  "name": "Sample Name",
  "description": "Sample Description"
}
```

#### Get Sample by ID
```http
GET /api/samples/{id}
```

#### Get All Samples
```http
GET /api/samples
```

#### Get Active Samples
```http
GET /api/samples/active
```

#### Update Sample Status
```http
PATCH /api/samples/{id}/status
Content-Type: application/json

{
  "status": "INACTIVE"
}
```

#### Delete Sample
```http
DELETE /api/samples/{id}
```

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
mvn test

# Run with coverage
mvn test jacoco:report
```

### Integration Tests
```bash
# Run integration tests
mvn verify
```

## 🔄 Customization Guide

### 1. Replace Sample Entity
1. Create your domain entity in `domain/model/`
2. Define input ports in `domain/port/in/` for read operations
3. Define output ports in `domain/port/out/` for write operations
4. Implement business logic in `application/service/`
5. Create REST controller in `web/controller/`
6. Implement database adapter in `infrastructure/adapters/db/`

### 2. Add External Service Integration
1. Create HTTP client in `infrastructure/adapters/http/`
2. Implement port interface for external service
3. Add circuit breaker and retry patterns
4. Create DTOs for external service communication

### 3. Database Configuration
1. Update `application.yml` with your database settings
2. Create JPA entities in `infrastructure/adapters/db/entity/`
3. Create repositories in `infrastructure/adapters/db/`
4. Update mappers for your entities

## 📦 Dependencies

### Core Dependencies
- **Spring Boot 3.2.0**: Application framework
- **Spring Data JPA**: Database access
- **H2 Database**: In-memory database
- **MapStruct**: Object mapping
- **Lombok**: Code generation
- **Resilience4j**: Fault tolerance

### External Dependencies
- **core-shared-lib**: Shared utilities and components

## 🏛️ Architecture Principles

### Clean Architecture Benefits
- **Independence**: Domain logic independent of frameworks
- **Testability**: Easy to unit test business logic
- **Flexibility**: Easy to change infrastructure
- **Maintainability**: Clear separation of concerns

### Hexagonal Architecture
- **Ports**: Define interfaces for external dependencies
- **Adapters**: Implement ports for specific technologies
- **Domain**: Contains business logic and entities
- **Application**: Orchestrates domain logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This template is provided as-is for educational and development purposes.

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review the example implementations
3. Create an issue in the repository

---

**Happy Coding! 🚀** 
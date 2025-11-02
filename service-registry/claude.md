# Service Registry (Eureka Server)

## Overview
The Service Registry is a Netflix Eureka Server that provides service discovery and registration capabilities for the Care Management System. It maintains a dynamic registry of all available microservice instances, enabling automatic service discovery and load balancing across the distributed system.

## Service Details
- **Port**: 8761
- **Framework**: Spring Boot 3.5.6
- **Technology Stack**: Spring Cloud 2025.0.0
- **Type**: Service Discovery Server
- **Language**: Java 17

## Key Technologies & Dependencies
- **Netflix Eureka Server**: Service discovery and registration
- **Spring Cloud 2025.0.0**: Latest Spring Cloud features
- **Spring Boot 3.5.6**: Latest Spring Boot version

## Core Responsibilities
1. **Service Registration**: Accepts service registrations from microservices
2. **Service Discovery**: Provides service instance information to clients
3. **Health Checking**: Monitors health of registered service instances
4. **Load Balancing**: Enables client-side or server-side load balancing
5. **Instance Metadata Management**: Tracks instance metadata (IP, port, health status)
6. **Heartbeat Management**: Processes heartbeats from registered instances
7. **Instance Deregistration**: Removes instances when they go down
8. **Self-Preservation**: Protects against false positives in instance deregistration

## Key Configuration Files
- `pom.xml`: Maven dependencies and build configuration
- `application.yml`: Spring Boot application configuration
- `application-docker.yml`: Docker environment configuration

## Important Notes
- **Lightweight**: Only requires Eureka Server dependency, no other Spring Cloud components
- **High Availability**: Can be configured in cluster mode for redundancy
- **Self-Registration**: Services automatically register with Eureka on startup
- **Health Checks**: Regular health checks determine instance availability
- **Dashboard**: Built-in web dashboard for monitoring registered services
- **Heartbeat Interval**: Services send heartbeats (default 30 seconds)
- **Lease Duration**: Instances have configurable lease durations
- **Self-Preservation Mode**: Protects against network partitions

## Eureka Dashboard
- **URL**: `http://localhost:8761/`
- **Features**:
  - View all registered services
  - View service instances and their status
  - Instance metadata and health information
  - Real-time updates as instances register/deregister

## Service Integration Flow
1. Service starts up
2. Service registers with Eureka (service name, IP, port, metadata)
3. Eureka maintains service in its registry
4. Service sends periodic heartbeats to Eureka
5. Other services query Eureka for service instance information
6. Services use discovered instances for inter-service communication
7. If service fails, Eureka removes it after lease expiration

## Key Configuration Properties
```yaml
# Eureka Server Configuration
eureka:
  instance:
    hostname: service-registry  # Instance hostname
  server:
    enable-self-preservation: true  # Enable self-preservation mode
    eviction-interval-timer-in-ms: 60000  # Check for expired leases
  client:
    register-with-eureka: false  # Don't register itself
    fetch-registry: false  # Don't fetch registry
```

## Registered Services
The following services register with this Eureka server:
1. **Gateway Service** (port 6060)
2. **Auth Service** (port 6061)
3. **Access Management Service** (port 6062)
4. **Reference Data Service** (port 6063)
5. **Appointment Service** (port 6064)
6. **Data Analysis Service** (port 6065)
7. **Chatbot Service** (port 6066)
8. **Config Server** (port 8888)

## API Endpoints (Eureka REST API)
```
# Service Discovery
GET /eureka/apps - List all registered services
GET /eureka/apps/{appName} - Get service instances
GET /eureka/apps/{appName}/{instanceId} - Get specific instance

# Health Check
GET /eureka/apps/{appName}/{instanceId}/status - Get instance status
PUT /eureka/apps/{appName}/{instanceId}/status - Update instance status

# Instance Metadata
GET /eureka/instances/{instanceId} - Get instance metadata
```

## Web Dashboard
```
GET / - Eureka Server dashboard
Displays:
- All registered applications
- Instance count per application
- Instance status (UP/DOWN)
- Instance metadata
- Last heartbeat timestamps
```

## Development & Deployment
- **Build**: `mvn clean package`
- **Run**: `java -jar service-registry-0.0.1-SNAPSHOT.jar`
- **Default Port**: 8761
- **Docker**: Dockerfile available for containerization
- **No Config Server**: Uses local application.yml only

## High Availability Setup
For production, configure Eureka in cluster mode:
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://eureka-1:8761/eureka/,http://eureka-2:8761/eureka/,http://eureka-3:8761/eureka/
```

## Security Considerations
- **Network Isolation**: Eureka should be accessible only to internal services
- **Authentication**: Can be secured with Spring Security
- **HTTPS**: Use HTTPS in production
- **Service Authentication**: Services should authenticate when registering

## Monitoring & Health
- **Metrics**: Provides Spring Boot Actuator metrics
- **Health Endpoint**: `/actuator/health` for health checks
- **Metrics Endpoint**: `/actuator/metrics` for detailed metrics
- **Prometheus Compatible**: Can be scraped by Prometheus

## Troubleshooting
- **Services Not Registering**: Check Eureka URL configuration in services
- **Services Staying UP Despite Failure**: Check health check configuration
- **Slow Instance Removal**: Adjust eviction interval and lease duration
- **Self-Preservation Issues**: Monitor the instance expiration timeline

## Performance Tuning
- **Heartbeat Interval**: Shorter = faster failure detection (more load)
- **Lease Duration**: Longer = more tolerance for network issues
- **Eviction Interval**: Check frequency for expired instances
- **Registry Cache**: Client-side caching reduces Eureka load

## Integration with Spring Cloud Load Balancer
Services use Eureka with Spring Cloud Load Balancer for:
- **Client-Side Load Balancing**: Distribute requests across instances
- **Round-Robin**: Default load balancing strategy
- **Automatic Discovery**: No hardcoded service URLs needed

# Claude.md Documentation Index

This document provides a quick reference to all the claude.md documentation files created for the Care Management System project.

## Project Overview
- **[claude.md](claude.md)** (644 lines) - **START HERE**: Complete project architecture, technology stack, service topology, and comprehensive overview of the entire system.

## Backend Microservices (7 Core Services)

### API & Infrastructure Layer
1. **[gateway-service/claude.md](gateway-service/claude.md)** (77 lines)
   - API Gateway for routing, load balancing, rate limiting
   - Port: 6060
   - Spring Cloud Gateway WebFlux (reactive)

2. **[service-registry/claude.md](service-registry/claude.md)**
   - Eureka Server for service discovery
   - Port: 8761
   - Service registration and health monitoring

3. **[config-server/claude.md](config-server/claude.md)**
   - Centralized configuration management
   - Port: 8888
   - Environment profiles: dev, docker, prod

### Core Business Services
4. **[auth-service/auth-service/claude.md](auth-service/auth-service/claude.md)**
   - User authentication and JWT token generation
   - Port: 6061
   - Uses Core Shared Library

5. **[access-management-service/claude.md](access-management-service/claude.md)**
   - Role-Based Access Control (RBAC)
   - Port: 6062
   - Permission and role management

6. **[appointment-service/claude.md](appointment-service/claude.md)**
   - Healthcare appointment scheduling
   - Port: 6064
   - Conflict detection and availability management

7. **[reference-data-service/claude.md](reference-data-service/claude.md)**
   - Master data management (code tables, organizations, locations)
   - Port: 6063
   - Built with JHipster 8.11.0

### Support & Analytics Services
8. **[data-analysis-service/claude.md](data-analysis-service/claude.md)**
   - Analytics, reporting, and business intelligence
   - Port: 6065
   - Excel/CSV export capabilities

9. **[chatbot-service/claude.md](chatbot-service/claude.md)**
   - Conversational AI and chatbot
   - Port: 6066
   - Clean Architecture implementation

## Shared Libraries
- **[shared-libs/core-shared-lib/core-shared-lib/claude.md](shared-libs/core-shared-lib/core-shared-lib/claude.md)**
  - Shared JWT, security, and utility classes
  - Used by all backend services
  - Maven JAR library (0.0.1-SNAPSHOT)

## Client Applications

### Web Portal
- **[web-portal/claude.md](web-portal/claude.md)** (362 lines)
  - React 19.1.1 + TypeScript + TailwindCSS
  - Modern administrative interface
  - Features: User management, appointments, analytics dashboards
  - Languages: English, Arabic (RTL support)

### Mobile Application
- **[care-mobile-app/claude.md](care-mobile-app/claude.md)** (434 lines)
  - Flutter 3.27.2 + Dart 3.6.1
  - Target: Android (min SDK 21) and iOS
  - Features: Voice assistance, appointments, messaging
  - Languages: English, Arabic (RTL support)

## Quick Navigation by Use Case

### I need to understand the entire system
→ Start with **[claude.md](claude.md)** (project overview)

### I'm working on a specific backend service
1. **Authentication?** → [auth-service/auth-service/claude.md](auth-service/auth-service/claude.md)
2. **Permissions/Authorization?** → [access-management-service/claude.md](access-management-service/claude.md)
3. **Appointments?** → [appointment-service/claude.md](appointment-service/claude.md)
4. **Master Data?** → [reference-data-service/claude.md](reference-data-service/claude.md)
5. **Analytics?** → [data-analysis-service/claude.md](data-analysis-service/claude.md)
6. **Chatbot?** → [chatbot-service/claude.md](chatbot-service/claude.md)

### I'm working on infrastructure
1. **API Gateway?** → [gateway-service/claude.md](gateway-service/claude.md)
2. **Service Discovery?** → [service-registry/claude.md](service-registry/claude.md)
3. **Configuration?** → [config-server/claude.md](config-server/claude.md)

### I'm working on the frontend
1. **Web Portal?** → [web-portal/claude.md](web-portal/claude.md)
2. **Mobile App?** → [care-mobile-app/claude.md](care-mobile-app/claude.md)

### I need to use shared libraries
→ [shared-libs/core-shared-lib/core-shared-lib/claude.md](shared-libs/core-shared-lib/core-shared-lib/claude.md)

## Documentation Content Summary

### Each Service Documentation Includes:
✅ Overview and purpose of the service
✅ Port number and technology stack
✅ Key technologies and dependencies
✅ Core responsibilities and features
✅ API endpoints and REST routes
✅ Database schema and data models
✅ Integration points with other services
✅ Development & deployment instructions
✅ Security considerations
✅ Testing approaches
✅ Performance considerations
✅ Troubleshooting tips

### Project Overview Documentation Includes:
✅ Complete project architecture
✅ Technology stack summary
✅ Service topology and inter-communication
✅ Database structure overview
✅ Security architecture and flows
✅ Resilience and fault tolerance patterns
✅ Deployment architecture
✅ Internationalization support
✅ Getting started guide
✅ Key features by domain
✅ Common development tasks
✅ Monitoring and observability

## Service Architecture Quick Reference

### By Layer
**Presentation Layer:**
- Web Portal (React)
- Mobile App (Flutter)

**API Gateway Layer:**
- Gateway Service (Port 6060)

**Business Logic Layer:**
- Auth Service (Port 6061)
- Access Management (Port 6062)
- Reference Data (Port 6063)
- Appointment Service (Port 6064)
- Data Analysis (Port 6065)
- Chatbot Service (Port 6066)

**Infrastructure Layer:**
- Service Registry/Eureka (Port 8761)
- Config Server (Port 8888)
- PostgreSQL Database
- Redis Cache

**Shared Components:**
- Core Shared Library

### By Technology
**Java Services:** 9 microservices using Spring Boot and Spring Cloud
**React Application:** Web portal with TypeScript and modern libraries
**Flutter Application:** Mobile app with GetX state management
**Database:** PostgreSQL for all services
**Configuration:** Spring Cloud Config Server
**Discovery:** Netflix Eureka
**Communication:** Spring Cloud OpenFeign, REST APIs

## Key Statistics

| Category | Count |
|----------|-------|
| Backend Microservices | 7 |
| Infrastructure Services | 2 |
| Shared Libraries | 1 |
| Client Applications | 2 |
| Total Services/Apps | 12 |
| Claude.md Files Created | 13 |
| Supported Languages | 2 (English, Arabic) |
| Database (PostgreSQL) | 1 |

## Technology Version Summary

| Technology | Version |
|------------|---------|
| Java | 17 LTS |
| Spring Boot | 3.2.5 - 3.5.6 |
| Spring Cloud | 2023.0.3 - 2025.0.0 |
| React | 19.1.1 |
| Flutter | 3.27.2 |
| Dart | 3.6.1 |
| PostgreSQL | 14+ |
| Maven | 3.9+ |
| Node.js | 18+ (for web portal) |

## How to Use This Documentation

1. **First Time?** Read the main [claude.md](claude.md) file for complete context
2. **Working on a service?** Find it in the list above and read its dedicated claude.md
3. **Need integration details?** Check the "Integration Points" section in each service doc
4. **Setting up development?** See "Development & Deployment" in service docs and main overview
5. **Deploying?** Check both service-specific and main project deployment sections

## Documentation Maintenance

All claude.md files have been created with:
- ✅ Current technology versions
- ✅ Accurate port numbers
- ✅ Complete API endpoints (where applicable)
- ✅ Database schema information
- ✅ Integration patterns
- ✅ Security considerations
- ✅ Development and deployment guidance

For updates and additions, maintain consistency across all documentation files.

---

**Last Updated:** October 29, 2025
**Total Documentation Lines:** ~4,000+ across all files
**Formats:** Markdown (.md) for universal compatibility

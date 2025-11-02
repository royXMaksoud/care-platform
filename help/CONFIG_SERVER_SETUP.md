# Config Server Integration Guide

## What was added to each service:

### 1. pom.xml - Added Config Client dependencies
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
```

### 2. bootstrap.yml - Connect to Config Server
Each service now has bootstrap.yml with:
- Service name
- Config Server URI (http://localhost:8888)
- Port number
- Retry configuration

## Service Ports:
- auth-service: 6061 (DB: cms_db)
- gateway-service: 6060
- access-management-service: 6062 (DB: cms_db)
- data-analysis-service: 6072 (DB: das_db)
- config-server: 8888
- service-registry: 8761

## Startup Order:
1. Config Server (8888)
2. Service Registry (8761)
3. All other services

## Test:
```powershell
curl http://localhost:8888/auth-service/default
curl http://localhost:8888/gateway-service/default
```


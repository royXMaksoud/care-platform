# Deployment Guide

Complete guide for deploying the CARE platform to production, staging, and other environments.

## 📋 Table of Contents

- [Environment Overview](#environment-overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Configuration Management](#configuration-management)
- [Database Setup](#database-setup)
- [Security Hardening](#security-hardening)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Environment Overview

### Deployment Environments

| Environment | Purpose | Services | Replicas | Resources |
|---|---|---|---|---|
| **Development** | Local development | All services | 1 | Minimal |
| **Staging** | Pre-production testing | All services | 2 | Medium |
| **Production** | Live system | All services | 3+ | High |

### Infrastructure Requirements

#### **Development (Local)**
```
CPU: 2 cores minimum
Memory: 8GB minimum
Storage: 50GB for databases
OS: Windows 10+, macOS, Linux
```

#### **Staging**
```
CPU: 4 cores
Memory: 16GB
Storage: 200GB SSD
Database: PostgreSQL 14+
Kubernetes: 1.24+
```

#### **Production**
```
CPU: 8+ cores
Memory: 32GB+
Storage: 500GB+ SSD
Database: PostgreSQL 14+ (managed/RDS recommended)
Kubernetes: 1.24+ (EKS/AKS/GKE)
Redis: For caching (optional)
Load Balancer: Application Load Balancer (ALB) or NGINX
```

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing: `mvn clean test`
- [ ] Code coverage > 70%
- [ ] No critical security vulnerabilities
- [ ] Code review completed
- [ ] Commits are clean and descriptive
- [ ] Version bumped in pom.xml files
- [ ] CHANGELOG updated

### Configuration

- [ ] Environment variables defined for all services
- [ ] Database credentials secure (not in code)
- [ ] JWT secret is 64+ characters
- [ ] CORS origins configured correctly
- [ ] API endpoints properly documented
- [ ] Rate limits configured
- [ ] Circuit breaker thresholds reviewed

### Infrastructure

- [ ] Database provisioned and tested
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] Log aggregation setup
- [ ] Kubernetes cluster healthy
- [ ] Network policies defined
- [ ] SSL/TLS certificates ready

### Documentation

- [ ] Deployment runbook reviewed
- [ ] Rollback procedure documented
- [ ] Team notified of deployment
- [ ] Change log prepared

---

## Docker Deployment

### Building Docker Images

#### **Build All Services**
```bash
# From project root
docker-compose build

# Or build specific service
docker-compose build auth-service
```

#### **Build With Custom Tags**
```bash
# Tag with registry and version
docker tag care-auth-service:latest my-registry.azurecr.io/care/auth-service:v1.0.0
docker push my-registry.azurecr.io/care/auth-service:v1.0.0
```

#### **Push to Registry**
```bash
# Azure Container Registry
az acr build --registry myregistry --image care/auth-service:v1.0.0 ./auth-service

# Docker Hub
docker tag care-auth-service:latest myusername/care-auth-service:v1.0.0
docker push myusername/care-auth-service:v1.0.0

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag care-auth-service:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/care/auth-service:v1.0.0
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/care/auth-service:v1.0.0
```

### Local Docker Compose Deployment

#### **Start All Services**
```bash
# With environment file
docker-compose --env-file .env.prod up -d

# View status
docker-compose ps

# View logs
docker-compose logs -f
```

#### **Environment File (.env.prod)**
```bash
# Database
DB_PASSWORD=YourSecurePasswordHere

# JWT
JWT_SECRET=YourVerySecureJWTSecretThatIsAtLeast64CharactersLongToAvoidWeakKeyException

# Service URLs
AUTH_SERVICE_URL=http://auth-service:6061
ACCESS_MGMT_URL=http://access-management-service:6062
REFERENCE_DATA_URL=http://reference-data-service:6063
DAS_URL=http://data-analysis-service:6072

# Features
ENABLE_ZIPKIN=true
ZIPKIN_URL=http://zipkin:9411

# Profiles
SPRING_PROFILES_ACTIVE=prod
```

#### **Health Verification**
```bash
# Check all services
docker-compose exec auth-service curl http://localhost:6061/actuator/health

# Check database connection
docker-compose exec postgres psql -U postgres -d cms_db -c "SELECT 1;"

# View container logs
docker-compose logs auth-service
```

---

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify installation
kubectl version --client

# Create namespace
kubectl create namespace care-system
```

### Deployment Files

**Location:** `K8S/services/` directory

Key files:
- `namespace.yaml` - Kubernetes namespace
- `configmap.yaml` - Configuration
- `secret.yaml` - Secrets (sensitive data)
- `deployment.yaml` - Service deployments
- `service.yaml` - Kubernetes services
- `ingress.yaml` - Ingress routing
- `pvc.yaml` - Persistent volumes

### Deploy to Kubernetes

#### **Step 1: Create Namespace**
```bash
kubectl apply -f K8S/services/namespace.yaml
```

#### **Step 2: Create ConfigMap**
```bash
kubectl apply -f K8S/services/configmap.yaml
```

#### **Step 3: Create Secrets**
```bash
# Create secret for database credentials
kubectl create secret generic db-credentials \
  --from-literal=username=postgres \
  --from-literal=password=YourSecurePassword \
  -n care-system

# Create secret for JWT
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=YourVerySecureJWTSecretThatIsAtLeast64Characters \
  -n care-system
```

#### **Step 4: Deploy Services**
```bash
# Deploy all services
kubectl apply -f K8S/services/

# Or deploy specific service
kubectl apply -f K8S/services/auth-service-deployment.yaml
```

#### **Step 5: Verify Deployment**
```bash
# Check pods status
kubectl get pods -n care-system

# Check services
kubectl get svc -n care-system

# Check deployment status
kubectl describe deployment auth-service -n care-system

# View logs
kubectl logs -f deployment/auth-service -n care-system
```

### Kubernetes Service Definition Example

```yaml
# K8S/services/auth-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: care-system
  labels:
    app: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: my-registry.azurecr.io/care/auth-service:v1.0.0
        ports:
        - containerPort: 6061
          name: http
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: SPRING_DATASOURCE_URL
          value: "jdbc:postgresql://postgres:5432/cms_db"
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: JAVA_OPTS
          value: "-Xmx512m -Xms256m"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 6061
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 6061
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: care-system
spec:
  selector:
    app: auth-service
  ports:
  - port: 6061
    targetPort: 6061
    protocol: TCP
  type: ClusterIP
```

---

## Configuration Management

### Environment Variables

All services use environment variables for configuration:

```yaml
# Core Configuration
SPRING_PROFILES_ACTIVE: prod              # Application profile
JAVA_OPTS: "-Xmx512m -Xms256m"           # JVM options

# Database
SPRING_DATASOURCE_URL: jdbc:postgresql://host:5432/db
SPRING_DATASOURCE_USERNAME: postgres
SPRING_DATASOURCE_PASSWORD: secret

# Service Discovery
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE: http://eureka:8761/eureka

# JWT
JWT_SECRET: VeryLongSecureKeyAtLeast64Characters
JWT_EXPIRATION: 86400000                 # 24 hours

# Application URLs
AUTH_SERVICE_URL: http://auth-service:6061
GATEWAY_URL: http://gateway:6060

# Features
ENABLE_ZIPKIN: true
ZIPKIN_URL: http://zipkin:9411
LOG_LEVEL: INFO
```

### Using ConfigServer

The Config Server manages centralized configuration:

```bash
# Fetch configuration
curl http://localhost:8888/auth-service/prod

# Configuration is stored in:
# External Git: https://github.com/royXMaksoud/care-config-repo
```

### Override Configuration via Environment Variables

Spring Boot reads environment variables automatically:

```bash
# Underscore replaces dots
export SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/cms_db
export SPRING_DATASOURCE_PASSWORD=ProdPassword123

# Run service
java -jar auth-service.jar
```

---

## Database Setup

### PostgreSQL Installation

#### **Docker**
```bash
docker run -d \
  --name care-postgres \
  -e POSTGRES_DB=cms_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=YourPassword \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:14-alpine
```

#### **Ubuntu/Debian**
```bash
# Install
sudo apt-get install postgresql-14

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Connect as postgres user
sudo -u postgres psql
```

### Database Initialization

#### **Create Databases**
```sql
-- Connect as postgres user
CREATE DATABASE cms_db;
CREATE DATABASE das_db;
CREATE DATABASE referenceDataService;

-- Create user
CREATE USER care_user WITH PASSWORD 'SecurePassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cms_db TO care_user;
GRANT ALL PRIVILEGES ON DATABASE das_db TO care_user;
```

#### **Apply Migrations**

JPA/Hibernate automatically creates tables on first run:

```yaml
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # or 'create' for fresh setup
```

Or use Liquibase (Reference Data Service):

```bash
# Liquibase migrations run automatically on startup
# Migrations located in: src/main/resources/db/changelog/
```

### Backup & Recovery

#### **Backup**
```bash
# Full backup
pg_dump -U postgres cms_db > backup-$(date +%Y%m%d).sql

# Docker backup
docker exec care-postgres pg_dump -U postgres cms_db > backup.sql
```

#### **Restore**
```bash
# Restore from backup
psql -U postgres cms_db < backup.sql

# Docker restore
cat backup.sql | docker exec -i care-postgres psql -U postgres cms_db
```

---

## Security Hardening

### JWT Secret Management

```bash
# Generate secure JWT secret
openssl rand -base64 64

# Example:
# ZHkxMjM0NTY3ODkwYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwYWJjZGVmZ2hpamtsbW5vcA==

# Store in secure vault (Azure Key Vault, AWS Secrets Manager, etc.)
# Never commit to Git!
```

### Database Security

```sql
-- Revoke public access
REVOKE ALL ON DATABASE cms_db FROM PUBLIC;

-- Create application-specific user (not postgres)
CREATE USER care_app WITH PASSWORD 'ComplexPassword123!@#';
GRANT CONNECT ON DATABASE cms_db TO care_app;

-- Grant table permissions (after tables exist)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO care_app;
```

### HTTPS/TLS

#### **Self-Signed Certificate (Dev)**
```bash
keytool -genkey -alias care-server \
  -keyalg RSA -keysize 2048 \
  -keystore keystore.jks \
  -validity 365
```

#### **Spring Boot Configuration**
```yaml
server:
  ssl:
    key-store: classpath:keystore.jks
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: JKS
    key-alias: care-server
```

#### **Nginx Reverse Proxy (Production)**
```nginx
server {
    listen 443 ssl;
    server_name api.care-platform.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://gateway-service:6060;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Network Policies

#### **Kubernetes NetworkPolicy**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: care-network-policy
  namespace: care-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: care-system
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: care-system
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53  # DNS
```

---

## Monitoring & Logging

### Application Metrics

```bash
# Prometheus scrape configuration
# All services expose metrics at /actuator/prometheus

scrape_configs:
  - job_name: 'care-auth'
    static_configs:
      - targets: ['auth-service:6061']
    metrics_path: '/actuator/prometheus'
```

### Distributed Tracing

```bash
# Zipkin Docker
docker run -d \
  --name zipkin \
  -p 9411:9411 \
  openzipkin/zipkin

# Access UI: http://localhost:9411
```

### Log Aggregation

#### **ELK Stack (Elasticsearch, Logstash, Kibana)**
```bash
# Start ELK Stack
docker-compose -f docker-compose.elk.yml up -d

# Configure Spring Boot to send logs
# application.yml
logging:
  level:
    root: INFO
    com.care: DEBUG
```

#### **Azure Log Analytics**
```yaml
spring:
  cloud:
    azure:
      application-insights:
        instrumentation-key: ${APPINSIGHTS_INSTRUMENTATION_KEY}
```

---

## Rollback Procedures

### Docker Rollback

```bash
# List image versions
docker image ls care-auth-service

# Rollback to previous version
docker-compose down
docker-compose up -d  # Uses previous image

# Or explicitly specify version
docker run -d --name auth-service \
  my-registry.azurecr.io/care/auth-service:v1.0.0
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/auth-service -n care-system

# Rollback to previous version
kubectl rollout undo deployment/auth-service -n care-system

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=2 -n care-system

# Check status
kubectl rollout status deployment/auth-service -n care-system
```

### Database Rollback

```bash
# Restore from backup
psql -U postgres cms_db < backup-before-migration.sql

# Or use Liquibase rollback
# liquibase rollback --changesetId=xxx
```

---

## Troubleshooting

### Common Issues

#### **Services Not Registering with Eureka**
```bash
# Check Eureka dashboard
curl http://localhost:8761/eureka/apps

# Expected: Service with status UP
# If DOWN: Check service logs
docker-compose logs auth-service
```

#### **Database Connection Failed**
```bash
# Verify database is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U postgres -c "SELECT 1;"

# Review service logs for connection errors
docker-compose logs auth-service | grep -i "datasource\|database"
```

#### **JWT Token Invalid**
```bash
# Verify JWT secret matches across services
echo $JWT_SECRET

# Check token expiration
curl -X POST http://localhost:6061/auth/validate \
  -H "Authorization: Bearer your_token"
```

#### **High Memory Usage**
```bash
# Check JVM settings
docker-compose exec auth-service \
  curl http://localhost:6061/actuator/metrics/jvm.memory.used

# Increase heap size
JAVA_OPTS="-Xmx1024m -Xms512m"
```

#### **Slow Queries**
```bash
# Enable query logging
export SPRING_JPA_SHOW_SQL=true
export SPRING_JPA_PROPERTIES_HIBERNATE_FORMAT_SQL=true

# Check slow query log in PostgreSQL
psql -U postgres
\c cms_db
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Health Check Commands

```bash
# All services
for service in auth-service access-management-service data-analysis-service; do
  echo "Checking $service..."
  curl -s http://localhost:6061/actuator/health 2>/dev/null | jq '.status'
done

# Database
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Gateway
curl http://localhost:6060/actuator/health | jq .
```

---

## Scaling & Performance Tuning

### Horizontal Scaling (Kubernetes)

```bash
# Scale auth-service to 5 replicas
kubectl scale deployment auth-service --replicas=5 -n care-system

# Auto-scale based on CPU
kubectl autoscale deployment auth-service \
  --min=2 --max=10 \
  --cpu-percent=70 \
  -n care-system
```

### Performance Tuning

#### **Database Connection Pool**
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 600000
      max-lifetime: 1800000
```

#### **JVM Tuning**
```bash
JAVA_OPTS="-Xmx2048m -Xms1024m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+ParallelRefProcEnabled"
```

---

## Post-Deployment Verification

```bash
# 1. Check all services are up
kubectl get pods -n care-system

# 2. Verify endpoints
curl http://api.care-platform.com/auth/health

# 3. Run smoke tests
# Deploy smoke test pod or run locally
./run-smoke-tests.sh

# 4. Check monitoring
# Verify Prometheus, Grafana, Zipkin are collecting data

# 5. Backup database
pg_dump -U postgres cms_db > backup-production.sql

# 6. Notify stakeholders
echo "Production deployment completed successfully"
```

---

For more help, see:
- [SERVICE_RUNBOOK.md](./SERVICE_RUNBOOK.md) - Service details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
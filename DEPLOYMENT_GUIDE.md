# 🚀 تدريب شامل: نشر المشروع على GitHub Actions + Docker + Kubernetes
# Comprehensive Guide: Deploying to GitHub Actions + Docker + Kubernetes

**التاريخ:** 2 نوفمبر 2025
**الحالة:** جاهز للتنفيذ الكامل
**المدة الكلية:** 8-10 ساعات
**الصعوبة:** عالية ⭐⭐⭐⭐

---

## 📚 المحتويات (Table of Contents)

1. [الخطوة 1: إعداد GitHub](#خطوة-1-إعداد-github)
2. [الخطوة 2: إعداد Docker](#خطوة-2-إعداد-docker)
3. [الخطوة 3: إعداد Kubernetes](#خطوة-3-إعداد-kubernetes)
4. [الخطوة 4: إعداد GitHub Actions](#خطوة-4-إعداد-github-actions)
5. [الخطوة 5: الاختبار والنشر](#خطوة-5-الاختبار-والنشر)
6. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## ✅ المتطلبات الأساسية

قبل البدء، تأكد من توفر:

```bash
# 1. Git مثبت ومعايير GitHub
git --version
# أو
winget install Git.Git

# 2. Docker Desktop (للـ Windows/Mac)
docker --version
# من: https://www.docker.com/products/docker-desktop

# 3. Docker Compose
docker-compose --version
# يأتي مع Docker Desktop

# 4. kubectl (لـ Kubernetes)
kubectl version --client
# أو: winget install Kubernetes.kubectl

# 5. Minikube أو Docker Desktop Kubernetes (للتطوير المحلي)
minikube version
# أو: تفعيل Kubernetes في Docker Desktop

# 6. حساب GitHub و Personal Access Token
# من: https://github.com/settings/tokens

# 7. حساب Docker Hub (اختياري، لكن موصى به)
# من: https://hub.docker.com
```

---

# الخطوة 1: إعداد GitHub

## 1.1: إنشء مستودع GitHub جديد

```bash
# الخيار أ: إنشاء من سطر الأوامر
git remote add origin https://github.com/YOUR_USERNAME/care-management-system.git
git branch -M main
git push -u origin main

# الخيار ب: من واجهة GitHub الويب
# 1. انتقل إلى github.com/new
# 2. ملء:
#    - Repository name: care-management-system
#    - Description: Enterprise Care Management Microservices
#    - Public/Private: حسب الاختيار
#    - Add .gitignore: Java
#    - Add license: MIT
# 3. انقر Create repository
```

## 1.2: إضافة GitHub Secrets

**لماذا؟** لتخزين البيانات الحساسة (أرقام سري، توكنات) بشكل آمن.

### الخطوات:

1. انتقل إلى `Settings` → `Secrets and variables` → `Actions`
2. انقر `New repository secret`
3. أضف هذه الـ Secrets:

```yaml
# 1. Docker Hub Credentials
DOCKER_USERNAME: your_docker_hub_username
DOCKER_PASSWORD: your_docker_hub_password
# أو استخدم Personal Access Token

# 2. Database Credentials
DB_PASSWORD: YourSecurePassword123!
DB_USERNAME: postgres

# 3. JWT Secret (يجب أن يكون طويلاً)
JWT_SECRET: SuperSecureKeyThatIsAtLeast64CharactersLongToAvoidWeakKeyException1234567890

# 4. Kubernetes (إذا استخدمت K8s خارجي)
KUBECONFIG_CONTENT: <محتوى .kube/config في Base64>

# 5. Optional: Cloud Credentials
AWS_ACCESS_KEY_ID: your_aws_key (إذا استخدمت AWS)
AWS_SECRET_ACCESS_KEY: your_aws_secret
AZURE_CREDENTIALS: your_azure_sp (إذا استخدمت Azure)
GCP_PROJECT_ID: your_gcp_project (إذا استخدمت GCP)
```

### كيفية الحصول على Secrets:

```bash
# 1. Docker Personal Access Token:
# - انتقل إلى Docker Hub Settings → Security → New Access Token
# - اسم: github-actions
# - الصلاحيات: Read, Write

# 2. GitHub Personal Access Token:
# - انتقل إلى github.com/settings/tokens
# - repo (كل الصلاحيات الـ repo)
# - admin:repo_hook
# - workflow

# 3. JWT Secret (من الـ terminal):
openssl rand -base64 64

# 4. Kubernetes kubeconfig (Base64):
cat ~/.kube/config | base64 -w 0  # Linux/Mac
# أو على Windows:
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("$env:USERPROFILE\.kube\config")) | Set-Clipboard
```

## 1.3: إنشاء `.gitignore` محسّن

```bash
# في جذر المشروع
cat > .gitignore << 'EOF'
# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Build
target/
dist/
node_modules/
build/
.gradle/

# Environment
.env
.env.local
.env.*.local
env.properties

# Secrets & Credentials
secrets.yaml
*.pem
*.key
*.crt
kubeconfig
~/.kube/config

# OS
.DS_Store
Thumbs.db
*.log

# Docker
docker-compose.override.yml

# Kubernetes
kube-manifests/secrets/
*.sealed-secrets.yaml

# IDE Files
.vscode/settings.json
.vscode/launch.json
.idea/*
*.iml
*.iws
*.ipr

# Node
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Flutter
.packages
.flutter-plugins
.flutter-plugins-dependencies
build/
ios/Flutter/Flutter.podspec

# Database
*.db
*.sqlite
postgres_data/

# Cache
.cache/
.pytest_cache/
.gradle/

# Dependencies lock files (optional, depending on your preference)
# package-lock.json
# yarn.lock
EOF

git add .gitignore
git commit -m "add comprehensive gitignore"
```

---

# الخطوة 2: إعداد Docker

## 2.1: مراجعة و تحسين Dockerfiles الموجودة

تحقق من أن كل service له Dockerfile صحيح.

### مثال: تحسين Dockerfile للـ Services:

```dockerfile
# File: service-registry/Dockerfile

FROM openjdk:17-jdk-slim as builder

WORKDIR /build

# نسخ الـ pom.xml
COPY service-registry/pom.xml .

# تحميل المكتبات
RUN mvn dependency:resolve

# نسخ الكود
COPY service-registry/src ./src

# بناء الـ JAR
RUN mvn clean package -DskipTests

# Stage 2: صورة الإنتاج الخفيفة
FROM openjdk:17-jdk-slim

WORKDIR /app

# نسخ الـ JAR من builder
COPY --from=builder /build/target/*.jar app.jar

# إنشاء مستخدم بدون صلاحيات
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
    CMD java -cp app.jar org.springframework.boot.loader.JarLauncher \
    && curl -f http://localhost:8761/actuator/health || exit 1

EXPOSE 8761

# بدء التطبيق
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## 2.2: إنشاء Docker Compose محسّن للـ Production

```yaml
# File: docker-compose.prod.yml

version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: care-postgres-prod
    environment:
      POSTGRES_DB: cms_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d  # للـ SQL Seed Scripts
    networks:
      - care-network-prod
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d cms_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Service Registry (Eureka)
  service-registry:
    image: ${DOCKER_REGISTRY}/care-service-registry:${VERSION}
    container_name: care-service-registry-prod
    ports:
      - "8761:8761"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx512m -Xms256m"
    networks:
      - care-network-prod
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  # Config Server
  config-server:
    image: ${DOCKER_REGISTRY}/care-config-server:${VERSION}
    container_name: care-config-server-prod
    ports:
      - "8888:8888"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx512m -Xms256m"
      EUREKA_SERVER: http://service-registry:8761/eureka
    networks:
      - care-network-prod
    depends_on:
      service-registry:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Auth Service
  auth-service:
    image: ${DOCKER_REGISTRY}/care-auth-service:${VERSION}
    container_name: care-auth-service-prod
    ports:
      - "6061:6061"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: cms_db
      DB_USERNAME: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6061
    networks:
      - care-network-prod
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6061/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Access Management Service
  access-management-service:
    image: ${DOCKER_REGISTRY}/care-access-management:${VERSION}
    container_name: care-access-management-prod
    ports:
      - "6062:6062"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: cms_db
      DB_USERNAME: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6062
    networks:
      - care-network-prod
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6062/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Reference Data Service
  reference-data-service:
    image: ${DOCKER_REGISTRY}/care-reference-data:${VERSION}
    container_name: care-reference-data-prod
    ports:
      - "6063:6063"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/cms_db
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE: http://service-registry:8761/eureka
      SERVER_PORT: 6063
    networks:
      - care-network-prod
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6063/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Appointment Service
  appointment-service:
    image: ${DOCKER_REGISTRY}/care-appointment:${VERSION}
    container_name: care-appointment-prod
    ports:
      - "6064:6064"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: cms_db
      DB_USERNAME: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6064
    networks:
      - care-network-prod
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6064/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Data Analysis Service
  data-analysis-service:
    image: ${DOCKER_REGISTRY}/care-data-analysis:${VERSION}
    container_name: care-data-analysis-prod
    ports:
      - "6065:6065"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: cms_db
      DB_USERNAME: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6065
    networks:
      - care-network-prod
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6065/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Chatbot Service
  chatbot-service:
    image: ${DOCKER_REGISTRY}/care-chatbot:${VERSION}
    container_name: care-chatbot-prod
    ports:
      - "6066:6066"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx512m -Xms256m"
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6066
    networks:
      - care-network-prod
    depends_on:
      service-registry:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6066/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # API Gateway
  gateway-service:
    image: ${DOCKER_REGISTRY}/care-gateway:${VERSION}
    container_name: care-gateway-prod
    ports:
      - "6060:6060"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6060
      JWT_SECRET: ${JWT_SECRET}
    networks:
      - care-network-prod
    depends_on:
      service-registry:
        condition: service_healthy
      auth-service:
        condition: service_healthy
      access-management-service:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6060/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

networks:
  care-network-prod:
    driver: bridge

volumes:
  postgres_data_prod:
    driver: local
```

## 2.3: إنشاء `.dockerignore` لتقليل حجم الصور

```bash
# File: .dockerignore

# Node
node_modules/
npm-debug.log*
yarn-debug.log*

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# Git
.git
.gitignore
.gitattributes

# OS
.DS_Store
Thumbs.db

# Build artifacts
target/
dist/
build/
.gradle/

# Documentation
README.md
docs/
help/

# Environment
.env
.env.local
env.properties

# Test files
src/test/
*.test.js

# Docker
docker-compose.yml
docker-compose.override.yml
Dockerfile
.dockerignore

# CI/CD
.github/
.gitlab-ci.yml
Jenkinsfile

# Media
*.mp4
*.mov
*.png
*.jpg
*.jpeg
```

---

# الخطوة 3: إعداد Kubernetes

## 3.1: إنشاء Kubernetes Manifests

### أولاً: إنشاء Namespace و ConfigMap

```yaml
# File: k8s/namespace.yaml

apiVersion: v1
kind: Namespace
metadata:
  name: care-system
  labels:
    name: care-system
---
# File: k8s/configmap.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: care-config
  namespace: care-system
data:
  SPRING_PROFILES_ACTIVE: "kubernetes"
  EUREKA_SERVER: "http://service-registry.care-system.svc.cluster.local:8761/eureka"
  CONFIG_SERVER: "http://config-server.care-system.svc.cluster.local:8888"
  DATABASE_HOST: "postgres.care-system.svc.cluster.local"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "cms_db"
```

### ثانياً: إنشاء Secret (البيانات الحساسة)

```yaml
# File: k8s/secret.yaml
# ⚠️ في الإنتاج، استخدم Sealed Secrets أو External Secrets

apiVersion: v1
kind: Secret
metadata:
  name: care-secrets
  namespace: care-system
type: Opaque
stringData:
  DB_PASSWORD: "YourSecurePassword123!"
  JWT_SECRET: "SuperSecureKeyThatIsAtLeast64CharactersLong..."
  DOCKER_REGISTRY_PASSWORD: "your-docker-password"
```

### ثالثاً: PostgreSQL StatefulSet

```yaml
# File: k8s/postgres-statefulset.yaml

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: care-system
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: care-system
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          value: "cms_db"
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: care-secrets
              key: DB_PASSWORD
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U postgres
          initialDelaySeconds: 5
          periodSeconds: 10
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: care-system
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### رابعاً: Service Registry (Eureka)

```yaml
# File: k8s/service-registry-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-registry
  namespace: care-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: service-registry
  template:
    metadata:
      labels:
        app: service-registry
    spec:
      containers:
      - name: service-registry
        image: ${DOCKER_REGISTRY}/care-service-registry:${VERSION}
        imagePullPolicy: Always
        ports:
        - containerPort: 8761
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: JAVA_OPTS
          value: "-Xmx512m -Xms256m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8761
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8761
          initialDelaySeconds: 30
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: service-registry
  namespace: care-system
spec:
  type: ClusterIP
  selector:
    app: service-registry
  ports:
  - port: 8761
    targetPort: 8761
```

### خامساً: Config Server

```yaml
# File: k8s/config-server-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: config-server
  namespace: care-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: config-server
  template:
    metadata:
      labels:
        app: config-server
    spec:
      containers:
      - name: config-server
        image: ${DOCKER_REGISTRY}/care-config-server:${VERSION}
        imagePullPolicy: Always
        ports:
        - containerPort: 8888
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: EUREKA_SERVER
          valueFrom:
            configMapKeyRef:
              name: care-config
              key: EUREKA_SERVER
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8888
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8888
          initialDelaySeconds: 30
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: config-server
  namespace: care-system
spec:
  type: ClusterIP
  selector:
    app: config-server
  ports:
  - port: 8888
    targetPort: 8888
```

### سادساً: Auth Service

```yaml
# File: k8s/auth-service-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: care-system
spec:
  replicas: 2
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
        image: ${DOCKER_REGISTRY}/care-auth-service:${VERSION}
        imagePullPolicy: Always
        ports:
        - containerPort: 6061
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: care-config
              key: DATABASE_HOST
        - name: DB_PORT
          valueFrom:
            configMapKeyRef:
              name: care-config
              key: DATABASE_PORT
        - name: DB_NAME
          valueFrom:
            configMapKeyRef:
              name: care-config
              key: DATABASE_NAME
        - name: DB_USERNAME
          value: "postgres"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: care-secrets
              key: DB_PASSWORD
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: care-secrets
              key: JWT_SECRET
        - name: EUREKA_SERVER
          valueFrom:
            configMapKeyRef:
              name: care-config
              key: EUREKA_SERVER
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 6061
          initialDelaySeconds: 90
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 6061
          initialDelaySeconds: 60
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1024Mi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: care-system
spec:
  type: ClusterIP
  selector:
    app: auth-service
  ports:
  - port: 6061
    targetPort: 6061
```

### سابعاً: API Gateway

```yaml
# File: k8s/gateway-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
  namespace: care-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
      - name: gateway
        image: ${DOCKER_REGISTRY}/care-gateway:${VERSION}
        imagePullPolicy: Always
        ports:
        - containerPort: 6060
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: EUREKA_SERVER
          valueFrom:
            configMapKeyRef:
              name: care-config
              key: EUREKA_SERVER
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: care-secrets
              key: JWT_SECRET
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 6060
          initialDelaySeconds: 90
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 6060
          initialDelaySeconds: 60
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1024Mi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: gateway
  namespace: care-system
spec:
  type: LoadBalancer
  selector:
    app: gateway
  ports:
  - port: 80
    targetPort: 6060
    protocol: TCP
```

## 3.2: إنشاء Kustomization للـ Deploy السهل

```yaml
# File: k8s/kustomization.yaml

apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: care-system

# القواعد المشتركة
commonLabels:
  app.kubernetes.io/part-of: care-management-system
  app.kubernetes.io/managed-by: kustomize

commonAnnotations:
  deployment.kubernetes.io/revision: "1"

# ملفات الـ YAML
resources:
  - namespace.yaml
  - configmap.yaml
  - secret.yaml
  - postgres-statefulset.yaml
  - service-registry-deployment.yaml
  - config-server-deployment.yaml
  - auth-service-deployment.yaml
  - gateway-deployment.yaml

# Variables للـ Substitution
vars:
  - name: DOCKER_REGISTRY
    objref:
      kind: ConfigMap
      name: docker-config
      apiVersion: v1
    fieldref:
      fieldpath: data.registry
  - name: VERSION
    objref:
      kind: ConfigMap
      name: docker-config
      apiVersion: v1
    fieldref:
      fieldpath: data.version

# Image Patches
images:
  - name: care-service-registry
    newTag: latest
  - name: care-config-server
    newTag: latest
  - name: care-auth-service
    newTag: latest
  - name: care-gateway
    newTag: latest
```

---

# الخطوة 4: إعداد GitHub Actions

## 4.1: إنشاء Main Workflow

```yaml
# File: .github/workflows/build-and-deploy.yml

name: Build & Deploy to Docker & Kubernetes

on:
  push:
    branches:
      - main
      - develop
    paths:
      - '**.java'
      - '**.dart'
      - '**.jsx'
      - 'pom.xml'
      - 'pubspec.yaml'
      - 'package.json'
      - 'Dockerfile'
      - 'docker-compose*.yml'
      - 'k8s/**'
      - '.github/workflows/**'
  pull_request:
    branches:
      - main
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging
          - production

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKER_USERNAME }}

jobs:
  # ===================================
  # المرحلة 1: البناء والاختبار
  # ===================================
  build-backend:
    name: Build Backend Services
    runs-on: ubuntu-latest

    strategy:
      matrix:
        service:
          - service-registry
          - config-server
          - auth-service
          - access-management-service
          - reference-data-service
          - appointment-service
          - data-analysis-service
          - chatbot-service
          - gateway-service

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: ☕ Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: 🏗️ Build Service
        run: |
          cd ${{ matrix.service }}
          mvn clean package -DskipTests --quiet
          echo "✅ ${{ matrix.service }} built successfully"

      - name: 📦 Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.service }}-jar
          path: ${{ matrix.service }}/target/*.jar
          retention-days: 1

  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🔧 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: web-portal/package-lock.json

      - name: 🏗️ Build Web Portal
        run: |
          cd web-portal
          npm ci
          npm run build
          echo "✅ Web Portal built successfully"

      - name: 📦 Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: web-portal-build
          path: web-portal/dist
          retention-days: 1

  build-mobile:
    name: Build Mobile App
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🔧 Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.27.2'

      - name: 🏗️ Build APK
        run: |
          cd care-mobile-app
          flutter pub get
          flutter build apk --release --no-sound-null-safety
          echo "✅ APK built successfully"

      - name: 📦 Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: mobile-apk
          path: care-mobile-app/build/app/outputs/apk/release/app-release.apk
          retention-days: 7

  # ===================================
  # المرحلة 2: الاختبار
  # ===================================
  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    needs: build-backend

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: ${{ secrets.DB_PASSWORD }}
          POSTGRES_DB: cms_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: ☕ Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: 🧪 Run Tests
        run: |
          mvn test \
            -DskipITs=false \
            -Dspring.datasource.url=jdbc:postgresql://localhost:5432/cms_test \
            -Dspring.datasource.password=${{ secrets.DB_PASSWORD }}

      - name: 📊 Publish Test Results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: '**/target/surefire-reports/*.xml'

  # ===================================
  # المرحلة 3: بناء Docker Images
  # ===================================
  build-docker:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: [build-backend, test-backend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    strategy:
      matrix:
        service:
          - service-registry
          - config-server
          - auth-service
          - access-management-service
          - reference-data-service
          - appointment-service
          - data-analysis-service
          - chatbot-service
          - gateway-service

    permissions:
      contents: read
      packages: write

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🔐 Set Up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 🔑 Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: 🏗️ Build & Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: ./
          file: ./${{ matrix.service }}/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/care-${{ matrix.service }}:latest
            ${{ secrets.DOCKER_USERNAME }}/care-${{ matrix.service }}:${{ github.sha }}
          cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/care-${{ matrix.service }}:buildcache
          cache-to: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/care-${{ matrix.service }}:buildcache,mode=max

  # ===================================
  # المرحلة 4: النشر على Kubernetes
  # ===================================
  deploy-kubernetes:
    name: Deploy to Kubernetes
    runs-on: ubuntu-latest
    needs: build-docker
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    environment:
      name: production
      url: https://care-system.example.com

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🔧 Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.27.0'

      - name: 🔑 Configure kubectl
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBECONFIG_CONTENT }}" | base64 -d > $HOME/.kube/config
          chmod 600 $HOME/.kube/config

      - name: 📦 Create Namespace
        run: |
          kubectl create namespace care-system --dry-run=client -o yaml | kubectl apply -f -

      - name: 🔐 Create Secrets
        run: |
          kubectl create secret generic care-secrets \
            --from-literal=DB_PASSWORD="${{ secrets.DB_PASSWORD }}" \
            --from-literal=JWT_SECRET="${{ secrets.JWT_SECRET }}" \
            -n care-system \
            --dry-run=client -o yaml | kubectl apply -f -

      - name: 📋 Apply Kubernetes Manifests
        run: |
          kubectl apply -k k8s/

      - name: ⏳ Wait for Rollout
        run: |
          kubectl rollout status deployment/service-registry -n care-system --timeout=5m
          kubectl rollout status deployment/config-server -n care-system --timeout=5m
          kubectl rollout status deployment/auth-service -n care-system --timeout=5m
          kubectl rollout status deployment/gateway -n care-system --timeout=5m

      - name: ✅ Verify Deployment
        run: |
          kubectl get pods -n care-system
          kubectl get svc -n care-system

      - name: 📊 Check Service Health
        run: |
          echo "🔍 Checking Service Health..."
          GATEWAY_IP=$(kubectl get svc gateway -n care-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
          echo "Gateway IP: $GATEWAY_IP"

          # انتظر حتى يصبح الـ Gateway جاهزاً
          for i in {1..30}; do
            if curl -s http://$GATEWAY_IP:6060/actuator/health | grep -q "UP"; then
              echo "✅ Gateway is healthy!"
              break
            fi
            echo "⏳ Waiting for gateway... ($i/30)"
            sleep 10
          done

  # ===================================
  # المرحلة 5: التنبيهات والإشعارات
  # ===================================
  notify:
    name: Send Notifications
    runs-on: ubuntu-latest
    needs: [build-docker, deploy-kubernetes]
    if: always()

    steps:
      - name: 📧 Send Email Notification
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 465
          username: ${{ secrets.MAIL_USERNAME }}
          password: ${{ secrets.MAIL_PASSWORD }}
          subject: ❌ Deployment Failed
          to: dev-team@example.com
          body: |
            Deployment to Kubernetes failed!

            Repository: ${{ github.repository }}
            Branch: ${{ github.ref }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}

            Check the logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}

      - name: 📢 Send Slack Notification
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Deployment Successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*✅ Deployment Successful*\nRepository: ${{ github.repository }}\nBranch: ${{ github.ref }}\nCommit: ${{ github.sha }}"
                  }
                }
              ]
            }
```

## 4.2: إنشاء Workflow للـ Code Quality

```yaml
# File: .github/workflows/code-quality.yml

name: Code Quality & Security

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  sonarqube:
    name: SonarQube Analysis
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: ☕ Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: 🔍 Run SonarQube
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  security-scan:
    name: Security Vulnerability Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: 🛡️ Run Trivy Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: 📤 Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  dependency-check:
    name: Dependency Vulnerability Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: ☕ Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: 🔍 Run OWASP Dependency Check
        uses: jeremylong/DependencyCheck_Action@main
        with:
          project: 'care-management-system'
          path: '.'
          format: 'SARIF'
          args: >-
            --enableExperimental
```

---

# الخطوة 5: الاختبار والنشر

## 5.1: تشغيل Workflow محلياً (Test)

```bash
# 1. تثبيت act (لتشغيل GitHub Actions محلياً)
# على Windows (استخدم PowerShell):
choco install act

# أو على Mac/Linux:
brew install act

# 2. تشغيل Workflow المحدد
cd /c/Java/care/Code

# اختبر بناء الـ backend فقط
act push --job build-backend

# اختبر الـ deployment
act push --job deploy-kubernetes -s KUBECONFIG_CONTENT=$(cat ~/.kube/config | base64)

# 3. عرض قائمة الـ jobs المتاحة
act -l
```

## 5.2: النشر اليدوي (Manual Deployment)

```bash
# الخطوة 1: بناء الـ Services محلياً
cd /c/Java/care/Code

# بناء جميع الـ Services
mvn clean package -DskipTests

# أو بناء service معين
cd gateway-service
mvn clean package -DskipTests

# الخطوة 2: بناء Docker Images
docker build -t your-registry/care-gateway:v1.0.0 -f gateway-service/Dockerfile .

# الخطوة 3: Push إلى Docker Registry
docker tag your-registry/care-gateway:v1.0.0 your-registry/care-gateway:latest
docker push your-registry/care-gateway:v1.0.0
docker push your-registry/care-gateway:latest

# الخطوة 4: نشر على Kubernetes
kubectl apply -f k8s/

# الخطوة 5: التحقق من الحالة
kubectl get pods -n care-system
kubectl get svc -n care-system
kubectl logs -n care-system deployment/gateway -f
```

## 5.3: التحقق من النشر

```bash
# 1. التحقق من الـ Pods
kubectl get pods -n care-system -w

# متوقع النتيجة:
# NAME                          READY   STATUS    RESTARTS
# service-registry-xxxxx        1/1     Running   0
# config-server-xxxxx           1/1     Running   0
# auth-service-xxxxx            1/1     Running   0
# gateway-xxxxx                 1/1     Running   0

# 2. التحقق من الـ Services
kubectl get svc -n care-system

# 3. التحقق من الـ Logs
kubectl logs -n care-system deployment/gateway --tail=100

# 4. الدخول إلى Pod للاختبار
kubectl exec -it deployment/gateway -n care-system -- /bin/sh

# 5. اختبار الـ Endpoints
GATEWAY_IP=$(kubectl get svc gateway -n care-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$GATEWAY_IP:6060/actuator/health

# 6. عرض الـ Events
kubectl describe pods -n care-system

# 7. عرض الـ Resource Usage
kubectl top nodes
kubectl top pods -n care-system
```

---

# استكشاف الأخطاء

## الخطأ 1: Pods في حالة CrashLoopBackOff

```bash
# تشخيص
kubectl describe pod <pod-name> -n care-system
kubectl logs <pod-name> -n care-system --previous

# الحل (عادةً):
# 1. تحقق من البيانات الحساسة (secrets)
kubectl get secrets -n care-system

# 2. تحقق من ConfigMap
kubectl get configmap -n care-system

# 3. تحقق من الـ Image
kubectl describe pod <pod-name> -n care-system | grep Image

# 4. تحقق من الموارد المتاحة
kubectl describe node
```

## الخطأ 2: ImagePullBackOff

```bash
# الحل:
# 1. تحقق من بيانات الدخول إلى Docker Hub
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=${{ secrets.DOCKER_USERNAME }} \
  --docker-password=${{ secrets.DOCKER_PASSWORD }} \
  -n care-system

# 2. أضف secret إلى pod spec
# في yaml: imagePullSecrets:
#   - name: regcred

# 3. تأكد من أن الـ image موجود
docker pull your-registry/care-gateway:latest
```

## الخطأ 3: Connection Refused

```bash
# تحقق من الـ network
kubectl get network-policies -n care-system

# اختبر الاتصال بين الـ pods
kubectl run -it --rm test --image=curlimages/curl -n care-system -- sh
# في داخل الـ pod:
curl http://service-registry.care-system.svc.cluster.local:8761/
```

## الخطأ 4: Database Connection Error

```bash
# تحقق من PostgreSQL
kubectl get statefulset postgres -n care-system
kubectl logs statefulset/postgres -n care-system

# اختبر الاتصال من pod آخر
kubectl run -it --rm dbtest --image=postgres:16-alpine -n care-system -- sh
# داخل الـ pod:
psql -h postgres.care-system.svc.cluster.local -U postgres -d cms_db
# أدخل كلمة السر من الـ secret
```

---

## 📋 Checklist النشر

### قبل البدء:
- [ ] حساب GitHub و Repository مُنشأ
- [ ] حساب Docker Hub مُنشأ
- [ ] Kubernetes Cluster جاهز (Minikube أو Cloud)
- [ ] kubectl مُركّب ومُعدّ
- [ ] جميع الـ Secrets في GitHub

### الإعداد:
- [ ] `.github/workflows/` موجودة
- [ ] `k8s/` manifests موجودة
- [ ] Dockerfiles صحيحة
- [ ] `.dockerignore` موجود
- [ ] `.gitignore` محسّن

### الاختبار المحلي:
- [ ] بناء الـ Services نجح
- [ ] Docker Images بُنيت بنجاح
- [ ] `docker-compose` اشتغل محلياً

### النشر:
- [ ] Push إلى GitHub main branch
- [ ] GitHub Actions بدأت تعمل
- [ ] Workflow أكمل بنجاح
- [ ] Pods تعمل بشكل صحيح
- [ ] Services accessible

---

## 🔗 مراجع مفيدة

- GitHub Actions: https://docs.github.com/en/actions
- Docker: https://docs.docker.com/
- Kubernetes: https://kubernetes.io/docs/
- Kustomize: https://kustomize.io/
- Spring Boot on K8s: https://spring.io/guides/gs/spring-boot-docker/

---

**حالة الاستعداد:** ✅ جاهز للتنفيذ الآن!

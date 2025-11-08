# 🚀 دليل النشر على سيرفر واحد مجاني
# Single Server Production Deployment Guide

**التاريخ:** 2 نوفمبر 2025
**الهدف:** نشر جميع الخدمات + React على سيرفر واحد مجاني
**المدة:** 4-6 ساعات (تثبيت + اختبار)

---

## 📊 ملخص سريع

```
ما لديك الآن:        ما ستحصل عليه:
├─ localhost:3000    ├─ your-domain.com
├─ localhost:6060    ├─ PostgreSQL مركزية
├─ localhost:6061    ├─ جميع Services في Docker
├─ localhost:6062    ├─ React Web Portal
├─ localhost:6063    ├─ API Gateway
├─ localhost:6064    ├─ Health Checks
└─ localhost:6065    └─ Monitoring و Logs
```

---

## 🎯 الخيارات المتاحة (مجاني)

### ✅ الخيار 1: Render.com (الأفضل للمبتدئين)
- ✅ مجاني تماماً (شروط معينة)
- ✅ PostgreSQL مدار تماماً
- ✅ 750 ساعة/شهر مجانية
- ❌ قد ينام السيرفر إذا لم يُستخدم 15 دقيقة

### ✅ الخيار 2: Railway.app
- ✅ مجاني $5/شهر للجميع (كافي لاختبار)
- ✅ PostgreSQL مدار
- ✅ سهل جداً
- ❌ محدود بـ $5 فقط

### ✅ الخيار 3: Fly.io
- ✅ مجاني بشروط
- ✅ سريع جداً
- ✅ 3 Shared-CPU تطبيقات مجانية
- ❌ يحتاج Dockerfile معينة

### ✅ الخيار 4: DigitalOcean Droplet
- ✅ $4/شهر للـ starter
- ✅ كامل السيطرة
- ✅ سريع وموثوق
- ❌ ليس مجاني تماماً

### ⭐ الخيار 5: AWS Free Tier (الأفضل على المدى الطويل)
- ✅ مجاني لمدة سنة كاملة
- ✅ t2.micro EC2 + RDS PostgreSQL
- ✅ كامل التحكم
- ❌ يحتاج خطوات أكثر

---

## 🚀 الجزء 1: تحضير المشروع

### الخطوة 1: بناء جميع الـ Services

```bash
cd c:\Java\care\Code

# تنظيف وبناء
mvn clean install -DskipTests

# أو بناء من root مباشرة
mvn -f pom.xml clean package -DskipTests

# تحقق من الـ JARs
ls -R target/
```

**الوقت المتوقع:** 10-15 دقيقة

### الخطوة 2: بناء React Web Portal

```bash
cd web-portal

# تثبيت المكتبات
npm ci

# بناء للإنتاج
npm run build

# النتيجة موجودة في: dist/

ls -la dist/
```

**الوقت المتوقع:** 3-5 دقائق

### الخطوة 3: تحضير Docker Images

```bash
cd c:\Java\care\Code

# بناء جميع الـ Images
docker-compose build

# أو بناء محدد
docker build -t care-gateway:latest -f gateway-service/Dockerfile .
docker build -t care-auth:latest -f auth-service/auth-service/Dockerfile .
# ... الخ
```

**الوقت المتوقع:** 20-30 دقيقة

---

## 🌍 الجزء 2: اختيار واعداد السيرفر

### ⭐ الخيار الموصى به: Railway.app

#### الخطوة 1: إنشاء حساب
```
1. انتقل إلى railway.app
2. Sign up بـ GitHub
3. تأكيد البريد الإلكتروني
```

#### الخطوة 2: إنشاء Project جديد
```
1. اضغط: New Project
2. اختر: Provision PostgreSQL
3. اضغط: Create
```

#### الخطوة 3: إضافة الخدمات
```
1. اضغط: + New Service
2. اختر: GitHub Repo
3. Select: your-repo/care-management-system
4. اختر: Docker
```

#### الخطوة 4: إعداد المتغيرات البيئية

في Railway Dashboard، أضف Variables:

```yaml
# Database
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_NAME=cms_db
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Service URLs
EUREKA_SERVER=http://service-registry:8761/eureka
CONFIG_SERVER=http://config-server:8888
GATEWAY_URL=http://gateway:6060

# Application
JWT_SECRET=SuperSecureKeyThatIsAtLeast64CharactersLong...
SPRING_PROFILES_ACTIVE=prod
```

---

## 💻 الجزء 3: إعدادات التطبيق للإنتاج

### تحديث application.yml لجميع Services

#### 1. Gateway Service
```yaml
# gateway-service/src/main/resources/application-prod.yml

server:
  port: 6060

spring:
  application:
    name: gateway-service
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - https://your-domain.com
              - https://www.your-domain.com
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders:
              - '*'
            allowCredentials: true
      routes:
        - id: auth-api
          uri: http://auth-service:6061
          predicates:
            - Path=/auth/**
          filters:
            - StripPrefix=1

        - id: access-api
          uri: http://access-management-service:6062
          predicates:
            - Path=/access/**
          filters:
            - StripPrefix=1

        - id: appointment-api
          uri: http://appointment-service:6064
          predicates:
            - Path=/appointment/**
          filters:
            - StripPrefix=1

        - id: reference-api
          uri: http://reference-data-service:6063
          predicates:
            - Path=/reference/**
          filters:
            - StripPrefix=1

eureka:
  client:
    service-url:
      defaultZone: http://service-registry:8761/eureka/
  instance:
    preferIpAddress: true
    hostname: gateway-service

logging:
  level:
    root: INFO
    org.springframework.cloud.gateway: INFO

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

#### 2. Auth Service
```yaml
# auth-service/auth-service/src/main/resources/application-prod.yml

server:
  port: 6061

spring:
  application:
    name: auth-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:cms_db}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
    show-sql: false

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER:http://service-registry:8761/eureka/}
  instance:
    preferIpAddress: true
    hostname: auth-service

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000

logging:
  level:
    root: INFO
```

#### 3. جميع Services الأخرى
```yaml
# نفس الإعدادات السابقة لكل service

server:
  port: ${SERVER_PORT:6062}  # غيّر الـ port لكل service

spring:
  application:
    name: access-management-service  # غيّر الاسم
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:cms_db}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:password}
  jpa:
    hibernate:
      ddl-auto: validate

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER:http://service-registry:8761/eureka/}
  instance:
    preferIpAddress: true
```

---

## 📦 الجزء 4: docker-compose.yml للإنتاج

```yaml
# File: docker-compose.prod.yml

version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: care-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-cms_db}
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - care-network
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Service Registry (Eureka)
  service-registry:
    image: care-service-registry:latest
    container_name: care-service-registry
    ports:
      - "8761:8761"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx512m -Xms256m"
    networks:
      - care-network
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Config Server
  config-server:
    image: care-config-server:latest
    container_name: care-config-server
    ports:
      - "8888:8888"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx512m -Xms256m"
      EUREKA_SERVER: http://service-registry:8761/eureka
    networks:
      - care-network
    restart: always
    depends_on:
      service-registry:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Auth Service
  auth-service:
    image: care-auth-service:latest
    container_name: care-auth
    ports:
      - "6061:6061"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-cms_db}
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6061
    networks:
      - care-network
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6061/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Access Management Service
  access-management-service:
    image: care-access-management:latest
    container_name: care-access-mgmt
    ports:
      - "6062:6062"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-cms_db}
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6062
    networks:
      - care-network
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      auth-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6062/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Reference Data Service
  reference-data-service:
    image: care-reference-data:latest
    container_name: care-reference-data
    ports:
      - "6063:6063"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-cms_db}
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6063
    networks:
      - care-network
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6063/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Appointment Service
  appointment-service:
    image: care-appointment-service:latest
    container_name: care-appointment
    ports:
      - "6064:6064"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-cms_db}
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6064
    networks:
      - care-network
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      auth-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6064/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Data Analysis Service
  data-analysis-service:
    image: care-data-analysis:latest
    container_name: care-data-analysis
    ports:
      - "6065:6065"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-cms_db}
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6065
    networks:
      - care-network
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      service-registry:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6065/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Chatbot Service
  chatbot-service:
    image: care-chatbot:latest
    container_name: care-chatbot
    ports:
      - "6066:6066"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx512m -Xms256m"
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6066
    networks:
      - care-network
    restart: always
    depends_on:
      service-registry:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6066/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # API Gateway
  gateway-service:
    image: care-gateway:latest
    container_name: care-gateway
    ports:
      - "6060:6060"
      - "80:6060"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx1024m -Xms512m"
      EUREKA_SERVER: http://service-registry:8761/eureka
      SERVER_PORT: 6060
      JWT_SECRET: ${JWT_SECRET}
    networks:
      - care-network
    restart: always
    depends_on:
      service-registry:
        condition: service_healthy
      auth-service:
        condition: service_healthy
      access-management-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6060/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Nginx (Web Server + React)
  nginx:
    image: nginx:alpine
    container_name: care-nginx
    ports:
      - "3000:80"
    volumes:
      - ./web-portal/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - care-network
    restart: always
    depends_on:
      - gateway-service
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 5

networks:
  care-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

---

## 📄 الجزء 5: إعدادات Nginx

```nginx
# File: nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Server block for React app
    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Serve static files with cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # React Router - fallback to index.html
        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache";
        }

        # Proxy API requests to Gateway
        location /api/ {
            proxy_pass http://gateway-service:6060;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 🚀 الجزء 6: خطوات النشر (على السيرفر)

### الخطوة 1: إعداد السيرفر

```bash
# 1. تحديث النظام
sudo apt update
sudo apt upgrade -y

# 2. تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 3. تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. التحقق
docker --version
docker-compose --version
```

### الخطوة 2: استنساخ المشروع

```bash
# انتقل إلى مجلد المشروع
cd /opt
sudo git clone https://github.com/your-username/care-management-system.git
cd care-management-system

# أو إذا كنت استخدمت git بالفعل:
# git pull origin main
```

### الخطوة 3: إنشاء ملف .env

```bash
# File: .env

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cms_db
DB_USERNAME=postgres
DB_PASSWORD=YourVerySecurePassword123!@#

# JWT
JWT_SECRET=SuperSecureKeyThatIsAtLeast64CharactersLongToAvoidWeakKeyException1234567890

# Environment
SPRING_PROFILES_ACTIVE=prod
ENVIRONMENT=production

# Logging
LOG_LEVEL=INFO
```

### الخطوة 4: بناء Docker Images

```bash
# على السيرفر
docker-compose -f docker-compose.prod.yml build

# أو push من جهازك المحلي:
# docker build -t your-registry/care-gateway:latest -f gateway-service/Dockerfile .
# docker push your-registry/care-gateway:latest
```

### الخطوة 5: تشغيل الخدمات

```bash
# تشغيل جميع الخدمات
docker-compose -f docker-compose.prod.yml up -d

# التحقق من الحالة
docker-compose -f docker-compose.prod.yml ps

# عرض الـ Logs
docker-compose -f docker-compose.prod.yml logs -f

# إيقاف
docker-compose -f docker-compose.prod.yml down
```

---

## ✅ الجزء 7: التحقق والاختبار

### التحقق من الخدمات

```bash
# 1. تحقق من Eureka
curl http://your-server:8761/

# 2. تحقق من Gateway
curl http://your-server:6060/actuator/health

# 3. تحقق من Auth Service
curl http://your-server:6061/actuator/health

# 4. تحقق من Database
curl http://your-server:6060/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# 5. تحقق من React App
curl http://your-server:3000/
```

### الأوامر المفيدة

```bash
# عرض الـ Logs لخدمة معينة
docker-compose logs auth-service -f

# الدخول إلى container
docker exec -it care-postgres psql -U postgres -d cms_db

# إعادة تشغيل service معين
docker-compose restart auth-service

# حذف كل شيء
docker-compose down -v
```

---

## 🔐 الأمان

### 1. استخدام HTTPS

```nginx
# في nginx.conf:
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    # ...
}

# تثبيت Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### 2. إعداد Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. حماية Database

```bash
# في docker-compose.prod.yml:
# استخدم passwords قوية جداً
# لا تعرّض port 5432 للإنترنت
```

---

## 📊 مراقبة الحالة

```bash
# مراقبة استخدام الموارد
docker stats

# عرض logs جميع الخدمات
docker-compose logs --tail=100 -f

# تحقق من Health
curl http://your-server:6060/actuator/health/liveness
curl http://your-server:6060/actuator/health/readiness
```

---

## 🔄 التحديثات المستقبلية

```bash
# لتحديث الخدمات:
git pull origin main
docker-compose build
docker-compose up -d

# أو rebuild خدمة معينة:
docker-compose build auth-service
docker-compose up -d auth-service
```

---

## 🎯 خريطة الطريق

```
الآن (localhost)
    ↓
1. اختيار السيرفر (Railway/AWS/etc) - 5 دقائق
    ↓
2. تحضير الملفات (docker-compose, nginx.conf, .env) - 15 دقيقة
    ↓
3. بناء Docker Images - 20 دقيقة
    ↓
4. رفع على السيرفر - 10 دقائق
    ↓
5. تشغيل وتحقق - 10 دقائق
    ↓
✅ يعمل! (60 دقيقة إجمالي)
```

---

## ❓ أسئلة شائعة

**س: هل يمكنني استخدام السيرفر المحلي؟**
ج: نعم! افعل:
```bash
docker-compose -f docker-compose.prod.yml up -d
# ثم افتح: http://localhost:3000
```

**س: كيف أتصل من الموبايل؟**
ج:
```
استخدم IP الكمبيوتر:
http://192.168.1.X:3000  # بدلاً من localhost
```

**س: كيف أعدل الكود؟**
ج:
```bash
# عدّل الملفات
# ثم أعد البناء:
docker-compose build service-name
docker-compose up -d service-name
```

**س: كيف أنسخ البيانات من localhost؟**
ج:
```bash
# قم بـ backup من localhost
docker exec care-postgres pg_dump -U postgres cms_db > backup.sql

# استعد على السيرفر الجديد
docker exec care-postgres psql -U postgres cms_db < backup.sql
```

---

**الحالة:** ✅ جاهز للنشر الآن!

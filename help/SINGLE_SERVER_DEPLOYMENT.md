# 🚀 نشر على سيرفر واحد - الدليل السريع
# Single Server Deployment - Quick Start

**الهدف:** نشر جميع الخدمات + React Web Portal على سيرفر واحد

---

## ⚡ الخطوات السريعة (نسخ و التصق)

### الخطوة 1: على جهازك المحلي - Build

```powershell
# في PowerShell (كـ Administrator)
cd c:\Java\care\Code

# تشغيل script النشر
.\DEPLOY_PRODUCTION.ps1 -Action build -DBPassword "YourSecurePassword123!" -JWTSecret "SuperSecureKeyThatIsAtLeast64CharactersLongXYZ..."
```

**النتيجة:**
- ✅ جميع Java services مبنية
- ✅ React app مبني (في `web-portal/dist/`)
- ✅ Docker images جاهزة

---

### الخطوة 2: على السيرفر - التحضير

```bash
# في Terminal على السيرفر (Ubuntu/Debian)

# 1. تحديث النظام
sudo apt update && sudo apt upgrade -y

# 2. تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 3. تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. التحقق
docker --version
docker-compose --version
```

---

### الخطوة 3: نسخ المشروع على السيرفر

```bash
# على السيرفر
cd /opt
sudo git clone https://github.com/your-username/care-management-system.git
cd care-management-system

# أو اجذب آخر تحديثات
git pull origin main
```

---

### الخطوة 4: إنشاء ملف .env

```bash
# على السيرفر
cp .env.example .env

# ثم عدّل الملف:
nano .env

# أو استخدم السكريبت:
cat > .env << 'EOF'
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cms_db
DB_USERNAME=postgres
DB_PASSWORD=YourSecurePassword123!

JWT_SECRET=SuperSecureKeyThatIsAtLeast64CharactersLongToAvoidWeakKeyException1234567890

SPRING_PROFILES_ACTIVE=prod
ENVIRONMENT=production
LOG_LEVEL=INFO
EOF
```

---

### الخطوة 5: تشغيل الخدمات

```bash
# على السيرفر

# بناء Docker images (إذا لم تُبنَ بعد)
docker-compose -f docker-compose.prod.yml build

# تشغيل جميع الخدمات
docker-compose -f docker-compose.prod.yml up -d

# التحقق من الحالة
docker-compose -f docker-compose.prod.yml ps

# عرض الـ Logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

### الخطوة 6: التحقق من الوصول

```bash
# من الـ Terminal أو Browser

# 1. React App
http://your-server-ip:3000

# 2. API Gateway
http://your-server-ip:6060/actuator/health

# 3. Eureka
http://your-server-ip:8761/

# 4. Swagger Docs
http://your-server-ip:6060/swagger-ui/index.html

# 5. من الموبايل (استخدم IP السيرفر بدلاً من localhost)
http://192.168.x.x:3000
```

---

## 📊 البنية على السيرفر

```
السيرفر الواحد
├── PostgreSQL (port 5432)
│   └── cms_db
├── Eureka Service Registry (port 8761)
├── Config Server (port 8888)
├── Auth Service (port 6061)
├── Access Management (port 6062)
├── Reference Data (port 6063)
├── Appointment Service (port 6064)
├── Data Analysis (port 6065)
├── Chatbot Service (port 6066)
├── API Gateway (port 6060)
└── Nginx + React (port 3000/80)
```

**التطبيق:**
- Web: http://server:3000 (Nginx + React)
- API: http://server:6060 (Gateway)

---

## 🔧 الأوامر المهمة

### مراقبة الحالة

```bash
# عرض جميع الـ containers
docker-compose ps

# عرض الـ Logs
docker-compose logs -f

# Logs خدمة معينة
docker-compose logs auth-service -f

# موارد التطبيقات
docker stats

# فحص health endpoints
curl http://localhost:6060/actuator/health
curl http://localhost:8761/
```

### إعادة التشغيل

```bash
# إعادة تشغيل جميع الخدمات
docker-compose restart

# إعادة خدمة معينة
docker-compose restart auth-service

# حذف وإعادة التشغيل
docker-compose down
docker-compose up -d
```

### الاتصال بـ Database

```bash
# الدخول إلى PostgreSQL
docker exec -it care-postgres psql -U postgres -d cms_db

# في داخل psql:
\dt                    -- عرض الجداول
SELECT * FROM users;   -- استعلام مثال
\q                     -- خروج
```

### Backup و Restore

```bash
# Backup Database
docker exec care-postgres pg_dump -U postgres cms_db > backup.sql

# Restore Database
docker exec -i care-postgres psql -U postgres cms_db < backup.sql
```

---

## 🌐 ربط Domain (اختياري)

```bash
# 1. اشتر domain من GoDaddy, Namecheap, etc.

# 2. أشر DNS إلى IP السيرفر:
#    A record: your-domain.com → server-ip
#    A record: www.your-domain.com → server-ip

# 3. نسخ Docker Compose مع Nginx
docker-compose -f docker-compose.prod.yml up -d

# 4. الوصول
http://your-domain.com
```

---

## 🔐 HTTPS (Let's Encrypt)

```bash
# 1. تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# 2. الحصول على شهادة
sudo certbot certonly --standalone -d your-domain.com

# 3. تحديث nginx.conf (اختياري - الحالي HTTP فقط)

# 4. إعادة تشغيل Nginx
docker-compose restart nginx
```

---

## 🐛 استكشاف الأخطاء

### الخدمات لا تبدأ

```bash
# عرض الخطأ
docker-compose logs

# الحل الشامل:
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database connection failed

```bash
# تحقق من الـ Environment variables
cat .env

# تحقق من البيانات الحساسة
docker exec care-postgres env | grep DB

# اختبر الاتصال
docker exec care-postgres pg_isready -U postgres
```

### Port in use

```bash
# إيقاف الخدمات السابقة
docker-compose down

# أو غيّر الـ port في docker-compose.yml
```

### Services not registering in Eureka

```bash
# تحقق من Eureka
curl http://localhost:8761/

# تحقق من logs
docker-compose logs service-registry

# تأكد من EUREKA_SERVER البيئة:
cat .env | grep EUREKA
```

---

## 📱 الموبايل

### تعديل بيانات الاتصال

في الموبايل App، عدّل:

```dart
// lib/app/data/providers/api_provider.dart

const String baseUrl = 'http://192.168.x.x:6060/api';  // IP السيرفر الفعلي
```

ثم أعد البناء:

```bash
flutter clean
flutter pub get
flutter build apk --release
```

---

## 📊 الأداء

### تحسين الموارد

```bash
# في .env:
JAVA_OPTS_GATEWAY=-Xmx512m -Xms256m  # لـ localhost
JAVA_OPTS_GATEWAY=-Xmx2048m -Xms1024m # لـ production
```

### مراقبة الاستخدام

```bash
# عرض استخدام CPU و Memory
docker stats --no-stream

# عرض الـ Logs الكبيرة
docker system df
docker system prune -a  # حذف الـ images غير المستخدمة
```

---

## 🔄 تحديث الكود

```bash
# على السيرفر

# جلب آخر التحديثات
git pull origin main

# إعادة البناء
docker-compose build

# التشغيل
docker-compose up -d
```

---

## 📝 ملخص الملفات

| الملف | الاستخدام |
|------|----------|
| `.env.example` | نموذج للمتغيرات (انسخ إلى `.env`) |
| `docker-compose.prod.yml` | التكوين الإنتاجي |
| `nginx.conf` | إعدادات الـ Web Server |
| `DEPLOY_PRODUCTION.ps1` | Script النشر (Windows) |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | شرح مفصل |

---

## ✅ Checklist للنشر

```
[ ] Java services built locally
[ ] React app built locally
[ ] Docker images created
[ ] Server prepared (Docker installed)
[ ] Project cloned on server
[ ] .env file created
[ ] docker-compose up -d executed
[ ] Services healthy (check docker ps)
[ ] React accessible on port 3000
[ ] API Gateway responding
[ ] Database connected
[ ] Mobile app updated with server IP
[ ] HTTPS configured (optional)
[ ] Backup strategy set up
```

---

## 🎯 الخطوات التالية

1. **اختبار شامل** - اختبر جميع الميزات
2. **الأمان** - فعّل HTTPS و الـ Firewall
3. **المراقبة** - أضف Prometheus/Grafana
4. **الـ Backup** - اعداد Backup يومي
5. **التوسع** - انقل إلى Kubernetes (إذا كبر المشروع)

---

## 📞 الدعم السريع

**المشكلة:** الخدمات لا تعمل
**الحل:**
```bash
docker-compose down -v
docker-compose up -d
docker-compose logs
```

**المشكلة:** Database فارغة
**الحل:**
```bash
docker exec -i care-postgres psql -U postgres cms_db < init.sql
```

**المشكلة:** لا يمكن الوصول من الموبايل
**الحل:**
```
استخدم IP السيرفر الفعلي، ليس localhost:
http://192.168.1.100:3000 (بدلاً من http://localhost:3000)
```

---

**🚀 الآن أنت جاهز للنشر على سيرفر واحد!**

**المدة الإجمالية:** 1-2 ساعة
**المتطلبات:** سيرفر بـ 2GB RAM و 20GB Storage (كـ minimum)

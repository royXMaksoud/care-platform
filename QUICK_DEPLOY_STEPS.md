# 🚀 خطوات النشر السريعة
# Quick Deployment Steps - 30 Minutes Setup

**الوقت:** 30-45 دقيقة فقط
**الصعوبة:** سهل جداً ⭐⭐

---

## ✅ الخطوة 0: التحضير (5 دقائق)

```bash
# تأكد من تثبيت الأدوات
docker --version           # يجب أن يكون مثبتاً
docker-compose --version   # يجب أن يكون مثبتاً
kubectl version --client   # يجب أن يكون مثبتاً

# انتقل إلى مجلد المشروع
cd c:\Java\care\Code
pwd  # تأكد من الموقع الصحيح
```

---

## ✅ الخطوة 1: إعداد حساب Docker Hub (5 دقائق)

### أ) إنشاء حساب (إذا لم تكن تملك واحد)
```bash
# 1. انتقل إلى https://hub.docker.com
# 2. انقر Sign Up
# 3. ملء البيانات (البريد، الاسم، الكلمة السرية)
# 4. تأكيد البريد الإلكتروني
```

### ب) إنشاء Personal Access Token (PAT)
```bash
# 1. انتقل إلى https://hub.docker.com/settings/security
# 2. انقر "New Access Token"
# 3. أدخل الاسم: github-actions
# 4. الصلاحيات: Read, Write, Delete
# 5. انقر Generate
# 6. انسخ الـ Token (ستحتاجه الآن)

# احفظه في مكان آمن - هذا هو PASSWORD الذي تحتاجه
```

---

## ✅ الخطوة 2: إعداد GitHub Repository (5 دقائق)

### أ) إنشاء Repository جديد على GitHub
```bash
# 1. انتقل إلى github.com/new
# 2. ملء البيانات:
#    - Repository name: care-management-system
#    - Description: Enterprise Care Management System
#    - Public/Private: اختر حسب الحاجة
# 3. انقر Create repository

# 4. في Terminal/PowerShell:
cd c:\Java\care\Code
git init
git add .
git commit -m "Initial commit: Care Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/care-management-system.git
git push -u origin main
```

### ب) إضافة GitHub Secrets
```bash
# 1. انتقل إلى:
#    Settings → Secrets and variables → Actions

# 2. أضف هذه الـ Secrets واحدة تلو الأخرى:

# Secret 1: Docker Username
# Name: DOCKER_USERNAME
# Value: your_docker_hub_username

# Secret 2: Docker Password (استخدم Token من الخطوة 1)
# Name: DOCKER_PASSWORD
# Value: your_docker_pat_token

# Secret 3: Database Password (اختر كلمة سر قوية)
# Name: DB_PASSWORD
# Value: YourSecurePassword123!

# Secret 4: JWT Secret (نسخ بطولة من الملف الموجود أو أنشئ جديد)
# Name: JWT_SECRET
# Value: SuperSecureKeyThatIsAtLeast64CharactersLong...

# Secret 5: Kubeconfig (إذا كان لديك K8s خارجي - اختياري الآن)
# Name: KUBECONFIG_CONTENT
# Value: <محتوى kubeconfig في Base64>

# 3. إذا كنت تستخدم Kubernetes محلي (Minikube/Docker Desktop):
#    يمكنك تجاوز KUBECONFIG_CONTENT الآن
```

---

## ✅ الخطوة 3: الاختبار المحلي (10 دقائق)

### أ) بناء المشروع محلياً
```bash
# في root المشروع
cd c:\Java\care\Code

# بناء جميع الـ Services
mvn clean package -DskipTests

# هذا قد يستغرق 5-10 دقائق في المرة الأولى
```

### ب) اختبار Docker Compose المحلي
```bash
# تشغيل المشروع بـ Docker Compose
docker-compose up -d

# انتظر 2-3 دقائق
sleep 180

# التحقق من الـ Services
docker-compose ps

# يجب أن ترى جميع الـ Containers running:
# service-registry  |  Up
# config-server    |  Up
# auth-service     |  Up
# gateway-service  |  Up
# ...

# اختبر الـ Gateway
curl http://localhost:6060/actuator/health

# إيقاف الـ Containers
docker-compose down
```

---

## ✅ الخطوة 4: تشغيل GitHub Actions (5 دقائق)

### أ) دفع التغييرات إلى GitHub
```bash
cd c:\Java\care\Code

# تأكد من أن كل شيء مُحفوظ
git status

# إذا كانت هناك تغييرات:
git add .
git commit -m "feat: add GitHub Actions and Kubernetes manifests"
git push origin main

# هذا سيشغل الـ Workflow تلقائياً!
```

### ب) مراقبة الـ Workflow
```bash
# انتقل إلى: github.com/YOUR_USERNAME/care-management-system

# 1. اختر التابة "Actions" من الأعلى
# 2. اختر أحدث Workflow run
# 3. شاهد التقدم:
#    - 🟠 Yellow = قيد التنفيذ
#    - 🟢 Green = نجح
#    - 🔴 Red = فشل

# الخطوات المتوقعة:
# 1. build-backend (5-10 دقائق)
# 2. build-frontend (2-3 دقائق)
# 3. build-mobile (5-10 دقائق)
# 4. test-backend (3-5 دقائق)
# 5. build-docker (10-15 دقيقة)
# 6. deploy-kubernetes (5-10 دقائق)

# الوقت الإجمالي: حوالي 40-60 دقيقة
```

### ج) التحقق من Docker Hub
```bash
# بعد انتهاء build-docker step

# 1. انتقل إلى docker.io/YOUR_USERNAME
# 2. يجب أن ترى هذه الصور:
#    - care-service-registry
#    - care-config-server
#    - care-auth-service
#    - care-gateway
#    - ... و أكثر

# كل صورة يجب أن يكون لها:
# - latest tag
# - sha tag (مثل: abc123def456...)

# مثال:
# care-gateway:latest
# care-gateway:abc123def456
```

---

## ✅ الخطوة 5: النشر على Kubernetes (10 دقائق)

### أ) إعداد Kubernetes محلي

#### الخيار 1: Docker Desktop Kubernetes
```bash
# 1. افتح Docker Desktop
# 2. Settings → Kubernetes → Enable Kubernetes
# 3. انتظر حتى يصبح جاهزاً (2-3 دقائق)

# تحقق
kubectl cluster-info
```

#### الخيار 2: Minikube
```bash
# تثبيت Minikube
choco install minikube

# بدء Minikube
minikube start --cpus=4 --memory=8192

# تحقق
kubectl cluster-info
```

### ب) النشر يدوياً على Kubernetes
```bash
cd c:\Java\care\Code

# 1. إنشاء Namespace
kubectl create namespace care-system

# 2. إنشاء Secrets
kubectl create secret generic care-secrets \
  --from-literal=DB_PASSWORD=YourSecurePassword123! \
  --from-literal=JWT_SECRET=SuperSecureKeyThatIsAtLeast64CharactersLong... \
  -n care-system

# 3. إنشاء ConfigMap
kubectl create configmap care-config \
  --from-literal=SPRING_PROFILES_ACTIVE=kubernetes \
  --from-literal=EUREKA_SERVER=http://service-registry.care-system.svc.cluster.local:8761/eureka \
  -n care-system

# 4. تحديث أسماء الـ Images في k8s/kustomization.yaml
# افتح الملف وغيّر:
# docker.io/your-username  →  docker.io/YOUR_ACTUAL_USERNAME

# 5. نشر Manifests
kubectl apply -k k8s/

# 6. متابعة التقدم
kubectl get pods -n care-system -w

# انتظر حتى تصبح جميع الـ Pods "Running"
# Ctrl+C للخروج من المراقبة
```

### ج) التحقق من النشر
```bash
# 1. عرض جميع الـ Pods
kubectl get pods -n care-system

# متوقع:
# NAME                               READY   STATUS    RESTARTS
# postgres-0                         1/1     Running   0
# service-registry-xxx               1/1     Running   0
# config-server-xxx                  1/1     Running   0
# gateway-xxx                        2/2     Running   0
# ...

# 2. عرض الـ Services
kubectl get svc -n care-system

# 3. عرض الـ Logs
kubectl logs -n care-system deployment/gateway -f

# 4. اختبار الـ Gateway
kubectl port-forward -n care-system svc/gateway 6060:80

# في Terminal آخر:
curl http://localhost:6060/actuator/health

# متوقع النتيجة:
# {"status":"UP"}
```

---

## 🔧 الأوامر المهمة (للمرجعية)

### مراقبة الـ Services
```bash
# 1. عرض جميع الـ Resources في Namespace
kubectl get all -n care-system

# 2. عرض الـ Logs
kubectl logs -n care-system deployment/auth-service -f

# 3. وصف Pod (لاستكشاف الأخطاء)
kubectl describe pod <pod-name> -n care-system

# 4. الدخول إلى Pod
kubectl exec -it <pod-name> -n care-system -- /bin/bash

# 5. حذف Deployment
kubectl delete deployment gateway -n care-system

# 6. حذف جميع الـ Resources
kubectl delete namespace care-system
```

### Docker Commands
```bash
# 1. عرض الـ Images المحلية
docker images | grep care

# 2. بناء image محلي
docker build -t your-username/care-gateway:v1 -f gateway-service/Dockerfile .

# 3. Push إلى Docker Hub
docker push your-username/care-gateway:v1

# 4. عرض الـ Containers
docker ps -a | grep care

# 5. عرض الـ Logs
docker logs <container-id>
```

---

## 🐛 استكشاف الأخطاء السريعة

### الخطأ: "ImagePullBackOff"
```bash
# السبب: الـ Image غير موجود أو بيانات الدخول خاطئة

# الحل:
# 1. تحقق من اسم الـ Image
kubectl describe pod <pod-name> -n care-system | grep Image

# 2. تأكد من أن الـ Image موجود على Docker Hub
docker search your-username/care-gateway

# 3. إعادة بناء وـ Push
docker build -t your-username/care-gateway:latest -f gateway-service/Dockerfile .
docker push your-username/care-gateway:latest

# 4. تحديث الـ Manifest وإعادة النشر
kubectl rollout restart deployment/gateway -n care-system
```

### الخطأ: "CrashLoopBackOff"
```bash
# السبب: التطبيق يتعطل عند البدء

# الحل:
# 1. عرض الـ Logs
kubectl logs <pod-name> -n care-system --previous

# 2. تحقق من البيانات الحساسة
kubectl get secrets -n care-system
kubectl get configmap -n care-system

# 3. تأكد من أن Database متاح
kubectl logs -n care-system statefulset/postgres -f
```

### الخطأ: "Pending"
```bash
# السبب: لا توجد موارد كافية

# الحل:
# 1. عرض الأحداث
kubectl describe pod <pod-name> -n care-system

# 2. عرض الموارد المتاحة
kubectl describe node

# 3. تقليل الموارد المطلوبة (في الـ manifests)
# memory: "512Mi" → "256Mi"
# cpu: "500m" → "250m"
```

---

## 📊 خريطة التقدم

```
المرحلة 1: التحضير (5 دقائق) ✅
├─ تثبيت الأدوات
├─ إنشاء Docker Hub Account
└─ إنشاء GitHub Account

المرحلة 2: الإعداد (10 دقائق) ✅
├─ إنشاء GitHub Repository
├─ إضافة GitHub Secrets
└─ دفع الكود

المرحلة 3: الاختبار المحلي (10 دقائق) ✅
├─ بناء المشروع
├─ تشغيل Docker Compose
└─ الاختبار

المرحلة 4: GitHub Actions (45 دقيقة) ⏳
├─ تشغيل Workflow
├─ بناء Docker Images
└─ التحقق على Docker Hub

المرحلة 5: Kubernetes (10 دقائق) ⏳
├─ تشغيل Kubernetes
├─ نشر Manifests
└─ التحقق من الـ Services

✅ = مكتمل
⏳ = قيد التنفيذ
```

---

## 📞 الدعم السريع

### أسئلة شائعة

**س: هل يجب أن أستخدم Kubernetes؟**
ج: لا، في البداية يمكنك استخدام Docker Compose فقط. Kubernetes اختياري للإنتاج.

**س: هل يمكنني استخدام Cloud Provider (AWS/Azure/GCP) بدلاً من Minikube؟**
ج: نعم! الـ manifests يعملون مع أي Kubernetes Cluster.

**س: كم سيكلفني هذا؟**
ج: تماماً مجاني للـ Private Projects على GitHub و Docker Hub!

**س: كيف أوقف الـ Cluster بدون حذفه؟**
ج:
```bash
# Minikube
minikube stop

# Docker Desktop
# Settings → Kubernetes → Disable Kubernetes
```

**س: كيف أحذف كل شيء؟**
ج:
```bash
# حذف Kubernetes Namespace (يحذف كل شيء فيه)
kubectl delete namespace care-system

# أو حذف Cluster كاملاً
minikube delete
```

---

**الآن أنت جاهز! 🎉**

الخطوة التالية: دفع التغييرات إلى GitHub وشاهد السحر!

```bash
cd c:\Java\care\Code
git push origin main
# ثم انتقل إلى GitHub Actions وشاهد الـ Workflow يعمل
```

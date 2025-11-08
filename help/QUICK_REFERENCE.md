# ⚡ بطاقة المرجعية السريعة
# Quick Reference Card - All Commands at a Glance

**اطبع هذا أو احفظه على هاتفك!**

---

## 📋 الأوامر الأساسية

### تثبيت الأدوات
```bash
# Windows - استخدم PowerShell كـ Administrator
choco install docker-desktop
choco install kubectl
choco install minikube
choco install git
choco install maven
choco install jdk17

# Mac
brew install docker
brew install kubectl
brew install minikube
```

### أول مرة فقط
```bash
cd c:\Java\care\Code

# إعداد Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# تسجيل الدخول إلى Docker
docker login

# تسجيل الدخول إلى GitHub (اختياري)
gh auth login
```

---

## 🚀 النشر السريع (3 خطوات فقط)

### الخطوة 1: بناء المشروع (5 دقائق)
```bash
cd c:\Java\care\Code
mvn clean package -DskipTests
```

### الخطوة 2: إضافة Secrets على GitHub (2 دقيقة)
```
انتقل إلى: github.com/your-repo/settings/secrets
أضف:
  - DOCKER_USERNAME = your_docker_username
  - DOCKER_PASSWORD = your_docker_pat_token
  - DB_PASSWORD = YourSecurePass123!
  - JWT_SECRET = SuperSecureKeyThatIsAtLeast64Characters...
```

### الخطوة 3: النشر (1 دقيقة)
```bash
git add .
git commit -m "Deploy: GitHub Actions + Docker + Kubernetes"
git push origin main
# والآن انتظر 45 دقيقة وشاهد السحر!
```

---

## 🐳 أوامر Docker

### بناء وتشغيل محلياً
```bash
# بناء الـ image
docker build -t care-gateway:latest -f gateway-service/Dockerfile .

# تشغيل Docker Compose
docker-compose up -d
docker-compose ps
docker-compose logs -f

# إيقاف الـ Containers
docker-compose down -v
```

### Push إلى Docker Hub
```bash
# بناء وـ Tag
docker build -t your-username/care-gateway:latest -f gateway-service/Dockerfile .

# Push
docker push your-username/care-gateway:latest
```

### الحذف والتنظيف
```bash
docker system prune -a     # حذف جميع الـ images و containers غير المستخدمة
docker logs <container-id> # عرض logs
```

---

## ☸️ أوامر Kubernetes

### التشغيل
```bash
# تشغيل Minikube
minikube start --cpus=4 --memory=8192

# تفعيل Kubernetes في Docker Desktop
# Settings → Kubernetes → Enable

# التحقق
kubectl cluster-info
kubectl get nodes
```

### النشر
```bash
# نشر من الملفات
kubectl create namespace care-system
kubectl apply -k k8s/

# أو نشر من الملفات مباشرة
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
# ... إلخ
```

### المراقبة
```bash
# عرض الـ Pods
kubectl get pods -n care-system
kubectl get pods -n care-system -w  # مراقبة مباشرة

# عرض الـ Services
kubectl get svc -n care-system

# عرض كل شيء
kubectl get all -n care-system

# Logs
kubectl logs <pod-name> -n care-system
kubectl logs <pod-name> -n care-system -f  # follow

# وصف Pod
kubectl describe pod <pod-name> -n care-system

# الدخول إلى Pod
kubectl exec -it <pod-name> -n care-system -- /bin/sh

# حذف Pods (سيتم إعادة إنشاؤها)
kubectl delete pod <pod-name> -n care-system
```

### Port Forwarding (الاختبار المحلي)
```bash
# Forward service port
kubectl port-forward -n care-system svc/gateway 6060:80

# في terminal آخر:
curl http://localhost:6060/actuator/health
```

### الحذف والتنظيف
```bash
# حذف namespace (يحذف كل شيء فيه)
kubectl delete namespace care-system

# أو حذف resource معين
kubectl delete deployment gateway -n care-system
kubectl delete service gateway -n care-system
```

---

## 🔧 أوامر Git

### الـ Commit الأساسية
```bash
# عرض الحالة
git status

# إضافة جميع الملفات
git add .

# Commit مع رسالة
git commit -m "feat: add deployment scripts"

# Push إلى GitHub
git push origin main

# Pull من GitHub
git pull origin main
```

### Branching (للفريق)
```bash
# إنشاء branch جديد
git checkout -b feature/new-feature

# الانتقال إلى branch موجود
git checkout main

# دمج branch
git merge feature/new-feature

# حذف branch
git branch -d feature/new-feature
```

---

## 🧪 اختبار سريع

### اختبار محلي
```bash
# 1. Build
mvn clean package -DskipTests

# 2. Start Docker Compose
docker-compose up -d

# 3. Check services
docker-compose ps

# 4. Test Gateway
curl http://localhost:6060/actuator/health

# 5. Stop
docker-compose down
```

### اختبار Kubernetes
```bash
# 1. Create namespace & resources
kubectl create namespace care-system
kubectl apply -k k8s/

# 2. Wait for pods
kubectl wait --for=condition=ready pod -l app=gateway -n care-system --timeout=300s

# 3. Port forward
kubectl port-forward svc/gateway 6060:80 -n care-system

# 4. Test (in another terminal)
curl http://localhost:6060/actuator/health

# 5. Check logs
kubectl logs deployment/gateway -n care-system
```

---

## 🔐 أوامر الـ Secrets

### GitHub Secrets (عبر CLI)
```bash
# تثبيت gh CLI
choco install gh

# تسجيل الدخول
gh auth login

# إضافة secret
gh secret set DOCKER_USERNAME --body "your-username"
gh secret set DOCKER_PASSWORD --body "your-token"

# عرض secrets
gh secret list
```

### Kubernetes Secrets
```bash
# إنشاء secret
kubectl create secret generic care-secrets \
  --from-literal=DB_PASSWORD=secure123 \
  --from-literal=JWT_SECRET=verylong... \
  -n care-system

# عرض secrets (encrypted)
kubectl get secrets -n care-system

# حذف secret
kubectl delete secret care-secrets -n care-system
```

---

## 📊 المراقبة والـ Debugging

### عرض الموارد
```bash
# استخدام الـ Nodes
kubectl top nodes

# استخدام الـ Pods
kubectl top pods -n care-system

# الأحداث
kubectl get events -n care-system
kubectl get events -n care-system -w  # follow
```

### Debugging
```bash
# وصف مفصل
kubectl describe pod <pod-name> -n care-system

# الـ Logs السابقة (إذا تعطل)
kubectl logs <pod-name> -n care-system --previous

# الدخول للـ Shell
kubectl exec -it <pod-name> -n care-system -- /bin/bash

# اختبار الاتصال بين الـ Pods
kubectl run -it --rm debug --image=curlimages/curl -n care-system -- sh
# داخل الـ Pod:
curl http://service-registry.care-system.svc.cluster.local:8761/
```

---

## 🆘 استكشاف الأخطاء السريع

### Pods غير بدء تشغيل
```bash
# 1. تحقق من الحالة
kubectl describe pod <pod-name> -n care-system

# 2. شاهد الـ Logs
kubectl logs <pod-name> -n care-system

# 3. شاهد الـ Previous Logs
kubectl logs <pod-name> -n care-system --previous

# 4. إعادة تشغيل
kubectl delete pod <pod-name> -n care-system
```

### Docker Image غير موجود
```bash
# تأكد من وجوده على Docker Hub
docker search your-username/care-gateway

# إعادة بناء وـ Push
docker build -t your-username/care-gateway:latest -f gateway-service/Dockerfile .
docker push your-username/care-gateway:latest

# إعادة النشر
kubectl rollout restart deployment/gateway -n care-system
```

### Database Connection Failed
```bash
# تحقق من PostgreSQL
kubectl logs statefulset/postgres -n care-system

# تحقق من السرية (secrets)
kubectl get secrets -n care-system
kubectl describe secret care-secrets -n care-system

# اختبر الاتصال
kubectl run -it --rm dbtest --image=postgres:16-alpine -n care-system -- sh
# داخل الـ Pod:
psql -h postgres.care-system.svc.cluster.local -U postgres -d cms_db
```

---

## 📝 قوائم التحقق

### قبل النشر
- [ ] `mvn clean package` نجح
- [ ] Docker و kubectl مثبتان
- [ ] GitHub Secrets مضافة
- [ ] Docker Hub username و password جاهزة
- [ ] Kubernetes cluster running

### بعد النشر
- [ ] GitHub Actions workflow نجح
- [ ] Docker Hub images ظاهرة
- [ ] Kubernetes pods running
- [ ] Gateway health check نجح
- [ ] لا توجد error logs

---

## 🎯 الملفات المهمة

| الملف | الهدف | الوقت |
|------|-------|-------|
| QUICK_DEPLOY_STEPS.md | خطوات سريعة | 15 دقيقة |
| DEPLOYMENT_CHECKLIST.md | قائمة التحقق | 30 دقيقة |
| DEPLOYMENT_GUIDE.md | شرح مفصل | ساعة واحدة |
| deploy-to-docker-k8s.ps1 | automation script | 5 دقائق |

---

## 💡 نصائح وحيل

### سرعة النشر
```bash
# استخدم المسارات المطلقة
cd c:\Java\care\Code  # أفضل من relative paths

# استخدم caching
mvn dependency:resolve  # حمّل المكتبات مرة واحدة

# استخدم offline mode (بعد التحميل)
mvn -o clean package   # offline
```

### توفير الموارد
```bash
# قلل الـ memory في development
# في k8s manifests: memory: "256Mi"

# استخدم 1 replica في البداية
# في kustomization.yaml: replicas: 1

# استخدم Alpine images
# في Dockerfile: FROM openjdk:17-jdk-alpine
```

### المراقبة
```bash
# watch الـ pods مباشرة
kubectl get pods -n care-system -w

# tail الـ logs
kubectl logs -f deployment/gateway -n care-system

# continuous describe
watch kubectl describe pod -n care-system
```

---

## 🔗 الروابط المهمة

- GitHub: https://github.com/
- Docker Hub: https://hub.docker.com/
- Kubernetes Docs: https://kubernetes.io/docs/
- Spring Cloud: https://spring.io/projects/spring-cloud

---

## ✅ الخطوات الأساسية (من الألف للياء)

```
1. git push origin main
   ↓
2. GitHub Actions يبدأ (انتقل إلى Actions tab)
   ↓
3. انتظر 45 دقيقة (التفت للقهوة ☕)
   ↓
4. تحقق من Docker Hub (الـ images موجودة؟)
   ↓
5. تحقق من Kubernetes (kubectl get pods)
   ↓
6. اختبر الـ Gateway (curl localhost:6060)
   ↓
7. ✅ يا هلا! تم النشر بنجاح!
```

---

**حفظ سريع:** Ctrl+D (أضف لـ favorites)

آخر تحديث: 2 نوفمبر 2025

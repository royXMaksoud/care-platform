# Data Analysis Service - Integration Summary

## Service Overview

**data-analysis-service** هي خدمة ضمن منظومة Care Platform لتحليل البيانات ومعالجة الملفات (Excel و CSV).

## التكامل مع منظومة Care

### 1. الخدمات المتصلة

```
┌─────────────────────────────────────────┐
│         Care Platform Services          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │ auth-service │◄───┤ JWT Tokens   │  │
│  │ (Port 6060)  │    │              │  │
│  └──────────────┘    └──────────────┘  │
│         │                               │
│         │ Authenticates                 │
│         ▼                               │
│  ┌──────────────────────────┐          │
│  │ data-analysis-service    │          │
│  │ (Port 6072)              │          │
│  │ - File Upload            │          │
│  │ - Data Analysis          │          │
│  │ - Excel/CSV Processing   │          │
│  └──────────────────────────┘          │
│         │                               │
│         │ Uses                          │
│         ▼                               │
│  ┌──────────────────────────┐          │
│  │ access-management-service│          │
│  │ (Port 6062)              │          │
│  │ - Permissions            │          │
│  │ - Roles                  │          │
│  └──────────────────────────┘          │
│         │                               │
│         │ Shares                        │
│         ▼                               │
│  ┌──────────────────────────┐          │
│  │ core-shared-lib          │          │
│  │ - JWT                    │          │
│  │ - i18n                   │          │
│  │ - Exceptions             │          │
│  │ - Validation             │          │
│  └──────────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

### 2. استخدام core-shared-lib

جميع الخدمات في منظومة Care تستخدم `core-shared-lib` للمكونات المشتركة:

#### ✅ Messaging / i18n
- رسائل متعددة اللغات (عربي/إنجليزي)
- `messages_en.properties` و `messages_ar.properties`
- `MessageResolver` لجلب الرسائل المترجمة

#### ✅ Global Exception Handling
- `GlobalExceptionHandler` لمعالجة جميع الاستثناءات
- استجابة خطأ موحدة عبر جميع الخدمات
- دعم i18n في رسائل الأخطاء

#### ✅ Dropdown Providers
- `SimpleListProvider` للقوائم المنسدلة
- `SimpleCascadeProvider` للقوائم المتتالية
- `OptionDto` موحد

#### ✅ JWT Authentication
- `JwtAuthenticationFilter` للمصادقة
- `JwtTokenProvider` للتحقق من التوكن
- `CurrentUserContext` للوصول لمعلومات المستخدم

#### ✅ Common DTOs
- `ErrorResponse` - استجابة الأخطاء
- `ApiResponse<T>` - استجابة API موحدة
- `PageResponse<T>` - استجابة البيانات المقسمة
- `CodeValueDto` - أزواج الكود والقيمة

## الإعدادات المشتركة

### 1. JWT Configuration

```yaml
jwt:
  secret: ${JWT_SECRET:...}  # نفس السر المستخدم في جميع الخدمات
  expiration: 86400000        # 24 ساعة
  refreshExpiration: 2592000000 # 30 يوم
```

### 2. i18n Configuration

```yaml
spring:
  messages:
    basename: i18n/messages
    fallback-to-system-locale: false
    encoding: UTF-8
```

### 3. Security Configuration

```java
@ComponentScan(basePackages = {"com.portal.das", "com.sharedlib.core"})
```

## الفروقات عن الإعداد الأولي

### ما تم إزالته ❌
- ✅ `docker-compose.yml` - الخدمة جزء من منظومة متكاملة
- ✅ ملفات `.md` من الجذر - نقلت إلى `help/`
- ✅ `HealthController` البسيط - نستخدم actuator

### ما تم إضافته ✅
- ✅ `core-shared-lib` dependency
- ✅ JWT authentication من shared-lib
- ✅ Global exception handler من shared-lib
- ✅ i18n messages (عربي/إنجليزي)
- ✅ Component scan لـ `com.sharedlib.core`
- ✅ SecurityConfig محدث

## البنية النهائية

```
data-analysis-service/
├── help/                    # جميع ملفات التوثيق
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── PROJECT_STRUCTURE.md
│   ├── SHARED_LIB_INTEGRATION.md
│   ├── INTEGRATION_SUMMARY.md
│   └── ...
├── src/
│   ├── main/
│   │   ├── java/com/portal/das/
│   │   │   ├── DataAnalysisServiceApplication.java  # مع @ComponentScan
│   │   │   └── config/
│   │   │       └── SecurityConfig.java              # JWT من shared-lib
│   │   └── resources/
│   │       ├── application.yml                      # مع JWT و i18n
│   │       └── i18n/
│   │           ├── messages_en.properties
│   │           └── messages_ar.properties
│   └── test/...
├── pom.xml                  # مع core-shared-lib dependency
└── ...
```

## أمثلة الاستخدام

### 1. رمي استثناء مع i18n

```java
@Service
@RequiredArgsConstructor
public class AnalysisService {
    
    public Analysis findById(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new NotFoundException("das.analysis.not.found"));
        // الرسالة ستترجم تلقائياً حسب لغة المستخدم
    }
}
```

### 2. الوصول للمستخدم الحالي

```java
@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {
    
    @PostMapping
    public ApiResponse<Analysis> create(@RequestBody @Valid CreateAnalysisDto dto) {
        CurrentUser user = CurrentUserContext.get();
        UUID userId = user.getId();
        String language = user.getLanguage(); // "en" or "ar"
        
        // استخدام بيانات المستخدم
        Analysis analysis = analysisService.create(dto, userId);
        return ApiResponse.success(analysis);
    }
}
```

### 3. استخدام MessageResolver

```java
@Service
@RequiredArgsConstructor
public class FileService {
    
    private final MessageResolver messageResolver;
    
    public String uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("das.file.empty");
        }
        
        // معالجة الملف...
        
        return messageResolver.getMessage("das.file.upload.success");
        // يعيد الرسالة بلغة المستخدم الحالية
    }
}
```

### 4. Validation مع i18n

```java
public class CreateAnalysisDto {
    
    @NotBlank(message = "error.validation.name.required")
    private String name;
    
    @ValidEmail(message = "error.validation.email.invalid")
    private String contactEmail;
    
    @NotNull(message = "error.validation.file.required")
    private MultipartFile file;
}
```

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=das
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT (must match auth-service)
JWT_SECRET=SuperSecureKeyThatIsAtLeast64CharactersLong...
JWT_EXPIRATION=86400000

# Optional
SERVER_PORT=6072
```

## تشغيل الخدمة

### محلياً (Local Development)

```bash
# Build
./mvnw clean package

# Run
./mvnw spring-boot:run

# With profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### مع Docker (كجزء من المنظومة)

```bash
# في docker-compose رئيسي للمنظومة بأكملها
docker-compose up data-analysis-service
```

## نقاط الوصول (Endpoints)

### Public (No Auth Required)
- `GET /actuator/health` - Health check
- `GET /swagger-ui.html` - API documentation

### Authenticated (JWT Required)
- جميع endpoints الأخرى تحتاج JWT token

### مثال Request مع JWT:

```bash
curl -X GET http://localhost:6072/api/analysis/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..." \
  -H "Accept-Language: ar"
```

## الخطوات التالية (Next Steps)

1. ✅ Bootstrap كامل
2. ⏭️ إنشاء Entities و Repositories
3. ⏭️ تطبيق Services للتحليل
4. ⏭️ إنشاء REST Controllers
5. ⏭️ معالجة ملفات Excel و CSV
6. ⏭️ إضافة Tests شاملة

## الدعم والتوثيق

للمزيد من المعلومات:
- `help/README.md` - توثيق عام
- `help/SHARED_LIB_INTEGRATION.md` - دليل التكامل مع shared-lib
- `help/QUICKSTART.md` - دليل البدء السريع
- `core-shared-lib` source code - للتفاصيل التقنية

---

**Status**: ✅ Bootstrap Complete - Ready for Development

**Version**: 0.0.1-SNAPSHOT  
**Date**: October 15, 2025


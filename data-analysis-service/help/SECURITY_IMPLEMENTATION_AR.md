# تطبيق الأمان - JWT Authentication & Authorization

## ✅ تم التنفيذ بنجاح

تم تطبيق نمط **Resource Server** في `data-analysis-service` بالكامل، متطابق مع الخدمات الأخرى في منظومة Care.

---

## 🔐 ما تم تطبيقه

### 1. JWT Validation (التحقق من التوكن)

#### ✅ نفس نمط access-management-service و auth-service

**SecurityConfig.java**:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtTokenProvider tokenProvider;  // من shared-lib
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(tokenProvider);
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .cors(...)  // CORS مفعّل
            .csrf(csrf -> csrf.disable())  // CSRF معطل
            .sessionManagement(STATELESS)  // لا sessions
            .authorizeHttpRequests(...)    // حماية endpoints
            .addFilterBefore(jwtAuthenticationFilter(), ...);
    }
}
```

**الميزات**:
- ✅ استخراج JWT من `Authorization: Bearer <token>`
- ✅ التحقق من التوقيع باستخدام `jwt.secret` المشترك
- ✅ استخراج معلومات المستخدم (userId, email, roles, permissions)
- ✅ وضع `CurrentUser` في SecurityContext و ThreadLocal

### 2. Endpoint Protection (حماية النقاط)

#### Public Endpoints (متاحة بدون JWT)
```java
.requestMatchers("/error").permitAll()
.requestMatchers("/actuator/**").permitAll()
.requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
```

#### Protected Endpoints (تحتاج JWT)
```java
.requestMatchers("/api/**").authenticated()  // كل /api/** محمية
.anyRequest().authenticated()                // كل شيء آخر محمي
```

**النتيجة**:
- ❌ طلب بدون JWT على `/api/**` → **401 Unauthorized**
- ✅ طلب مع JWT صحيح على `/api/**` → **200 OK**
- ✅ طلب على `/actuator/health` → **200 OK** (بدون JWT)

### 3. CORS Configuration (مشاركة الموارد)

#### في SecurityConfig.java:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
    configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
    configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

#### في application.yml:
```yaml
care:
  security:
    cors:
      allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:8080}
      allowed-methods: GET,POST,PUT,DELETE,OPTIONS
      allowed-headers: Authorization,Content-Type,X-Requested-With
```

**الميزات**:
- ✅ يسمح بطلبات من frontend applications
- ✅ قابل للتخصيص عبر environment variables
- ✅ يدعم credentials (cookies, authorization headers)

---

## 🧪 Test Endpoints (نقاط الاختبار)

تم إنشاء `TestController` لاختبار الأمان:

### 1. `/api/test/auth` - اختبار المصادقة الأساسي
```bash
curl -X GET http://localhost:6072/api/test/auth \
  -H "Authorization: Bearer <token>"
```

**يعيد**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "userType": "ADMIN",
    "language": "ar",
    "roles": ["ADMIN"],
    "permissions": ["READ_DATA"]
  },
  "message": "Authentication successful"
}
```

### 2. `/api/test/admin` - اختبار دور ADMIN
```java
@GetMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public ApiResponse<String> testAdmin() {
    return ApiResponse.ok("Admin access granted");
}
```

### 3. `/api/test/analyst` - اختبار دور ANALYST
```java
@GetMapping("/analyst")
@PreAuthorize("hasAnyRole('ANALYST', 'ADMIN')")
public ApiResponse<String> testAnalyst() {
    return ApiResponse.ok("Analyst access granted");
}
```

---

## 🔑 JWT Token Requirements

### يجب أن يحتوي التوكن على:
```json
{
  "sub": "user-uuid",           // UUID للمستخدم
  "email": "user@example.com",
  "userType": "ADMIN",
  "lang": "ar",                 // اللغة
  "roles": ["ADMIN"],
  "permissions": ["READ_DATA"],
  "iat": 1697500000,
  "exp": 1697586400
}
```

### كيفية الحصول على التوكن:

```bash
# 1. Login عبر auth-service
curl -X POST http://localhost:6060/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@example.com",
    "password": "password123"
  }'

# 2. استخدام التوكن في data-analysis-service
curl -X GET http://localhost:6072/api/test/auth \
  -H "Authorization: Bearer <token-from-step-1>"
```

---

## 🛡️ Authorization (التفويض)

### استخدام @PreAuthorize

```java
// فقط ADMIN
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<?> deleteAnalysis(@PathVariable UUID id) { ... }

// ADMIN أو ANALYST
@PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
@GetMapping("/{id}")
public ResponseEntity<?> getAnalysis(@PathVariable UUID id) { ... }

// حسب Permission
@PreAuthorize("hasAuthority('WRITE_DATA')")
@PostMapping
public ResponseEntity<?> createAnalysis(@RequestBody AnalysisDto dto) { ... }
```

### Programmatic Authorization

```java
import com.sharedlib.core.context.CurrentUser;
import com.sharedlib.core.context.CurrentUserContext;

@Service
public class AnalysisService {
    
    public void deleteAnalysis(UUID id) {
        CurrentUser user = CurrentUserContext.get();
        
        // فحص الدور
        if (!user.hasRole("ADMIN")) {
            throw new ForbiddenException("error.forbidden.admin.only");
        }
        
        // فحص الصلاحية
        if (!user.hasPermission("DELETE_DATA")) {
            throw new ForbiddenException("error.forbidden.no.permission");
        }
        
        // الحذف
    }
}
```

---

## 📝 Configuration Files

### application.yml
```yaml
# JWT - يجب أن يطابق auth-service
jwt:
  secret: ${JWT_SECRET:SuperSecureKey...}
  expiration: 86400000
  refreshExpiration: 2592000000

# CORS
care:
  security:
    csrf:
      enabled: false
    cors:
      allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:8080}
      allowed-methods: GET,POST,PUT,DELETE,OPTIONS
      allowed-headers: Authorization,Content-Type,X-Requested-With
```

### Environment Variables
```bash
# Required (مطلوب)
export JWT_SECRET="your-shared-secret-key-min-64-chars"

# Optional (اختياري)
export CORS_ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
export JWT_EXPIRATION=86400000
```

---

## ✅ Acceptance Criteria (معايير القبول)

### تم التحقق من:

#### 1. ✅ Unauthorized calls to /api/** return 401
```bash
# بدون JWT
curl -X GET http://localhost:6072/api/test/auth
# النتيجة: 401 Unauthorized ✅
```

#### 2. ✅ Authorized calls pass
```bash
# مع JWT صحيح
curl -X GET http://localhost:6072/api/test/auth \
  -H "Authorization: Bearer <valid-token>"
# النتيجة: 200 OK ✅
```

#### 3. ✅ Public endpoints accessible
```bash
curl -X GET http://localhost:6072/actuator/health
# النتيجة: 200 OK ✅

curl -X GET http://localhost:6072/swagger-ui.html
# النتيجة: 200 OK ✅
```

#### 4. ✅ CORS headers present
```bash
curl -X OPTIONS http://localhost:6072/api/test/auth \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
# النتيجة: CORS headers موجودة ✅
```

#### 5. ✅ Role-based authorization works
```bash
# بدون دور ADMIN
curl -X GET http://localhost:6072/api/test/admin \
  -H "Authorization: Bearer <analyst-token>"
# النتيجة: 403 Forbidden ✅

# مع دور ADMIN
curl -X GET http://localhost:6072/api/test/admin \
  -H "Authorization: Bearer <admin-token>"
# النتيجة: 200 OK ✅
```

---

## 🔍 التحقق من التطابق مع الخدمات الأخرى

### ✅ مطابقة لـ access-management-service

| Component | access-management | data-analysis | Status |
|-----------|-------------------|---------------|---------|
| JwtTokenProvider | ✅ من shared-lib | ✅ من shared-lib | ✅ متطابق |
| JwtAuthenticationFilter | ✅ من shared-lib | ✅ من shared-lib | ✅ متطابق |
| JWT Secret Config | ✅ jwt.secret | ✅ jwt.secret | ✅ متطابق |
| CORS Config | ✅ care.security.cors | ✅ care.security.cors | ✅ متطابق |
| Public Endpoints | ✅ actuator, swagger | ✅ actuator, swagger | ✅ متطابق |
| API Protection | ✅ /api/** authenticated | ✅ /api/** authenticated | ✅ متطابق |
| Stateless Sessions | ✅ STATELESS | ✅ STATELESS | ✅ متطابق |
| CSRF Disabled | ✅ disabled | ✅ disabled | ✅ متطابق |

---

## 📚 التوثيق

تم إنشاء التوثيق التالي:

1. **JWT_SECURITY_GUIDE.md** (إنجليزي) - دليل شامل
2. **SECURITY_IMPLEMENTATION_AR.md** (عربي) - هذا الملف
3. **TestController.java** - endpoints للاختبار

---

## 🎯 الحالة النهائية

### ✅ تم التطبيق بالكامل

```
Security Implementation: ✅ Complete
├── JWT Validation: ✅ Working
├── Endpoint Protection: ✅ /api/** protected
├── Public Endpoints: ✅ actuator, swagger accessible
├── CORS: ✅ Configured
├── Role-Based Access: ✅ @PreAuthorize working
├── Test Endpoints: ✅ Created
├── Documentation: ✅ Complete
└── Matches Other Services: ✅ Yes
```

### 🚀 جاهز للاستخدام

الخدمة الآن:
- ✅ تثق بـ JWT من auth-service
- ✅ لا تملك user database خاصة بها (resource server)
- ✅ تحمي `/api/**` endpoints
- ✅ تسمح بالوصول لـ actuator و swagger
- ✅ CORS مفعّل للـ frontend
- ✅ تطابق نمط الخدمات الأخرى 100%

---

**الأمان مطبّق بشكل صحيح وجاهز للإنتاج! 🔒**

**التاريخ**: 16 أكتوبر 2025  
**الحالة**: ✅ مكتمل ومُختبر


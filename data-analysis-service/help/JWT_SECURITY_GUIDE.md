# JWT Security & Authentication Guide

## Overview

`data-analysis-service` acts as a **resource server** that trusts JWT tokens issued by `auth-service`. It does NOT have its own user database - it validates JWT signatures and extracts user context.

---

## Security Configuration

### 1. JWT Validation

**How it works:**
- JWT token is extracted from `Authorization: Bearer <token>` header
- Token signature is validated using shared secret (must match auth-service)
- User information (userId, email, roles, permissions) is extracted
- `CurrentUser` is set in `SecurityContext` and `ThreadLocal`

**Configuration** (`application.yml`):
```yaml
jwt:
  secret: ${JWT_SECRET:...}  # Must match auth-service
  expiration: 86400000        # 24 hours
  refreshExpiration: 2592000000 # 30 days
```

**⚠️ IMPORTANT**: The `jwt.secret` MUST be identical across all services (auth-service, access-management-service, data-analysis-service).

### 2. Endpoint Protection

#### Public Endpoints (No Authentication Required)
- `/actuator/**` - Health checks and monitoring
- `/v3/api-docs/**` - OpenAPI specification
- `/swagger-ui/**` - Swagger UI
- `/swagger-ui.html` - Swagger UI entry point
- `/error` - Error page

#### Protected Endpoints (JWT Required)
- `/api/**` - All API endpoints require valid JWT
- Any other endpoints - Require authentication by default

**SecurityConfig**:
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/error").permitAll()
    .requestMatchers("/actuator/**").permitAll()
    .requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
    .requestMatchers("/api/**").authenticated()  // ← JWT required
    .anyRequest().authenticated()
)
```

### 3. CORS Configuration

**Purpose**: Allow frontend applications to make cross-origin requests

**Configuration** (`application.yml`):
```yaml
care:
  security:
    cors:
      allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:8080}
      allowed-methods: GET,POST,PUT,DELETE,OPTIONS
      allowed-headers: Authorization,Content-Type,X-Requested-With
```

**Environment Variable Override**:
```bash
export CORS_ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
```

---

## JWT Token Structure

### Expected Claims

```json
{
  "sub": "user-uuid",           // userId (UUID)
  "email": "user@example.com",
  "userType": "ADMIN",
  "lang": "ar",                 // Language preference (en/ar)
  "roles": ["ADMIN", "ANALYST"],
  "permissions": ["READ_DATA", "WRITE_DATA"],
  "iat": 1697500000,
  "exp": 1697586400
}
```

### Accessing User Information

```java
import com.sharedlib.core.context.CurrentUser;
import com.sharedlib.core.context.CurrentUserContext;

@RestController
@RequestMapping("/api/example")
public class ExampleController {
    
    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUser() {
        // Get current authenticated user
        CurrentUser user = CurrentUserContext.get();
        
        UUID userId = user.userId();
        String email = user.email();
        String userType = user.userType();
        String language = user.language();
        List<String> roles = user.roles();
        List<String> permissions = user.permissions();
        
        // Check roles
        if (user.hasRole("ADMIN")) {
            // Admin logic
        }
        
        // Check permissions
        if (user.hasPermission("READ_DATA")) {
            // Permission logic
        }
        
        return ResponseEntity.ok(user);
    }
}
```

---

## Testing JWT Authentication

### Test Endpoints

The service includes test endpoints in `TestController`:

#### 1. `/api/test/auth` - Basic Authentication Test
- **Method**: GET
- **Auth**: JWT required
- **Returns**: Current user information

```bash
curl -X GET http://localhost:6072/api/test/auth \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "userType": "ADMIN",
    "language": "en",
    "roles": ["ADMIN"],
    "permissions": ["READ_DATA", "WRITE_DATA"],
    "timestamp": "2025-10-15T23:00:00"
  },
  "message": "Authentication successful"
}
```

**Unauthorized Response (401)**:
```json
{
  "code": "error.unauthorized",
  "message": "Unauthorized access",
  "status": 401,
  "timestamp": "2025-10-15T23:00:00",
  "path": "/api/test/auth"
}
```

#### 2. `/api/test/admin` - Admin Role Test
- **Method**: GET
- **Auth**: JWT with ADMIN role required
- **Returns**: Success message

```bash
curl -X GET http://localhost:6072/api/test/admin \
  -H "Authorization: Bearer <admin-jwt-token>"
```

#### 3. `/api/test/analyst` - Analyst/Admin Role Test
- **Method**: GET
- **Auth**: JWT with ANALYST or ADMIN role
- **Returns**: Success message

```bash
curl -X GET http://localhost:6072/api/test/analyst \
  -H "Authorization: Bearer <analyst-jwt-token>"
```

### Testing Without Authentication

```bash
# Should return 401 Unauthorized
curl -X GET http://localhost:6072/api/test/auth
```

### Testing Public Endpoints

```bash
# Should return 200 OK
curl -X GET http://localhost:6072/actuator/health

# Should return 200 OK
curl -X GET http://localhost:6072/swagger-ui.html
```

---

## Integration with auth-service

### Getting a JWT Token

1. **Login via auth-service**:
```bash
curl -X POST http://localhost:6060/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@example.com",
    "password": "password123"
  }'
```

2. **Response includes JWT**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "expiresIn": 86400000
}
```

3. **Use token in data-analysis-service**:
```bash
curl -X GET http://localhost:6072/api/test/auth \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Role-Based Access Control (RBAC)

### Using @PreAuthorize

```java
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {
    
    // Only ADMIN can access
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnalysis(@PathVariable UUID id) {
        // Delete logic
    }
    
    // ADMIN or ANALYST can access
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getAnalysis(@PathVariable UUID id) {
        // Get logic
    }
    
    // Check permission
    @PreAuthorize("hasAuthority('WRITE_DATA')")
    @PostMapping
    public ResponseEntity<?> createAnalysis(@RequestBody AnalysisDto dto) {
        // Create logic
    }
    
    // Complex expression
    @PreAuthorize("hasRole('ADMIN') or (hasRole('ANALYST') and #userId == principal.userId)")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnalysis(@PathVariable UUID id, @RequestParam UUID userId) {
        // Update logic
    }
}
```

### Programmatic Access Control

```java
import com.sharedlib.core.context.CurrentUser;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.ForbiddenException;

@Service
public class AnalysisService {
    
    public void deleteAnalysis(UUID analysisId) {
        CurrentUser user = CurrentUserContext.get();
        
        // Check if user is admin
        if (!user.hasRole("ADMIN")) {
            throw new ForbiddenException("error.forbidden.admin.only");
        }
        
        // Delete logic
    }
    
    public Analysis getAnalysis(UUID analysisId) {
        CurrentUser user = CurrentUserContext.get();
        Analysis analysis = findById(analysisId);
        
        // Check if user owns the analysis or is admin
        if (!analysis.getOwnerId().equals(user.userId()) && !user.isAdmin()) {
            throw new ForbiddenException("error.forbidden.not.owner");
        }
        
        return analysis;
    }
}
```

---

## Security Best Practices

### 1. Always Validate JWT
✅ **Do**: Let JwtAuthenticationFilter validate tokens
❌ **Don't**: Trust tokens without validation

### 2. Use Shared Secret Securely
✅ **Do**: Store JWT_SECRET in environment variables
❌ **Don't**: Hardcode secrets in code

### 3. Check Authorization
✅ **Do**: Use @PreAuthorize or programmatic checks
❌ **Don't**: Assume authenticated = authorized

### 4. Handle Exceptions Properly
✅ **Do**: Use shared-lib exceptions (NotFoundException, ForbiddenException)
❌ **Don't**: Return sensitive information in error messages

### 5. Log Security Events
```java
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SecureService {
    
    public void sensitiveOperation() {
        CurrentUser user = CurrentUserContext.get();
        log.info("User {} performed sensitive operation", user.userId());
        
        if (!user.hasRole("ADMIN")) {
            log.warn("Unauthorized access attempt by user {}", user.userId());
            throw new ForbiddenException("error.forbidden");
        }
    }
}
```

---

## Troubleshooting

### Issue: 401 Unauthorized on all /api/** endpoints

**Possible causes:**
1. JWT token not provided
2. JWT token expired
3. JWT secret mismatch between services
4. Invalid token format

**Solution:**
```bash
# Check if token is valid
curl -X POST http://localhost:6060/api/auth/validate \
  -H "Authorization: Bearer <your-token>"

# Verify JWT_SECRET environment variable
echo $JWT_SECRET

# Check application logs for JWT validation errors
```

### Issue: 403 Forbidden despite having valid JWT

**Possible causes:**
1. User lacks required role
2. User lacks required permission
3. @PreAuthorize condition not met

**Solution:**
```bash
# Check user roles and permissions
curl -X GET http://localhost:6072/api/test/auth \
  -H "Authorization: Bearer <your-token>"

# Review @PreAuthorize annotations on endpoints
```

### Issue: CORS errors in browser

**Possible causes:**
1. Frontend origin not in allowed-origins list
2. Missing CORS headers
3. Preflight OPTIONS request failing

**Solution:**
```yaml
# Update application.yml or environment variable
care:
  security:
    cors:
      allowed-origins: http://your-frontend:3000
```

---

## Testing Checklist

- [ ] Unauthorized requests to `/api/**` return 401
- [ ] Valid JWT on `/api/**` returns 200
- [ ] Public endpoints accessible without JWT
- [ ] Expired JWT returns 401
- [ ] Invalid JWT signature returns 401
- [ ] Missing Authorization header returns 401
- [ ] @PreAuthorize correctly blocks unauthorized roles
- [ ] CORS works for allowed origins
- [ ] CORS blocks disallowed origins
- [ ] User context accessible via CurrentUserContext

---

## Environment Variables

```bash
# Required
export JWT_SECRET="your-shared-secret-key-min-64-chars"

# Optional (with defaults)
export JWT_EXPIRATION=86400000
export JWT_REFRESH_EXPIRATION=2592000000
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8080"
```

---

## Summary

✅ **Resource Server Pattern**
- No user database in data-analysis-service
- Trusts auth-service JWT
- Validates signature with shared secret

✅ **Endpoint Protection**
- `/api/**` requires JWT authentication
- Public endpoints: actuator, swagger, error
- CORS enabled for frontend origins

✅ **User Context**
- `CurrentUser` available via `CurrentUserContext.get()`
- Includes userId, email, roles, permissions
- Thread-safe with ThreadLocal

✅ **Authorization**
- @PreAuthorize for declarative access control
- Programmatic checks with CurrentUser
- Role and permission based

✅ **Testing**
- Test endpoints in TestController
- 401 for unauthorized access
- 200 for valid JWT with proper roles

---

**Security is configured correctly and ready for production use! 🔒**


# Core Shared Library Integration Guide

## Overview

The Data Analysis Service integrates with `core-shared-lib` to leverage common functionality shared across all Care platform services.

## What's Included from core-shared-lib

### 1. Exception Handling

**GlobalExceptionHandler** provides centralized exception handling:

```java
// Usage in your code
throw new NotFoundException("das.analysis.not.found");
throw new BadRequestException("das.file.invalid.format");
throw new ValidationException("error.validation", fieldErrors);
```

**Available Exception Types:**
- `BadRequestException` - 400 errors
- `NotFoundException` - 404 errors
- `UnauthorizedException` - 401 errors
- `ForbiddenException` - 403 errors
- `ConflictException` - 409 errors
- `ValidationException` - Validation errors with field details
- `MessageResolvableException` - i18n-aware exceptions

### 2. JWT Authentication

**JwtAuthenticationFilter** and **JwtTokenProvider**:

```java
// Already configured in SecurityConfig.java
// JWT is automatically validated and user context is set

// Access current user in your code:
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.context.CurrentUser;

CurrentUser user = CurrentUserContext.get();
UUID userId = user.getId();
String email = user.getEmail();
String language = user.getLanguage();
List<String> roles = user.getRoles();
List<String> permissions = user.getPermissions();
```

### 3. Language Context

**LanguageContext** provides thread-local language storage:

```java
import com.sharedlib.core.context.LanguageContext;

// Get current language (from JWT)
String lang = LanguageContext.getLanguage(); // "en" or "ar"

// Set language (usually done by filter)
LanguageContext.setLanguage("ar");

// Clear (always done in filter's finally block)
LanguageContext.clear();
```

### 4. i18n Message Resolution

**MessageResolver** for getting localized messages:

```java
import com.sharedlib.core.i18n.MessageResolver;

@RequiredArgsConstructor
public class MyService {
    private final MessageResolver messageResolver;
    
    public void doSomething() {
        String message = messageResolver.getMessage("das.file.upload.success");
        String messageWithArgs = messageResolver.getMessage("das.file.too.large", maxSize);
    }
}
```

### 5. Dropdown Providers

For dropdown/select options:

```java
import com.sharedlib.core.dropdown.SimpleListProvider;
import com.sharedlib.core.web.dto.OptionDto;

@Service
public class MyDropdownService {
    
    public List<OptionDto> getFileTypes() {
        return List.of(
            new OptionDto("EXCEL", "Excel File"),
            new OptionDto("CSV", "CSV File")
        );
    }
}
```

### 6. Common DTOs

**ApiResponse** for consistent responses:

```java
import com.sharedlib.core.web.response.ApiResponse;

public ApiResponse<MyData> getMyData() {
    MyData data = fetchData();
    return ApiResponse.<MyData>builder()
        .success(true)
        .data(data)
        .message("Success")
        .build();
}
```

**PageResponse** for paginated data:

```java
import com.sharedlib.core.web.response.PageResponse;
import org.springframework.data.domain.Page;

public PageResponse<MyEntity> getPagedData(int page, int size) {
    Page<MyEntity> dataPage = repository.findAll(PageRequest.of(page, size));
    return PageResponse.fromPage(dataPage);
}
```

### 7. Filter and Search

**GenericFilterService** for dynamic filtering:

```java
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericFilterService;
import org.springframework.data.jpa.domain.Specification;

@Service
@RequiredArgsConstructor
public class MySearchService {
    private final GenericFilterService filterService;
    
    public List<MyEntity> search(FilterRequest filterRequest) {
        Specification<MyEntity> spec = filterService.buildSpecification(filterRequest, MyEntity.class);
        return repository.findAll(spec);
    }
}
```

### 8. Validation Annotations

Custom validators from shared-lib:

```java
import com.sharedlib.core.validation.*;

public class MyDto {
    @ValidEmail
    private String email;
    
    @ValidPhone
    private String phone;
    
    @ValidUUID
    private String userId;
    
    @ValidEnum(enumClass = FileType.class)
    private String fileType;
    
    @ValidDateRange
    private LocalDate startDate;
    
    private LocalDate endDate;
}
```

### 9. Utility Classes

**DateUtil**:
```java
import com.sharedlib.core.utils.DateUtil;

LocalDate date = DateUtil.parseDate("2025-10-15");
String formatted = DateUtil.formatDate(LocalDate.now());
```

**JsonUtil**:
```java
import com.sharedlib.core.utils.JsonUtil;

String json = JsonUtil.toJson(myObject);
MyClass obj = JsonUtil.fromJson(json, MyClass.class);
```

**ContextUtil**:
```java
import com.sharedlib.core.util.ContextUtil;

// Get current user safely
Optional<CurrentUser> user = ContextUtil.getCurrentUser();

// Get current language
String lang = ContextUtil.getCurrentLanguage().orElse("en");
```

## Configuration Required

### 1. Component Scan

Already configured in `DataAnalysisServiceApplication.java`:

```java
@SpringBootApplication
@ComponentScan(basePackages = {"com.portal.das", "com.sharedlib.core"})
public class DataAnalysisServiceApplication {
    // ...
}
```

### 2. Application Properties

Already configured in `application.yml`:

```yaml
spring:
  messages:
    basename: i18n/messages
    fallback-to-system-locale: false
    encoding: UTF-8

jwt:
  secret: ${JWT_SECRET:...}
  expiration: 86400000
  refreshExpiration: 2592000000
```

### 3. Security Configuration

Already configured in `SecurityConfig.java`:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtTokenProvider tokenProvider;
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(tokenProvider);
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        // JWT filter configured
    }
}
```

## Best Practices

### 1. Always Use Shared Exceptions

❌ **Don't:**
```java
return ResponseEntity.status(404).body("Not found");
throw new RuntimeException("Invalid format");
```

✅ **Do:**
```java
throw new NotFoundException("das.analysis.not.found");
throw new BadRequestException("das.file.invalid.format");
```

### 2. Use Message Keys for i18n

❌ **Don't:**
```java
return "File uploaded successfully";
```

✅ **Do:**
```java
return messageResolver.getMessage("das.file.upload.success");
```

### 3. Access Current User from Context

❌ **Don't:**
```java
@RequestHeader("user-id") UUID userId
```

✅ **Do:**
```java
CurrentUser user = CurrentUserContext.get();
UUID userId = user.getId();
```

### 4. Use @PreAuthorize for Method Security

```java
@PreAuthorize("hasRole('ADMIN')")
public void deleteAnalysis(UUID id) {
    // Only ADMIN role can access
}

@PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
public void viewAnalysis(UUID id) {
    // ADMIN or ANALYST can access
}
```

### 5. Handle Validation Properly

```java
public void createAnalysis(@Valid CreateAnalysisDto dto) {
    // @Valid triggers validation
    // Errors automatically handled by GlobalExceptionHandler
}
```

## Error Response Format

All errors from shared-lib follow this format:

```json
{
  "code": "das.file.invalid.format",
  "message": "Invalid file format. Only Excel and CSV files are allowed",
  "status": 400,
  "timestamp": "2025-10-15T23:50:00",
  "path": "/api/analysis/upload",
  "details": [
    {
      "field": "file",
      "code": "file.invalid",
      "message": "File must be Excel or CSV"
    }
  ]
}
```

## Testing with Shared Library

### Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class MyServiceTest {
    
    @Mock
    private MessageResolver messageResolver;
    
    @InjectMocks
    private MyService myService;
    
    @Test
    void shouldThrowNotFoundException() {
        assertThrows(NotFoundException.class, () -> {
            myService.findById(UUID.randomUUID());
        });
    }
}
```

### Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class MyControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnAnalysis() throws Exception {
        mockMvc.perform(get("/api/analysis/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").exists());
    }
}
```

## Migration from Basic Setup

If you have existing code without shared-lib:

### Step 1: Replace Custom Exception Handler
Remove custom `@ControllerAdvice` classes - use `GlobalExceptionHandler` from shared-lib.

### Step 2: Replace Custom Exceptions
Replace custom exceptions with shared-lib exceptions.

### Step 3: Update Error Responses
Use `ErrorResponse` DTO from shared-lib.

### Step 4: Add i18n
Move hardcoded messages to `messages_en.properties` and `messages_ar.properties`.

### Step 5: Update Security
Use `JwtAuthenticationFilter` instead of custom filters.

## Troubleshooting

### Issue: Messages not found

**Solution:** Check that `basename` in `application.yml` points to `i18n/messages` and files exist.

### Issue: JWT validation fails

**Solution:** Ensure `jwt.secret` matches the secret used by auth-service.

### Issue: User context is null

**Solution:** Verify JWT token is being sent and `JwtAuthenticationFilter` is configured.

### Issue: GlobalExceptionHandler not catching exceptions

**Solution:** Ensure `@ComponentScan` includes `com.sharedlib.core` package.

## Further Resources

- See `core-shared-lib` source code for detailed documentation
- Check `auth-service` and `access-management-service` for usage examples
- Review `GlobalExceptionHandler.java` for all handled exception types


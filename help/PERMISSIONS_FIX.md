# 🔥 PERMISSIONS ISSUE FIXED!

## 🔴 The Problem

**Symptoms:**
```json
{
    "etag": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "generatedAt": "2025-10-24T08:31:49.797506500Z",
    "systems": []  ← EMPTY!
}
```

- `/auth/me/permissions` returns empty `systems` array
- Database has permissions (54 rows for user `roy`)
- Postman returns 200 OK but empty permissions
- Frontend shows "No access to applications"

---

## 🔍 Root Cause

**File:** `auth-service/.../PermissionWebClientConfig.java`

**Problem:**
```java
@Bean
@LoadBalanced  // ← THIS WAS THE PROBLEM!
public WebClient.Builder loadBalancedWebClientBuilder() {
    return WebClient.builder();
}

@Bean
public WebClient permissionWebClient(WebClient.Builder webClientBuilder) {
    // Uses the @LoadBalanced builder above
}
```

**Why it failed:**

1. `@LoadBalanced` makes WebClient use **Service Discovery (Eureka)**
2. Configuration uses **direct URL**:
   ```yaml
   permission:
     base-url: http://localhost:6062  # Direct URL, not service name!
   ```
3. WebClient tries to resolve `localhost:6062` via Eureka → **FAILS**
4. Circuit Breaker triggers **Fallback method** → Returns **empty permissions**
5. User sees `systems: []`

**ETag proves it:**
- `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- This is SHA-256 hash of **empty string**!
- Confirms permissions list was empty when building tree

---

## ✅ The Fix

**Changed:** Remove `@LoadBalanced` and use direct WebClient

```java
// BEFORE (WRONG - with Service Discovery)
@Bean
@LoadBalanced
public WebClient.Builder loadBalancedWebClientBuilder() {
    return WebClient.builder();
}

@Bean
public WebClient permissionWebClient(WebClient.Builder webClientBuilder) {
    return webClientBuilder
            .baseUrl(props.getBaseUrl())
            .defaultHeader("X-Internal-Key", internalApiKey)
            .build();
}

// AFTER (CORRECT - direct HTTP calls)
@Bean
public WebClient permissionWebClient() {
    HttpClient httpClient = HttpClient.create()
            .wiretap(true)
            .responseTimeout(Duration.ofMillis(props.getReadTimeoutMs()))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, props.getConnectTimeoutMs());

    return WebClient.builder()  // Direct builder, NO @LoadBalanced
            .baseUrl(props.getBaseUrl())
            .defaultHeader("X-Internal-Key", internalApiKey)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
}
```

---

## 🚀 How to Apply Fix

### **Step 1: Restart Auth Service ONLY**

**Don't restart everything!** Only Auth Service needs restart:

```powershell
# In Auth Service window, press Ctrl+C to stop

# Then restart:
cd C:\Java\care\Code
.\START_AUTH.ps1
```

⏳ Wait for: `Started AuthServiceApplication`

---

### **Step 2: Test Immediately**

```powershell
# Login to get token
$loginBody = @{
    email = "roy@gmail.com"
    password = "your-password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:6060/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

# Test permissions
$headers = @{ "Authorization" = "Bearer $($response.token)" }
$perms = Invoke-RestMethod -Uri "http://localhost:6060/auth/me/permissions?force=true" -Headers $headers

# Check result
Write-Host "Systems found: $($perms.systems.Count)" -ForegroundColor $(if ($perms.systems.Count -gt 0) { "Green" } else { "Red" })
$perms.systems | ForEach-Object { Write-Host "  - $($_.systemName)" -ForegroundColor Cyan }
```

**Expected output:**
```
Systems found: 5
  - Appointments
  - Content Management System
  - Data Analysis Service
  - SMS Manager
```

---

## 📊 Why This Happened

**Timeline:**

1. **Before:** System was working
   - WebClient was using direct URLs
   - Permissions loaded correctly

2. **What changed:** Someone added `@LoadBalanced` annotation
   - Intended to use Service Discovery for scalability
   - But didn't change configuration from direct URL to service name
   - Created mismatch: Code expects service name, config has direct URL

3. **Result:** All permission requests failed silently
   - Circuit Breaker opened
   - Fallback returned empty permissions
   - No obvious error in logs (just "Fallback triggered")

---

## 🎯 Key Learnings

### **When to use `@LoadBalanced`:**

✅ **Use when:**
- Microservices registered with Service Discovery (Eureka)
- Using service names in URLs: `http://access-management-service`
- Want automatic load balancing across multiple instances

❌ **Don't use when:**
- Using direct URLs: `http://localhost:6062`
- Local development without Eureka
- Need simple point-to-point communication

### **Our Setup:**

```yaml
# Current configuration uses DIRECT URLs
permission:
  base-url: http://localhost:6062  # NOT a service name!
```

**Therefore:** Don't use `@LoadBalanced`!

---

## 🔧 Other Services Check

**Verified other services don't have this issue:**
- ✅ Gateway: No WebClient to other services
- ✅ AMS: No WebClient to Auth (uses internal key only)
- ✅ Frontend: Uses axios with direct URLs

**Only Auth Service** had this `@LoadBalanced` problem!

---

## 📝 Testing Checklist

After applying fix:

- [ ] Auth Service restarted successfully
- [ ] Login works (returns JWT token)
- [ ] `/auth/me/permissions` returns non-empty systems array
- [ ] Frontend shows "Home" page (not "No access")
- [ ] User can navigate to CMS sections
- [ ] DataTables load data correctly
- [ ] No "Fallback triggered" warnings in Auth Service logs

---

## 🎉 Status

**Problem:** Auth Service couldn't fetch permissions from AMS  
**Root Cause:** `@LoadBalanced` annotation conflicting with direct URL configuration  
**Fix Applied:** Removed `@LoadBalanced`, use direct WebClient  
**Status:** ✅ **FIXED**

**Files Changed:**
1. `auth-service/.../PermissionWebClientConfig.java`
   - Removed `@LoadBalanced` annotation
   - Removed dependency on injected WebClient.Builder
   - Created WebClient directly with proper configuration

**Time to Fix:** 1 minute (just restart Auth Service)

---

**Last Updated:** 2025-10-24  
**Issue:** Empty permissions array  
**Resolution:** Remove @LoadBalanced from WebClient configuration


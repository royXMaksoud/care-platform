# Quick OAuth Fix - Authentication Failed Issue

## Problem

OAuth login fails with:
- "Authentication Failed"  
- "Please configure OAuth credentials for GOOGLE"
- Backend returns: `"OAuth provider not configured"`

## Root Causes Identified

1. **Auth Service returning 500 error** for `/auth/oauth/config` endpoint
2. **Frontend cached old configuration** (still using Gateway port 6060 instead of Auth Service 6061)
3. **OAuth credentials not loading** in Auth Service

## Solution Steps

### Option 1: Direct Test (Bypass issues temporarily)

1. **Stop ALL Java processes:**
   ```powershell
   Stop-Process -Name java -Force
   ```

2. **Start ONLY Auth Service with OAuth:**
   ```powershell
   cd C:\Java\care\Code\auth-service\auth-service
   
   # Set OAuth credentials
   $env:OAUTH_GOOGLE_CLIENT_ID="22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com"
   $env:OAUTH_GOOGLE_CLIENT_SECRET="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"
   
   # Verify they're set
   Write-Host "Google Client ID: $($env:OAUTH_GOOGLE_CLIENT_ID.Substring(0,30))..."
   
   # Start service
   ./mvnw spring-boot:run -DskipTests
   ```

3. **Wait for startup** (look for: `Started AuthServiceApplication`)

4. **Test OAuth config:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:6061/auth/oauth/config" | ConvertTo-Json
   ```
   
   **Expected:**
   ```json
   {
     "googleClientId": "22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com",
     "microsoftClientId": "NOT_CONFIGURED",
     "status": "ready"
   }
   ```

5. **Update Frontend config:**
   ```powershell
   # Edit web-portal\.env.local
   VITE_GOOGLE_CLIENT_ID=22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com
   VITE_API_BASE_URL=http://localhost:6061
   VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
   ```

6. **Restart Frontend (IMPORTANT - clear cache):**
   ```powershell
   cd C:\Java\care\Code\web-portal
   
   # Kill existing frontend
   # Then start fresh
   npm run dev
   ```

7. **Test OAuth:**
   - Open: `http://localhost:5173/login`
   - Click: "Continue with Google"
   - Should work!

### Option 2: Full System (with Gateway)

If Auth Service `/auth/oauth/config` returns **200 OK** and status is "ready":

1. **Ensure Gateway whitelist includes OAuth:**
   ```yaml
   # gateway-service/src/main/resources/application.yml
   gateway:
     whitelist: /auth/login,/auth/register,/auth/refresh-token,/auth/logout,/auth/oauth/**,/swagger-ui/**,/v3/api-docs/**,/actuator/health
   ```

2. **Start Gateway:**
   ```powershell
   cd C:\Java\care\Code\gateway-service
   ./mvnw spring-boot:run -DskipTests
   ```

3. **Update Frontend to use Gateway:**
   ```
   VITE_API_BASE_URL=http://localhost:6060
   ```

4. **Restart Frontend**

## Debugging 500 Error in Auth Service

If `/auth/oauth/config` returns 500 error, check Auth Service logs for:

### Common Issues:

**1. NullPointerException:**
- OAuth credentials not loaded
- Check environment variables are set BEFORE starting service

**2. Bean initialization error:**
- OAuth configuration classes failing to load
- Check `OAuthService.java` and related beans

**3. Application.yml parsing error:**
- YAML syntax error in oauth section
- Check indentation

### Check Auth Service Logs:

Look in the Auth Service PowerShell window for errors after calling the endpoint.

Search for:
- `Exception`
- `Error`
- `Failed to`
- `NullPointerException`
- `IllegalArgumentException`

### Manual Debug Test:

```powershell
# Test health endpoint (should work)
Invoke-WebRequest -Uri "http://localhost:6061/actuator/health" -UseBasicParsing

# Test OAuth config (failing with 500)
Invoke-WebRequest -Uri "http://localhost:6061/auth/oauth/config" -UseBasicParsing
```

If health works but OAuth config fails, the issue is in `AuthController.getOAuthConfig()` method.

## Frontend Cache Issue

**Vite caches environment variables!**

To fix:
1. Edit `.env.local`
2. **Stop frontend (Ctrl+C)**
3. Clear cache: Delete `web-portal/node_modules/.vite` folder (optional)
4. Restart: `npm run dev`
5. Hard refresh browser (Ctrl+Shift+R)

## Verification Checklist

- [ ] Auth Service starts without errors
- [ ] Environment variables are set BEFORE starting Auth Service
- [ ] `/auth/oauth/config` returns 200 (not 500)
- [ ] OAuth status is "ready" (not "needs_configuration")
- [ ] Frontend `.env.local` has correct base URL
- [ ] Frontend restarted after changing `.env.local`
- [ ] Browser cache cleared (Ctrl+Shift+R)

## Success Criteria

1. `/auth/oauth/config` returns:
   ```json
   {
     "status": "ready",
     "googleClientId": "22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com"
   }
   ```

2. OAuth flow completes successfully:
   - User clicks "Continue with Google"
   - Redirects to Google
   - After authentication, redirects back to app
   - User sees dashboard (or welcome page)

## If Still Failing

Share:
1. Auth Service logs (from PowerShell window) - last 50 lines after OAuth attempt
2. Browser Console errors (F12 → Console tab)
3. Network tab (F12 → Network) - show `/auth/oauth/callback` request/response


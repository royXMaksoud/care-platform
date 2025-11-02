# OAuth Authentication - Final Fix

## Problem Summary

**Symptom:** After selecting Gmail account, user is immediately redirected back to login page with "authentication failed" message.

**Root Cause:** Gateway's `AuthenticationFilter` was blocking OAuth endpoints because they were not in the whitelist.

## Solution

### 1. Gateway Configuration Fix

**File:** `gateway-service/src/main/resources/application.yml`

**Change:**
```yaml
gateway:
  whitelist: /auth/login,/auth/register,/auth/refresh-token,/auth/logout,/auth/oauth/**,/swagger-ui/**,/v3/api-docs/**,/actuator/health
```

**Added:** `/auth/oauth/**` to the whitelist

This allows:
- `/auth/oauth/config` - Frontend fetches OAuth configuration
- `/auth/oauth/callback` - Backend receives authorization code from Google

### 2. Frontend Configuration

**File:** `web-portal/.env.local`

```env
VITE_GOOGLE_CLIENT_ID=22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:6060
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
```

**Key Points:**
- `VITE_API_BASE_URL` must be `6060` (Gateway), NOT `6061` (Auth Service direct)
- Google will redirect to `http://localhost:5173/oauth/callback` after authentication

### 3. Backend OAuth Configuration

**Auth Service** must have these environment variables set:

```powershell
$env:OAUTH_GOOGLE_CLIENT_ID="22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com"
$env:OAUTH_GOOGLE_CLIENT_SECRET="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"
```

These are configured in `application.yml` to read from environment:
```yaml
oauth:
  google:
    client-id: ${OAUTH_GOOGLE_CLIENT_ID:}
    client-secret: ${OAUTH_GOOGLE_CLIENT_SECRET:}
```

## How to Start Services

### Option 1: Automated Script (Recommended)

```powershell
cd C:\Java\care\Code
.\START_ALL_FOR_OAUTH.ps1
```

This script:
1. Stops all Java processes
2. Starts Gateway (port 6060)
3. Starts Auth Service with OAuth credentials (port 6061)
4. Starts Access Management Service (port 6062)
5. Waits 60 seconds
6. Tests all services

### Option 2: Manual Start

Open 3 separate PowerShell windows:

**Window 1 - Gateway:**
```powershell
cd C:\Java\care\Code\gateway-service
./mvnw spring-boot:run
```

**Window 2 - Auth Service:**
```powershell
cd C:\Java\care\Code\auth-service\auth-service
$env:OAUTH_GOOGLE_CLIENT_ID="22284906705-cafqh1pedp9oro7vfoid1eb8flpstrbm.apps.googleusercontent.com"
$env:OAUTH_GOOGLE_CLIENT_SECRET="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"
./mvnw spring-boot:run
```

**Window 3 - Access Management Service:**
```powershell
cd C:\Java\care\Code\access-management-service
./mvnw spring-boot:run
```

**Wait for all services to show:** `Started [Service]Application in X seconds`

### Start Frontend

```powershell
cd C:\Java\care\Code\web-portal
npm run dev
```

## Testing OAuth

### Quick Test

```powershell
cd C:\Java\care\Code
.\TEST_OAUTH_QUICK.ps1
```

All tests should show **GREEN** status.

### Manual Test

1. Open: `http://localhost:5173/login`
2. Click: **"Continue with Google"**
3. Select your Gmail account
4. **Expected:** 
   - Redirect to `http://localhost:5173/oauth/callback`
   - See "Authenticating..." then "Success!"
   - Redirect to dashboard (existing user) or welcome page (new user)

## OAuth Flow Diagram

```
User clicks "Continue with Google"
    ↓
Frontend generates state & redirects to Google
    ↓
User authenticates with Google
    ↓
Google redirects to: http://localhost:5173/oauth/callback?code=...&state=...
    ↓
Frontend (OAuthCallback.jsx) sends POST to Gateway:
    POST http://localhost:6060/auth/oauth/callback
    {
      provider: "GOOGLE",
      code: "...",
      redirectUri: "...",
      state: "..."
    }
    ↓
Gateway checks whitelist: /auth/oauth/** ✓ ALLOWED
    ↓
Gateway forwards to Auth Service:
    POST http://localhost:6061/auth/oauth/callback
    ↓
Auth Service (AuthController.oauthCallback):
  1. Validates request
  2. Exchanges code for Google ID token (OAuthService)
  3. Verifies ID token with Google
  4. Extracts user profile (email, name, etc.)
  5. Finds or creates user (OAuthAccountLinkService)
  6. Generates JWT token
  7. Returns response with token
    ↓
Frontend stores token and redirects user
```

## Troubleshooting

### Error: "authentication failed" immediately after Gmail selection

**Cause:** Gateway is blocking OAuth callback endpoint

**Fix:**
1. Check `gateway-service/src/main/resources/application.yml`
2. Ensure whitelist includes: `/auth/oauth/**`
3. Restart Gateway

### Error: "NOT_CONFIGURED" in OAuth config

**Cause:** Auth Service doesn't have OAuth credentials

**Fix:**
1. Set environment variables before starting Auth Service:
   ```powershell
   $env:OAUTH_GOOGLE_CLIENT_ID="..."
   $env:OAUTH_GOOGLE_CLIENT_SECRET="..."
   ```
2. Restart Auth Service

### Error: Connection refused or 503

**Cause:** Services not fully started

**Fix:** Wait 30-60 seconds for all services to fully initialize

### Frontend still calling port 6061 directly

**Cause:** Frontend `.env.local` has wrong base URL or cache issue

**Fix:**
1. Update `.env.local`: `VITE_API_BASE_URL=http://localhost:6060`
2. Clear Vite cache: `npm run dev -- --force`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart frontend

## Critical Configuration Checklist

- [x] Gateway whitelist includes `/auth/oauth/**`
- [x] Frontend `.env.local` has `VITE_API_BASE_URL=http://localhost:6060`
- [x] Auth Service has OAuth credentials in environment variables
- [x] All 3 services (Gateway, Auth, AMS) are running
- [x] Frontend is running on port 5173

## Files Modified

1. **gateway-service/src/main/resources/application.yml**
   - Added `/auth/oauth/**` to whitelist

2. **web-portal/.env.local**
   - Set `VITE_API_BASE_URL=http://localhost:6060`
   - Set `VITE_GOOGLE_CLIENT_ID`

3. **Scripts Created:**
   - `START_ALL_FOR_OAUTH.ps1` - Automated startup
   - `TEST_OAUTH_QUICK.ps1` - Quick validation

## Success Criteria

✅ All services start without errors  
✅ `TEST_OAUTH_QUICK.ps1` shows all GREEN  
✅ User can click "Continue with Google"  
✅ User is redirected to Google login  
✅ After authentication, user is redirected back with token  
✅ User sees dashboard (or welcome page for new users)  

## Support

If OAuth still fails after applying all fixes:

1. Run: `.\TEST_OAUTH_QUICK.ps1`
2. Share the output
3. Check Auth Service logs in the PowerShell window for detailed errors
4. Check browser Console (F12) for frontend errors


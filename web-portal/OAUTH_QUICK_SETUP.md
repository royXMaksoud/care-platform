# 🚀 OAuth Quick Setup Guide

## Problem Solved

The error `client_id=undefined` means the frontend doesn't have Google OAuth credentials configured.

## Quick Fix (5 minutes)

### Step 1: Create `.env.local` file in `web-portal/` folder

Create a new file: `web-portal/.env.local` with this content:

```bash
# API Configuration
VITE_API_URL=http://localhost:8090

# Google OAuth - REQUIRED
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE

# Microsoft OAuth - Optional
VITE_MICROSOFT_CLIENT_ID=YOUR_MICROSOFT_CLIENT_ID_HERE
VITE_MICROSOFT_TENANT_ID=common
```

### Step 2: Get Google OAuth Client ID

**Option A: Use Test Credentials (Quick)**
For testing, you can temporarily use a dummy value to see the flow:
```
VITE_GOOGLE_CLIENT_ID=test-client-id-replace-me
```

**Option B: Get Real Credentials (Recommended - 3 minutes)**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials

2. **Create Project** (if you don't have one):
   - Click "Select a project" → "New Project"
   - Name: "Care Portal"
   - Click "Create"

3. **Create OAuth Credentials**:
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Care Portal"
   - **Authorized redirect URIs**: Add `http://localhost:5173/oauth/callback`
   - Click "Create"

4. **Copy the Client ID**:
   - A popup will show your Client ID
   - Copy it to your `.env.local` file

### Step 3: Restart Frontend

```bash
cd web-portal
npm run dev
```

The OAuth buttons will now work!

---

## Backend Configuration (Optional - for full OAuth flow)

To make OAuth actually work (not just show the UI), add to `auth-service/src/main/resources/application.yml`:

```yaml
oauth:
  google:
    client-id: ${OAUTH_GOOGLE_CLIENT_ID:}
    client-secret: ${OAUTH_GOOGLE_CLIENT_SECRET:}
```

Then set environment variables:
```bash
export OAUTH_GOOGLE_CLIENT_ID="your-client-id"
export OAUTH_GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## Test It

1. Start backend: `cd auth-service && mvn spring-boot:run`
2. Start frontend: `cd web-portal && npm run dev`
3. Go to: http://localhost:5173/auth/login
4. Click "Continue with Google"
5. You should see Google's login page (not the 400 error)

---

## Troubleshooting

**Still seeing `client_id=undefined`?**
- ✅ Check `.env.local` file exists in `web-portal/` folder
- ✅ Check file name is exactly `.env.local` (not `.env.local.txt`)
- ✅ Restart the frontend (`npm run dev`)

**Google says "redirect_uri_mismatch"?**
- ✅ In Google Console, add: `http://localhost:5173/oauth/callback`
- ✅ Make sure there's NO trailing slash
- ✅ Use `http` (not `https`) for localhost

**401/403 errors?**
- Backend OAuth is not fully configured
- You can still test the UI flow with test credentials

Need help? Check the main `OAUTH_SETUP.md` guide.


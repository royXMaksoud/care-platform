# ✅ CORS Issue Fixed - Complete Guide

## 🔴 Problem Summary

**What happened:**
- Frontend was changed to use Gateway (port 6060) instead of Auth Service (port 6061)
- Gateway didn't have CORS configuration
- All frontend requests failed with "CORS error"
- Postman worked because it doesn't enforce CORS

**Error:**
```
Access to XMLHttpRequest at 'http://localhost:6060/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## ✅ Solution Applied

### 1. **Gateway Service - CORS Configuration Added**

**File:** `gateway-service/src/main/java/com/ftp/gateway/gatewayservice/Config/GatewaySecurityConfig.java`

**Changes:**
- ✅ Added CORS imports
- ✅ Added `.cors()` configuration in SecurityFilterChain
- ✅ Added `corsConfigurationSource()` bean with:
  - Allowed origins: `localhost:5173, 5174, 3000, 3001`
  - Allowed methods: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
  - Allowed headers: `*` (all)
  - Credentials: `true`
  - Max age: `3600` seconds (1 hour)

**Result:** Gateway now properly handles CORS requests from frontend!

---

### 2. **Frontend - BaseURL Configuration**

**Files:**
- `web-portal/src/lib/axios.ts`
- `web-portal/src/shared/lib/axios.jsx`

**Changed:**
```javascript
// BEFORE (WRONG - direct to Auth Service)
baseURL: 'http://localhost:6061'

// AFTER (CORRECT - through Gateway)
baseURL: 'http://localhost:6060'
```

**Why Gateway?**
- ✅ Single entry point for all services
- ✅ Centralized CORS handling
- ✅ Load balancing via Eureka
- ✅ Proper routing to Auth, AMS, DAS, etc.

---

## 🚀 How to Start Services

### **METHOD 1: Manual Start (Recommended for monitoring)**

Open **4 separate PowerShell windows**:

#### **Window 1 - Gateway (START FIRST!)**
```powershell
cd C:\Java\care\Code
.\START_GATEWAY.ps1
```
⏳ Wait for: `Started GatewayServiceApplication`

---

#### **Window 2 - Auth Service**
```powershell
cd C:\Java\care\Code
.\START_AUTH.ps1
```
⏳ Wait for: `Started AuthServiceApplication`

---

#### **Window 3 - Access Management**
```powershell
cd C:\Java\care\Code
.\START_AMS.ps1
```
⏳ Wait for: `Started AccessManagementServiceApplication`

---

#### **Window 4 - Frontend**
```powershell
cd C:\Java\care\Code
.\START_FRONTEND.ps1
```
⏳ Wait for: `VITE ready in XXX ms`

---

### **METHOD 2: Stop All Services**
```powershell
cd C:\Java\care\Code
.\STOP_ALL.ps1
```

---

## 🧪 How to Verify

### **1. Check Services are Running**
```powershell
netstat -ano | findstr ":6060 :6061 :6062 :5173"
```

**Expected output:**
```
TCP    0.0.0.0:6060    LISTENING  (Gateway)
TCP    0.0.0.0:6061    LISTENING  (Auth)
TCP    0.0.0.0:6062    LISTENING  (AMS)
TCP    0.0.0.0:5173    LISTENING  (Frontend)
```

---

### **2. Test Frontend**

1. **Open Browser:** `http://localhost:5173`

2. **Clear Browser Cache:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

3. **Hard Reload:**
   - Press `Ctrl + Shift + R`

4. **Open DevTools:**
   - Press `F12`
   - Go to **Network** tab

5. **Try Login:**
   - Enter credentials
   - Click "Sign In"

6. **Check Network Tab:**
   ```
   ✅ POST http://localhost:6060/auth/login - Status 200 OK
   ✅ No CORS errors!
   ```

---

### **3. Test API Endpoints**

**Login:**
```
✅ POST http://localhost:6060/auth/login
```

**Users List:**
```
✅ POST http://localhost:6060/auth/api/users/filter
```

**Systems List:**
```
✅ POST http://localhost:6060/access/api/systems/filter
```

**All should return Status 200 with no CORS errors!**

---

## 🔧 Architecture

```
┌─────────────────────┐
│   Frontend (5173)   │
│  React + Vite       │
└──────────┬──────────┘
           │
           │ All requests go to Gateway
           ▼
┌─────────────────────┐
│   Gateway (6060)    │◄──── CORS enabled here!
│  Spring Cloud GW    │
└──────────┬──────────┘
           │
           ├──────────► Auth Service (6061)
           │
           ├──────────► AMS (6062)
           │
           └──────────► Data Analysis (6063)
```

---

## 📝 Key Points

1. **Always start Gateway FIRST!**
   - Other services register with Eureka through Gateway

2. **Clear browser cache after changes!**
   - Vite caches aggressively

3. **Check Network tab for actual URLs!**
   - Should always be `localhost:6060` for all API calls

4. **Postman vs Browser:**
   - Postman doesn't enforce CORS (works directly)
   - Browser enforces CORS (needs proper headers)

---

## 🆘 Troubleshooting

### **Problem: Still getting CORS errors**

**Solution:**
1. Make sure Gateway is running (port 6060)
2. Clear browser cache completely
3. Hard reload (Ctrl+Shift+R)
4. Check Network tab - URL should be `localhost:6060`

---

### **Problem: Login returns 401 Unauthorized**

**Check:**
1. Auth Service is running (port 6061)
2. Database is accessible
3. Credentials are correct
4. Check Auth Service logs

---

### **Problem: No permissions returned**

**Check:**
1. Access Management Service is running (port 6062)
2. User has permissions in database
3. Check AMS logs

---

## 📊 Services Status Check

```powershell
# Check if services are running
Get-Process -Name java -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime

# Check if frontend is running
Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime

# Check ports
netstat -ano | findstr "6060 6061 6062 5173"
```

---

## ✅ Success Criteria

- [ ] Gateway running on port 6060
- [ ] Auth Service running on port 6061
- [ ] AMS running on port 6062
- [ ] Frontend running on port 5173
- [ ] Login works without CORS errors
- [ ] Datatables load data
- [ ] Permissions load correctly
- [ ] No CORS errors in browser console

---

## 🎯 Files Modified

### **Backend:**
1. `gateway-service/.../GatewaySecurityConfig.java`
   - Added CORS configuration

### **Frontend:**
2. `web-portal/src/lib/axios.ts`
   - Changed baseURL to 6060 (Gateway)
3. `web-portal/src/shared/lib/axios.jsx`
   - Changed baseURL to 6060 (Gateway)

### **Scripts Created:**
4. `START_GATEWAY.ps1` - Start Gateway
5. `START_AUTH.ps1` - Start Auth Service
6. `START_AMS.ps1` - Start Access Management
7. `START_FRONTEND.ps1` - Start Frontend
8. `STOP_ALL.ps1` - Stop all services

---

## 📞 Support

If you still face issues:

1. **Check logs:** Look at console output in each PowerShell window
2. **Check browser console:** F12 → Console tab
3. **Check Network tab:** F12 → Network tab
4. **Verify ports:** Use `netstat` command above

---

**Last Updated:** 2025-10-24
**Status:** ✅ CORS Issue Fixed!


# 🚀 Services Management Guide

## 📋 Overview

This guide helps you manage all microservices:
- **Gateway Service** (Port 6060)
- **Auth Service** (Port 6061)  
- **Access Management Service** (Port 6062)

---

## ⚡ Quick Start

### Option 1: Use PowerShell Scripts (Recommended)

```powershell
# 1. Start all services
.\start-all-services.ps1

# 2. Wait ~60 seconds, then check status
.\check-services.ps1

# 3. When done, stop all
.\stop-all-services.ps1
```

### Option 2: Manual Start

```powershell
# Terminal 1: Auth Service
cd C:\Java\care\Code\auth-service\auth-service
mvn spring-boot:run

# Terminal 2: Access Management
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement
mvn spring-boot:run

# Terminal 3: Gateway
cd C:\Java\care\Code\gateway-service
mvn spring-boot:run
```

---

## 📊 Available Scripts

### 1. `start-all-services.ps1`

**What it does:**
- Stops any existing Java processes
- Starts services in correct order:
  1. Auth Service (6061) - wait 20s
  2. Access Management (6062) - wait 20s
  3. Gateway (6060) - wait 15s
- Opens each service in a new PowerShell window

**Usage:**
```powershell
.\start-all-services.ps1
```

**Expected Output:**
- 3 new PowerShell windows open
- Each shows service logs
- Services start sequentially

---

### 2. `check-services.ps1`

**What it does:**
- Lists all running Java processes
- Checks health endpoints for each service
- Shows port status
- Provides troubleshooting tips

**Usage:**
```powershell
.\check-services.ps1
```

**Expected Output:**
```
✅ Gateway (6060): Status: 200 - UP
✅ Auth Service (6061): Status: 200 - UP
✅ Access Management (6062): Status: 200 - UP
```

---

### 3. `stop-all-services.ps1`

**What it does:**
- Finds all Java processes
- Forcefully stops them
- Verifies ports are freed
- Shows cleanup status

**Usage:**
```powershell
.\stop-all-services.ps1
```

**Expected Output:**
```
✅ Stopped 3 Java process(es)
✅ Port 6060 is free
✅ Port 6061 is free
✅ Port 6062 is free
```

---

## 🔍 Troubleshooting

### Problem: "Port already in use"

**Solution:**
```powershell
# Stop all services first
.\stop-all-services.ps1

# Then start again
.\start-all-services.ps1
```

---

### Problem: "ClassNotFoundException: CodeTable"

**Root Cause:** Corrupted target folder or path too long

**Solution:**
```powershell
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement

# Option 1: Maven clean
mvn clean compile -DskipTests

# Option 2: Manual delete (if path too long)
Remove-Item -Recurse -Force target -ErrorAction SilentlyContinue
mvn compile -DskipTests
```

---

### Problem: "Failed to configure DataSource"

**Root Cause:** Missing database configuration

**Solution:**
1. Check `application.yml` has database settings
2. Ensure PostgreSQL is running
3. Verify connection details:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/your_db
       username: postgres
       password: your_password
   ```

---

### Problem: Service starts but immediately stops

**Causes:**
1. **Port conflict** - Another service using the port
2. **Database connection failed** - Check PostgreSQL
3. **Compilation errors** - Check for Java errors in logs

**Solution:**
```powershell
# 1. Check what's using the port
netstat -ano | findstr "6061"

# 2. Kill the process (replace PID)
taskkill /PID <process_id> /F

# 3. Check PostgreSQL is running
# Services → PostgreSQL should be "Running"

# 4. Recompile if needed
mvn clean compile -DskipTests
```

---

## 📝 Service Details

### Auth Service (6061)
- **Path:** `C:\Java\care\Code\auth-service\auth-service`
- **Port:** 6061
- **Swagger:** http://localhost:6061/swagger-ui.html
- **Health:** http://localhost:6061/actuator/health
- **Purpose:** User authentication, JWT tokens, permissions

### Access Management (6062)
- **Path:** `C:\Java\care\Code\access-management-system\access-management-service\accessmanagement`
- **Port:** 6062
- **Swagger:** http://localhost:6062/swagger-ui.html
- **Health:** http://localhost:6062/actuator/health
- **Purpose:** User permissions, roles, system actions

### Gateway (6060)
- **Path:** `C:\Java\care\Code\gateway-service`
- **Port:** 6060
- **Health:** http://localhost:6060/actuator/health
- **Purpose:** API gateway, routes requests to services

---

## 🎯 Startup Order

**Correct Order (Important!):**

1. **Auth Service** (6061) - First
   - Other services depend on this for authentication
   - Wait until you see: `Started AuthServiceApplication`

2. **Access Management** (6062) - Second
   - Needs auth service for permissions
   - Wait until you see: `Started AccessmanagementApplication`

3. **Gateway** (6060) - Last
   - Routes to other services
   - Wait until you see: `Started GatewayServiceApplication`

---

## ✅ Health Check

### Manual Check (Browser)
- Gateway: http://localhost:6060/actuator/health
- Auth: http://localhost:6061/actuator/health
- Access: http://localhost:6062/actuator/health

### PowerShell Check
```powershell
# Quick check all services
.\check-services.ps1

# Or manual curl
curl http://localhost:6060/actuator/health
curl http://localhost:6061/actuator/health
curl http://localhost:6062/actuator/health
```

**Expected Response:**
```json
{"status":"UP"}
```

---

## 🛠️ Common Issues

### Issue 1: Windows Path Too Long

**Error:**
```
Cannot remove item ... path too long
```

**Solutions:**

**Option A: Enable Long Paths (Recommended)**
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Restart Windows
```

**Option B: Move to Shorter Path**
```powershell
# Instead of:
C:\Java\care\Code\access-management-system\access-management-service\accessmanagement\

# Use:
C:\projects\access-mgmt\
```

---

### Issue 2: Service Won't Stop

**Error:**
```
Some processes still running...
```

**Solution:**
```powershell
# Force kill all Java
Get-Process java | Stop-Process -Force

# Or use Task Manager
# Ctrl+Shift+Esc → Find Java processes → End Task
```

---

### Issue 3: Database Connection Failed

**Error:**
```
Failed to determine a suitable driver class
```

**Checklist:**
- [ ] PostgreSQL service is running
- [ ] Database exists
- [ ] `application.yml` has correct DB config
- [ ] PostgreSQL driver in `pom.xml`

**Fix:**
```powershell
# Check PostgreSQL service
Get-Service -Name "*postgres*"

# If not running, start it
Start-Service postgresql-x64-17  # Adjust version
```

---

## 📊 Performance Tips

1. **Increase JVM Memory** (if services are slow):
   ```bash
   # In each service, before mvn spring-boot:run
   export MAVEN_OPTS="-Xmx2048m -Xms512m"
   ```

2. **Disable DevTools** (for production):
   ```xml
   <!-- Comment out in pom.xml -->
   <!--
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-devtools</artifactId>
   </dependency>
   -->
   ```

3. **Clean Build** (if things are slow):
   ```powershell
   mvn clean compile -DskipTests
   ```

---

## 🎉 Success Checklist

After running `start-all-services.ps1` and waiting 60 seconds:

- [ ] 3 PowerShell windows are open
- [ ] Each window shows "Started ...Application"
- [ ] `check-services.ps1` shows all services UP
- [ ] Can access Swagger UIs
- [ ] Can login and test APIs
- [ ] No errors in any console window

---

## 📞 Quick Commands Reference

```powershell
# Start everything
.\start-all-services.ps1

# Check status
.\check-services.ps1

# Stop everything
.\stop-all-services.ps1

# Manual start (if scripts fail)
# Terminal 1:
cd C:\Java\care\Code\auth-service\auth-service ; mvn spring-boot:run

# Terminal 2:
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement ; mvn spring-boot:run

# Terminal 3:
cd C:\Java\care\Code\gateway-service ; mvn spring-boot:run
```

---

**Last Updated:** October 9, 2025  
**Status:** ✅ All services configured and tested


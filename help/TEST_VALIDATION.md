# 🧪 Test Data Integrity Validation

## ⏰ انتظر 30 ثانية

الـ access-management service بدأ يشتغل الآن. **انتظر 30 ثانية** حتى يكمل startup!

```powershell
Start-Sleep -Seconds 30
```

---

## ✅ Test 1: Update with Duplicate Code (Should Return 400)

### PowerShell:
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
}

$body = @{
    code = "CMS_CONTENT_CREATE"
    name = "List Content"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:6060/access/api/system-section-actions/679e04f1-8858-4d32-8786-35b213704739" `
    -Method Put `
    -Headers $headers `
    -Body $body
```

### Expected Response (NEW - Fixed! ✅):
```json
{
  "code": "error.validation",
  "status": 400,
  "errors": [
    {
      "field": "code",
      "code": "error.SystemSectionAction.code-duplicate",
      "message": "Action code 'CMS_CONTENT_CREATE' already exists in this section"
    }
  ]
}
```

### Old Response (Before Fix ❌):
```json
{
  "code": "error.data.integrity",
  "message": "Data integrity violation",
  "status": 409
}
```

---

## ✅ Test 2: Update with Same Code (Should Success)

```powershell
$body = @{
    code = "CMS_CONTENT_LIST"  # Same code - OK!
    name = "List Content - Updated"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:6060/access/api/system-section-actions/679e04f1-8858-4d32-8786-35b213704739" `
    -Method Put `
    -Headers $headers `
    -Body $body
```

### Expected Response:
```json
{
  "systemSectionActionId": "679e04f1-8858-4d32-8786-35b213704739",
  "code": "CMS_CONTENT_LIST",
  "name": "List Content - Updated"
}
```
✅ **200 OK** - Success!

---

## 🔍 Debug: Check Service Status

```powershell
# Check if service is running
curl http://localhost:6062/actuator/health

# Expected: {"status":"UP"}
```

---

## ❌ If Still Getting 409

**Possible Causes:**

### 1. Service Not Started Yet
```powershell
# Wait more
Start-Sleep -Seconds 30

# Check again
curl http://localhost:6062/actuator/health
```

### 2. Old Process Still Running
```powershell
# Check Java processes
Get-Process java

# Stop all
Get-Process java | Stop-Process -Force

# Restart
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement
mvn clean spring-boot:run
```

### 3. Code Not Compiled
```powershell
cd C:\Java\care\Code\access-management-system\access-management-service\accessmanagement

# Force recompile
mvn clean compile -DskipTests

# Then run
mvn spring-boot:run
```

---

## 📊 Quick Check

Run this to see if validation is working:

```powershell
# Wait for service
Start-Sleep -Seconds 40

# Test (replace YOUR_TOKEN)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN"
}

$body = '{"code":"CMS_CONTENT_CREATE","name":"Test"}'

try {
    Invoke-RestMethod -Uri "http://localhost:6060/access/api/system-section-actions/679e04f1-8858-4d32-8786-35b213704739" `
        -Method Put `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode" -ForegroundColor $(if($statusCode -eq 400){"Green"}else{"Red"})
    
    if ($statusCode -eq 400) {
        Write-Host "✅ SUCCESS! Validation is working (400 Bad Request)" -ForegroundColor Green
    } elseif ($statusCode -eq 409) {
        Write-Host "❌ FAIL! Still getting 409 - Old code running" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Unexpected status: $statusCode" -ForegroundColor Yellow
    }
}
```

**Expected Output:**
```
Status Code: 400
✅ SUCCESS! Validation is working (400 Bad Request)
```

---

## ✅ Success Indicators

- [ ] Service returns **400** (not 409)
- [ ] Error message mentions **"code-duplicate"**
- [ ] Field **"code"** is specified in error
- [ ] Message is **user-friendly** in English

---

**الآن انتظر 30 ثانية وجرب Test 1!** ⏰


# 🚀 CURSOR AI - EXECUTE THESE COMMANDS NOW
# أوامر مباشرة لـ Cursor AI لتنفيذ المتبقي

**التاريخ:** 2 نوفمبر 2025
**الحالة:** جاهز للتنفيذ الآن
**الأولوية:** CRITICAL

---

## ⚡ الأوامر (Commands for Cursor AI)

### 🎯 الأمر الأول: MobileServiceTypeController

```
👉 INSTRUCTION FOR CURSOR AI #1:

Go to: appointment-service/src/main/java/com/care/appointment/web/controller/

Create NEW FILE: MobileServiceTypeController.java

Copy ENTIRE code from CURSOR_AI_REMAINING_TASKS.md → Task #1 → MobileServiceTypeController

This file should:
✅ Have @RestController annotation
✅ Map to /api/mobile/service-types
✅ Have @GetMapping("/lookup") endpoint
✅ Return List<ServiceTypeDTO>
✅ Use LoadAllUseCase to fetch data
✅ Include Swagger documentation
✅ Handle errors properly

After creating:
1. Run: mvn clean install
2. Test: GET http://localhost:6064/api/mobile/service-types/lookup
3. Verify response has serviceTypeId, name, nameAr, nameEn, isActive
```

---

### 🎯 الأمر الثاني: Seed Data SQL

```
👉 INSTRUCTION FOR CURSOR AI #2:

Go to: appointment-service/

Create NEW FILE: seed-data.sql

Copy ENTIRE SQL script from CURSOR_AI_REMAINING_TASKS.md → Task #3 → Seed Data SQL

This script should:
✅ INSERT 5 service types (فحص عام, أطفال, أسنان, عيون, قلب)
✅ INSERT 3 health centers (مراكز صحية)
✅ INSERT 5 providers/doctors (أطباء)
✅ INSERT 3 beneficiaries (مستفيدين)
   - 07701234567 with DOB 1985-05-15
   - 07702345678 with DOB 1990-03-22
   - 07703456789 with DOB 1978-12-08
✅ INSERT 3 test appointments
✅ INSERT provider specializations
✅ INSERT center services

After creating:
1. Run SQL script on PostgreSQL:
   psql -U appointment_user -d appointment_db -f seed-data.sql

2. Verify data inserted:
   SELECT COUNT(*) FROM appt_service_types;  -- Should be 5
   SELECT COUNT(*) FROM appt_health_centers; -- Should be 3
   SELECT COUNT(*) FROM appt_providers;      -- Should be 5
   SELECT COUNT(*) FROM appt_beneficiaries;  -- Should be 3
   SELECT COUNT(*) FROM appt_appointments;   -- Should be 3

3. Test login API:
   curl -X POST http://localhost:6064/api/mobile/beneficiaries/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"07701234567","dateOfBirth":"1985-05-15"}'
```

---

## 📋 QUICK CHECKLIST FOR CURSOR AI

### Task 1: MobileServiceTypeController (2 hours)

- [ ] Create file: `MobileServiceTypeController.java`
- [ ] Copy code from CURSOR_AI_REMAINING_TASKS.md
- [ ] File location: `appointment-service/src/main/java/com/care/appointment/web/controller/`
- [ ] Has imports for:
  - `@RestController`
  - `@RequestMapping("/api/mobile/service-types")`
  - `LoadAllUseCase`
  - `ServiceTypeWebMapper`
  - Swagger annotations
- [ ] Endpoint: `GET /api/mobile/service-types/lookup`
- [ ] Returns: `ResponseEntity<List<ServiceTypeResponse>>`
- [ ] Run: `mvn clean install`
- [ ] Test with Postman/cURL
- [ ] ✅ DONE

---

### Task 2: Seed Data SQL (4 hours)

- [ ] Create file: `seed-data.sql`
- [ ] File location: `appointment-service/`
- [ ] Copy SQL from CURSOR_AI_REMAINING_TASKS.md
- [ ] Contains INSERT statements for:
  - [ ] 5 service types
  - [ ] 3 health centers
  - [ ] 5 providers
  - [ ] 3 beneficiaries
  - [ ] 3 appointments
  - [ ] Provider specializations
  - [ ] Center services
- [ ] Run script on PostgreSQL
- [ ] Verify all data inserted
- [ ] Test login endpoint
- [ ] ✅ DONE

---

## 🧪 TESTING COMMANDS FOR CURSOR AI

### Test MobileServiceTypeController

```bash
# Command 1: Get all service types
curl -X GET http://localhost:6064/api/mobile/service-types/lookup \
  -H "Content-Type: application/json"

# Expected: 5 service types with names
# [
#   {
#     "serviceTypeId": "550e8400-e29b-41d4-a716-446655440001",
#     "name": "فحص عام",
#     "isActive": true
#   },
#   ...
# ]

# Command 2: Get specific service type
curl -X GET http://localhost:6064/api/mobile/service-types/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json"
```

### Test Seed Data

```bash
# Command 1: Test beneficiary login (should work after seed data)
curl -X POST http://localhost:6064/api/mobile/beneficiaries/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "07701234567",
    "dateOfBirth": "1985-05-15"
  }'

# Expected: Success with beneficiary data

# Command 2: Verify database has data
# In PostgreSQL:
# SELECT COUNT(*) FROM appt_service_types WHERE is_deleted = false;
# -- Expected: 5
```

---

## 📌 FILES TO REFERENCE

### For MobileServiceTypeController Code:
📄 **CURSOR_AI_REMAINING_TASKS.md** → Scroll to → Task #1

```
🎯 المهمة #1: MobileServiceTypeController (2 ساعات)

### الحل:

#### 1️⃣ أنشئ Controller جديد:
```
File: appointment-service/src/main/java/com/care/appointment/web/controller/MobileServiceTypeController.java

الكود:
---
[COMPLETE CODE HERE - 70 lines]
---
```

### For Seed Data SQL:
📄 **CURSOR_AI_REMAINING_TASKS.md** → Scroll to → Task #3

```
## 🎯 المهمة #3: Seed Data - SQL (4 ساعات)

### الحل:

#### 1️⃣ أنشئ SQL Seed Script:
```
File: appointment-service/seed-data.sql

الكود:
---
[COMPLETE SQL SCRIPT HERE - 300+ lines]
---
```

---

## ✅ SUCCESS CRITERIA

### When Task 1 is Done:
```
✅ File created: MobileServiceTypeController.java
✅ Builds without errors: mvn clean install
✅ Endpoint accessible: GET /api/mobile/service-types/lookup
✅ Returns JSON with 5+ service types
✅ Flutter app loads service types (in dropdown)
```

### When Task 2 is Done:
```
✅ File created: seed-data.sql
✅ SQL script runs without errors
✅ Database has 5 service types
✅ Database has 3 health centers
✅ Database has 5 providers
✅ Database has 3 beneficiaries
✅ Login works with test credentials
✅ Flutter app shows appointments
```

---

## 🎯 FINAL CHECKLIST

After BOTH tasks complete:

- [ ] MobileServiceTypeController created ✅
- [ ] Seed data inserted ✅
- [ ] API endpoints tested ✅
- [ ] Flutter app can login ✅
- [ ] Service types appear in dropdown ✅
- [ ] Appointments appear in list ✅
- [ ] All screens working ✅
- [ ] Error messages clear ✅
- [ ] **SYSTEM 100% COMPLETE** ✅

---

## 📞 ERROR TROUBLESHOOTING

### If MobileServiceTypeController fails to compile:
1. Check imports are correct
2. Check dependencies in pom.xml
3. Run: `mvn clean compile`
4. Check for typos in annotations

### If Seed Data SQL fails:
1. Check PostgreSQL is running
2. Check table names match schema
3. Check UUID format is correct
4. Run one INSERT at a time to find issue

### If API returns 404:
1. Check endpoint path is correct
2. Check application-service is running on port 6064
3. Check controller is annotated with @RestController
4. Rebuild and restart: `mvn clean install && java -jar target/appointment-service.jar`

### If Flutter login fails:
1. Check seed data has beneficiaries
2. Check mobile number format: 10 digits starting with 07
3. Check date format: yyyy-MM-dd
4. Check API token is stored correctly

---

## 🚀 EXECUTE IN ORDER

### Step 1 (First 2 hours):
1. Create MobileServiceTypeController.java
2. Run `mvn clean install`
3. Test API endpoint
4. ✅ Verify it works

### Step 2 (Next 4 hours):
1. Create seed-data.sql
2. Run SQL on PostgreSQL
3. Verify data inserted
4. Test login endpoint
5. ✅ Verify it works

### Step 3 (Last 1 hour):
1. Run Flutter app
2. Test login with 07701234567 / 1985-05-15
3. View appointments
4. Search for appointments
5. ✅ Verify everything works

---

## 💡 NOTES FOR CURSOR AI

1. **Code is ready to copy-paste** - Just get it from CURSOR_AI_REMAINING_TASKS.md
2. **Don't create new dependencies** - Use existing ones
3. **Don't modify existing files** - Only create new ones
4. **Test each task separately** - Don't do both at once
5. **Follow the exact file paths** - They're specified in the tasks

---

## 📊 TIME ESTIMATE

| Task | Time | Status |
|------|------|--------|
| MobileServiceTypeController | 2 hours | ⏳ Ready |
| Seed Data SQL | 4 hours | ⏳ Ready |
| Testing & Verification | 1 hour | ⏳ Ready |
| **TOTAL** | **6 hours** | **6 hours to 100%** |

---

## 🎯 AFTER COMPLETION

Once both tasks are done:
- ✅ Mobile app is 100% functional
- ✅ Beneficiaries can login
- ✅ Appointments are visible
- ✅ Service types are loaded
- ✅ System ready for production

---

**Status: READY TO EXECUTE** ✅
**ETA: 6 hours to completion** ⏱️
**Difficulty: Medium** 📊

**GO TO: CURSOR_AI_REMAINING_TASKS.md AND COPY THE CODE** 🚀


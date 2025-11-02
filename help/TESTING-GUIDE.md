# 🧪 COMPLETE TESTING GUIDE

**Appointment Management System - End-to-End Testing**

---

## 🎯 **Testing Workflow (Step by Step):**

### **✅ STEP 1: Verify Both Services Running**

**Backend:**
```powershell
# Check if running
Invoke-RestMethod -Uri "http://localhost:6064/actuator/health"
# Should return: {"status":"UP"}

# Or open Swagger
Start-Process "http://localhost:6064/swagger-ui.html"
```

**Frontend:**
```powershell
# Should be running on port 5173
Start-Process "http://localhost:5173"
```

---

### **✅ STEP 2: Login to Portal**

1. Open: http://localhost:5173
2. Login with your credentials (from access-management-service)
3. You should see the home page with system cards

---

### **✅ STEP 3: Access Appointment Module**

**Option A:** Click the "Appointment" card from home

**Option B:** Direct URL:
```
http://localhost:5173/appointment
```

**Expected:** You should see 6 sections:
1. Schedule Management
2. Holiday Management
3. Service Types
4. Action Types
5. Beneficiaries
6. Appointments

---

### **✅ STEP 4: Test Schedule Management**

1. Click "Schedule Management" card
2. **URL:** `http://localhost:5173/appointment/schedules`
3. You should see an empty table (if no data) or existing schedules
4. Click "**+ Add**" button
5. Fill the form:
   - **Center/Branch:** Select from dropdown
   - **Day of Week:** Sunday (0)
   - **Start Time:** 08:00
   - **End Time:** 16:00
   - **Slot Duration:** 30 minutes
   - **Max Capacity:** 10
   - **Active:** ✓ (checked)
6. Click "**Save**"
7. **Expected:** Success toast + new row appears in table
8. **Test Edit:** Click row → Edit → Change time → Save
9. **Test Delete:** Click delete icon → Confirm → Row removed

---

### **✅ STEP 5: Test Holiday Management**

1. Go to: http://localhost:5173/appointment/holidays
2. Click "**+ Add**"
3. Fill the form:
   - **Center/Branch:** Select from dropdown
   - **Holiday Date:** 2025-12-25
   - **Holiday Name:** Christmas Day
   - **Reason:** National Holiday
   - **Recurring Yearly:** ✓ (checked)
   - **Active:** ✓ (checked)
4. Click "**Save**"
5. **Expected:** Success toast + new row appears
6. **Test Filter:**
   - Click "Filters" button
   - Add criteria: `holidayDate` EQUAL `2025-12-25`
   - Apply
   - Should show only matching holidays

---

### **✅ STEP 6: Test Service Types**

1. Go to: http://localhost:5173/appointment/service-types
2. Create a **General Service:**
   - **Name:** General Medicine
   - **Code:** GEN_MED
   - **Description:** General medical services
   - **Parent Service:** (leave empty)
   - **Is Detailed Service:** ✗ (unchecked)
   - **Display Order:** 1
3. Create a **Detailed Service:**
   - **Name:** Cardiology Consultation
   - **Code:** CARD_CONSULT
   - **Parent Service:** Select "General Medicine"
   - **Is Detailed Service:** ✓ (checked)
   - **Display Order:** 1
4. **Expected:** Hierarchical services created

---

### **✅ STEP 7: Test Action Types**

1. Go to: http://localhost:5173/appointment/action-types
2. Create actions:
   - **Arrived:** Code: ARRIVED, Color: Green, Completes: No
   - **Completed:** Code: COMPLETED, Color: Blue, Completes: Yes
   - **No Show:** Code: NO_SHOW, Color: Red, Completes: Yes
   - **Cancelled:** Code: CANCELLED, Color: Gray, Completes: Yes
3. **Expected:** All action types visible with color indicators

---

### **✅ STEP 8: Test Beneficiaries**

1. Go to: http://localhost:5173/appointment/beneficiaries
2. Click "**+ Add**"
3. Create a beneficiary:
   - **National ID:** 12345678901
   - **Full Name:** Ahmad Mohammad Ali
   - **Mother Name:** Fatima Hassan
   - **Mobile:** +963912345678
   - **Email:** ahmad.ali@example.com
   - **Address:** Damascus, Syria
   - **Latitude:** 33.5138
   - **Longitude:** 36.2765
4. Click "**Save**"
5. **Test Search:**
   - Use filter: `fullName` CONTAINS `Ahmad`
   - Should find the beneficiary

---

### **✅ STEP 9: Test Appointments View**

1. Go to: http://localhost:5173/appointment/appointments
2. Should see table (empty if no appointments yet)
3. **Test Filters:**
   - Filter by date range
   - Filter by center
   - Filter by priority
4. **Expected:** Filtering works, pagination works

---

## 🧪 **Advanced Testing:**

### **Test Filtering (All Pages):**
1. Click "**Filters**" button
2. Add criteria:
   - Field: `isActive`
   - Operator: `EQUAL`
   - Value: `true`
3. Click "Apply"
4. **Expected:** Shows only active records

### **Test Sorting:**
1. Click any column header
2. **Expected:** Table sorts by that column
3. Click again → Reverse sort

### **Test Pagination:**
1. If more than 20 records, use pagination controls at bottom
2. **Expected:** Navigate between pages

### **Test Export:**
1. Click "**Controls**" dropdown (top right)
2. Select "**Export to Excel**"
3. **Expected:** Downloads .xlsx file

---

## ⚠️ **Troubleshooting:**

### **Problem: "Failed to fetch"**
**Cause:** Backend not running or gateway issue

**Solution:**
```powershell
# Check backend
Invoke-RestMethod -Uri "http://localhost:6064/actuator/health"

# Check gateway (if using)
Invoke-RestMethod -Uri "http://localhost:6060/actuator/health"
```

### **Problem: "Cannot read properties of undefined"**
**Cause:** API response format mismatch

**Solution:**
- Check browser console (F12)
- Check Network tab for API response
- Verify backend returns correct data structure

### **Problem: "Permission denied"**
**Cause:** User doesn't have appointment module permissions

**Solution:**
- Grant permissions in access-management-service
- Or use admin account

### **Problem: Dropdown is empty (no options)**
**Cause:** Lookup API failed or no data

**Solution:**
- Check browser console for errors
- Verify backend `/lookup` endpoints work
- Add data in referenced tables first (e.g., organization branches)

---

## 📊 **Expected Results:**

### **Schedule Management:**
- ✅ Empty table initially
- ✅ "Add" button creates schedule
- ✅ Branches loaded from access-management
- ✅ Day names show (Sunday, الأحد)
- ✅ Time displayed correctly
- ✅ Edit/Delete works

### **Holiday Management:**
- ✅ Empty table initially
- ✅ Date picker shows
- ✅ Recurring checkbox works
- ✅ Filter by date works
- ✅ CRUD operations successful

### **Service Types:**
- ✅ Can create general services
- ✅ Can create detailed services
- ✅ Parent dropdown populated
- ✅ Hierarchy displayed

### **Action Types:**
- ✅ Color picker works
- ✅ Checkboxes work
- ✅ Color displayed in table

### **Beneficiaries:**
- ✅ National ID validation
- ✅ Mobile format validation
- ✅ Email validation
- ✅ Search works

### **Appointments:**
- ✅ Table shows appointments
- ✅ Date/time formatted
- ✅ Patient/Center names resolved
- ✅ Priority badge colored

---

## 🎯 **Complete Test Scenario:**

### **Scenario: Setup a New Center**

**1. Create Service Type:**
```
Go to: /appointment/service-types
Create: "Cardiology" (CARD_001)
```

**2. Create Schedule (Sunday):**
```
Go to: /appointment/schedules
Create: Main Center, Sunday, 08:00-16:00, 30min, capacity 10
```

**3. Create Schedule (Monday):**
```
Create: Main Center, Monday, 08:00-16:00, 30min, capacity 10
```

**4. Add Holiday:**
```
Go to: /appointment/holidays
Create: Main Center, 2025-12-25, "Christmas", Recurring
```

**5. Create Action Types:**
```
Go to: /appointment/action-types
Create: "Arrived" (ARRIVED)
Create: "Completed" (COMPLETED)
Create: "No Show" (NO_SHOW)
```

**6. Register Beneficiary:**
```
Go to: /appointment/beneficiaries
Create: Ahmad Ali, +963912345678
```

**7. View Setup:**
```
Check each page - all data should be visible
Filter, sort, edit - all should work
```

---

## 📝 **Testing Checklist:**

- [ ] Frontend builds without errors
- [ ] Frontend runs on port 5173
- [ ] Can login to portal
- [ ] Appointment card appears on home
- [ ] Can access /appointment
- [ ] Can access /appointment/schedules
- [ ] Can create a schedule
- [ ] Can edit a schedule
- [ ] Can delete a schedule
- [ ] Can access /appointment/holidays
- [ ] Can create a holiday
- [ ] Can access /appointment/service-types
- [ ] Can create a service type
- [ ] Can access /appointment/action-types
- [ ] Can create an action type
- [ ] Can access /appointment/beneficiaries
- [ ] Can create a beneficiary
- [ ] Can access /appointment/appointments
- [ ] Filtering works on all pages
- [ ] Sorting works on all pages
- [ ] Pagination works (if enough data)
- [ ] i18n switching works (EN ↔ AR)

---

## 🎉 **If All Tests Pass:**

**YOU HAVE A COMPLETE WORKING SYSTEM!**

✅ Backend + Frontend integrated  
✅ All CRUD operations working  
✅ Filtering & sorting working  
✅ i18n working  
✅ Ready for production!

---

## 🚀 **Production Deployment:**

When ready to deploy:

1. **Backend:**
   ```powershell
   cd appointment-service
   mvn clean package -DskipTests
   # Deploy the .jar file
   ```

2. **Frontend:**
   ```powershell
   cd web-portal
   npm run build
   # Deploy the dist/ folder to web server
   ```

---

**Happy Testing!** 🧪✨



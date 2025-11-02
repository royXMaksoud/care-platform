# Cursor AI - Detailed Implementation Prompts & Missing Components

**Status:** Complete Requirements for Full Implementation
**Date:** November 1, 2025
**Target:** appointment-service and notification-service integration

---

## EXECUTIVE SUMMARY

The appointment-service is 95% complete. This document provides:

1. **Exact prompts for Cursor AI** to implement missing components
2. **Web page requirements** for the web-portal
3. **Missing backend components** to complete
4. **Notification/SMS system** with full architecture

---

## PART 1: MISSING BACKEND COMPONENTS FOR APPOINTMENT-SERVICE

### 1.1 FIX: CreateBeneficiaryCommand Missing Fields

**File:** `appointment-service/src/main/java/com/care/appointment/application/beneficiary/command/CreateBeneficiaryCommand.java`

**Prompt for Cursor AI:**
```
Update CreateBeneficiaryCommand.java to add these 5 new fields:

1. dateOfBirth (LocalDate) - For mobile authentication
2. genderCodeValueId (UUID) - Reference to gender code table value
3. profilePhotoUrl (String) - URL to profile photo
4. registrationStatusCodeValueId (UUID) - QUICK or COMPLETE status
5. preferredLanguageCodeValueId (UUID) - AR, EN, FR, KU, etc.

Add Lombok @Data, @Builder, @NoArgsConstructor, @AllArgsConstructor annotations.
Update BeneficiaryAdminService.save() method to map these fields when creating beneficiary.
The fields should be mapped from command to Beneficiary domain model.

After changes:
- Run: mvn clean compile
- Verify no errors
```

---

### 1.2 FIX: Update UpdateBeneficiaryCommand Missing Fields

**File:** `appointment-service/src/main/java/com/care/appointment/application/beneficiary/command/UpdateBeneficiaryCommand.java`

**Prompt for Cursor AI:**
```
Update UpdateBeneficiaryCommand.java to add these 5 fields (same as CreateBeneficiaryCommand):

1. dateOfBirth (LocalDate)
2. genderCodeValueId (UUID)
3. profilePhotoUrl (String)
4. registrationStatusCodeValueId (UUID)
5. preferredLanguageCodeValueId (UUID)

Update BeneficiaryAdminService.update() method to:
- Load existing beneficiary
- Map command fields to domain model
- Update only non-null fields
- Preserve rowVersion for optimistic locking
- Save and return updated beneficiary

After changes:
- Run: mvn clean compile
- Verify no errors
```

---

### 1.3 FIX: Rate Limiting Configuration (Already Applied)

**Status:** ✅ CONFIRMED - Fix #2 has been applied correctly!

I can see from the code that:
- ✅ `@RateLimiter(name = "mobileBeneficiaryAuth")` is present at line 73
- ✅ Documentation updated with rate limit details (line 60, 79)
- ✅ 429 response documented in JavaDoc (line 85)

**Verification:**
Add to `application.yml`:
```yaml
resilience4j:
  ratelimiter:
    instances:
      mobileBeneficiaryAuth:
        registerHealthIndicator: true
        limitRefreshPeriod: 1m
        limitForPeriod: 5                # 5 requests per minute (strict for security)
        timeoutDuration: 5s
        eventConsumerBufferSize: 100
```

---

### 1.4 NEW: Add Repository Methods for Beneficiary Lookups

**File:** `appointment-service/src/main/java/com/care/appointment/infrastructure/db/repositories/BeneficiaryRepository.java`

**Prompt for Cursor AI:**
```
Add these new query methods to BeneficiaryRepository interface:

1. findByPreferredLanguageCodeValueId(UUID languageCodeValueId)
   - Returns: List<Beneficiary>
   - Purpose: Find all beneficiaries with specific language preference
   - Usage: For bulk messaging in preferred languages

2. findByRegistrationStatusCodeValueId(UUID statusCodeValueId)
   - Returns: List<Beneficiary>
   - Purpose: Find beneficiaries by registration status (QUICK or COMPLETE)
   - Usage: For filtering beneficiary lists

3. countByIsActiveAndIsDeletedFalse()
   - Returns: long
   - Purpose: Count active beneficiaries
   - Usage: For statistics and reporting

4. findByGenderCodeValueId(UUID genderCodeValueId)
   - Returns: List<Beneficiary>
   - Purpose: Find beneficiaries by gender
   - Usage: For targeted messaging by demographic

5. findByIsActiveTrueAndIsDeletedFalseOrderByCreatedAtDesc()
   - Returns: List<Beneficiary>
   - Purpose: Find all active beneficiaries in descending creation order
   - Usage: For dashboard and bulk operations

Use Spring Data JPA @Query annotation if custom query needed.
Add @Transactional(readOnly = true) for read operations.

After changes:
- Run: mvn clean compile
- Create corresponding unit tests
```

---

### 1.5 NEW: Add DTO for Bulk Beneficiary Update

**File:** `appointment-service/src/main/java/com/care/appointment/web/dto/BulkBeneficiaryUpdateRequest.java`

**Prompt for Cursor AI:**
```
Create new BulkBeneficiaryUpdateRequest.java DTO:

Fields:
1. beneficiaryIds (List<UUID>) - @NotEmpty
   - IDs of beneficiaries to update

2. updateFields (Map<String, Object>)
   - Map of field names to new values
   - Supports: preferredLanguageCodeValueId, profilePhotoUrl, etc.
   - Example: { "preferredLanguageCodeValueId": "550e8400..." }

3. description (String) - @NotBlank
   - Description of bulk update (for audit trail)
   - Example: "Bulk language preference update to Arabic"

4. isApprovedByAdmin (Boolean) - @NotNull
   - Approval flag for sensitive updates

Annotations:
- @Data @Builder @NoArgsConstructor @AllArgsConstructor (Lombok)
- @Valid on nested fields
- Use @Size, @NotNull, @NotBlank for validation

After creation:
- Run: mvn clean compile
- Add corresponding mapper in BeneficiaryWebMapper
```

---

### 1.6 NEW: Add Admin Endpoint for Bulk Update

**File:** `appointment-service/src/main/java/com/care/appointment/web/controller/admin/BeneficiaryController.java`

**Prompt for Cursor AI:**
```
Add new endpoint to admin BeneficiaryController:

Endpoint: PUT /api/admin/beneficiaries/bulk
Method: putBulkUpdate()

Request:
- @RequestBody @Valid BulkBeneficiaryUpdateRequest request
- @RequestAttribute("userId") UUID userId

Logic:
1. Validate that user has ADMIN role or BENEFICIARY_UPDATE permission
2. For each beneficiary ID in request.getBeneficiaryIds():
   - Load beneficiary
   - Update specified fields from updateFields map
   - Set updatedById to current userId
   - Set updatedAt to Instant.now()
   - Increment rowVersion for optimistic locking
   - Save beneficiary
3. Log bulk update event: "User [userId] updated [count] beneficiaries: [description]"
4. Return: List<BeneficiaryDTO> with updated records

Response: 200 OK with list of updated beneficiaries

Error Handling:
- 400: If beneficiaryIds is empty
- 400: If updateFields is empty
- 401: If user not authorized
- 404: If any beneficiary not found
- 409: If rowVersion mismatch (optimistic locking)

After implementation:
- Run: mvn clean compile
- Test endpoint with Swagger
```

---

### 1.7 NEW: Add Statistics Endpoint

**File:** `appointment-service/src/main/java/com/care/appointment/web/controller/admin/BeneficiaryController.java`

**Prompt for Cursor AI:**
```
Add new endpoint to admin BeneficiaryController:

Endpoint: GET /api/admin/beneficiaries/statistics
Method: getStatistics()

Return BeneficiaryStatisticsDTO containing:

1. totalBeneficiaries (long)
   - SELECT COUNT(*) FROM beneficiaries WHERE is_deleted = false

2. activeBeneficiaries (long)
   - WHERE is_active = true AND is_deleted = false

3. beneficiariesByLanguage (Map<String, Long>)
   - Count by preferred language (AR, EN, FR, KU)
   - Example: { "AR": 450, "EN": 320, "FR": 50, "KU": 30 }

4. beneficiariesByGender (Map<String, Long>)
   - Count by gender (M, F)
   - Example: { "M": 425, "F": 425 }

5. beneficiariesByRegistrationStatus (Map<String, Long>)
   - Count by registration status (QUICK, COMPLETE)
   - Example: { "QUICK": 500, "COMPLETE": 350 }

6. recentBeneficiaries (List<BeneficiaryDTO>)
   - Last 10 created beneficiaries with full details

7. lastUpdatedAt (Instant)
   - Timestamp when stats were calculated

Caching:
- @Cacheable(value = "beneficiaryStats", unless="#result == null")
- TTL: 5 minutes

Response: 200 OK with BeneficiaryStatisticsDTO

After implementation:
- Create BeneficiaryStatisticsDTO
- Create mapper for stats
- Run tests
```

---

### 1.8 NEW: Add Beneficiary Search/Filter Endpoint

**File:** `appointment-service/src/main/java/com/care/appointment/web/controller/admin/BeneficiaryController.java`

**Prompt for Cursor AI:**
```
Add new endpoint for advanced searching:

Endpoint: POST /api/admin/beneficiaries/search
Method: searchBeneficiaries()

Request Body (BeneficiarySearchRequest):
{
  "mobileNumber": "+963912...",          // Optional - partial match
  "fullName": "محمد",                    // Optional - partial match
  "nationalId": "123456789",             // Optional - exact match
  "genderCodeValueId": "550e8400...",    // Optional - exact match
  "preferredLanguageCodeValueId": "...", // Optional - exact match
  "registrationStatusCodeValueId": "...",// Optional - exact match
  "isActive": true,                      // Optional filter
  "createdAfter": "2025-10-01",          // Optional - from date
  "createdBefore": "2025-11-01",         // Optional - to date
  "pageNumber": 0,                       // Pagination
  "pageSize": 20                         // Pagination
}

Response:
{
  "content": [ ...beneficiaries... ],
  "totalElements": 450,
  "totalPages": 23,
  "pageNumber": 0,
  "pageSize": 20,
  "hasMore": true
}

Search Logic:
1. Build dynamic JPA Specification based on request fields
2. Use case-insensitive LIKE for string fields
3. Use exact match for UUID fields
4. Apply date range filters if provided
5. Apply pagination
6. Sort by createdAt descending

After implementation:
- Create BeneficiarySearchRequest DTO
- Create BeneficiarySearchResponse DTO with pagination
- Create specification for dynamic queries
- Test with various filter combinations
```

---

## PART 2: WEB PORTAL PAGES FOR APPOINTMENT-SERVICE

### 2.1 NEW: Beneficiary List Page with Search & Filters

**File:** `web-portal/src/modules/cms/pages/beneficiary/BeneficiaryList.jsx`

**Prompt for Cursor AI:**
```
Create comprehensive Beneficiary List page with:

Features:
1. Data Table using TanStack Table:
   - Columns: ID, Full Name, Mobile, Email, Gender, Language, Status, Active, Created, Actions
   - Sortable columns (by name, mobile, created date)
   - Default sort by createdAt descending
   - Pagination (10, 20, 50 rows per page)
   - Row selection for bulk operations
   - Expandable rows showing full details

2. Search & Filter Panel (left sidebar):
   - Text input for mobile number (with E.164 placeholder)
   - Text input for full name (case-insensitive search)
   - Text input for national ID
   - Dropdown for gender (load from reference-data-service)
   - Dropdown for preferred language (AR, EN, FR, KU)
   - Dropdown for registration status (QUICK, COMPLETE)
   - Checkbox for "Active Only"
   - Date range picker (Created After/Before)
   - Search button
   - Clear filters button

3. Action Buttons:
   - "New Beneficiary" - Open create modal
   - "Edit" - Edit selected beneficiary
   - "Delete" - Soft delete selected beneficiary
   - "Bulk Update" - Update selected beneficiaries
   - "Export" - Export to CSV/Excel
   - "Statistics" - Show beneficiary statistics dashboard

4. Bulk Operations Menu:
   - Update Language Preference (select language, apply to selected)
   - Update Registration Status (select status, apply to selected)
   - Update Active Status (enable/disable selected)

5. Statistics Section (collapsible):
   - Total beneficiaries count
   - Active beneficiaries count
   - By language pie chart (AR, EN, FR, KU)
   - By gender pie chart (M, F)
   - By registration status bar chart (QUICK, COMPLETE)
   - Recent 5 beneficiaries added list

6. Responsive Design:
   - Desktop: 2 columns (filters + table)
   - Tablet: Filters collapse to drawer
   - Mobile: Full width responsive table

API Calls:
- GET /api/admin/beneficiaries?page=0&size=20&sort=createdAt,desc
- POST /api/admin/beneficiaries/search (with filters)
- GET /api/admin/beneficiaries/statistics
- PUT /api/admin/beneficiaries/bulk (for bulk update)
- DELETE /api/admin/beneficiaries/{id}
- GET /reference-data/code-tables/GENDERS/values (for dropdown)
- GET /reference-data/code-tables/LANGUAGES/values (for dropdown)
- GET /reference-data/code-tables/REGISTRATION_STATUS/values (for dropdown)

State Management:
- Use TanStack Query for data fetching with caching
- Use React hooks for local state
- Loading, error, empty states

After creation:
- Add route to src/modules/cms/routes.jsx
- Add translations to locales (en/ar)
- Test with various screen sizes
- Test all filter combinations
```

---

### 2.2 NEW: Beneficiary Details/Edit Page

**File:** `web-portal/src/modules/cms/pages/beneficiary/BeneficiaryDetails.jsx`

**Prompt for Cursor AI:**
```
Create detailed Beneficiary Details page:

Layout:
1. Header Section:
   - Beneficiary profile photo (or default avatar)
   - Name, mobile, email displayed prominently
   - Breadcrumb navigation: CMS > Beneficiaries > [Name]
   - Last updated timestamp

2. Tabs:
   a) Personal Information Tab:
      - Full Name (text input)
      - Mother Name (text input)
      - National ID (text input, readonly)
      - Mobile Number (text input, E.164 format)
      - Email (email input)
      - Date of Birth (date picker)
      - Gender (dropdown from reference-data)
      - Preferred Language (dropdown: AR, EN, FR, KU)
      - Address (textarea)
      - Latitude/Longitude (map picker or text inputs)
      - Profile Photo URL (file upload or URL input)

   b) Registration Tab:
      - Registration Status (dropdown: QUICK, COMPLETE)
      - Status Changed At (timestamp, readonly)
      - Status Changed By (user name, readonly)
      - Registration Completed At (timestamp, readonly)
      - Registration Completed By (user name, readonly)
      - Can view full registration workflow

   c) Family Members Tab:
      - List of family members (mini table)
      - Add family member button
      - Edit/Delete buttons for each member
      - Emergency contacts highlighted
      - Can book appointments indicator

   d) Documents Tab:
      - List of documents (mini table)
      - Columns: Type, Country, Issued, Expires, Status
      - Upload new document button
      - Edit/Delete buttons
      - Expiration warning (red if < 30 days)

   e) Activity Log Tab:
      - Created By: [User], At: [Timestamp]
      - Updated By: [User], At: [Timestamp]
      - Updated By: [User], At: [Timestamp]
      - (Show last 10 updates)
      - Version/rowVersion (for optimistic locking)

   f) Quick Actions Tab:
      - Send Notification (link to notification system)
      - Send SMS
      - View Appointments (link to appointment-service)
      - View Messages History (link to messaging)

3. Footer (always visible):
   - "Save" button
   - "Cancel" button
   - "Delete" button
   - "Duplicate" button (create copy for new beneficiary)
   - Success/Error message area

API Calls:
- GET /api/admin/beneficiaries/{id} (get beneficiary details)
- PUT /api/admin/beneficiaries/{id} (update beneficiary)
- DELETE /api/admin/beneficiaries/{id} (soft delete)
- GET /api/family-members/beneficiary/{id} (get family members)
- POST /api/family-members (create family member)
- PUT /api/family-members/{id} (update family member)
- DELETE /api/family-members/{id} (delete family member)
- GET /api/beneficiary-documents/beneficiary/{id} (get documents)
- POST /api/beneficiary-documents (upload document metadata)
- PUT /api/beneficiary-documents/{id} (update document)
- DELETE /api/beneficiary-documents/{id} (delete document)
- GET /reference-data/code-tables/GENDERS/values
- GET /reference-data/code-tables/LANGUAGES/values
- GET /reference-data/code-tables/REGISTRATION_STATUS/values

Form Validation:
- Full Name: @NotBlank, max 200 chars
- Mobile: E.164 format, @NotBlank
- Email: @Email format (optional)
- Date of Birth: @Past (can't be future)
- National ID: unique within system
- Address: max 1000 chars

Error Handling:
- 404: Beneficiary not found
- 409: Optimistic locking conflict (rowVersion mismatch)
- 400: Validation error
- Show user-friendly error messages
- Auto-retry on temporary failures

Optimistic Locking:
- Include rowVersion in update request
- If 409 conflict, reload from server
- Warn user about conflicting changes

After creation:
- Add route: /cms/beneficiaries/:id
- Add nested routes for tabs
- Create shared hooks for form management
- Create validation utilities
- Test all tabs and interactions
```

---

### 2.3 NEW: Create Beneficiary Modal/Form

**File:** `web-portal/src/modules/cms/pages/beneficiary/CreateBeneficiaryModal.jsx`

**Prompt for Cursor AI:**
```
Create modal for creating new beneficiary:

Layout:
1. Modal Header:
   - Title: "Create New Beneficiary"
   - Close button

2. Form Fields (required fields marked with *):
   Required Fields:
   - Full Name* (text input, @NotBlank)
   - Mother Name (text input)
   - Mobile Number* (text input, E.164 format, @NotBlank)
   - National ID (text input, must be unique)
   - Date of Birth* (date picker, @Past)
   - Gender* (dropdown: M, F)
   - Preferred Language* (dropdown: AR, EN, FR, KU)
   - Registration Status* (dropdown: QUICK, COMPLETE)

   Optional Fields:
   - Email (email input)
   - Address (textarea)
   - Latitude/Longitude (map picker)
   - Profile Photo URL (file upload)

3. Two-Step Creation:
   Step 1: Quick Registration (QUICK status)
   - Only required fields: name, mobile, DOB, gender, language
   - Takes 30 seconds
   - Creates basic profile

   Step 2: Complete Registration (COMPLETE status)
   - All fields
   - Add family members
   - Upload documents
   - Takes several minutes

4. Modal Footer:
   - "Create" button (disabled until required fields filled)
   - "Create & Continue to Details" button
   - "Cancel" button

API Call:
- POST /api/admin/beneficiaries
  {
    "nationalId": "123456789",
    "fullName": "محمد علي",
    "motherName": "فاطمة حسن",
    "mobileNumber": "+963912345678",
    "email": "user@example.com",
    "address": "Damascus, Syria",
    "dateOfBirth": "1990-01-15",
    "genderCodeValueId": "550e8400...",
    "profilePhotoUrl": "https://s3.example.com/photo.jpg",
    "registrationStatusCodeValueId": "550e8400...",
    "preferredLanguageCodeValueId": "550e8400..."
  }

Response:
- 201 Created with full BeneficiaryDTO
- Include beneficiaryId for redirect

Validation:
- Mobile number format: E.164 (e.g., +963912345678)
- National ID: unique constraint check
- All required fields present
- Show validation errors inline under each field

Loading State:
- Disable form during submission
- Show loading spinner on submit button
- Show success toast notification
- Show error toast with details if fails

After creation:
- Create corresponding DTO class if not exists
- Add translations
- Test form validation
- Test all scenarios (quick vs complete)
```

---

### 2.4 NEW: Family Members Sub-Page

**File:** `web-portal/src/modules/cms/pages/beneficiary/FamilyMembersTab.jsx`

**Prompt for Cursor AI:**
```
Create Family Members management tab (shows inside beneficiary details):

Features:
1. Family Members List (Table):
   - Columns: Name, Relation, Mobile, Email, Gender, Emergency Contact, Can Book, Actions
   - Sortable by name and relation
   - Pagination (10 per page)
   - Row actions: Edit, Delete, Make Emergency Contact, Remove

2. Add Family Member Button:
   - Opens modal for creating new family member

3. Quick Filters:
   - Show All / Show Emergency Contacts Only / Show Can Book Only
   - Checkboxes for filtering

4. Family Member Detail Modal (Create/Edit):
   Required Fields:
   - Full Name* (@NotBlank)
   - Date of Birth* (@Past)
   - Relation Type* (dropdown: SPOUSE, CHILD, PARENT, SIBLING, OTHER)
   - If OTHER: Relation Description (text)
   - Gender* (dropdown: M, F)
   - National ID (optional but recommended)
   - Mother Name (optional)

   Optional Fields:
   - Mobile Number (E.164 format)
   - Email address
   - Is Emergency Contact (checkbox)
   - Can Book Appointments (checkbox)

5. Statistics:
   - Total family members: [count]
   - Emergency contacts: [count]
   - Can book appointments: [count]

API Calls:
- GET /api/family-members/beneficiary/{beneficiaryId}
- POST /api/family-members
  {
    "beneficiaryId": "550e8400...",
    "fullName": "فاطمة علي",
    "motherName": "خديجة حسن",
    "nationalId": "987654321",
    "dateOfBirth": "2015-05-20",
    "relationType": "CHILD",
    "relationDescription": null,
    "mobileNumber": "+963912345679",
    "email": "child@example.com",
    "genderCodeValueId": "550e8400...",
    "isEmergencyContact": true,
    "canBookAppointments": true
  }
- PUT /api/family-members/{familyMemberId}
- DELETE /api/family-members/{familyMemberId}

State Management:
- Local state for list
- TanStack Query for API calls
- Optimistic updates

After creation:
- Add to BeneficiaryDetails tabs
- Create FamilyMemberForm modal component
- Add translations for relation types
- Test CRUD operations
```

---

### 2.5 NEW: Documents Management Sub-Page

**File:** `web-portal/src/modules/cms/pages/beneficiary/DocumentsTab.jsx`

**Prompt for Cursor AI:**
```
Create Documents management tab (shows inside beneficiary details):

Features:
1. Documents List (Table):
   - Columns: Type, Country, Issued, Expires, Status, Size, Actions
   - Color-coded expiration status:
     * Red: < 30 days to expiration (urgent)
     * Yellow: 30-60 days (warning)
     * Green: > 60 days (okay)
   - Sortable by type, expiration date
   - Pagination (10 per page)
   - Row actions: Download, Edit, Delete

2. Upload Document Button:
   - Opens modal for uploading new document

3. Document Detail Modal (Create/Edit):
   Required Fields:
   - Document Type* (dropdown: PASSPORT, ID_CARD, BIRTH_CERT, DRIVER_LICENSE, TRAVEL_PERMIT, OTHER)
   - If OTHER: Description (text)
   - Issue Country* (country dropdown)
   - Issue Date* (date picker)
   - Expiration Date (date picker, optional)
   - Document Number (text)

   File Upload:
   - Accept: PDF, PNG, JPG, JPEG
   - Max size: 5MB
   - Upload to S3 bucket
   - Store reference (storageKey) in database

4. Statistics:
   - Total documents: [count]
   - Expiring soon: [count] (< 30 days)
   - Expired: [count]
   - By type pie chart

API Calls:
- GET /api/beneficiary-documents/beneficiary/{beneficiaryId}
- POST /api/beneficiary-documents
  (includes file upload to S3)
  {
    "beneficiaryId": "550e8400...",
    "documentType": "PASSPORT",
    "issueCountry": "SY",
    "issueDate": "2020-01-15",
    "expirationDate": "2030-01-14",
    "documentNumber": "N12345678",
    "storageKey": "s3://bucket/documents/passport_550e8400.pdf",
    "fileContentType": "application/pdf",
    "fileSizeBytes": 245632
  }
- PUT /api/beneficiary-documents/{documentId}
- DELETE /api/beneficiary-documents/{documentId}
- GET /reference-data/code-tables/DOCUMENT_TYPES/values
- GET /reference-data/code-tables/COUNTRIES/values

File Upload Handling:
- Use Axios for file upload
- Show progress bar
- Show preview for images
- Validate file size and type client-side
- Handle upload errors gracefully

Expiration Warnings:
- Highlight expiring documents in red
- Show warning badge
- Email alert option (integrate with notification system)

After creation:
- Add to BeneficiaryDetails tabs
- Create DocumentForm modal component
- Create file upload service
- Add translations
- Test file upload
- Test expiration date calculations
```

---

### 2.6 NEW: Bulk Update Page

**File:** `web-portal/src/modules/cms/pages/beneficiary/BulkUpdatePage.jsx`

**Prompt for Cursor AI:**
```
Create page for bulk updating beneficiaries:

Layout:
1. Header:
   - Title: "Bulk Update Beneficiaries"
   - Breadcrumb navigation

2. Two-Step Process:

   STEP 1: Select Beneficiaries
   - Show previous list of beneficiaries with row selection
   - "Select All" checkbox
   - Counter: "X beneficiaries selected"
   - Next button (enabled only if > 0 selected)

   STEP 2: Select Fields to Update
   - Checkboxes for which fields to update:
     [ ] Preferred Language
     [ ] Gender
     [ ] Registration Status
     [ ] Profile Photo URL
     [ ] Active Status

   For each checked field, show input:
   - Preferred Language: dropdown (AR, EN, FR, KU)
   - Gender: dropdown (M, F)
   - Registration Status: dropdown (QUICK, COMPLETE)
   - Profile Photo URL: text input
   - Active Status: toggle (on/off)

   Update Description:
   - Textarea for describing why bulk update (for audit trail)
   - Example: "Update language preference to Arabic for new cohort"

   Admin Approval:
   - Checkbox: "I approve this bulk update"
   - Required before submission

3. Review Summary (Step 3):
   - Show: X beneficiaries will be updated with:
     * Preferred Language → Arabic
     * Registration Status → COMPLETE
   - Confirm button
   - Back button

4. Confirmation & Results:
   - Show progress: "Updating beneficiary 1 of 25..."
   - Success message with count: "Successfully updated 25 beneficiaries"
   - Error handling: Show which ones failed and why
   - Export results button (CSV with updated records)

API Call:
- PUT /api/admin/beneficiaries/bulk
  {
    "beneficiaryIds": ["550e8400...", "550e8400...", ...],
    "updateFields": {
      "preferredLanguageCodeValueId": "550e8400...",
      "registrationStatusCodeValueId": "550e8400..."
    },
    "description": "Update language preference to Arabic for new cohort",
    "isApprovedByAdmin": true
  }

Validation:
- At least 1 beneficiary selected
- At least 1 field selected for update
- Max 1000 beneficiaries per bulk update (safety limit)
- Admin approval required

Loading State:
- Disable buttons during processing
- Show progress bar
- Prevent navigation away during update

After creation:
- Add route: /cms/beneficiaries/bulk-update
- Create step component/state management
- Create progress indicator
- Add translations
- Test all scenarios
```

---

### 2.7 NEW: Beneficiary Statistics Dashboard

**File:** `web-portal/src/modules/cms/pages/beneficiary/BeneficiaryStatistics.jsx`

**Prompt for Cursor AI:**
```
Create Statistics dashboard for beneficiary analytics:

Layout:
1. KPI Cards (Top Row):
   - Card 1: Total Beneficiaries
     * Large number (e.g., 850)
     * Trend arrow (↑↓) if data available
     * Percentage change vs last month

   - Card 2: Active Beneficiaries
     * Count and percentage
     * Status: "X% of total"

   - Card 3: Registered (COMPLETE Status)
     * Count and percentage
     * Compared to QUICK registrations

   - Card 4: New This Month
     * Count of beneficiaries created this month
     * Trend vs previous month

2. Charts:
   a) Language Distribution (Pie Chart):
      - AR: 450 (53%)
      - EN: 320 (38%)
      - FR: 50 (6%)
      - KU: 30 (3%)
      - Interactive: click to drill down

   b) Gender Distribution (Donut Chart):
      - M: 425 (50%)
      - F: 425 (50%)
      - Color coded (blue/pink)

   c) Registration Status (Horizontal Bar Chart):
      - QUICK: 500 (59%)
      - COMPLETE: 350 (41%)
      - Shows progression over time

   d) New Registrations Trend (Line Chart):
      - X-axis: Last 12 months
      - Y-axis: Count of new beneficiaries
      - Show trend line

   e) Beneficiaries by Decade of Birth (Bar Chart):
      - Age distribution
      - Help identify demographic

3. Recent Activity Section:
   - Latest 10 beneficiaries created
   - Mini table: Name, Mobile, Language, Status, Created At
   - Link to full details

4. Filters (Sidebar):
   - Date range picker (default: last 30 days, last 3 months, last year, all time)
   - Language filter (multiselect)
   - Gender filter (multiselect)
   - Registration status filter
   - "Apply Filters" button

5. Export Options:
   - Download as PDF report
   - Download as Excel spreadsheet
   - Schedule automated report (email weekly/monthly)

API Call:
- GET /api/admin/beneficiaries/statistics
  Response:
  {
    "totalBeneficiaries": 850,
    "activeBeneficiaries": 800,
    "beneficiariesByLanguage": { "AR": 450, "EN": 320, "FR": 50, "KU": 30 },
    "beneficiariesByGender": { "M": 425, "F": 425 },
    "beneficiariesByRegistrationStatus": { "QUICK": 500, "COMPLETE": 350 },
    "recentBeneficiaries": [...10 recent...],
    "lastUpdatedAt": "2025-11-01T10:30:00Z"
  }

Optional Advanced Analytics:
- Age distribution chart (requires DOB comparison)
- Geographic distribution map (if latitude/longitude available)
- Registration completion rate (QUICK to COMPLETE conversion)
- Retention metrics (active vs inactive)

Performance:
- Cache statistics for 5 minutes
- Load charts asynchronously
- Show skeleton loaders while loading

After creation:
- Add route: /cms/beneficiaries/statistics
- Create chart components using Recharts or Chart.js
- Create filter controls
- Add PDF export library (jsPDF + html2pdf)
- Add Excel export library (xlsx)
- Test with various date ranges
- Optimize for mobile viewing
```

---

## PART 3: NOTIFICATION & SMS SYSTEM ARCHITECTURE

### 3.1 NEW SERVICE: Create notification-service

**File Structure:**
```
notification-service/
├── src/main/java/com/care/notification/
│   ├── domain/
│   │   └── model/
│   │       ├── Notification.java
│   │       ├── NotificationTemplate.java
│   │       ├── NotificationRecipient.java
│   │       └── NotificationAttachment.java
│   │
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── entities/
│   │   │   │   ├── NotificationEntity.java
│   │   │   │   ├── NotificationTemplateEntity.java
│   │   │   │   ├── NotificationRecipientEntity.java
│   │   │   │   └── NotificationAttachmentEntity.java
│   │   │   ├── repositories/
│   │   │   │   ├── NotificationRepository.java
│   │   │   │   ├── NotificationTemplateRepository.java
│   │   │   │   ├── NotificationRecipientRepository.java
│   │   │   │   └── NotificationAttachmentRepository.java
│   │   │   └── adapters/
│   │   │       ├── NotificationDbAdapter.java
│   │   │       └── NotificationTemplateDbAdapter.java
│   │   │
│   │   ├── messaging/
│   │   │   ├── producer/
│   │   │   │   └── NotificationProducer.java (RabbitMQ)
│   │   │   └── consumer/
│   │   │       └── NotificationConsumer.java (RabbitMQ listener)
│   │   │
│   │   └── external/
│   │       ├── SmsProvider.java (interface)
│   │       ├── TwilioSmsProvider.java
│   │       ├── EmailProvider.java (interface)
│   │       ├── SendGridEmailProvider.java
│   │       ├── PushNotificationProvider.java (interface)
│   │       └── FirebasePushProvider.java
│   │
│   ├── application/
│   │   ├── ports/
│   │   │   ├── out/
│   │   │   │   ├── NotificationCrudPort.java
│   │   │   │   ├── SmsPort.java
│   │   │   │   ├── EmailPort.java
│   │   │   │   └── PushPort.java
│   │   │   └── in/
│   │   │       ├── SendNotificationUseCase.java
│   │   │       └── SendBulkNotificationUseCase.java
│   │   │
│   │   ├── service/
│   │   │   ├── NotificationService.java
│   │   │   ├── SmsService.java
│   │   │   ├── EmailService.java
│   │   │   └── PushNotificationService.java
│   │   │
│   │   ├── command/
│   │   │   ├── SendNotificationCommand.java
│   │   │   └── SendBulkNotificationCommand.java
│   │   │
│   │   └── mapper/
│   │       ├── NotificationDomainMapper.java
│   │       └── NotificationJpaMapper.java
│   │
│   ├── web/
│   │   ├── controller/
│   │   │   ├── NotificationController.java
│   │   │   └── NotificationTemplateController.java
│   │   │
│   │   ├── dto/
│   │   │   ├── SendNotificationRequest.java
│   │   │   ├── SendBulkNotificationRequest.java
│   │   │   ├── NotificationResponse.java
│   │   │   ├── NotificationTemplateDTO.java
│   │   │   └── NotificationStatusResponse.java
│   │   │
│   │   └── mapper/
│   │       ├── NotificationWebMapper.java
│   │       └── NotificationTemplateWebMapper.java
│   │
│   ├── config/
│   │   ├── RabbitMqConfig.java
│   │   ├── SecurityConfig.java
│   │   └── OpenApiConfig.java
│   │
│   └── NotificationServiceApplication.java
│
├── src/main/resources/
│   ├── application.yml
│   ├── application-prod.yml
│   ├── liquibase/
│   │   ├── db.changelog-master.xml
│   │   └── changesets/
│   │       ├── 001-create-notification-tables.xml
│   │       └── 002-create-indexes.xml
│   │
│   └── i18n/
│       ├── messages_en.properties
│       └── messages_ar.properties
│
├── src/test/java/...
└── pom.xml
```

---

### 3.2 Prompt: Create Notification Domain Model

**Prompt for Cursor AI:**
```
Create complete Notification domain model system:

File 1: domain/model/Notification.java
Fields:
1. notificationId (UUID) - Primary key
2. appointmentServiceNotificationId (UUID) - Reference back to appointment-service if triggered by appointment
3. notificationType (String) - APPOINTMENT_REMINDER, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, CUSTOM_MESSAGE, SYSTEM_ALERT, URGENT_MESSAGE
4. senderUserId (UUID) - Who initiated this notification
5. senderUserName (String) - Name of sender (cached)
6. messageSubject (String) - Subject (used for email)
7. messageBodyAr (String) - Arabic message body
8. messageBodyEn (String) - English message body
9. recipients (List<NotificationRecipient>) - Collection of recipients
10. deliveryChannels (List<String>) - [SMS, EMAIL, PUSH] - where to send
11. scheduledAt (Instant) - Send at specific time (null = send immediately)
12. sentAt (Instant) - When actually sent
13. bulkNotificationBatchId (UUID) - If part of bulk send, batch ID
14. bulkCount (Integer) - Total recipients in batch
15. successCount (Integer) - How many succeeded
16. failureCount (Integer) - How many failed
17. priorityLevel (String) - LOW, NORMAL, HIGH, URGENT
18. retryCount (Integer) - How many retry attempts
19. maxRetries (Integer) - Max retry attempts allowed
20. expiresAt (Instant) - Don't send after this time
21. status (String) - DRAFT, SCHEDULED, SENDING, SENT, PARTIAL_FAILURE, FAILED, EXPIRED
22. createdById, createdAt, updatedById, updatedAt, rowVersion (audit)

File 2: domain/model/NotificationRecipient.java
Fields:
1. recipientId (UUID)
2. notificationId (UUID) - FK to Notification
3. beneficiaryId (UUID) - The recipient beneficiary
4. beneficiaryFullName (String) - Cached name
5. beneficiaryMobileNumber (String) - For SMS
6. beneficiaryEmail (String) - For email
7. beneficiaryPreferredLanguage (String) - AR/EN/FR/KU
8. deliveryStatus (String) - PENDING, DELIVERED, FAILED, BOUNCED, UNSUBSCRIBED
9. deliveryAttempts (Integer) - How many times attempted
10. lastDeliveryAttemptAt (Instant)
11. deliveredAt (Instant)
12. readStatus (String) - UNREAD, READ (for app push)
13. readAt (Instant) - When beneficiary read (for push/email)
14. deliveryError (String) - Error message if failed
15. externalMessageId (String) - ID from SMS/Email provider (for tracking)
16. createdAt, updatedAt (timestamps)

File 3: domain/model/NotificationTemplate.java
Fields:
1. templateId (UUID)
2. templateCode (String) - APPOINTMENT_REMINDER, APPOINTMENT_CANCELLED, etc. (unique)
3. templateName (String) - Human readable name
4. description (String) - What this template is for
5. subjectAr (String) - Email subject in Arabic
6. subjectEn (String) - Email subject in English
7. bodyAr (String) - Message body with {placeholders}
8. bodyEn (String) - Message body with {placeholders}
9. placeholders (List<String>) - [BENEFICIARY_NAME, APPOINTMENT_DATE, DOCTOR_NAME, etc]
10. supportedChannels (List<String>) - [SMS, EMAIL, PUSH]
11. priorityLevel (String) - Default priority (LOW, NORMAL, HIGH, URGENT)
12. maxRetries (Integer) - Default retry count
13. retryIntervalSeconds (Integer) - Seconds between retries
14. isActive (Boolean)
15. isDeleted (Boolean)
16. createdBy, createdAt, updatedBy, updatedAt, rowVersion

File 4: domain/model/NotificationAttachment.java
Fields:
1. attachmentId (UUID)
2. notificationId (UUID) - FK
3. fileName (String)
4. fileContentType (String) - MIME type
5. fileSizeBytes (Long)
6. storageKey (String) - S3 path
7. isActive, createdAt

Methods needed:
- Domain models should have Builder pattern (@Builder)
- Immutability via @Data + @Getter @Setter
- Validation via field annotations
- toString() for logging (no sensitive data)

After creation:
- Run: mvn clean compile
- Verify imports
```

---

### 3.3 Prompt: Create Notification Database Entities

**Prompt for Cursor AI:**
```
Create JPA entities for notifications:

File 1: infrastructure/db/entities/NotificationEntity.java
- @Entity @Table(name = "notifications")
- All fields from Notification domain model mapped to columns
- Relationships:
  * @OneToMany(cascade = CascadeType.ALL) List<NotificationRecipientEntity> recipients
  * ForeignKey to users table (created_by_user_id, updated_by_user_id)
- Indexes:
  * (sender_user_id, created_at DESC)
  * (bulk_notification_batch_id)
  * (status)
  * (scheduled_at)
  * (created_at DESC)
- Use @CreationTimestamp, @UpdateTimestamp
- Use @UuidGenerator for ID
- Optimistic locking with @Version rowVersion

File 2: infrastructure/db/entities/NotificationRecipientEntity.java
- @Entity @Table(name = "notification_recipients")
- All fields from NotificationRecipient
- Relationships:
  * @ManyToOne(fetch = FetchType.LAZY) NotificationEntity notification
- Indexes:
  * (notification_id, beneficiary_id)
  * (beneficiary_id)
  * (delivery_status)
  * (read_status)
  * (delivered_at)
- Composite unique constraint: (notification_id, beneficiary_id)

File 3: infrastructure/db/entities/NotificationTemplateEntity.java
- @Entity @Table(name = "notification_templates")
- All fields from NotificationTemplate
- Unique constraint: template_code
- Indexes:
  * (template_code)
  * (is_active)

File 4: infrastructure/db/entities/NotificationAttachmentEntity.java
- @Entity @Table(name = "notification_attachments")
- All fields
- Relationships:
  * @ManyToOne(fetch = FetchType.LAZY) NotificationEntity notification
- Indexes:
  * (notification_id)

After creation:
- Create Liquibase changelog:
  001-create-notification-tables.xml
  - CREATE TABLE notifications (...)
  - CREATE TABLE notification_recipients (...)
  - CREATE TABLE notification_templates (...)
  - CREATE TABLE notification_attachments (...)
  - CREATE ALL INDEXES
  - CREATE FOREIGN KEYS
  - INSERT default templates

- Run: mvn clean compile
- Run: mvn liquibase:update (if using Liquibase)
```

---

### 3.4 Prompt: Create Notification Repositories

**Prompt for Cursor AI:**
```
Create Spring Data JPA repositories:

File: infrastructure/db/repositories/NotificationRepository.java

Methods to implement:
1. findByNotificationId(UUID id) → Optional<Notification>
2. findByBulkNotificationBatchId(UUID batchId) → List<Notification>
3. findByStatusAndScheduledAtBefore(String status, Instant time)
   → List<Notification> (for scheduled send at startup)
4. findByBeneficiaryIdAndStatus(UUID beneficiaryId, String status)
   → List<Notification> (history for beneficiary)
5. findByStatusOrderByCreatedAtDesc(String status, Pageable)
   → Page<Notification> (for listing)
6. countByBulkNotificationBatchId(UUID batchId) → long
7. findByBulkNotificationBatchIdAndDeliveryStatus(UUID batchId, String status)
   → List<Notification> (for batch status checking)
8. findByExpiresAtBeforeAndStatusNot(Instant expiry, String status)
   → List<Notification> (for cleanup)

Annotations:
- @Repository
- @Transactional(readOnly = true) for reads
- @Query for complex queries if needed

---

File: infrastructure/db/repositories/NotificationRecipientRepository.java

Methods:
1. findByNotificationId(UUID notificationId) → List<NotificationRecipient>
2. findByBeneficiaryIdAndStatusOrderByDeliveredAtDesc(UUID id, String status, Pageable)
   → Page<NotificationRecipient> (history for beneficiary)
3. findByDeliveryStatusAndLastDeliveryAttemptAtBefore(String status, Instant time)
   → List<NotificationRecipient> (for retry)
4. countByNotificationIdAndDeliveryStatus(UUID notificationId, String status) → long
5. findByNotificationIdAndDeliveryStatus(UUID notificationId, String status)
   → List<NotificationRecipient>
6. findByReadStatusNullAndNotificationIdOrderByCreatedAtAsc(UUID notificationId)
   → List<NotificationRecipient> (unread)

---

File: infrastructure/db/repositories/NotificationTemplateRepository.java

Methods:
1. findByTemplateCode(String code) → Optional<NotificationTemplate>
2. findByIsActiveTrueOrderByTemplateNameAsc() → List<NotificationTemplate>
3. findAll(Pageable) → Page<NotificationTemplate>
4. existsByTemplateCode(String code) → boolean

---

File: infrastructure/db/repositories/NotificationAttachmentRepository.java

Methods:
1. findByNotificationId(UUID notificationId) → List<NotificationAttachment>
2. deleteByNotificationId(UUID notificationId) → void

After creation:
- Run: mvn clean compile
- Create corresponding @Query methods if needed
```

---

### 3.5 Prompt: Create Notification Services

**Prompt for Cursor AI:**
```
Create application services for notifications:

File: application/service/NotificationService.java

Methods:
1. sendNotification(SendNotificationCommand) → Notification
   - Validate command
   - Create Notification domain object
   - Create NotificationRecipients (one per beneficiary)
   - If scheduled: save and return (scheduled for later)
   - If immediate: call sendAsync
   - Return created notification

2. sendBulkNotification(SendBulkNotificationCommand) → Notification
   - Load all beneficiaries from appointment-service
   - Filter by language if specified
   - Create Notification with bulk details
   - Create NotificationRecipients for each
   - Publish to RabbitMQ message queue (see 3.6)
   - Return notification with batch ID

3. markAsRead(UUID notificationId, UUID beneficiaryId) → void
   - Find NotificationRecipient by notification + beneficiary
   - Set readStatus = READ
   - Set readAt = Instant.now()
   - Save
   - (Called by mobile app when user reads notification)

4. updateDeliveryStatus(String externalMessageId, String status, String error) → void
   - Find NotificationRecipient by externalMessageId
   - Update deliveryStatus, deliveredAt, deliveryError
   - Update parent Notification successCount/failureCount
   - (Called by SMS/Email provider webhooks)

5. processPendingNotifications() → void
   - Find all SCHEDULED notifications with scheduledAt <= now
   - Change status to SENDING
   - Publish to message queue
   - (Called by scheduled task every minute)

6. retryFailedNotifications() → void
   - Find NotificationRecipients with status=FAILED and deliveryAttempts < maxRetries
   - Increment deliveryAttempts
   - Republish to message queue
   - (Called by scheduled task daily)

7. getNotificationHistory(UUID beneficiaryId, Pageable) → Page<NotificationDTO>
   - Get all notifications for beneficiary
   - Return with recipient status

---

File: application/service/SmsService.java

Methods:
1. sendSms(String phoneNumber, String messageBody, String language) → String (messageId)
   - Call TwilioSmsProvider.send()
   - Log attempt
   - Return externalMessageId for tracking

2. handleSmsDeliveryWebhook(SmsDeliveryWebhookPayload) → void
   - Parse webhook from Twilio
   - Call NotificationService.updateDeliveryStatus()

---

File: application/service/EmailService.java

Methods:
1. sendEmail(String emailAddress, String subject, String body, List<Attachment>) → String
   - Call SendGridEmailProvider.send()
   - Log attempt
   - Return externalMessageId

2. handleEmailDeliveryWebhook(EmailWebhookPayload) → void
   - Parse webhook from SendGrid
   - Extract opened/bounced events
   - Call NotificationService.updateDeliveryStatus()

---

File: application/service/PushNotificationService.java

Methods:
1. sendPush(String deviceToken, String title, String body) → String
   - Call FirebasePushProvider.send()
   - Log attempt
   - Return externalMessageId

2. handlePushReadWebhook(String externalMessageId) → void
   - Called when app confirms user opened push
   - Call NotificationService.markAsRead()

After creation:
- Add @Service annotations
- Add @Transactional for writes
- Add @Slf4j for logging
- Add @RequiredArgsConstructor for dependency injection
- Run: mvn clean compile
```

---

### 3.6 Prompt: Create RabbitMQ Configuration

**Prompt for Cursor AI:**
```
Create RabbitMQ message queue configuration for async notification sending:

File: config/RabbitMqConfig.java

Configuration:
1. Message Queue Topology:
   ```java
   // Exchange: notifications.exchange (topic exchange)
   @Bean
   public TopicExchange notificationsExchange() {
       return new TopicExchange("notifications.exchange", true, false);
   }

   // Queue: notifications.sms.queue
   @Bean
   public Queue smsQueue() {
       return QueueBuilder.durable("notifications.sms.queue")
           .withArgument("x-dead-letter-exchange", "notifications.dlx")
           .withArgument("x-dead-letter-routing-key", "notifications.dlx.sms")
           .build();
   }

   // Queue: notifications.email.queue
   @Bean
   public Queue emailQueue() {
       return QueueBuilder.durable("notifications.email.queue")
           .withArgument("x-dead-letter-exchange", "notifications.dlx")
           .withArgument("x-dead-letter-routing-key", "notifications.dlx.email")
           .build();
   }

   // Queue: notifications.push.queue
   @Bean
   public Queue pushQueue() {
       return QueueBuilder.durable("notifications.push.queue")
           .withArgument("x-dead-letter-exchange", "notifications.dlx")
           .withArgument("x-dead-letter-routing-key", "notifications.dlx.push")
           .build();
   }

   // Dead Letter Exchange for failed messages
   @Bean
   public DirectExchange deadLetterExchange() {
       return new DirectExchange("notifications.dlx", true, false);
   }

   // Bindings
   @Bean
   public Binding smsBinding(Queue smsQueue, TopicExchange notificationsExchange) {
       return BindingBuilder.bind(smsQueue)
           .to(notificationsExchange)
           .with("notifications.sms.*");
   }

   @Bean
   public Binding emailBinding(Queue emailQueue, TopicExchange notificationsExchange) {
       return BindingBuilder.bind(emailQueue)
           .to(notificationsExchange)
           .with("notifications.email.*");
   }

   @Bean
   public Binding pushBinding(Queue pushQueue, TopicExchange notificationsExchange) {
       return BindingBuilder.bind(pushQueue)
           .to(notificationsExchange)
           .with("notifications.push.*");
   }
   ```

2. Message Converter:
   ```java
   @Bean
   public MessageConverter jsonMessageConverter() {
       return new Jackson2JsonMessageConverter();
   }
   ```

3. RabbitTemplate Configuration:
   ```java
   @Bean
   public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
       RabbitTemplate template = new RabbitTemplate(connectionFactory);
       template.setMessageConverter(jsonMessageConverter());
       return template;
   }
   ```

File: infrastructure/messaging/producer/NotificationProducer.java

Methods:
```java
@Component
@RequiredArgsConstructor
public class NotificationProducer {
    private final RabbitTemplate rabbitTemplate;

    public void publishSmsNotification(NotificationMessage message) {
        rabbitTemplate.convertAndSend("notifications.exchange",
            "notifications.sms.send", message);
    }

    public void publishEmailNotification(NotificationMessage message) {
        rabbitTemplate.convertAndSend("notifications.exchange",
            "notifications.email.send", message);
    }

    public void publishPushNotification(NotificationMessage message) {
        rabbitTemplate.convertAndSend("notifications.exchange",
            "notifications.push.send", message);
    }

    public void publishBulkNotification(BulkNotificationMessage message) {
        // For bulk notifications, publish multiple messages
        message.getRecipients().forEach(recipient -> {
            NotificationMessage singleMessage = NotificationMessage.builder()
                .notificationId(message.getNotificationId())
                .beneficiaryId(recipient.getBeneficiaryId())
                .phoneNumber(recipient.getPhoneNumber())
                .email(recipient.getEmail())
                .messageBody(recipient.getPreferredLanguage().equals("AR") ?
                    message.getMessageBodyAr() : message.getMessageBodyEn())
                .channels(message.getDeliveryChannels())
                .build();

            message.getDeliveryChannels().forEach(channel -> {
                if ("SMS".equals(channel)) {
                    publishSmsNotification(singleMessage);
                } else if ("EMAIL".equals(channel)) {
                    publishEmailNotification(singleMessage);
                } else if ("PUSH".equals(channel)) {
                    publishPushNotification(singleMessage);
                }
            });
        });
    }
}
```

File: infrastructure/messaging/consumer/NotificationConsumer.java

Methods:
```java
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {
    private final SmsService smsService;
    private final EmailService emailService;
    private final PushNotificationService pushService;

    @RabbitListener(queues = "notifications.sms.queue")
    public void consumeSmsNotification(NotificationMessage message) {
        try {
            String messageId = smsService.sendSms(
                message.getPhoneNumber(),
                message.getMessageBody(),
                message.getLanguage()
            );
            log.info("SMS sent: notification={}, messageId={}",
                message.getNotificationId(), messageId);
        } catch (Exception e) {
            log.error("SMS send failed: notification={}, error={}",
                message.getNotificationId(), e.getMessage());
            throw e; // Requeue for retry
        }
    }

    @RabbitListener(queues = "notifications.email.queue")
    public void consumeEmailNotification(NotificationMessage message) {
        try {
            String messageId = emailService.sendEmail(
                message.getEmail(),
                message.getSubject(),
                message.getMessageBody(),
                message.getAttachments()
            );
            log.info("Email sent: notification={}, messageId={}",
                message.getNotificationId(), messageId);
        } catch (Exception e) {
            log.error("Email send failed: notification={}, error={}",
                message.getNotificationId(), e.getMessage());
            throw e;
        }
    }

    @RabbitListener(queues = "notifications.push.queue")
    public void consumePushNotification(NotificationMessage message) {
        try {
            String messageId = pushService.sendPush(
                message.getDeviceToken(),
                message.getTitle(),
                message.getMessageBody()
            );
            log.info("Push sent: notification={}, messageId={}",
                message.getNotificationId(), messageId);
        } catch (Exception e) {
            log.error("Push send failed: notification={}, error={}",
                message.getNotificationId(), e.getMessage());
            throw e;
        }
    }
}
```

After creation:
- Add RabbitMQ dependencies to pom.xml:
  * org.springframework.boot:spring-boot-starter-amqp
- Configure application.yml:
  ```yaml
  spring:
    rabbitmq:
      host: localhost
      port: 5672
      username: guest
      password: guest
  ```
- Run: mvn clean compile
```

---

### 3.7 Prompt: Create External SMS/Email Providers

**Prompt for Cursor AI:**
```
Create interfaces and implementations for external providers:

File: infrastructure/external/SmsProvider.java (Interface)
```java
public interface SmsProvider {
    String sendSms(String phoneNumber, String messageBody) throws SmsException;
    void handleDeliveryWebhook(Map<String, String> webhookData);
}
```

File: infrastructure/external/TwilioSmsProvider.java (Implementation)
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TwilioSmsProvider implements SmsProvider {
    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.from-number}")
    private String fromNumber;

    private final RestTemplate restTemplate;

    @Override
    public String sendSms(String phoneNumber, String messageBody) {
        // Use Twilio SDK:
        Twilio.init(accountSid, authToken);
        Message message = Message.creator(
            new PhoneNumber(phoneNumber),  // To number
            new PhoneNumber(fromNumber),   // From number
            messageBody)
            .setStatusCallback(new URI("https://yourapp.com/webhooks/sms"))
            .create();

        log.info("SMS sent via Twilio: sid={}", message.getSid());
        return message.getSid();
    }

    @Override
    public void handleDeliveryWebhook(Map<String, String> data) {
        // Webhook from Twilio with delivery status
        String messageSid = data.get("MessageSid");
        String status = data.get("MessageStatus");
        // Update notification status in database
    }
}
```

File: infrastructure/external/EmailProvider.java (Interface)
```java
public interface EmailProvider {
    String sendEmail(String emailAddress, String subject, String body,
                     List<Attachment> attachments) throws EmailException;
    void handleDeliveryWebhook(Map<String, String> webhookData);
}
```

File: infrastructure/external/SendGridEmailProvider.java (Implementation)
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SendGridEmailProvider implements EmailProvider {
    @Value("${sendgrid.api-key}")
    private String apiKey;

    @Value("${sendgrid.from-email}")
    private String fromEmail;

    @Override
    public String sendEmail(String emailAddress, String subject, String body,
                            List<Attachment> attachments) {
        com.sendgrid.helpers.mail.Email from =
            new com.sendgrid.helpers.mail.Email(fromEmail);
        com.sendgrid.helpers.mail.Email to =
            new com.sendgrid.helpers.mail.Email(emailAddress);
        Content content = new Content("text/html", body);
        Mail mail = new Mail(from, subject, to, content);

        if (attachments != null && !attachments.isEmpty()) {
            attachments.forEach(att -> {
                Attachments sgAttachment = new Attachments();
                sgAttachment.setFilename(att.getFileName());
                sgAttachment.setContent(att.getContent());
                sgAttachment.setType(att.getContentType());
                sgAttachment.setDisposition("attachment");
                mail.addAttachments(sgAttachment);
            });
        }

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            log.info("Email sent via SendGrid: status={}", response.getStatusCode());
            return response.getHeaders().get("X-Message-Id");
        } catch (IOException e) {
            throw new EmailException("Failed to send email", e);
        }
    }

    @Override
    public void handleDeliveryWebhook(Map<String, String> data) {
        // Handle delivery webhook
    }
}
```

File: infrastructure/external/PushNotificationProvider.java (Interface)
```java
public interface PushNotificationProvider {
    String sendPush(String deviceToken, String title, String body)
        throws PushException;
}
```

File: infrastructure/external/FirebasePushProvider.java (Implementation)
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class FirebasePushProvider implements PushNotificationProvider {
    @Value("${firebase.project-id}")
    private String projectId;

    private final FirebaseMessaging firebaseMessaging;

    @Override
    public String sendPush(String deviceToken, String title, String body) {
        Notification notification = Notification.builder()
            .setTitle(title)
            .setBody(body)
            .build();

        Message message = Message.builder()
            .setToken(deviceToken)
            .setNotification(notification)
            .putData("click_action", "FLUTTER_NOTIFICATION_CLICK")
            .build();

        try {
            String messageId = firebaseMessaging.send(message);
            log.info("Push sent via Firebase: messageId={}", messageId);
            return messageId;
        } catch (FirebaseMessagingException e) {
            throw new PushException("Failed to send push", e);
        }
    }
}
```

Configuration (application.yml):
```yaml
twilio:
  account-sid: ${TWILIO_ACCOUNT_SID}
  auth-token: ${TWILIO_AUTH_TOKEN}
  from-number: +15551234567

sendgrid:
  api-key: ${SENDGRID_API_KEY}
  from-email: noreply@example.com

firebase:
  project-id: your-project-id
  credentials-path: classpath:firebase-key.json
```

After creation:
- Add dependencies:
  * com.twilio.sdk:twilio:9.2.0
  * com.sendgrid:sendgrid-java:4.10.0
  * com.google.firebase:firebase-admin:9.2.0
- Create exception classes (SmsException, EmailException, PushException)
- Run: mvn clean compile
```

---

### 3.8 Prompt: Create Notification Controllers & DTOs

**Prompt for Cursor AI:**
```
Create REST endpoints for notification management:

File: web/controller/NotificationController.java

Endpoints:
1. POST /api/notifications/send (Single notification)
   @RequestBody SendNotificationRequest
   @RequestAttribute("userId") UUID userId

   Request Body:
   {
     "beneficiaryId": "550e8400...",
     "notificationType": "CUSTOM_MESSAGE",
     "messageSubject": "Appointment Reminder",
     "messageBodyAr": "تذكير: لديك موعد غداً",
     "messageBodyEn": "Reminder: You have an appointment tomorrow",
     "deliveryChannels": ["SMS", "EMAIL", "PUSH"],
     "priorityLevel": "NORMAL",
     "scheduledAt": null  // If null, send immediately
   }

   Response: 201 Created with NotificationResponse

2. POST /api/notifications/send-bulk (Bulk to multiple beneficiaries)
   @RequestBody SendBulkNotificationRequest
   @RequestAttribute("userId") UUID userId

   Request Body:
   {
     "beneficiaryIds": ["550e8400...", "550e8400...", ...],
     "notificationType": "APPOINTMENT_REMINDER",
     "messageSubject": "Appointment Reminder",
     "messageBodyAr": "لديك موعد غداً في...",
     "messageBodyEn": "You have an appointment tomorrow at...",
     "deliveryChannels": ["SMS", "EMAIL"],
     "filterByLanguage": null,  // Optional: AR, EN, FR, KU
     "priorityLevel": "NORMAL",
     "maxRetries": 3,
     "scheduledAt": null
   }

   Response: 201 Created with bulk notification response including batch ID

3. POST /api/notifications/{id}/mark-read
   @PathVariable("id") UUID notificationId
   @RequestAttribute("userId") UUID beneficiaryId

   Body: { "readAt": "2025-11-01T10:30:00Z" }

   Response: 200 OK

4. GET /api/notifications/{id}
   Response: NotificationResponse with full details and recipient list

5. GET /api/notifications/beneficiary/{beneficiaryId}/history
   @RequestParam(defaultValue = "0") int page
   @RequestParam(defaultValue = "20") int size

   Response: Page<NotificationDTO>

6. GET /api/notifications/batch/{batchId}/status
   Response:
   {
     "batchId": "550e8400...",
     "totalRecipients": 100,
     "sentCount": 95,
     "failureCount": 5,
     "readCount": 45,
     "status": "SENT"
   }

7. GET /api/notifications/statistics
   Response:
   {
     "totalSent": 5000,
     "totalDelivered": 4800,
     "totalFailed": 200,
     "deliveryRate": "96%",
     "averageReadRate": "42%",
     "bySmsCount": 3000,
     "byEmailCount": 1500,
     "byPushCount": 500
   }

File: web/dto/SendNotificationRequest.java
Fields:
- beneficiaryId (UUID) @NotNull
- notificationType (String) @NotBlank
- messageSubject (String) @NotBlank
- messageBodyAr (String) @NotBlank
- messageBodyEn (String) @NotBlank
- deliveryChannels (List<String>) @NotEmpty
- priorityLevel (String) - LOW/NORMAL/HIGH/URGENT
- scheduledAt (Instant) - optional
- maxRetries (Integer)

File: web/dto/SendBulkNotificationRequest.java
Fields:
- beneficiaryIds (List<UUID>) @NotEmpty, max 10000
- notificationType (String) @NotBlank
- messageSubject (String)
- messageBodyAr (String) @NotBlank
- messageBodyEn (String) @NotBlank
- deliveryChannels (List<String>) @NotEmpty
- filterByLanguage (String) - optional AR/EN/FR/KU
- priorityLevel (String)
- scheduledAt (Instant)
- maxRetries (Integer)

File: web/dto/NotificationResponse.java
Fields:
- notificationId (UUID)
- notificationType (String)
- messageSubject (String)
- messageBodyAr (String)
- messageBodyEn (String)
- deliveryChannels (List<String>)
- status (String)
- bulkNotificationBatchId (UUID)
- successCount (Integer)
- failureCount (Integer)
- sentAt (Instant)
- recipients (List<NotificationRecipientResponse>)
- createdAt (Instant)

After creation:
- Add validation annotations
- Create mappers
- Add OpenAPI documentation
- Run: mvn clean compile
```

---

### 3.9 Prompt: Create Appointment Service Integration

**Prompt for Cursor AI:**
```
Create integration between appointment-service and notification-service:

File: appointment-service/src/main/java/com/care/appointment/infrastructure/clients/NotificationServiceClient.java

Purpose: OpenFeign client to call notification-service

Endpoints to call:
```java
@FeignClient(
    name = "notification-service",
    url = "${notification-service.url:http://localhost:6067}",
    fallback = NotificationServiceClientFallback.class,
    path = "/api/notifications"
)
public interface NotificationServiceClient {

    @PostMapping("/send")
    NotificationResponse sendNotification(
        @RequestBody SendNotificationRequest request,
        @RequestHeader("User-Id") UUID userId);

    @PostMapping("/send-bulk")
    NotificationResponse sendBulkNotification(
        @RequestBody SendBulkNotificationRequest request,
        @RequestHeader("User-Id") UUID userId);

    @PostMapping("/{id}/mark-read")
    void markAsRead(@PathVariable UUID id, @RequestParam UUID beneficiaryId);
}
```

File: appointment-service/src/main/java/com/care/appointment/application/appointment/service/AppointmentNotificationService.java

New service that handles appointment-related notifications:

Methods:
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentNotificationService {
    private final NotificationServiceClient notificationClient;
    private final BeneficiaryRepository beneficiaryRepository;

    // Called when appointment is created
    public void sendAppointmentConfirmation(UUID appointmentId, UUID beneficiaryId) {
        Beneficiary beneficiary = beneficiaryRepository.findById(beneficiaryId)
            .orElseThrow(() -> new NotFoundException("Beneficiary not found"));

        String messageBodyAr = "تم تأكيد موعدك بنجاح. رقم الموعد: " + appointmentId;
        String messageBodyEn = "Your appointment has been confirmed. ID: " + appointmentId;

        SendNotificationRequest request = SendNotificationRequest.builder()
            .beneficiaryId(beneficiaryId)
            .notificationType("APPOINTMENT_CONFIRMED")
            .messageBodyAr(messageBodyAr)
            .messageBodyEn(messageBodyEn)
            .deliveryChannels(Arrays.asList("SMS", "PUSH"))
            .priorityLevel("NORMAL")
            .build();

        try {
            notificationClient.sendNotification(request, getCurrentUserId());
            log.info("Appointment confirmation sent: appointmentId={}", appointmentId);
        } catch (Exception e) {
            log.error("Failed to send appointment confirmation: appointmentId={}",
                appointmentId, e);
            // Don't fail appointment creation if notification fails
        }
    }

    // Called 1 day before appointment
    public void sendAppointmentReminder(UUID appointmentId, UUID beneficiaryId) {
        String messageBodyAr = "تذكير: لديك موعد غداً";
        String messageBodyEn = "Reminder: You have an appointment tomorrow";

        SendNotificationRequest request = SendNotificationRequest.builder()
            .beneficiaryId(beneficiaryId)
            .notificationType("APPOINTMENT_REMINDER")
            .messageBodyAr(messageBodyAr)
            .messageBodyEn(messageBodyEn)
            .deliveryChannels(Arrays.asList("SMS", "EMAIL", "PUSH"))
            .priorityLevel("HIGH")
            .build();

        notificationClient.sendNotification(request, getCurrentUserId());
    }

    // Called when appointment is cancelled
    public void sendAppointmentCancellation(UUID appointmentId, UUID beneficiaryId,
                                            String reason) {
        String messageBodyAr = "تم إلغاء موعدك: " + reason;
        String messageBodyEn = "Your appointment has been cancelled: " + reason;

        SendNotificationRequest request = SendNotificationRequest.builder()
            .beneficiaryId(beneficiaryId)
            .notificationType("APPOINTMENT_CANCELLED")
            .messageBodyAr(messageBodyAr)
            .messageBodyEn(messageBodyEn)
            .deliveryChannels(Arrays.asList("SMS", "PUSH"))
            .priorityLevel("HIGH")
            .build();

        notificationClient.sendNotification(request, getCurrentUserId());
    }

    // Bulk send reminders to multiple beneficiaries
    public void sendAppointmentRemindersForAllDueAppointments() {
        // Find all appointments scheduled for tomorrow
        List<UUID> beneficiaryIds = findBeneficiariesWithAppointmentsTomorrow();

        SendBulkNotificationRequest request = SendBulkNotificationRequest.builder()
            .beneficiaryIds(beneficiaryIds)
            .notificationType("APPOINTMENT_REMINDER")
            .messageBodyAr("تذكير: لديك موعد غداً في مركزنا الطبي")
            .messageBodyEn("Reminder: You have an appointment tomorrow at our center")
            .deliveryChannels(Arrays.asList("SMS", "PUSH"))
            .filterByLanguage(null)  // Send in each beneficiary's preferred language
            .priorityLevel("NORMAL")
            .scheduledAt(Instant.now().plus(1, ChronoUnit.HOURS))  // Send in 1 hour
            .build();

        notificationClient.sendBulkNotification(request, SYSTEM_USER_ID);
        log.info("Bulk appointment reminders queued: count={}", beneficiaryIds.size());
    }
}
```

Integration Points:
1. In AppointmentAdminService.createAppointment():
   - After appointment saved, call appointmentNotificationService.sendAppointmentConfirmation()

2. In AppointmentAdminService.updateAppointmentStatus():
   - If status changed to CANCELLED, call sendAppointmentCancellation()

3. Scheduled task (runs daily at 10 AM):
   - Call sendAppointmentRemindersForAllDueAppointments()

Configuration in application.yml:
```yaml
notification-service:
  url: http://localhost:6067

feign:
  client:
    config:
      notification-service:
        connectTimeout: 5000
        readTimeout: 10000
        loggerLevel: FULL
```

After creation:
- Add OpenFeign dependency if not exists
- Create fallback class for circuit breaker
- Add configuration properties
- Test integration
```

---

### 3.10 Prompt: Create Notification Service Main Application

**Prompt for Cursor AI:**
```
Create complete notification-service Spring Boot application:

File: pom.xml
Dependencies needed:
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- spring-boot-starter-validation
- spring-boot-starter-security
- spring-boot-starter-amqp (RabbitMQ)
- spring-cloud-starter-openfeign
- spring-cloud-starter-eureka-client
- spring-cloud-starter-config
- postgresql driver
- liquibase-core
- mapstruct
- lombok
- springdoc-openapi-starter-webmvc-ui
- twilio-java
- sendgrid-java
- firebase-admin
- resilience4j libraries

File: NotificationServiceApplication.java
```java
@SpringBootApplication
@EnableFeignClients
@EnableDiscoveryClient
public class NotificationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
```

File: application.yml
```yaml
spring:
  application:
    name: notification-service

  jpa:
    hibernate:
      ddl-auto: validate  # Liquibase handles migrations
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQL13Dialect

  datasource:
    url: jdbc:postgresql://localhost:5432/notification_db
    username: postgres
    password: password
    driverClassName: org.postgresql.Driver

  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest

  config:
    import: optional:configserver:http://localhost:8888

eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
    instance-id: ${spring.application.name}:${spring.application.instance_id:${random.value}}

server:
  port: 6067
  servlet:
    context-path: /

twilio:
  account-sid: ${TWILIO_ACCOUNT_SID}
  auth-token: ${TWILIO_AUTH_TOKEN}
  from-number: +15551234567

sendgrid:
  api-key: ${SENDGRID_API_KEY}
  from-email: noreply@example.com

firebase:
  project-id: your-project-id

logging:
  level:
    com.care.notification: DEBUG
    org.springframework: INFO
    org.hibernate: INFO

liquibase:
  change-log: classpath:liquibase/db.changelog-master.xml
  enabled: true

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

resilience4j:
  circuitbreaker:
    instances:
      appointmentService:
        slidingWindowSize: 100
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
```

File: bootstrap.yml (for Config Server)
```yaml
spring:
  cloud:
    config:
      uri: http://localhost:8888
  application:
    name: notification-service
  profiles:
    active: default
```

Docker Configuration (Dockerfile):
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/notification-service-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

After creation:
- Complete pom.xml with all dependencies
- Create SecurityConfig for inter-service authentication
- Create OpenApiConfig for Swagger documentation
- Create health check endpoint
- Run: mvn clean compile
- Run: mvn spring-boot:run
- Verify service registers with Eureka
- Check Swagger docs at http://localhost:6067/swagger-ui.html
```

---

## PART 4: WEB PORTAL NOTIFICATION PAGES

### 4.1 NEW: Send Notification Page

**File:** `web-portal/src/modules/cms/pages/notification/SendNotificationPage.jsx`

**Prompt for Cursor AI:**
```
Create page for sending notifications from admin dashboard:

Features:
1. Recipient Selection:
   - Option 1: Select single beneficiary (dropdown with search)
   - Option 2: Select multiple beneficiaries (multi-select with filters)
   - Option 3: Select from list of beneficiaries with checkboxes
   - Search filters: name, mobile, language, etc.

2. Notification Content:
   - Subject (text input) - for email
   - Arabic Message Body (textarea, auto-translate button)
   - English Message Body (textarea, character counter)
   - Preview section showing how it will look in different languages

3. Delivery Channels:
   - Checkboxes for: SMS, Email, Push Notification
   - Auto-select based on beneficiary preferences

4. Advanced Options:
   - Priority Level dropdown: LOW, NORMAL, HIGH, URGENT
   - Schedule for Later: datetime picker (optional)
   - Max Retries: number input (1-5)
   - Notification Type dropdown: APPOINTMENT_REMINDER, CUSTOM_MESSAGE, etc.

5. Template Selection:
   - Dropdown of pre-made templates
   - Load template button
   - Save as template option

6. Preview & Confirmation:
   - Show preview of message in beneficiary's preferred language
   - Show estimated delivery time
   - Show potential issues/warnings
   - Confirmation button with progress

7. Success Feedback:
   - Show notification ID for tracking
   - Link to view delivery status
   - Show delivery progress in real-time

API Calls:
- GET /api/notifications/templates (load templates)
- POST /api/notifications/send (single)
- POST /api/notifications/send-bulk (multiple)
- GET /api/notifications/{id} (check status)
- GET /api/beneficiaries/search (search recipients)

After creation:
- Create NotificationTemplate component
- Create RecipientSelector component
- Create MessagePreview component
- Add translations
- Test all features
```

---

### 4.2 NEW: Notification History/Tracking Page

**File:** `web-portal/src/modules/cms/pages/notification/NotificationHistoryPage.jsx`

**Prompt for Cursor AI:**
```
Create page for viewing notification delivery history and status:

Features:
1. Filters:
   - Date range picker
   - Notification type (APPOINTMENT_REMINDER, CUSTOM_MESSAGE, etc.)
   - Status filter (SENT, DELIVERED, FAILED, PENDING)
   - Beneficiary search
   - Channel filter (SMS, EMAIL, PUSH)

2. List of Notifications (Data Table):
   - Columns: ID, Type, Sent At, Recipients, Status, Delivery Rate, Read Count, Actions
   - Sortable, paginable
   - Color-coded status (green=sent, red=failed, yellow=pending)
   - Row expansion showing recipient details

3. Notification Detail Modal:
   - Full message content (AR + EN)
   - Recipient list with statuses:
     * Name | Mobile | Status | Sent At | Delivered At | Read At
     * Color coding for each status
   - Statistics:
     * Total recipients
     * Delivered count
     * Failed count
     * Read count
     * Read rate %
   - Pie chart showing delivery status distribution
   - Line chart showing read rate over time

4. Batch Details (for bulk notifications):
   - Show all recipients in table
   - Filter by delivery status
   - Retry failed option
   - Download list of undelivered (CSV)

5. Quick Actions:
   - Retry failed deliveries
   - Cancel scheduled notification
   - Resend to unread recipients
   - Export delivery report

API Calls:
- GET /api/notifications (list with filters)
- GET /api/notifications/{id} (detail)
- GET /api/notifications/batch/{batchId}/status
- POST /api/notifications/{id}/retry-failed
- GET /api/notifications/{id}/recipients
- GET /api/notifications/statistics

After creation:
- Create rich data table component
- Create status badge component
- Create charts for delivery analytics
- Add translations
- Test filtering and sorting
```

---

## PART 5: DEPLOYMENT & INTEGRATION

### 5.1 Docker Compose Configuration

**File:** `docker-compose.yml` (UPDATE)

**Prompt for Cursor AI:**
```
Update docker-compose.yml to include notification-service:

Add services:
1. notification-service
   - Image: care/notification-service:latest
   - Port: 6067:6067
   - Environment:
     * DATABASE_URL: postgresql://postgres:password@postgres:5432/notification_db
     * RABBITMQ_HOST: rabbitmq
     * TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
     * SENDGRID_API_KEY: ${SENDGRID_API_KEY}
     * EUREKA_URL: http://service-registry:8761
   - Depends on: postgres, rabbitmq, service-registry, config-server
   - Health check

2. RabbitMQ (if not already present)
   - Image: rabbitmq:3.12-management
   - Port: 5672:5672, 15672:15672
   - Environment:
     * RABBITMQ_DEFAULT_USER: guest
     * RABBITMQ_DEFAULT_PASS: guest
   - Health check

Create .env file with:
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
SENDGRID_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project

Update existing appointment-service config to add:
  - Depends on: rabbitmq
  - Environment variables for notification-service URL
```

---

### 5.2 Database Setup for Notification Service

**File:** `liquibase/changesets/001-create-notification-tables.xml`

**Prompt for Cursor AI:**
```
Create Liquibase migration for notification database:

Migrations:
1. Create notifications table (detailed schema)
2. Create notification_recipients table with foreign keys
3. Create notification_templates table
4. Create notification_attachments table
5. Create all indexes for performance
6. Create sequence for ID generation if needed
7. Insert default notification templates:
   - APPOINTMENT_REMINDER
   - APPOINTMENT_CANCELLED
   - APPOINTMENT_RESCHEDULED
   - APPOINTMENT_CONFIRMED
   - SYSTEM_ALERT
   - CUSTOM_MESSAGE

After creation:
- Schema should be production-ready
- Indexes optimized for common queries
- All constraints properly defined
```

---

## SUMMARY OF EVERYTHING NEEDED

### Files to Create/Modify:

**Appointment Service Fixes (2):**
- ✅ CreateBeneficiaryCommand (add 5 fields)
- ✅ MobileBeneficiaryController (rate limiting - DONE)

**Appointment Service Enhancements:**
- UpdateBeneficiaryCommand (add 5 fields)
- BeneficiaryRepository (add 5 query methods)
- BulkBeneficiaryUpdateRequest DTO
- BeneficiaryStatisticsDTO
- BeneficiarySearchRequest DTO
- BulkUpdateEndpoint in BeneficiaryController
- StatisticsEndpoint in BeneficiaryController
- SearchEndpoint in BeneficiaryController
- NotificationServiceClient (OpenFeign)
- AppointmentNotificationService

**Web Portal Pages (7):**
- BeneficiaryList.jsx (comprehensive with search/filters)
- BeneficiaryDetails.jsx (tabbed view)
- CreateBeneficiaryModal.jsx
- FamilyMembersTab.jsx
- DocumentsTab.jsx
- BulkUpdatePage.jsx
- BeneficiaryStatistics.jsx

**New Notification Service (Complete - 30+ files):**
- Domain models (4)
- Infrastructure: entities, repositories, adapters, external providers, messaging (20+)
- Application: services, commands, ports (6+)
- Web: controllers, DTOs, mappers (8)
- Config: Spring, RabbitMQ, Security, OpenAPI (4)
- Database: Liquibase migrations

**Notification Pages (2):**
- SendNotificationPage.jsx
- NotificationHistoryPage.jsx

**Infrastructure:**
- docker-compose.yml update
- RabbitMQ configuration
- Database migrations
- Deployment scripts

**Total New Files: 60+**
**Total Modified Files: 5**

---

## IMPLEMENTATION TIMELINE

**Week 1:**
- Day 1: Fix CreateBeneficiaryCommand & UpdateBeneficiaryCommand (4 hours)
- Day 2: Add Repository methods & Admin endpoints (6 hours)
- Day 3-4: Create web portal beneficiary pages (12 hours)
- Day 5: Testing & debugging (8 hours)

**Week 2:**
- Day 1-2: Create notification-service domain & infrastructure (12 hours)
- Day 3-4: Create services & RabbitMQ integration (12 hours)
- Day 5: Create controllers & DTOs (6 hours)

**Week 3:**
- Day 1-2: Create notification web pages (10 hours)
- Day 3: Integration testing & deployment (8 hours)
- Day 4-5: Production hardening & documentation (10 hours)

**Total Estimated Time: 90-100 hours (2-3 weeks full-time)**

---

**Document Complete - Ready for Cursor AI Implementation**

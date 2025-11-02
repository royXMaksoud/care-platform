# 🏗️ Architecture Diagrams & Flow Charts

## 1. CLEAN ARCHITECTURE LAYERS (Phase 1 & 2)

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB LAYER (HTTP)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Controllers:                                                 │
│  ├── MobileBeneficiaryController                             │
│  │   └── POST /api/mobile/beneficiaries/auth/verify         │
│  │                                                            │
│  └── BeneficiaryFamilyController                             │
│      ├── POST /api/admin/beneficiaries/{id}/family          │
│      ├── GET /api/admin/beneficiaries/{id}/family           │
│      ├── GET /api/admin/beneficiaries/{id}/family/{id}      │
│      ├── PUT /api/admin/beneficiaries/{id}/family/{id}      │
│      └── DELETE /api/admin/beneficiaries/{id}/family/{id}   │
│                                                               │
│  DTOs:                                                        │
│  ├── BeneficiaryDTO                                          │
│  ├── VerifyCredentialsRequest                                │
│  ├── CreateFamilyMemberRequest                               │
│  ├── UpdateFamilyMemberRequest                               │
│  └── FamilyMemberResponse                                    │
│                                                               │
│  Mappers:                                                     │
│  ├── BeneficiaryWebMapper                                    │
│  └── FamilyMemberWebMapper                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (DTO → Command)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Business Logic)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Services:                                                    │
│  ├── BeneficiaryVerificationService                          │
│  │   ├── verifyByMobileAndDOB()                              │
│  │   └── verifyByMobileAndMotherName()                       │
│  │                                                            │
│  └── FamilyMemberAdminService                                │
│      ├── saveFamilyMember()      [SaveUseCase]              │
│      ├── updateFamilyMember()    [UpdateUseCase]            │
│      ├── getFamilyMemberById()   [LoadUseCase]              │
│      ├── deleteFamilyMember()    [DeleteUseCase]            │
│      └── loadAllFamilyMembers()  [LoadAllUseCase]           │
│                                                               │
│  Commands:                                                    │
│  ├── UpdateBeneficiaryCommand                                │
│  ├── CreateFamilyMemberCommand                               │
│  └── UpdateFamilyMemberCommand                               │
│                                                               │
│  Mappers:                                                     │
│  ├── BeneficiaryWebMapper                                    │
│  └── FamilyMemberDomainMapper                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Domain Model)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  DOMAIN LAYER (Pure Logic)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Models:                                                      │
│  ├── Beneficiary                                             │
│  │   ├── beneficiaryId: UUID                                │
│  │   ├── nationalId: String                                 │
│  │   ├── fullName: String                                   │
│  │   ├── mobileNumber: String                               │
│  │   ├── dateOfBirth: LocalDate (NEW)                       │
│  │   ├── gender: String (NEW)                               │
│  │   ├── registrationStatus: String (NEW)                   │
│  │   └── ... audit fields                                   │
│  │                                                            │
│  └── BeneficiaryFamilyMember                                 │
│      ├── familyMemberId: UUID                                │
│      ├── beneficiaryId: UUID                                 │
│      ├── fullName: String                                    │
│      ├── relationType: String                                │
│      ├── dateOfBirth: LocalDate                              │
│      ├── canBookAppointments: Boolean                        │
│      └── ... audit fields                                    │
│                                                               │
│  Enums:                                                       │
│  ├── RegistrationStatus { QUICK, COMPLETE }                  │
│  ├── Gender { MALE, FEMALE }                                 │
│  └── RelationType { SPOUSE, SON, DAUGHTER, ... }            │
│                                                               │
│  Ports (In):                                                  │
│  ├── SaveUseCase        (Create)                             │
│  ├── UpdateUseCase      (Update)                             │
│  ├── LoadUseCase        (Read)                               │
│  ├── DeleteUseCase      (Delete)                             │
│  └── LoadAllUseCase     (List)                               │
│                                                               │
│  Ports (Out):                                                 │
│  ├── FamilyMemberCrudPort                                    │
│  └── FamilyMemberSearchPort                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Entity)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         INFRASTRUCTURE LAYER (Data Persistence)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Entities (JPA):                                              │
│  ├── BeneficiaryEntity                                       │
│  │   └── (contains new columns: dob, gender, etc.)          │
│  │                                                            │
│  └── BeneficiaryFamilyMemberEntity                           │
│      ├── Columns: family_member_id, beneficiary_id, ...     │
│      └── Indexes: ix_family_beneficiary, ix_family_active  │
│                                                               │
│  Repositories (JPA):                                          │
│  ├── BeneficiaryRepository                                   │
│  │   ├── findByMobileNumberAndDateOfBirth()  (NEW)          │
│  │   ├── findByMobileNumberAndMotherName()   (NEW)          │
│  │   ├── findByRegistrationStatus()          (NEW)          │
│  │   ├── existsByNationalId()                (NEW)          │
│  │   └── existsByMobileNumber()              (NEW)          │
│  │                                                            │
│  └── BeneficiaryFamilyMemberRepository                       │
│      ├── findByBeneficiaryIdAndIsActiveTrueAndIsDeletedFalse│
│      ├── findByNationalId()                                  │
│      ├── existsByBeneficiaryIdAndFullNameAndDateOfBirth()   │
│      └── countByBeneficiaryIdAndIsActiveTrueAndIsDeletedFalse
│                                                               │
│  Adapters:                                                    │
│  ├── BeneficiaryDbAdapter                                    │
│  │   └── (No new adapter - uses existing)                   │
│  │                                                            │
│  └── FamilyMemberDbAdapter                                   │
│      ├── Implements FamilyMemberCrudPort                     │
│      ├── Implements FamilyMemberSearchPort                   │
│      └── Uses Specifications for filtering                   │
│                                                               │
│  Mappers:                                                     │
│  ├── BeneficiaryJpaMapper   (existing)                       │
│  └── FamilyMemberJpaMapper  (NEW)                            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tables:                                                      │
│  ├── beneficiaries (MODIFIED)                                │
│  │   └── New columns: date_of_birth, gender,                │
│  │       profile_photo_url, registration_status,            │
│  │       registration_completed_at, etc.                    │
│  │                                                            │
│  └── beneficiary_family_members (NEW)                        │
│      ├── Columns: family_member_id, beneficiary_id, ...    │
│      ├── Indexes: ix_family_beneficiary,                    │
│      │             ix_family_national_id,                   │
│      │             ix_family_active                         │
│      └── Unique Constraint: (beneficiary_id, full_name,     │
│                              date_of_birth)                  │
│                                                               │
│  Liquibase:                                                   │
│  ├── 001-add-beneficiary-fields.xml                          │
│  └── 002-create-family-members.xml                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. MOBILE AUTHENTICATION FLOW (Phase 1)

```
┌─────────────────────────────────────┐
│   Mobile App                         │
│   ┌─────────────────────────────┐   │
│   │ Login Screen                │   │
│   │ Enter: Mobile #             │   │
│   │        Date of Birth        │   │
│   └────────────┬────────────────┘   │
└────────────────┼────────────────────┘
                 │
                 │ POST /api/mobile/beneficiaries/auth/verify
                 │ {
                 │   "mobileNumber": "+963912345678",
                 │   "dateOfBirth": "1990-01-15"
                 │ }
                 ▼
    ┌────────────────────────────────┐
    │  API Gateway (Port 6060)        │
    │  - Route to appointment-service │
    │  - Rate limiting check          │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  MobileBeneficiaryController                   │
    │  POST /api/mobile/beneficiaries/auth/verify    │
    └────────────┬─────────────────────────────────┘
                 │
                 │ Call BeneficiaryVerificationService
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  BeneficiaryVerificationService                │
    │  verifyByMobileAndDOB()                        │
    │  ┌──────────────────────────────────────────┐  │
    │  │ 1. Call BeneficiarySearchPort            │  │
    │  │    .findByMobileNumberAndDateOfBirth()  │  │
    │  │                                          │  │
    │  │ 2. If found: Return Beneficiary model   │  │
    │  │    If not found: Throw                  │  │
    │  │    UnauthorizedException                │  │
    │  └──────────────────────────────────────────┘  │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  BeneficiaryDbAdapter (SearchPort impl)        │
    │  findByMobileNumberAndDateOfBirth()            │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  BeneficiaryRepository                         │
    │  Query: SELECT * FROM beneficiaries            │
    │         WHERE mobile_number = ?                │
    │         AND date_of_birth = ?                  │
    │                                                 │
    │  Index: ix_beneficiaries_mobile_dob            │
    │  (Very fast query - composite index)           │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  PostgreSQL                                     │
    │  Returns: BeneficiaryEntity or NULL            │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  FamilyMemberJpaMapper.toDomain()              │
    │  Convert: Entity → Domain Model                │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  BeneficiaryWebMapper.toDTO()                  │
    │  Convert: Domain → Response DTO                │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼ HTTP 200
    ┌────────────────────────────────────────────────┐
    │  Response: BeneficiaryDTO                      │
    │  {                                              │
    │    "beneficiaryId": "uuid",                    │
    │    "fullName": "أحمد",                        │
    │    "mobileNumber": "+963912345678",            │
    │    "dateOfBirth": "1990-01-15",                │
    │    "registrationStatus": "COMPLETE",           │
    │    "preferredLanguage": "AR"                   │
    │  }                                              │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────────────────────┐
    │  Mobile App                                         │
    │  - Store JWT token from backend                     │
    │  - Redirect to Home/Dashboard                       │
    │  - User authenticated successfully                  │
    └─────────────────────────────────────────────────────┘
```

---

## 3. FAMILY MEMBER CRUD FLOW (Phase 2)

```
┌──────────────────────────────────────────────────────────────┐
│  CREATE FAMILY MEMBER                                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: POST /api/admin/beneficiaries/{beneficiaryId}/family│
│  Body: CreateFamilyMemberRequest                              │
│                                                                │
│  1. Controller validates request with @Valid                  │
│  2. Extracts current user from SecurityContext                │
│  3. Calls SaveUseCase.saveFamilyMember(command)              │
│     ↓                                                          │
│     Service validations:                                       │
│     ├─ Check duplicate (name + DOB per beneficiary)          │
│     ├─ Validate relation type enum                           │
│     ├─ Validate gender enum                                  │
│     └─ Set defaults (canBookAppointments=true)               │
│     ↓                                                          │
│     Calls FamilyMemberCrudPort.save()                        │
│     ↓                                                          │
│     FamilyMemberDbAdapter:                                     │
│     ├─ Convert Domain → Entity (JpaMapper)                   │
│     └─ Call repository.save()                                │
│     ↓                                                          │
│     JPA persists to database with:                            │
│     ├─ Auto-generated UUID                                   │
│     ├─ CreationTimestamp                                     │
│     └─ Version = 0                                           │
│     ↓                                                          │
│  4. Convert response: Entity → Domain → DTO                  │
│  5. Return HTTP 201 Created with FamilyMemberResponse        │
│                                                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  READ FAMILY MEMBERS                                          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: GET /api/admin/beneficiaries/{beneficiaryId}/family │
│           ?page=0&size=20&sort=fullName,asc                  │
│                                                                │
│  1. Controller receives FilterRequest and Pageable           │
│  2. Calls LoadAllUseCase.loadAllFamilyMembers()              │
│     ↓                                                          │
│     Service just delegates to port:                           │
│     ↓                                                          │
│     Calls FamilyMemberSearchPort.search()                    │
│     ↓                                                          │
│     FamilyMemberDbAdapter:                                     │
│     ├─ Build Specification with:                             │
│     │  ├─ beneficiaryId = :id                                │
│     │  ├─ isActive = true                                    │
│     │  ├─ isDeleted = false                                  │
│     │  └─ Apply FilterRequest                                │
│     └─ Call repository.findAll(spec, pageable)              │
│     ↓                                                          │
│     Repository executes query:                                │
│     SELECT * FROM beneficiary_family_members                 │
│     WHERE beneficiary_id = ?                                 │
│       AND is_active = true                                   │
│       AND is_deleted = false                                 │
│     ORDER BY full_name ASC                                   │
│     LIMIT 20 OFFSET 0                                        │
│     ↓                                                          │
│  3. Convert results: Entities → Domain Models → DTOs         │
│  4. Return Page<FamilyMemberResponse> with metadata          │
│                                                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  UPDATE FAMILY MEMBER                                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: PUT /api/admin/beneficiaries/{id}/family/{memberId}│
│  Body: UpdateFamilyMemberRequest (partial)                    │
│                                                                │
│  1. Controller validates request                              │
│  2. Calls UpdateUseCase.updateFamilyMember(command)          │
│     ↓                                                          │
│     Service validations:                                       │
│     ├─ Load existing (throws 404 if not found)               │
│     ├─ Check not deleted                                     │
│     ├─ Validate enum values (if provided)                    │
│     ├─ Check for duplicate if name/DOB changed              │
│     └─ Apply updates using MapStruct                         │
│     ↓                                                          │
│     Calls FamilyMemberCrudPort.update()                      │
│     ↓                                                          │
│     JPA performs UPDATE with:                                 │
│     ├─ Only changed fields updated                           │
│     ├─ UpdateTimestamp auto-updated                          │
│     ├─ Version incremented (optimistic locking)              │
│     └─ updatedBy set from command                            │
│     ↓                                                          │
│  3. Return updated FamilyMemberResponse                       │
│                                                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  DELETE FAMILY MEMBER (Soft Delete)                           │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: DELETE /api/admin/beneficiaries/{id}/family/{id}   │
│                                                                │
│  1. Controller calls DeleteUseCase.deleteFamilyMember(id)    │
│     ↓                                                          │
│     Service:                                                   │
│     ├─ Load existing (404 if not found)                      │
│     ├─ Check not already deleted                             │
│     ├─ Set isDeleted = true                                  │
│     ├─ Set isActive = false                                  │
│     └─ Call update                                           │
│     ↓                                                          │
│     JPA performs UPDATE:                                       │
│     UPDATE beneficiary_family_members                        │
│     SET is_deleted = true,                                   │
│         is_active = false,                                   │
│         updated_at = NOW()                                   │
│     WHERE family_member_id = ?                               │
│     ↓                                                          │
│  2. Return HTTP 204 No Content                                │
│  3. Data preserved in database for audit trail               │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE SCHEMA EVOLUTION

```
BEFORE (Current State):
┌─────────────────────┐
│    beneficiaries    │
├─────────────────────┤
│ beneficiary_id (PK) │
│ national_id (UK)    │
│ full_name           │
│ mother_name         │
│ mobile_number (UK)  │
│ email               │
│ address             │
│ latitude            │
│ longitude           │
│ is_active           │
│ is_deleted          │
│ created_by_user_id  │
│ created_at          │
│ updated_by_user_id  │
│ updated_at          │
│ row_version         │
└─────────────────────┘

AFTER (Phase 1):
┌──────────────────────────────┐
│     beneficiaries            │
├──────────────────────────────┤
│ beneficiary_id (PK)          │
│ national_id (UK)             │
│ full_name                    │
│ mother_name                  │
│ mobile_number (UK)           │
│ email                        │
│ address                      │
│ latitude                     │
│ longitude                    │
├──────────────────────────────┤
│ date_of_birth (NEW)          │
│ gender (NEW)                 │
│ profile_photo_url (NEW)      │
│ registration_status (NEW)    │
│ registration_completed_at    │
│ registration_completed_by_id │
│ preferred_language (NEW)     │
├──────────────────────────────┤
│ is_active                    │
│ is_deleted                   │
│ created_by_user_id           │
│ created_at                   │
│ updated_by_user_id           │
│ updated_at                   │
│ row_version                  │
└──────────────────────────────┘

Indexes added:
├── ix_beneficiaries_mobile_dob (mobile, dob)
└── ix_beneficiaries_registration_status

═════════════════════════════════════════════════════════════════

NEW TABLE (Phase 2):
┌──────────────────────────────────┐
│ beneficiary_family_members       │
├──────────────────────────────────┤
│ family_member_id (PK)            │
│ beneficiary_id (FK) ──────┐      │
├──────────────────────────┼──────┤
│ full_name                 │      │
│ relation_type             │      │
│ date_of_birth             │      │
│ national_id               │      │
│ gender                    │      │
│ can_book_appointments     │      │
│ is_active                 │      │
│ is_deleted                │      │
├──────────────────────────┼──────┤
│ created_by_user_id        │      │
│ created_at                │      │
│ updated_by_user_id        │      │
│ updated_at                │      │
│ row_version               │      │
└──────────────────────────┼──────┘
                           │
                    relates to
                           │
              ┌────────────┘
              └─→ beneficiaries(beneficiary_id)

Indexes:
├── ix_family_beneficiary
├── ix_family_national_id
└── ix_family_active

Unique Constraint:
└── (beneficiary_id, full_name, date_of_birth)
```

---

## 5. DEPENDENCY INJECTION FLOW

```
Spring Initialization:

1. Service Layer Beans:
   ├── BeneficiaryVerificationService
   │   @Transactional
   │   @RequiredArgsConstructor → BeneficiarySearchPort
   │
   └── FamilyMemberAdminService
       @Transactional
       @RequiredArgsConstructor → FamilyMemberCrudPort, FamilyMemberSearchPort

2. Adapter (Port Implementation):
   └── FamilyMemberDbAdapter
       @Component
       @RequiredArgsConstructor → BeneficiaryFamilyMemberRepository, FamilyMemberJpaMapper
       implements → FamilyMemberCrudPort, FamilyMemberSearchPort

3. Repository Beans (Auto-created):
   ├── BeneficiaryRepository extends JpaRepository
   └── BeneficiaryFamilyMemberRepository extends JpaRepository, JpaSpecificationExecutor

4. Mapper Beans (MapStruct @Mapper with componentModel="spring"):
   ├── FamilyMemberDomainMapper
   ├── FamilyMemberJpaMapper
   └── FamilyMemberWebMapper

5. Controller Beans:
   ├── MobileBeneficiaryController
   │   @RequiredArgsConstructor → BeneficiaryVerificationService, BeneficiaryWebMapper
   │
   └── BeneficiaryFamilyController
       @RequiredArgsConstructor → SaveUseCase, UpdateUseCase, LoadUseCase,
                                  DeleteUseCase, LoadAllUseCase, FamilyMemberWebMapper

Wiring:
┌────────────────────────────────────────────────────────────┐
│ Controller                                                  │
│ └── SaveUseCase interface                                 │
│     └── FamilyMemberAdminService                          │
│         └── FamilyMemberCrudPort interface                │
│             └── FamilyMemberDbAdapter @Component          │
│                 └── BeneficiaryFamilyMemberRepository      │
│                     └── Actuator + JpaSpecificationExecutor
│                                                             │
│ FamilyMemberAdminService also injects:                    │
│ └── FamilyMemberSearchPort                                │
│     └── FamilyMemberDbAdapter (same instance)             │
└────────────────────────────────────────────────────────────┘
```

---

## 6. ERROR HANDLING FLOW

```
Validation Errors:

┌──────────────────────────┐
│ Invalid Request          │
│ (e.g., missing field)    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Spring Validation (@Valid)                   │
│ Catches at Controller parameter level        │
│ Throws MethodArgumentNotValidException       │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Global Exception Handler (@ExceptionHandler) │
│ Returns: HTTP 400 Bad Request                │
│ Body: {                                       │
│   "error": "Validation failed",              │
│   "fields": [                                 │
│     {"field": "fullName", "message": "..."}  │
│   ]                                           │
│ }                                             │
└──────────────────────────────────────────────┘

Business Logic Errors:

┌──────────────────────────────────────┐
│ Save duplicate family member         │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│ FamilyMemberAdminService.saveFamilyMember()              │
│ if (searchPort.existsByBeneficiaryIdAndFullNameAndDOB) │
│    throw IllegalArgumentException(...)                   │
└────────────┬──────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Exception Handler                            │
│ Returns: HTTP 409 Conflict                   │
│ Body: {                                       │
│   "error": "Duplicate family member",        │
│   "timestamp": "2025-11-01T10:00:00Z"        │
│ }                                             │
└──────────────────────────────────────────────┘

Authentication Errors:

┌──────────────────────────┐
│ Invalid credentials      │
│ (wrong DOB)              │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ BeneficiaryVerificationService               │
│ .verifyByMobileAndDOB()                      │
│ repository.findByMobileAndDOB() → Optional.empty()
│ .orElseThrow(UnauthorizedException)         │
└────────────┬──────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Exception Handler                            │
│ Returns: HTTP 401 Unauthorized               │
│ Body: {                                       │
│   "error": "Invalid credentials",            │
│   "timestamp": "2025-11-01T10:00:00Z"        │
│ }                                             │
└──────────────────────────────────────────────┘

Data Not Found:

┌──────────────────────────────────────┐
│ Request for non-existent resource    │
│ GET /family/{invalidId}              │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ FamilyMemberAdminService.getFamilyMemberById │
│ if (port.findById().isEmpty())               │
│    throw IllegalArgumentException(...)       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Exception Handler                            │
│ Returns: HTTP 404 Not Found                  │
│ Body: {                                       │
│   "error": "Resource not found",             │
│   "timestamp": "2025-11-01T10:00:00Z"        │
│ }                                             │
└──────────────────────────────────────────────┘
```

---

## 7. QUERY PERFORMANCE OPTIMIZATION

```
HIGH PERFORMANCE QUERIES (with Indexes):

1. Mobile Authentication Query:
   ┌────────────────────────────────────────────────────┐
   │ SELECT * FROM beneficiaries                        │
   │ WHERE mobile_number = ?                            │
   │   AND date_of_birth = ?                            │
   │                                                     │
   │ Index: ix_beneficiaries_mobile_dob                 │
   │ Estimated rows: 1 (very fast)                      │
   │ Execution: < 1ms                                   │
   └────────────────────────────────────────────────────┘

2. Family Members by Beneficiary:
   ┌────────────────────────────────────────────────────┐
   │ SELECT * FROM beneficiary_family_members           │
   │ WHERE beneficiary_id = ?                           │
   │   AND is_active = true                             │
   │   AND is_deleted = false                           │
   │ ORDER BY full_name ASC                             │
   │ LIMIT 20 OFFSET 0                                  │
   │                                                     │
   │ Index: ix_family_beneficiary                       │
   │ Estimated rows: 5-10                               │
   │ Execution: < 5ms                                   │
   └────────────────────────────────────────────────────┘

3. Check for Duplicate Family Member:
   ┌────────────────────────────────────────────────────┐
   │ SELECT 1 FROM beneficiary_family_members           │
   │ WHERE beneficiary_id = ?                           │
   │   AND full_name = ?                                │
   │   AND date_of_birth = ?                            │
   │   AND is_deleted = false                           │
   │ LIMIT 1                                            │
   │                                                     │
   │ Unique Constraint: ux_family_member_per_beneficiary
   │ Estimated rows: 1                                  │
   │ Execution: < 1ms                                   │
   └────────────────────────────────────────────────────┘

Index Strategy Summary:
├── Composite Index (mobile, dob)
│   └─ For authentication queries
├── Single Column Indexes
│   ├─ beneficiary_id → for family member lookup
│   ├─ is_active → for active records filtering
│   └─ national_id → for unique lookups
└── Unique Constraints
    └─ (beneficiary_id, full_name, dob) → prevent duplicates
```

---

**End of Architecture Documentation**

All diagrams show the complete flow from HTTP request through all layers to database and back.


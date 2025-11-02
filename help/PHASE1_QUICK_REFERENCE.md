# 🚀 PHASE 1: Beneficiary Enhancements - QUICK REFERENCE

## 📊 Phase 1 Overview
- **Duration**: 1 Week
- **Files**: 10 total (6 new, 4 modified)
- **Complexity**: Medium
- **Priority**: Critical (Mobile App Foundation)

---

## ⚡ FILES TO CREATE (6 NEW)

### 1. `domain/enums/RegistrationStatus.java`
```java
public enum RegistrationStatus {
    QUICK("QUICK"),
    COMPLETE("COMPLETE");
    // ... fromValue() method
}
```
**Purpose**: Track registration type for beneficiary
**Size**: ~25 lines

---

### 2. `domain/enums/Gender.java`
```java
public enum Gender {
    MALE("M"),
    FEMALE("F");
    // ... fromCode() method
}
```
**Purpose**: Standardize gender field
**Size**: ~25 lines

---

### 3. `application/beneficiary/service/BeneficiaryVerificationService.java`
```java
@Service
public class BeneficiaryVerificationService {
    public Beneficiary verifyByMobileAndDOB(String mobile, LocalDate dob)
    public Beneficiary verifyByMobileAndMotherName(String mobile, String mother)
}
```
**Purpose**: Handle mobile app authentication
**Size**: ~50 lines

---

### 4. `web/controller/MobileBeneficiaryController.java`
```java
@RestController
@RequestMapping("/api/mobile/beneficiaries")
public class MobileBeneficiaryController {
    @PostMapping("/auth/verify")
    public ResponseEntity<BeneficiaryDTO> verifyCredentials(...)
}
```
**Purpose**: Expose mobile authentication endpoint
**Size**: ~60 lines

---

### 5. `web/dto/VerifyCredentialsRequest.java`
```java
@Data
public class VerifyCredentialsRequest {
    @NotBlank String mobileNumber;
    @NotNull LocalDate dateOfBirth;
}
```
**Purpose**: Request DTO for verification
**Size**: ~20 lines

---

## 🔧 FILES TO MODIFY (4 EXISTING)

### 1. `domain/model/Beneficiary.java`
**Add 7 fields**:
```java
private LocalDate dateOfBirth;
private String gender;
private String profilePhotoUrl;
private String registrationStatus;
private Instant registrationCompletedAt;
private UUID registrationCompletedByUserId;
private String preferredLanguage;
```

---

### 2. `infrastructure/db/entities/BeneficiaryEntity.java`
**Add columns**:
```java
@Column(name = "date_of_birth")
private LocalDate dateOfBirth;

@Column(name = "gender", length = 10)
private String gender;

// ... 5 more columns

@PrePersist
void prePersist() {
    if (registrationStatus == null)
        registrationStatus = "QUICK";
    if (preferredLanguage == null)
        preferredLanguage = "EN";
}
```

**Add indexes**:
```java
@Index(name = "ix_appt_beneficiaries_mobile_dob",
       columnList = "mobile_number, date_of_birth"),
@Index(name = "ix_appt_beneficiaries_registration_status",
       columnList = "registration_status")
```

---

### 3. `infrastructure/db/repositories/BeneficiaryRepository.java`
**Add 5 methods**:
```java
Optional<BeneficiaryEntity> findByMobileNumberAndDateOfBirth(String mobile, LocalDate dob);
Optional<BeneficiaryEntity> findByMobileNumberAndMotherName(String mobile, String mother);
List<BeneficiaryEntity> findByRegistrationStatus(String status);
boolean existsByNationalId(String nationalId);
boolean existsByMobileNumber(String mobileNumber);
```

---

### 4. `web/dto/BeneficiaryDTO.java`
**Add 6 fields with Swagger**:
```java
@Schema(description = "Date of birth", example = "1990-01-15")
private LocalDate dateOfBirth;

@Schema(description = "Gender", example = "MALE",
        allowableValues = {"MALE", "FEMALE"})
private String gender;

// ... 4 more fields
```

---

## 📝 DATABASE MIGRATION

### Liquibase Changeset: `001-add-beneficiary-fields.xml`

```xml
<changeSet id="1" author="appointment-team">
    <addColumn tableName="beneficiaries">
        <column name="date_of_birth" type="date"/>
        <column name="gender" type="varchar(10)"/>
        <column name="profile_photo_url" type="varchar(500)"/>
        <column name="registration_status" type="varchar(20)"
                defaultValue="QUICK"/>
        <column name="registration_completed_at" type="timestamp"/>
        <column name="registration_completed_by_user_id" type="uuid"/>
        <column name="preferred_language" type="varchar(5)"
                defaultValue="EN"/>
    </addColumn>

    <createIndex indexName="ix_appt_beneficiaries_mobile_dob"
                 tableName="beneficiaries">
        <column name="mobile_number"/>
        <column name="date_of_birth"/>
    </createIndex>

    <createIndex indexName="ix_appt_beneficiaries_registration_status"
                 tableName="beneficiaries">
        <column name="registration_status"/>
    </createIndex>
</changeSet>
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests (30 minutes)
- [ ] Gender enum conversion
- [ ] RegistrationStatus enum conversion
- [ ] BeneficiaryVerificationService.verifyByMobileAndDOB()
- [ ] BeneficiaryVerificationService.verifyByMobileAndMotherName()

### Integration Tests (1 hour)
- [ ] findByMobileNumberAndDateOfBirth() query
- [ ] findByMobileNumberAndMotherName() query
- [ ] existsByNationalId() check
- [ ] existsByMobileNumber() check
- [ ] PrePersist() sets defaults

### API Tests (1 hour)
- [ ] POST /api/mobile/beneficiaries/auth/verify (success)
- [ ] POST /api/mobile/beneficiaries/auth/verify (invalid credentials)
- [ ] POST /api/mobile/beneficiaries/auth/verify (validation errors)
- [ ] Swagger documentation accessible

---

## 🔐 Validation Rules

| Field | Rules |
|-------|-------|
| `dateOfBirth` | Past date, person ≥18 years old |
| `gender` | MALE or FEMALE only |
| `mobileNumber` | E.164 format, immutable after creation |
| `registrationStatus` | QUICK or COMPLETE |
| `preferredLanguage` | EN or AR |

---

## 📋 Step-by-Step Implementation

### Step 1: Create Enums (15 minutes)
1. Create `RegistrationStatus.java` with enum conversion
2. Create `Gender.java` with enum conversion
3. Test enum conversions

### Step 2: Update Domain Model (10 minutes)
1. Add 7 new fields to `Beneficiary.java`
2. No Java compilation errors
3. Check imports are correct

### Step 3: Update Entity (20 minutes)
1. Add 7 new columns to `BeneficiaryEntity.java`
2. Add @PrePersist method
3. Add 2 new indexes
4. Compile and verify no errors

### Step 4: Update Repository (15 minutes)
1. Add 5 new query methods
2. Verify method signatures
3. Add JavaDoc to each method

### Step 5: Create Verification Service (20 minutes)
1. Create `BeneficiaryVerificationService.java`
2. Implement both verification methods
3. Add logging

### Step 6: Create Mobile Controller (20 minutes)
1. Create `MobileBeneficiaryController.java`
2. Add `/auth/verify` endpoint
3. Add Swagger annotations

### Step 7: Create Request DTO (10 minutes)
1. Create `VerifyCredentialsRequest.java`
2. Add validation annotations
3. Add Swagger documentation

### Step 8: Update Response DTO (15 minutes)
1. Add 6 new fields to `BeneficiaryDTO.java`
2. Add Swagger annotations
3. Update mapper if needed

### Step 9: Database Migration (15 minutes)
1. Create Liquibase changeset
2. Test locally
3. Verify all indexes created

### Step 10: Testing & Validation (3+ hours)
1. Write unit tests (30 min)
2. Write integration tests (1 hour)
3. Write API tests (1 hour)
4. Manual testing (30 min)

---

## 🎯 Success Criteria

✅ All 6 new files created
✅ All 4 files modified correctly
✅ All 10 test cases passing
✅ Database migration successful
✅ Swagger documentation complete
✅ No compilation warnings
✅ Mobile controller returns proper responses
✅ Verification methods handle both auth flows

---

## 📊 File Summary

```
PHASE 1 FILES:

NEW FILES (6):
├── domain/enums/RegistrationStatus.java (25 lines)
├── domain/enums/Gender.java (25 lines)
├── application/beneficiary/service/BeneficiaryVerificationService.java (50 lines)
├── web/controller/MobileBeneficiaryController.java (60 lines)
├── web/dto/VerifyCredentialsRequest.java (20 lines)
└── liquibase/changesets/001-add-beneficiary-fields.xml (40 lines)

MODIFIED FILES (4):
├── domain/model/Beneficiary.java (+50 lines)
├── infrastructure/db/entities/BeneficiaryEntity.java (+80 lines)
├── infrastructure/db/repositories/BeneficiaryRepository.java (+50 lines)
└── web/dto/BeneficiaryDTO.java (+40 lines)

TOTAL: ~535 lines of code
```

---

## 🔍 Code Review Checklist

**Code Quality**
- [ ] No magic strings (use constants)
- [ ] Proper exception handling
- [ ] Null checks where needed
- [ ] No console.log or System.out.println
- [ ] Proper logging levels (debug/info/warn/error)

**Security**
- [ ] Input validation on all endpoints
- [ ] No sensitive data in logs
- [ ] Mobile endpoint has rate limiting plan
- [ ] SQL injection prevention (using JPA)

**Documentation**
- [ ] JavaDoc on all public methods
- [ ] Swagger annotations on controllers
- [ ] README updated with new endpoints
- [ ] Example requests/responses

**Testing**
- [ ] Unit tests for enums
- [ ] Integration tests for repository
- [ ] API tests for controller
- [ ] Test edge cases (null, empty, invalid)

---

## 🚨 Common Pitfalls to Avoid

❌ **DON'T**: Use String for dateOfBirth (use LocalDate)
✅ **DO**: Use LocalDate for proper date handling

❌ **DON'T**: Add verification logic in controller
✅ **DO**: Put business logic in Service layer

❌ **DON'T**: Expose entity objects in API responses
✅ **DO**: Use DTOs and mappers

❌ **DON'T**: Skip database migration scripts
✅ **DO**: Use Liquibase for version control

❌ **DON'T**: Hard-code default values
✅ **DO**: Use @PrePersist for defaults

---

## 📞 Quick Help

### Q: How to run tests?
```bash
mvn test -Dtest=BeneficiaryVerificationServiceTests
mvn verify  # All tests
```

### Q: How to run migrations?
```bash
mvn liquibase:update
```

### Q: How to check Swagger docs?
```
http://localhost:6064/swagger-ui.html
```

### Q: How to debug queries?
Add to application.yml:
```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

---

## 📌 Key Design Decisions

1. **Separate Mobile Controller**: Different business rules for mobile app
2. **Immutable Mobile Number**: Prevent fraud/identity changes
3. **Composite Index (mobile + DOB)**: Fast authentication queries
4. **Soft Delete Only**: Preserve audit trail
5. **Enum for Status**: Type-safe, prevents invalid values
6. **PrePersist Defaults**: Ensure data consistency at database level
7. **Multiple Auth Methods**: Flexibility for different use cases

---

**Duration**: 1 Week
**Effort**: 10.5 hours
**Start Date**: Immediately
**Status**: READY TO IMPLEMENT

Next: Phase 2 - Family Members Module


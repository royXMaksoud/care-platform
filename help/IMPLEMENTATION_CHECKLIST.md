# 📋 Implementation Execution Checklist

## PHASE 1: BENEFICIARY ENHANCEMENTS (Week 1)

### Domain Layer
- [ ] Create `domain/enums/RegistrationStatus.java`
- [ ] Create `domain/enums/Gender.java`
- [ ] Update `domain/model/Beneficiary.java` (add 7 fields)

**Expected Effort**: 1 hour
**Files**: 2 new + 1 modified

---

### Infrastructure Layer
- [ ] Update `infrastructure/db/entities/BeneficiaryEntity.java`
  - [ ] Add 7 new column fields
  - [ ] Add 2 new indexes to @Table
  - [ ] Add PrePersist method
- [ ] Update `infrastructure/db/repositories/BeneficiaryRepository.java`
  - [ ] Add `findByMobileNumberAndDateOfBirth()`
  - [ ] Add `findByMobileNumberAndMotherName()`
  - [ ] Add `findByRegistrationStatus()`
  - [ ] Add `existsByNationalId()`
  - [ ] Add `existsByMobileNumber()`

**Expected Effort**: 2 hours
**Files**: 2 modified

---

### Application Layer
- [ ] Update `application/beneficiary/command/UpdateBeneficiaryCommand.java`
  - [ ] Add new fields (dateOfBirth, gender, etc.)
  - [ ] Remove mobileNumber (immutable)
- [ ] Create `application/beneficiary/service/BeneficiaryVerificationService.java`
  - [ ] `verifyByMobileAndDOB()` method
  - [ ] `verifyByMobileAndMotherName()` method

**Expected Effort**: 1.5 hours
**Files**: 1 new + 1 modified

---

### Web Layer
- [ ] Update `web/dto/BeneficiaryDTO.java`
  - [ ] Add 6 new fields with Swagger annotations
- [ ] Create `web/controller/MobileBeneficiaryController.java`
  - [ ] `POST /api/mobile/beneficiaries/auth/verify` endpoint
- [ ] Create `web/dto/VerifyCredentialsRequest.java`

**Expected Effort**: 2 hours
**Files**: 2 new + 1 modified

---

### Testing Phase 1
- [ ] Unit tests for enums
- [ ] Unit tests for VerificationService
- [ ] Integration tests for repository methods
- [ ] API tests for mobile controller

**Expected Effort**: 3 hours

---

### Database Migration Phase 1
- [ ] Create Liquibase changeset for beneficiaries table
- [ ] Test migration on local database
- [ ] Verify indexes created

**Expected Effort**: 1 hour

---

**PHASE 1 TOTAL**: 10.5 hours (1-2 days)

---

## PHASE 2: FAMILY MEMBERS MODULE (Week 1-2)

### Domain Layer
- [ ] Create `domain/enums/RelationType.java`
- [ ] Create `domain/model/BeneficiaryFamilyMember.java`

**Expected Effort**: 1 hour
**Files**: 2 new

---

### Domain Layer - Ports (In)
- [ ] Create `domain/ports/in/familymember/SaveUseCase.java`
- [ ] Create `domain/ports/in/familymember/UpdateUseCase.java`
- [ ] Create `domain/ports/in/familymember/LoadUseCase.java`
- [ ] Create `domain/ports/in/familymember/DeleteUseCase.java`
- [ ] Create `domain/ports/in/familymember/LoadAllUseCase.java`

**Expected Effort**: 1.5 hours
**Files**: 5 new

---

### Domain Layer - Ports (Out)
- [ ] Create `domain/ports/out/familymember/FamilyMemberCrudPort.java`
- [ ] Create `domain/ports/out/familymember/FamilyMemberSearchPort.java`

**Expected Effort**: 1 hour
**Files**: 2 new

---

### Application Layer - Commands
- [ ] Create `application/familymember/command/CreateFamilyMemberCommand.java`
- [ ] Create `application/familymember/command/UpdateFamilyMemberCommand.java`

**Expected Effort**: 1 hour
**Files**: 2 new

---

### Application Layer - Mapper
- [ ] Create `application/familymember/mapper/FamilyMemberDomainMapper.java` (MapStruct)

**Expected Effort**: 30 minutes
**Files**: 1 new

---

### Application Layer - Service
- [ ] Create `application/familymember/service/FamilyMemberAdminService.java`
  - [ ] `saveFamilyMember()` with validations
  - [ ] `updateFamilyMember()` with validations
  - [ ] `getFamilyMemberById()` read-only
  - [ ] `deleteFamilyMember()` soft delete
  - [ ] `loadAllFamilyMembers()` with filtering
  - [ ] Validation helper methods

**Expected Effort**: 3 hours
**Files**: 1 new

---

### Infrastructure Layer - Entity & Repository
- [ ] Create `infrastructure/db/entities/BeneficiaryFamilyMemberEntity.java`
  - [ ] All columns with JPA annotations
  - [ ] Indexes in @Table
  - [ ] PrePersist method
- [ ] Create `infrastructure/db/repositories/BeneficiaryFamilyMemberRepository.java`
  - [ ] Custom query methods
  - [ ] JpaSpecificationExecutor extension

**Expected Effort**: 2 hours
**Files**: 2 new

---

### Infrastructure Layer - Adapter
- [ ] Create `infrastructure/db/adapter/FamilyMemberDbAdapter.java`
  - [ ] Implement FamilyMemberCrudPort
  - [ ] Implement FamilyMemberSearchPort
  - [ ] Specification methods for filtering
- [ ] Create `infrastructure/db/mapper/FamilyMemberJpaMapper.java` (MapStruct)

**Expected Effort**: 2.5 hours
**Files**: 2 new

---

### Web Layer - DTOs
- [ ] Create `web/dto/familymember/CreateFamilyMemberRequest.java`
- [ ] Create `web/dto/familymember/UpdateFamilyMemberRequest.java`
- [ ] Create `web/dto/familymember/FamilyMemberResponse.java`

**Expected Effort**: 1.5 hours
**Files**: 3 new

---

### Web Layer - Mapper
- [ ] Create `web/mapper/FamilyMemberWebMapper.java` (MapStruct)

**Expected Effort**: 30 minutes
**Files**: 1 new

---

### Web Layer - Controller
- [ ] Create `web/controller/BeneficiaryFamilyController.java`
  - [ ] `POST /{beneficiaryId}/family` - Add member
  - [ ] `GET /{beneficiaryId}/family` - List with pagination
  - [ ] `GET /{beneficiaryId}/family/{memberId}` - Get one
  - [ ] `PUT /{beneficiaryId}/family/{memberId}` - Update
  - [ ] `DELETE /{beneficiaryId}/family/{memberId}` - Delete
  - [ ] Helper method for current user ID

**Expected Effort**: 2 hours
**Files**: 1 new

---

### Testing Phase 2
- [ ] Unit tests for enums and model
- [ ] Unit tests for FamilyMemberAdminService (8-10 test cases)
- [ ] Integration tests for repository
- [ ] API tests for controller (all 5 endpoints)
- [ ] Test duplicate prevention
- [ ] Test soft delete behavior

**Expected Effort**: 4 hours

---

### Database Migration Phase 2
- [ ] Create Liquibase changeset for family_members table
- [ ] Create all indexes
- [ ] Test migration
- [ ] Verify unique constraint

**Expected Effort**: 1 hour

---

**PHASE 2 TOTAL**: 22 hours (2-3 days)

---

## COMBINED PHASE 1 + 2 TOTAL

**Estimated Effort**: 32.5 hours (4-5 days)
**Files to Create**: 28 files
**Files to Modify**: 6 files
**Tests to Write**: 50+ test cases
**Database Changes**: 2 migration scripts

---

## VERIFICATION CHECKLIST

### Code Quality
- [ ] All Java files compile without errors
- [ ] No warnings in IDE
- [ ] SonarQube analysis passed (if applicable)
- [ ] Code coverage > 80%

### Architecture
- [ ] Clean Architecture layers properly separated
- [ ] No dependencies bypass the layers
- [ ] DTOs not exposed in domain layer
- [ ] Entities not exposed beyond infrastructure

### Documentation
- [ ] All public methods have JavaDoc
- [ ] All use cases documented
- [ ] Swagger/OpenAPI annotations complete
- [ ] README updated with new endpoints

### Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All API tests passing
- [ ] No flaky tests

### Database
- [ ] Liquibase migrations run successfully
- [ ] All indexes created
- [ ] Constraints applied correctly
- [ ] No orphaned data

### Performance
- [ ] Complex queries have proper indexes
- [ ] No N+1 query problems
- [ ] Pagination implemented
- [ ] Load tested with sample data

---

## QUICK START COMMANDS

```bash
# Compile the project
mvn clean compile

# Run all tests
mvn test

# Run integration tests
mvn verify

# Build JAR
mvn clean package

# Check code style
mvn checkstyle:check

# Generate Javadoc
mvn javadoc:javadoc

# Run SonarQube analysis
mvn sonar:sonar
```

---

## FILE STRUCTURE SUMMARY

```
PHASE 1 (9 files):
✅ domain/enums/RegistrationStatus.java (NEW)
✅ domain/enums/Gender.java (NEW)
✅ domain/model/Beneficiary.java (MODIFY)
✅ infrastructure/db/entities/BeneficiaryEntity.java (MODIFY)
✅ infrastructure/db/repositories/BeneficiaryRepository.java (MODIFY)
✅ application/beneficiary/command/UpdateBeneficiaryCommand.java (MODIFY)
✅ application/beneficiary/service/BeneficiaryVerificationService.java (NEW)
✅ web/dto/BeneficiaryDTO.java (MODIFY)
✅ web/controller/MobileBeneficiaryController.java (NEW)
✅ web/dto/VerifyCredentialsRequest.java (NEW)

PHASE 2 (28 files):
✅ domain/enums/RelationType.java (NEW)
✅ domain/model/BeneficiaryFamilyMember.java (NEW)
✅ domain/ports/in/familymember/SaveUseCase.java (NEW)
✅ domain/ports/in/familymember/UpdateUseCase.java (NEW)
✅ domain/ports/in/familymember/LoadUseCase.java (NEW)
✅ domain/ports/in/familymember/DeleteUseCase.java (NEW)
✅ domain/ports/in/familymember/LoadAllUseCase.java (NEW)
✅ domain/ports/out/familymember/FamilyMemberCrudPort.java (NEW)
✅ domain/ports/out/familymember/FamilyMemberSearchPort.java (NEW)
✅ application/familymember/command/CreateFamilyMemberCommand.java (NEW)
✅ application/familymember/command/UpdateFamilyMemberCommand.java (NEW)
✅ application/familymember/mapper/FamilyMemberDomainMapper.java (NEW)
✅ application/familymember/service/FamilyMemberAdminService.java (NEW)
✅ infrastructure/db/entities/BeneficiaryFamilyMemberEntity.java (NEW)
✅ infrastructure/db/repositories/BeneficiaryFamilyMemberRepository.java (NEW)
✅ infrastructure/db/adapter/FamilyMemberDbAdapter.java (NEW)
✅ infrastructure/db/mapper/FamilyMemberJpaMapper.java (NEW)
✅ web/dto/familymember/CreateFamilyMemberRequest.java (NEW)
✅ web/dto/familymember/UpdateFamilyMemberRequest.java (NEW)
✅ web/dto/familymember/FamilyMemberResponse.java (NEW)
✅ web/mapper/FamilyMemberWebMapper.java (NEW)
✅ web/controller/BeneficiaryFamilyController.java (NEW)

DATABASE:
✅ liquibase/changesets/001-add-beneficiary-fields.xml (NEW)
✅ liquibase/changesets/002-create-family-members.xml (NEW)
```

---

## DEPENDENCIES CHECK

Before starting, verify these are in `pom.xml`:

```xml
<!-- MapStruct -->
<mapstruct.version>1.5.5.Final</mapstruct.version>

<!-- Lombok -->
<lombok.version>1.18.32</lombok.version>

<!-- SpringDoc OpenAPI (Swagger) -->
<springdoc-openapi-starter-webmvc-ui.version>2.0.2</springdoc-openapi-starter-webmvc-ui.version>

<!-- Liquibase -->
<liquibase.version>4.23.0</liquibase.version>

<!-- TestContainers (for integration tests) -->
<testcontainers.version>1.19.1</testcontainers.version>
```

---

## ARCHITECTURE DECISIONS REFERENCE

| Decision | Rationale |
|----------|-----------|
| Soft Delete Only | Preserve audit trail, enable GDPR compliance, recover accidentally deleted data |
| Separate Mobile Controller | Different auth rules, rate limiting, business logic for mobile app |
| MapStruct Mappers | Type-safe, compile-time verification, zero-reflection overhead |
| JpaSpecificationExecutor | Dynamic filtering without custom query string concatenation |
| Liquibase Migrations | Version control for database schema, rollback capability |
| Comprehensive Indexes | Query performance, especially for mobile+DOB auth |
| Multiple Validation Layers | Input validation (DTO) + business rules (Service) + database constraints |

---

## TROUBLESHOOTING GUIDE

### MapStruct Issues
- **Problem**: Mapper not injected
- **Solution**: Ensure `componentModel = "spring"` in @Mapper annotation

### Index Not Created
- **Problem**: Liquibase changeset runs but index missing
- **Solution**: Verify index name is unique, check for typos in column names

### Specification Queries
- **Problem**: Dynamic filtering returns no results
- **Solution**: Verify filter field names match entity field names exactly

### Soft Delete Issues
- **Problem**: Deleted records still appear
- **Solution**: Always add `isDeleted = false AND isActive = true` to queries

---

## NEXT PHASE PREVIEW

### Phase 3: Documents Module (Similar to Family Members)
- [ ] Domain model: BeneficiaryDocument
- [ ] Enums: DocumentType, DocumentStatus
- [ ] Full CRUD with file upload handling
- [ ] Estimated: 20 hours

### Phase 4: Mobile Registration APIs
- [ ] Quick registration (minimal fields)
- [ ] Full registration (complete profile)
- [ ] Status tracking
- [ ] Estimated: 15 hours

### Phase 5: Referrals Module
- [ ] Domain model: AppointmentReferral
- [ ] Inter-service communication
- [ ] Status workflows
- [ ] Estimated: 25 hours

---

**Generated**: 2025-11-01
**Status**: Ready for Implementation
**Next Step**: Start Phase 1 - Domain Layer

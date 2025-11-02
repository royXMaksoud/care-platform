# 📋 Detailed Implementation Plan - Appointment Service Enhancements

**Status**: Ready for Implementation
**Target Completion**: 4 Weeks
**Teams**: Backend Development

---

## TABLE OF CONTENTS
1. [Phase 1: Beneficiary Enhancements](#phase-1-beneficiary-enhancements)
2. [Phase 2: Family Members Module](#phase-2-family-members-module)
3. [Phase 3: Documents Module](#phase-3-documents-module)
4. [Phase 4: Mobile Registration APIs](#phase-4-mobile-registration-apis)
5. [Phase 5: Referrals Module](#phase-5-referrals-module)
6. [Database Migrations](#database-migrations)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Checklist](#deployment-checklist)

---

## PHASE 1: BENEFICIARY ENHANCEMENTS

**Duration**: 1 Week
**Priority**: 1 (Critical)
**Files to Create/Modify**: 8 files

### 1.1 Domain Layer - Enums (2 files)

#### File 1: `domain/enums/RegistrationStatus.java`
```java
package com.care.appointment.domain.enums;

public enum RegistrationStatus {
    QUICK("QUICK"),      // Quick registration - can book appointments
    COMPLETE("COMPLETE"); // Full registration with national ID

    private final String value;

    RegistrationStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static RegistrationStatus fromValue(String value) {
        for (RegistrationStatus status : RegistrationStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown registration status: " + value);
    }
}
```

**Purpose**: Track whether beneficiary completed full registration or quick registration
**Used By**: Domain model, database entity, DTOs
**Testing**: Verify enum conversion methods work correctly

---

#### File 2: `domain/enums/Gender.java`
```java
package com.care.appointment.domain.enums;

public enum Gender {
    MALE("M"),
    FEMALE("F");

    private final String code;

    Gender(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static Gender fromCode(String code) {
        for (Gender gender : Gender.values()) {
            if (gender.code.equalsIgnoreCase(code)) {
                return gender;
            }
        }
        throw new IllegalArgumentException("Unknown gender code: " + code);
    }
}
```

**Purpose**: Standardize gender field
**Used By**: Domain model, demographics reporting
**Internationalization**: Display names should come from i18n files

---

### 1.2 Domain Layer - Model (1 file)

#### File 3: `domain/model/Beneficiary.java` (MODIFY)

**Current State**: 28 lines, basic fields
**Changes**: Add 7 new fields + documentation

```java
package com.care.appointment.domain.model;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Beneficiary {
    // === EXISTING FIELDS ===
    private UUID beneficiaryId;
    private String nationalId;
    private String fullName;
    private String motherName;
    private String mobileNumber;
    private String email;
    private String address;
    private Double latitude;
    private Double longitude;

    // === NEW FIELDS (Priority 1) ===
    /** Date of birth - used for verification in mobile app */
    private LocalDate dateOfBirth;

    /** Gender: MALE or FEMALE */
    private String gender;

    /** URL to profile photo - stored in external storage */
    private String profilePhotoUrl;

    /** Registration status: QUICK or COMPLETE */
    private String registrationStatus;

    /** Timestamp when full registration was completed */
    private Instant registrationCompletedAt;

    /** User ID of who completed the registration */
    private UUID registrationCompletedByUserId;

    /** Preferred language for notifications: EN or AR */
    private String preferredLanguage;

    // === AUDIT FIELDS ===
    private Boolean isActive;
    private Boolean isDeleted;
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
}
```

**Key Changes**:
- Added `dateOfBirth` - **REQUIRED** for mobile app authentication
- Added `gender` - for demographic reports and personalization
- Added `profilePhotoUrl` - optional but enhances user experience
- Added `registrationStatus` - **REQUIRED** to track registration flow
- Added `registrationCompletedAt` - audit trail
- Added `registrationCompletedByUserId` - audit trail
- Added `preferredLanguage` - **REQUIRED** for i18n support

**Validation Rules**:
- `dateOfBirth` must be in the past
- `dateOfBirth` must make person at least 18 years old (configurable)
- `gender` must be MALE or FEMALE
- `registrationStatus` must be QUICK or COMPLETE
- `mobileNumber` cannot be changed after initial registration (immutable in updates)

---

### 1.3 Infrastructure Layer - Entity (1 file)

#### File 4: `infrastructure/db/entities/BeneficiaryEntity.java` (MODIFY)

**Current State**: ~80 lines
**Changes**: Add 7 new columns + 2 indexes + PrePersist logic

Add these fields to the entity:

```java
// === NEW COLUMNS ===

@Column(name = "date_of_birth")
private LocalDate dateOfBirth;

@Column(name = "gender", length = 10)
private String gender;

@Column(name = "profile_photo_url", length = 500)
private String profilePhotoUrl;

@Column(name = "registration_status", length = 20, nullable = false)
private String registrationStatus;

@Column(name = "registration_completed_at")
private Instant registrationCompletedAt;

@Column(name = "registration_completed_by_user_id")
private UUID registrationCompletedByUserId;

@Column(name = "preferred_language", length = 5)
private String preferredLanguage;
```

Update the @Table annotation with new indexes:

```java
@Table(
    name = "beneficiaries",
    schema = "public",
    indexes = {
        // EXISTING INDEXES
        @Index(name = "ux_appt_beneficiaries_national_id", columnList = "national_id", unique = true),
        @Index(name = "ix_appt_beneficiaries_mobile", columnList = "mobile_number"),
        @Index(name = "ix_appt_beneficiaries_email", columnList = "email"),
        @Index(name = "ix_appt_beneficiaries_active", columnList = "is_active"),
        @Index(name = "ix_appt_beneficiaries_deleted", columnList = "is_deleted"),

        // NEW INDEXES
        @Index(name = "ix_appt_beneficiaries_mobile_dob", columnList = "mobile_number, date_of_birth"),
        @Index(name = "ix_appt_beneficiaries_registration_status", columnList = "registration_status")
    }
)
```

Add PrePersist method:

```java
@PrePersist
void prePersist() {
    if (isActive == null) isActive = Boolean.TRUE;
    if (isDeleted == null) isDeleted = Boolean.FALSE;
    if (registrationStatus == null) registrationStatus = "QUICK";
    if (preferredLanguage == null) preferredLanguage = "EN";
}
```

---

### 1.4 Infrastructure Layer - Repository (1 file)

#### File 5: `infrastructure/db/repositories/BeneficiaryRepository.java` (MODIFY)

Add these new methods:

```java
/**
 * Finds beneficiary by mobile number and date of birth.
 * Used for authentication in mobile app.
 * Critical for Quick Registration flow.
 *
 * @param mobileNumber The mobile number (E.164 format)
 * @param dateOfBirth The date of birth
 * @return Optional containing beneficiary if found
 */
Optional<BeneficiaryEntity> findByMobileNumberAndDateOfBirth(
    String mobileNumber, LocalDate dateOfBirth);

/**
 * Finds beneficiary by mobile number and mother name.
 * Alternative authentication method if DOB not available.
 *
 * @param mobileNumber The mobile number
 * @param motherName The mother's full name
 * @return Optional containing beneficiary if found
 */
Optional<BeneficiaryEntity> findByMobileNumberAndMotherName(
    String mobileNumber, String motherName);

/**
 * Finds all beneficiaries with incomplete registration.
 * Used for follow-up and analytics.
 *
 * @param registrationStatus The status (QUICK or COMPLETE)
 * @return List of matching beneficiaries
 */
List<BeneficiaryEntity> findByRegistrationStatus(String registrationStatus);

/**
 * Checks if beneficiary exists with given national ID.
 * Used for duplicate checking during registration.
 *
 * @param nationalId The national ID
 * @return true if exists, false otherwise
 */
boolean existsByNationalId(String nationalId);

/**
 * Checks if beneficiary exists with given mobile number.
 * Used for duplicate checking during registration.
 *
 * @param mobileNumber The mobile number
 * @return true if exists, false otherwise
 */
boolean existsByMobileNumber(String mobileNumber);
```

**Purpose**: Support new mobile app authentication flows
**Performance**: Both queries are fast due to indexes

---

### 1.5 Application Layer - Command (1 file)

#### File 6: `application/beneficiary/command/UpdateBeneficiaryCommand.java` (MODIFY)

Add these new fields:

```java
package com.care.appointment.application.beneficiary.command;

import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBeneficiaryCommand {
    // EXISTING FIELDS
    private UUID beneficiaryId;
    private String nationalId;
    private String fullName;
    private String motherName;
    // NOTE: mobileNumber should NOT be updatable after initial registration
    private String email;
    private String address;
    private Double latitude;
    private Double longitude;
    private Boolean isActive;
    private UUID updatedById;

    // NEW FIELDS (for completing registration)
    private LocalDate dateOfBirth;
    private String gender;
    private String profilePhotoUrl;
    private String preferredLanguage;

    // REGISTRATION COMPLETION (only for completing QUICK registration)
    private String registrationStatus;
    private UUID registrationCompletedByUserId;
}
```

**Important**: `mobileNumber` should be removed from update operations - it's immutable.

---

### 1.6 Application Layer - Service (1 file)

#### File 7: `application/beneficiary/service/BeneficiaryVerificationService.java` (NEW)

```java
package com.care.appointment.application.beneficiary.service;

import com.care.appointment.domain.model.Beneficiary;
import com.care.appointment.domain.ports.out.beneficiary.BeneficiarySearchPort;
import com.sharedlib.core.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Service for verifying beneficiary credentials for mobile app authentication.
 *
 * Supports multiple authentication methods:
 * 1. Mobile + Date of Birth (Primary)
 * 2. Mobile + Mother Name (Fallback)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BeneficiaryVerificationService {

    private final BeneficiarySearchPort beneficiarySearchPort;

    /**
     * Verifies beneficiary credentials using mobile number and date of birth.
     *
     * This is the primary authentication method for mobile app.
     * Most secure as it requires knowledge of DOB.
     *
     * @param mobileNumber The mobile number in E.164 format (e.g., +963912345678)
     * @param dateOfBirth The date of birth
     * @return Verified beneficiary
     * @throws UnauthorizedException if credentials are invalid
     */
    public Beneficiary verifyByMobileAndDOB(String mobileNumber, LocalDate dateOfBirth) {
        log.debug("Attempting to verify beneficiary with mobile: {} and DOB", mobileNumber);

        return beneficiarySearchPort.findByMobileNumberAndDateOfBirth(mobileNumber, dateOfBirth)
            .orElseThrow(() -> {
                log.warn("Verification failed for mobile: {}", mobileNumber);
                return new UnauthorizedException("Invalid credentials");
            });
    }

    /**
     * Verifies beneficiary using mobile number and mother's name.
     *
     * Fallback method if DOB is not available.
     * Less secure but acceptable as secondary method.
     *
     * @param mobileNumber The mobile number
     * @param motherName The mother's full name
     * @return Verified beneficiary
     * @throws UnauthorizedException if credentials are invalid
     */
    public Beneficiary verifyByMobileAndMotherName(String mobileNumber, String motherName) {
        log.debug("Attempting to verify beneficiary with mobile: {} and mother name", mobileNumber);

        return beneficiarySearchPort.findByMobileNumberAndMotherName(mobileNumber, motherName)
            .orElseThrow(() -> {
                log.warn("Verification failed for mobile: {}", mobileNumber);
                return new UnauthorizedException("Invalid credentials");
            });
    }
}
```

**Purpose**: Handle mobile app authentication logic
**Key Features**:
- Reads-only (no state changes)
- Comprehensive logging for security audit
- Two authentication methods for flexibility
- Proper exception handling

---

### 1.7 Web Layer - DTOs (2 files)

#### File 8a: `web/dto/BeneficiaryDTO.java` (MODIFY)

Add to existing DTO:

```java
@Schema(description = "Date of birth", example = "1990-01-15")
private LocalDate dateOfBirth;

@Schema(description = "Gender", example = "MALE", allowableValues = {"MALE", "FEMALE"})
private String gender;

@Schema(description = "Profile photo URL", example = "https://storage.example.com/photos/beneficiary-123.jpg")
private String profilePhotoUrl;

@Schema(description = "Registration status", example = "QUICK",
        allowableValues = {"QUICK", "COMPLETE"})
private String registrationStatus;

@Schema(description = "Timestamp when full registration was completed")
private Instant registrationCompletedAt;

@Schema(description = "Preferred language for notifications", example = "EN",
        allowableValues = {"EN", "AR"})
private String preferredLanguage;
```

---

#### File 8b: `web/controller/MobileBeneficiaryController.java` (NEW)

```java
package com.care.appointment.web.controller;

import com.care.appointment.application.beneficiary.service.BeneficiaryVerificationService;
import com.care.appointment.domain.model.Beneficiary;
import com.care.appointment.web.dto.BeneficiaryDTO;
import com.care.appointment.web.mapper.BeneficiaryWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;

/**
 * REST Controller for mobile beneficiary operations.
 *
 * Endpoints:
 * - POST /api/mobile/beneficiaries/auth/verify - Verify credentials
 * - POST /api/mobile/beneficiaries/register/quick - Quick registration
 *
 * This is separate from admin endpoints for:
 * 1. Different authentication rules
 * 2. Different validation logic
 * 3. Rate limiting specific to mobile
 */
@RestController
@RequestMapping("/api/mobile/beneficiaries")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mobile - Beneficiary", description = "Beneficiary operations for mobile app")
public class MobileBeneficiaryController {

    private final BeneficiaryVerificationService verificationService;
    private final BeneficiaryWebMapper beneficiaryWebMapper;

    /**
     * Verifies beneficiary credentials for login.
     *
     * Request format:
     * {
     *   "mobileNumber": "+963912345678",
     *   "dateOfBirth": "1990-01-15"
     * }
     *
     * Response: Returns beneficiary with sensitive fields filtered
     *
     * @param request Verification request with mobile and DOB
     * @return Verified beneficiary if credentials match
     * @throws UnauthorizedException if credentials are invalid
     */
    @PostMapping("/auth/verify")
    @Operation(
        summary = "Verify beneficiary credentials",
        description = "Verifies mobile number and date of birth for authentication"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Verification successful"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<BeneficiaryDTO> verifyCredentials(
        @Valid @RequestBody VerifyCredentialsRequest request) {

        log.info("Verifying beneficiary credentials for mobile: {}", request.getMobileNumber());

        Beneficiary verified = verificationService.verifyByMobileAndDOB(
            request.getMobileNumber(),
            request.getDateOfBirth()
        );

        BeneficiaryDTO response = beneficiaryWebMapper.toDTO(verified);
        log.info("Beneficiary verified successfully: {}", verified.getBeneficiaryId());

        return ResponseEntity.ok(response);
    }
}
```

Create supporting DTOs:

```java
// VerifyCredentialsRequest.java
package com.care.appointment.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyCredentialsRequest {

    @Schema(description = "Mobile number in E.164 format", example = "+963912345678", required = true)
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Invalid mobile number format")
    private String mobileNumber;

    @Schema(description = "Date of birth", example = "1990-01-15", required = true)
    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth cannot be in future")
    private LocalDate dateOfBirth;
}
```

---

### 1.8 Mapper (MODIFY or CREATE)

Update `web/mapper/BeneficiaryWebMapper.java` to handle new fields:

```java
// Ensure mapper includes all new fields
beneficiaryDTO.setDateOfBirth(beneficiary.getDateOfBirth());
beneficiaryDTO.setGender(beneficiary.getGender());
beneficiaryDTO.setProfilePhotoUrl(beneficiary.getProfilePhotoUrl());
beneficiaryDTO.setRegistrationStatus(beneficiary.getRegistrationStatus());
beneficiaryDTO.setPreferredLanguage(beneficiary.getPreferredLanguage());
```

---

### 1.9 Phase 1 Summary

**Files Created**: 2 (Enums, Verification Service, Mobile Controller, Request DTO)
**Files Modified**: 5 (Domain Model, Entity, Repository, Command, DTOs)
**Total Lines of Code**: ~600 lines
**Estimated Time**: 3-4 days

**Testing Checklist**:
- ✅ Enum conversion methods work correctly
- ✅ Entity persists with all new fields
- ✅ Repository queries work (index efficiency)
- ✅ Service handles both auth methods
- ✅ Controller returns proper DTOs
- ✅ Validation on request DTOs
- ✅ Swagger documentation is complete

---

## PHASE 2: FAMILY MEMBERS MODULE

**Duration**: 1 Week
**Priority**: 1 (Critical)
**Files to Create**: 15 files
**Complexity**: High (Complete CRUD with multiple layers)

### 2.1 Domain Layer - Model & Enums

#### File 1: `domain/enums/RelationType.java` (NEW)

```java
package com.care.appointment.domain.enums;

public enum RelationType {
    SPOUSE("SPOUSE"),
    SON("SON"),
    DAUGHTER("DAUGHTER"),
    FATHER("FATHER"),
    MOTHER("MOTHER"),
    BROTHER("BROTHER"),
    SISTER("SISTER"),
    GRANDFATHER("GRANDFATHER"),
    GRANDMOTHER("GRANDMOTHER"),
    GRANDSON("GRANDSON"),
    GRANDDAUGHTER("GRANDDAUGHTER"),
    UNCLE("UNCLE"),
    AUNT("AUNT"),
    COUSIN("COUSIN"),
    NEPHEW("NEPHEW"),
    NIECE("NIECE"),
    OTHER("OTHER");

    private final String value;

    RelationType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static RelationType fromValue(String value) {
        for (RelationType type : RelationType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown relation type: " + value);
    }
}
```

---

#### File 2: `domain/model/BeneficiaryFamilyMember.java` (NEW)

```java
package com.care.appointment.domain.model;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Domain model for family members of beneficiaries.
 *
 * Allows:
 * - Tracking multiple family members
 * - Family members can book appointments
 * - Shared family history and documents
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryFamilyMember {

    /** Unique identifier for family member record */
    private UUID familyMemberId;

    /** Reference to the beneficiary (parent) */
    private UUID beneficiaryId;

    /** Full name of family member */
    private String fullName;

    /** Relationship to beneficiary */
    private String relationType;

    /** Date of birth for demographic tracking */
    private LocalDate dateOfBirth;

    /** National ID (if available) */
    private String nationalId;

    /** Gender: MALE or FEMALE */
    private String gender;

    /** Whether this family member can book appointments independently */
    private Boolean canBookAppointments;

    /** Whether this record is active */
    private Boolean isActive;

    /** Whether this record is deleted (soft delete) */
    private Boolean isDeleted;

    // === AUDIT FIELDS ===
    private UUID createdById;
    private Instant createdAt;
    private UUID updatedById;
    private Instant updatedAt;
    private Long rowVersion;
}
```

---

### 2.2 Domain Layer - Ports (In/Out)

#### File 3: `domain/ports/in/familymember/SaveUseCase.java` (NEW)

```java
package com.care.appointment.domain.ports.in.familymember;

import com.care.appointment.application.familymember.command.CreateFamilyMemberCommand;
import com.care.appointment.domain.model.BeneficiaryFamilyMember;

/**
 * Use case for creating family members.
 *
 * Responsibilities:
 * - Validate input
 * - Check beneficiary exists
 * - Prevent duplicate entries
 * - Persist new family member
 */
public interface SaveUseCase {
    BeneficiaryFamilyMember saveFamilyMember(CreateFamilyMemberCommand command);
}
```

---

#### File 4: `domain/ports/in/familymember/UpdateUseCase.java` (NEW)

```java
package com.care.appointment.domain.ports.in.familymember;

import com.care.appointment.application.familymember.command.UpdateFamilyMemberCommand;
import com.care.appointment.domain.model.BeneficiaryFamilyMember;

/**
 * Use case for updating family members.
 *
 * Responsibilities:
 * - Validate input
 * - Check family member exists
 * - Update only mutable fields
 * - Preserve audit trail
 */
public interface UpdateUseCase {
    BeneficiaryFamilyMember updateFamilyMember(UpdateFamilyMemberCommand command);
}
```

---

#### File 5: `domain/ports/in/familymember/LoadUseCase.java` (NEW)

```java
package com.care.appointment.domain.ports.in.familymember;

import com.care.appointment.domain.model.BeneficiaryFamilyMember;

import java.util.Optional;
import java.util.UUID;

/**
 * Use case for loading single family member.
 */
public interface LoadUseCase {
    Optional<BeneficiaryFamilyMember> getFamilyMemberById(UUID familyMemberId);
}
```

---

#### File 6: `domain/ports/in/familymember/DeleteUseCase.java` (NEW)

```java
package com.care.appointment.domain.ports.in.familymember;

import java.util.UUID;

/**
 * Use case for deleting family members (soft delete).
 *
 * Responsibilities:
 * - Mark as deleted
 * - Preserve audit trail
 * - Soft delete only (no hard delete)
 */
public interface DeleteUseCase {
    void deleteFamilyMember(UUID familyMemberId);
}
```

---

#### File 7: `domain/ports/in/familymember/LoadAllUseCase.java` (NEW)

```java
package com.care.appointment.domain.ports.in.familymember;

import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import com.sharedlib.core.filter.FilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Use case for loading all family members with filtering and pagination.
 */
public interface LoadAllUseCase {
    Page<BeneficiaryFamilyMember> loadAllFamilyMembers(
        UUID beneficiaryId, FilterRequest filter, Pageable pageable);
}
```

---

#### File 8: `domain/ports/out/familymember/FamilyMemberCrudPort.java` (NEW)

```java
package com.care.appointment.domain.ports.out.familymember;

import com.care.appointment.domain.model.BeneficiaryFamilyMember;

import java.util.Optional;
import java.util.UUID;

/**
 * Port for CRUD operations on family members.
 *
 * Implemented by: FamilyMemberDbAdapter
 * Uses: BeneficiaryFamilyMemberRepository
 */
public interface FamilyMemberCrudPort {

    /**
     * Saves new family member.
     */
    BeneficiaryFamilyMember save(BeneficiaryFamilyMember member);

    /**
     * Updates existing family member.
     */
    BeneficiaryFamilyMember update(BeneficiaryFamilyMember member);

    /**
     * Finds family member by ID.
     */
    Optional<BeneficiaryFamilyMember> findById(UUID id);

    /**
     * Deletes (soft delete) family member.
     */
    void delete(UUID id);

    /**
     * Checks if family member exists.
     */
    boolean existsById(UUID id);
}
```

---

#### File 9: `domain/ports/out/familymember/FamilyMemberSearchPort.java` (NEW)

```java
package com.care.appointment.domain.ports.out.familymember;

import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import com.sharedlib.core.filter.FilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Port for searching and querying family members.
 *
 * Implemented by: FamilyMemberDbAdapter
 * Uses: JpaSpecificationExecutor
 */
public interface FamilyMemberSearchPort {

    /**
     * Searches family members with filtering and pagination.
     */
    Page<BeneficiaryFamilyMember> search(
        UUID beneficiaryId, FilterRequest filter, Pageable pageable);

    /**
     * Lists all active family members for beneficiary.
     */
    List<BeneficiaryFamilyMember> findAllByBeneficiaryId(UUID beneficiaryId);

    /**
     * Checks if family member exists by name and DOB.
     */
    boolean existsByBeneficiaryIdAndFullNameAndDateOfBirth(
        UUID beneficiaryId, String fullName, java.time.LocalDate dob);

    /**
     * Finds by national ID (if unique constraint exists).
     */
    Optional<BeneficiaryFamilyMember> findByNationalId(String nationalId);
}
```

---

### 2.3 Application Layer - Commands & Mappers

#### File 10: `application/familymember/command/CreateFamilyMemberCommand.java` (NEW)

```java
package com.care.appointment.application.familymember.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFamilyMemberCommand {

    @Schema(description = "Beneficiary ID who owns this family member", required = true)
    @NotNull(message = "Beneficiary ID is required")
    private UUID beneficiaryId;

    @Schema(description = "Full name of family member", example = "أحمد محمد علي", required = true)
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 200, message = "Full name must be between 2 and 200 characters")
    private String fullName;

    @Schema(description = "Relation type", example = "SON", required = true)
    @NotBlank(message = "Relation type is required")
    private String relationType;

    @Schema(description = "Date of birth", example = "2010-05-15")
    private LocalDate dateOfBirth;

    @Schema(description = "National ID", example = "01234567890")
    @Size(max = 50, message = "National ID cannot exceed 50 characters")
    private String nationalId;

    @Schema(description = "Gender", example = "MALE", allowableValues = {"MALE", "FEMALE"})
    private String gender;

    @Schema(description = "Can this family member book appointments independently", example = "true")
    private Boolean canBookAppointments;

    @Schema(description = "User ID of who is creating this record")
    @NotNull(message = "Creator user ID is required")
    private UUID createdById;
}
```

---

#### File 11: `application/familymember/command/UpdateFamilyMemberCommand.java` (NEW)

```java
package com.care.appointment.application.familymember.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFamilyMemberCommand {

    @Schema(description = "Family Member ID to update", required = true)
    @NotNull(message = "Family member ID is required")
    private UUID familyMemberId;

    @Schema(description = "Full name", example = "أحمد محمد علي")
    @Size(min = 2, max = 200, message = "Full name must be between 2 and 200 characters")
    private String fullName;

    @Schema(description = "Relation type", example = "SON")
    private String relationType;

    @Schema(description = "Date of birth", example = "2010-05-15")
    private LocalDate dateOfBirth;

    @Schema(description = "National ID")
    @Size(max = 50, message = "National ID cannot exceed 50 characters")
    private String nationalId;

    @Schema(description = "Gender", allowableValues = {"MALE", "FEMALE"})
    private String gender;

    @Schema(description = "Can this family member book appointments")
    private Boolean canBookAppointments;

    @Schema(description = "User ID of who is updating this record")
    @NotNull(message = "Updater user ID is required")
    private UUID updatedById;
}
```

---

#### File 12: `application/familymember/mapper/FamilyMemberDomainMapper.java` (NEW)

```java
package com.care.appointment.application.familymember.mapper;

import com.care.appointment.application.familymember.command.CreateFamilyMemberCommand;
import com.care.appointment.application.familymember.command.UpdateFamilyMemberCommand;
import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for converting Commands to Domain Models.
 * Configuration: componentModel = "spring" for Spring injection
 */
@Mapper(componentModel = "spring")
public interface FamilyMemberDomainMapper {

    /**
     * Converts CreateFamilyMemberCommand to domain model.
     */
    @Mapping(target = "familyMemberId", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "isDeleted", constant = "false")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "rowVersion", ignore = true)
    BeneficiaryFamilyMember commandToModel(CreateFamilyMemberCommand command);

    /**
     * Updates domain model from UpdateCommand.
     * Only updates mutable fields.
     */
    @Mapping(target = "familyMemberId", ignore = true)
    @Mapping(target = "beneficiaryId", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdById", ignore = true)
    void updateModelFromCommand(UpdateFamilyMemberCommand command, BeneficiaryFamilyMember model);
}
```

---

### 2.4 Application Layer - Service

#### File 13: `application/familymember/service/FamilyMemberAdminService.java` (NEW)

This is a **substantial file** - key implementation service. [SEE DETAILED FILE BELOW]

---

### 2.5 Infrastructure Layer - Entity, Repository, Adapter

#### File 14: `infrastructure/db/entities/BeneficiaryFamilyMemberEntity.java` (NEW)

```java
package com.care.appointment.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * JPA Entity for family members.
 *
 * Indexes:
 * - ix_family_beneficiary: Query by beneficiary
 * - ix_family_national_id: Query by national ID
 * - ix_family_active: Filter by active status
 */
@Entity
@Table(
    name = "beneficiary_family_members",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "ux_family_member_per_beneficiary",
            columnNames = {"beneficiary_id", "full_name", "date_of_birth"}
        )
    },
    indexes = {
        @Index(name = "ix_family_beneficiary", columnList = "beneficiary_id"),
        @Index(name = "ix_family_national_id", columnList = "national_id"),
        @Index(name = "ix_family_active", columnList = "is_active")
    }
)
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryFamilyMemberEntity {

    @Id
    @UuidGenerator
    @Column(name = "family_member_id", nullable = false, updatable = false)
    private UUID familyMemberId;

    @Column(name = "beneficiary_id", nullable = false)
    private UUID beneficiaryId;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "relation_type", nullable = false, length = 50)
    private String relationType;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "national_id", length = 50)
    private String nationalId;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "can_book_appointments", nullable = false)
    private Boolean canBookAppointments;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    @Column(name = "created_by_user_id")
    private UUID createdById;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @Column(name = "updated_by_user_id")
    private UUID updatedById;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Version
    @Column(name = "row_version")
    private Long rowVersion;

    @PrePersist
    void prePersist() {
        if (canBookAppointments == null) canBookAppointments = Boolean.TRUE;
        if (isActive == null) isActive = Boolean.TRUE;
        if (isDeleted == null) isDeleted = Boolean.FALSE;
    }
}
```

---

#### File 15: `infrastructure/db/repositories/BeneficiaryFamilyMemberRepository.java` (NEW)

```java
package com.care.appointment.infrastructure.db.repositories;

import com.care.appointment.infrastructure.db.entities.BeneficiaryFamilyMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for family member persistence operations.
 *
 * Extends:
 * - JpaRepository: Basic CRUD
 * - JpaSpecificationExecutor: Dynamic filtering
 */
@Repository
public interface BeneficiaryFamilyMemberRepository extends
        JpaRepository<BeneficiaryFamilyMemberEntity, UUID>,
        JpaSpecificationExecutor<BeneficiaryFamilyMemberEntity> {

    /**
     * Finds all active family members for a beneficiary.
     */
    List<BeneficiaryFamilyMemberEntity> findByBeneficiaryIdAndIsActiveTrueAndIsDeletedFalse(
        UUID beneficiaryId);

    /**
     * Finds family member by national ID (if available).
     */
    Optional<BeneficiaryFamilyMemberEntity> findByNationalId(String nationalId);

    /**
     * Checks for duplicate family member.
     */
    boolean existsByBeneficiaryIdAndFullNameAndDateOfBirthAndIsDeletedFalse(
        UUID beneficiaryId, String fullName, LocalDate dateOfBirth);

    /**
     * Counts active family members for a beneficiary.
     */
    long countByBeneficiaryIdAndIsActiveTrueAndIsDeletedFalse(UUID beneficiaryId);

    /**
     * Custom query to find by multiple criteria.
     */
    @Query("""
        SELECT fm FROM BeneficiaryFamilyMemberEntity fm
        WHERE fm.beneficiaryId = :beneficiaryId
        AND fm.isActive = true
        AND fm.isDeleted = false
        ORDER BY fm.fullName ASC
        """)
    List<BeneficiaryFamilyMemberEntity> findActiveByBeneficiaryId(UUID beneficiaryId);
}
```

---

#### File 16: `infrastructure/db/adapter/FamilyMemberDbAdapter.java` (NEW)

```java
package com.care.appointment.infrastructure.db.adapter;

import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import com.care.appointment.domain.ports.out.familymember.FamilyMemberCrudPort;
import com.care.appointment.domain.ports.out.familymember.FamilyMemberSearchPort;
import com.care.appointment.infrastructure.db.entities.BeneficiaryFamilyMemberEntity;
import com.care.appointment.infrastructure.db.repositories.BeneficiaryFamilyMemberRepository;
import com.care.appointment.infrastructure.db.mapper.FamilyMemberJpaMapper;
import com.sharedlib.core.filter.FilterRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter implementing domain ports using JPA repository.
 *
 * Responsibilities:
 * - Convert between JPA entities and domain models
 * - Execute queries using repository
 * - Handle pagination and filtering
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FamilyMemberDbAdapter implements FamilyMemberCrudPort, FamilyMemberSearchPort {

    private final BeneficiaryFamilyMemberRepository repository;
    private final FamilyMemberJpaMapper mapper;

    @Override
    public BeneficiaryFamilyMember save(BeneficiaryFamilyMember member) {
        log.debug("Saving family member: {} for beneficiary: {}",
                  member.getFullName(), member.getBeneficiaryId());

        BeneficiaryFamilyMemberEntity entity = mapper.toEntity(member);
        BeneficiaryFamilyMemberEntity saved = repository.save(entity);

        log.info("Family member saved with ID: {}", saved.getFamilyMemberId());
        return mapper.toDomain(saved);
    }

    @Override
    public BeneficiaryFamilyMember update(BeneficiaryFamilyMember member) {
        log.debug("Updating family member: {}", member.getFamilyMemberId());

        BeneficiaryFamilyMemberEntity entity = mapper.toEntity(member);
        BeneficiaryFamilyMemberEntity updated = repository.save(entity);

        log.info("Family member updated: {}", updated.getFamilyMemberId());
        return mapper.toDomain(updated);
    }

    @Override
    public Optional<BeneficiaryFamilyMember> findById(UUID id) {
        log.debug("Finding family member by ID: {}", id);
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public void delete(UUID id) {
        log.debug("Deleting (soft) family member: {}", id);
        repository.findById(id).ifPresent(entity -> {
            entity.setIsDeleted(true);
            entity.setIsActive(false);
            repository.save(entity);
            log.info("Family member soft-deleted: {}", id);
        });
    }

    @Override
    public boolean existsById(UUID id) {
        return repository.existsById(id);
    }

    @Override
    public Page<BeneficiaryFamilyMember> search(
            UUID beneficiaryId, FilterRequest filter, Pageable pageable) {

        log.debug("Searching family members for beneficiary: {} with filter", beneficiaryId);

        Specification<BeneficiaryFamilyMemberEntity> spec =
            Specification.where(beneficiaryIdEquals(beneficiaryId))
                .and(isActiveTrueAndDeletedFalse())
                .and(applyFilter(filter));

        Page<BeneficiaryFamilyMemberEntity> page = repository.findAll(spec, pageable);
        List<BeneficiaryFamilyMember> models = page.getContent().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());

        return new PageImpl<>(models, pageable, page.getTotalElements());
    }

    @Override
    public List<BeneficiaryFamilyMember> findAllByBeneficiaryId(UUID beneficiaryId) {
        return repository.findActiveByBeneficiaryId(beneficiaryId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByBeneficiaryIdAndFullNameAndDateOfBirth(
            UUID beneficiaryId, String fullName, LocalDate dob) {
        return repository.existsByBeneficiaryIdAndFullNameAndDateOfBirthAndIsDeletedFalse(
                beneficiaryId, fullName, dob);
    }

    @Override
    public Optional<BeneficiaryFamilyMember> findByNationalId(String nationalId) {
        return repository.findByNationalId(nationalId).map(mapper::toDomain);
    }

    // === Specification methods for dynamic filtering ===

    private Specification<BeneficiaryFamilyMemberEntity> beneficiaryIdEquals(UUID beneficiaryId) {
        return (root, query, cb) -> cb.equal(root.get("beneficiaryId"), beneficiaryId);
    }

    private Specification<BeneficiaryFamilyMemberEntity> isActiveTrueAndDeletedFalse() {
        return (root, query, cb) -> cb.and(
            cb.equal(root.get("isActive"), true),
            cb.equal(root.get("isDeleted"), false)
        );
    }

    private Specification<BeneficiaryFamilyMemberEntity> applyFilter(FilterRequest filter) {
        if (filter == null || filter.isEmpty()) {
            return Specification.where(null);
        }
        // Implementation depends on FilterRequest structure from core-shared-lib
        return Specification.where(null);
    }
}
```

---

#### File 17: `infrastructure/db/mapper/FamilyMemberJpaMapper.java` (NEW)

```java
package com.care.appointment.infrastructure.db.mapper;

import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import com.care.appointment.infrastructure.db.entities.BeneficiaryFamilyMemberEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for JPA entity <-> domain model conversion.
 */
@Mapper(componentModel = "spring")
public interface FamilyMemberJpaMapper {

    /**
     * Converts JPA entity to domain model.
     */
    BeneficiaryFamilyMember toDomain(BeneficiaryFamilyMemberEntity entity);

    /**
     * Converts domain model to JPA entity.
     */
    BeneficiaryFamilyMemberEntity toEntity(BeneficiaryFamilyMember model);
}
```

---

### 2.6 Web Layer - DTOs & Controller

#### File 18: `web/dto/familymember/CreateFamilyMemberRequest.java` (NEW)

```java
package com.care.appointment.web.dto.familymember;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFamilyMemberRequest {

    @Schema(description = "Full name of family member", example = "أحمد محمد علي", required = true)
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 200, message = "Full name length must be between 2 and 200 characters")
    private String fullName;

    @Schema(
        description = "Relation type to beneficiary",
        example = "SON",
        requiredMode = Schema.RequiredMode.REQUIRED,
        allowableValues = {
            "SPOUSE", "SON", "DAUGHTER", "FATHER", "MOTHER", "BROTHER", "SISTER",
            "GRANDFATHER", "GRANDMOTHER", "GRANDSON", "GRANDDAUGHTER",
            "UNCLE", "AUNT", "COUSIN", "NEPHEW", "NIECE", "OTHER"
        }
    )
    @NotBlank(message = "Relation type is required")
    private String relationType;

    @Schema(description = "Date of birth", example = "2010-05-15")
    @PastOrPresent(message = "Date of birth cannot be in future")
    private LocalDate dateOfBirth;

    @Schema(description = "National ID (optional)", example = "01234567890")
    @Size(max = 50, message = "National ID cannot exceed 50 characters")
    private String nationalId;

    @Schema(description = "Gender", example = "MALE", allowableValues = {"MALE", "FEMALE"})
    private String gender;

    @Schema(
        description = "Whether this family member can book appointments independently",
        example = "true"
    )
    private Boolean canBookAppointments;
}
```

---

#### File 19: `web/dto/familymember/UpdateFamilyMemberRequest.java` (NEW)

```java
package com.care.appointment.web.dto.familymember;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFamilyMemberRequest {

    @Schema(description = "Full name of family member", example = "أحمد محمد علي")
    @Size(min = 2, max = 200, message = "Full name length must be between 2 and 200 characters")
    private String fullName;

    @Schema(
        description = "Relation type to beneficiary",
        example = "SON",
        allowableValues = {
            "SPOUSE", "SON", "DAUGHTER", "FATHER", "MOTHER", "BROTHER", "SISTER",
            "GRANDFATHER", "GRANDMOTHER", "GRANDSON", "GRANDDAUGHTER",
            "UNCLE", "AUNT", "COUSIN", "NEPHEW", "NIECE", "OTHER"
        }
    )
    private String relationType;

    @Schema(description = "Date of birth", example = "2010-05-15")
    @PastOrPresent(message = "Date of birth cannot be in future")
    private LocalDate dateOfBirth;

    @Schema(description = "National ID (optional)", example = "01234567890")
    @Size(max = 50, message = "National ID cannot exceed 50 characters")
    private String nationalId;

    @Schema(description = "Gender", allowableValues = {"MALE", "FEMALE"})
    private String gender;

    @Schema(description = "Whether this family member can book appointments independently")
    private Boolean canBookAppointments;
}
```

---

#### File 20: `web/dto/familymember/FamilyMemberResponse.java` (NEW)

```java
package com.care.appointment.web.dto.familymember;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class FamilyMemberResponse {

    @Schema(description = "Unique identifier for family member")
    private UUID familyMemberId;

    @Schema(description = "Beneficiary ID who owns this family member")
    private UUID beneficiaryId;

    @Schema(description = "Full name")
    private String fullName;

    @Schema(description = "Relation type to beneficiary")
    private String relationType;

    @Schema(description = "Date of birth")
    private LocalDate dateOfBirth;

    @Schema(description = "National ID")
    private String nationalId;

    @Schema(description = "Gender")
    private String gender;

    @Schema(description = "Can book appointments independently")
    private Boolean canBookAppointments;

    @Schema(description = "Is this record active")
    private Boolean isActive;

    @Schema(description = "When this record was created")
    private Instant createdAt;

    @Schema(description = "When this record was last updated")
    private Instant updatedAt;
}
```

---

#### File 21: `web/mapper/FamilyMemberWebMapper.java` (NEW)

```java
package com.care.appointment.web.mapper;

import com.care.appointment.application.familymember.command.CreateFamilyMemberCommand;
import com.care.appointment.application.familymember.command.UpdateFamilyMemberCommand;
import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import com.care.appointment.web.dto.familymember.CreateFamilyMemberRequest;
import com.care.appointment.web.dto.familymember.FamilyMemberResponse;
import com.care.appointment.web.dto.familymember.UpdateFamilyMemberRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for web DTO <-> domain model conversion.
 */
@Mapper(componentModel = "spring")
public interface FamilyMemberWebMapper {

    /**
     * Converts create request to command.
     */
    @Mapping(target = "beneficiaryId", ignore = true) // Set in controller
    @Mapping(target = "createdById", ignore = true)    // Set from SecurityContext
    CreateFamilyMemberCommand createRequestToCommand(CreateFamilyMemberRequest request);

    /**
     * Converts update request to command.
     */
    @Mapping(target = "familyMemberId", ignore = true) // Set in controller
    @Mapping(target = "updatedById", ignore = true)    // Set from SecurityContext
    UpdateFamilyMemberCommand updateRequestToCommand(UpdateFamilyMemberRequest request);

    /**
     * Converts domain model to response DTO.
     */
    FamilyMemberResponse toResponse(BeneficiaryFamilyMember model);
}
```

---

#### File 22: `web/controller/BeneficiaryFamilyController.java` (NEW)

```java
package com.care.appointment.web.controller;

import com.care.appointment.application.familymember.command.CreateFamilyMemberCommand;
import com.care.appointment.application.familymember.command.UpdateFamilyMemberCommand;
import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import com.care.appointment.domain.ports.in.familymember.*;
import com.care.appointment.web.dto.familymember.*;
import com.care.appointment.web.mapper.FamilyMemberWebMapper;
import com.sharedlib.core.filter.FilterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for family member management.
 *
 * Endpoints:
 * - POST   /api/{admin|mobile}/beneficiaries/{beneficiaryId}/family
 * - GET    /api/{admin|mobile}/beneficiaries/{beneficiaryId}/family
 * - GET    /api/{admin|mobile}/beneficiaries/{beneficiaryId}/family/{familyMemberId}
 * - PUT    /api/{admin|mobile}/beneficiaries/{beneficiaryId}/family/{familyMemberId}
 * - DELETE /api/{admin|mobile}/beneficiaries/{beneficiaryId}/family/{familyMemberId}
 */
@RestController
@RequestMapping({
    "/api/admin/beneficiaries/{beneficiaryId}/family",
    "/api/mobile/beneficiaries/{beneficiaryId}/family"
})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Family Members", description = "Manage family members of beneficiaries")
public class BeneficiaryFamilyController {

    private final SaveUseCase saveFamilyMemberUseCase;
    private final UpdateUseCase updateFamilyMemberUseCase;
    private final LoadUseCase loadFamilyMemberUseCase;
    private final DeleteUseCase deleteFamilyMemberUseCase;
    private final LoadAllUseCase loadAllFamilyMembersUseCase;
    private final FamilyMemberWebMapper mapper;

    /**
     * Creates a new family member for the beneficiary.
     *
     * Allows tracking and booking appointments for family members.
     *
     * Request body:
     * {
     *   "fullName": "أحمد محمد علي",
     *   "relationType": "SON",
     *   "dateOfBirth": "2010-05-15",
     *   "gender": "MALE",
     *   "canBookAppointments": true
     * }
     *
     * @param beneficiaryId The beneficiary UUID
     * @param request Family member data
     * @return Created family member with 201 status
     */
    @PostMapping
    @Operation(
        summary = "Add family member",
        description = "Creates a new family member for the beneficiary"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "Family member created successfully",
            content = @Content(schema = @Schema(implementation = FamilyMemberResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "404", description = "Beneficiary not found"),
        @ApiResponse(responseCode = "409", description = "Family member already exists")
    })
    public ResponseEntity<FamilyMemberResponse> addFamilyMember(
            @PathVariable UUID beneficiaryId,
            @Valid @RequestBody CreateFamilyMemberRequest request) {

        log.info("Adding family member for beneficiary: {}", beneficiaryId);

        // Get current user from security context
        UUID createdById = getCurrentUserId();

        // Convert request to command
        CreateFamilyMemberCommand command = mapper.createRequestToCommand(request);
        command.setBeneficiaryId(beneficiaryId);
        command.setCreatedById(createdById);

        // Execute use case
        BeneficiaryFamilyMember created = saveFamilyMemberUseCase.saveFamilyMember(command);

        log.info("Family member created: {} for beneficiary: {}",
                 created.getFamilyMemberId(), beneficiaryId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(created));
    }

    /**
     * Gets all family members for a beneficiary with pagination.
     *
     * Used in mobile app to show family list when booking appointments.
     *
     * Query parameters:
     * - page: Page number (0-indexed)
     * - size: Page size
     * - sort: Sort criteria (e.g., fullName,asc)
     *
     * @param beneficiaryId The beneficiary UUID
     * @param filter Filter criteria
     * @param pageable Pagination info
     * @return Page of family members
     */
    @GetMapping
    @Operation(
        summary = "Get family members list",
        description = "Lists all active family members for a beneficiary with pagination"
    )
    @ApiResponse(responseCode = "200", description = "List retrieved successfully")
    public ResponseEntity<Page<FamilyMemberResponse>> getFamilyMembers(
            @PathVariable UUID beneficiaryId,
            @ModelAttribute FilterRequest filter,
            Pageable pageable) {

        log.debug("Getting family members for beneficiary: {}", beneficiaryId);

        Page<BeneficiaryFamilyMember> page = loadAllFamilyMembersUseCase
            .loadAllFamilyMembers(beneficiaryId, filter, pageable);

        Page<FamilyMemberResponse> response = page.map(mapper::toResponse);

        return ResponseEntity.ok(response);
    }

    /**
     * Gets a specific family member by ID.
     *
     * @param beneficiaryId The beneficiary UUID
     * @param familyMemberId The family member UUID
     * @return Family member details
     */
    @GetMapping("/{familyMemberId}")
    @Operation(summary = "Get family member details")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Family member found"),
        @ApiResponse(responseCode = "404", description = "Family member not found")
    })
    public ResponseEntity<FamilyMemberResponse> getFamilyMember(
            @PathVariable UUID beneficiaryId,
            @PathVariable UUID familyMemberId) {

        log.debug("Getting family member: {} for beneficiary: {}",
                  familyMemberId, beneficiaryId);

        BeneficiaryFamilyMember member = loadFamilyMemberUseCase
            .getFamilyMemberById(familyMemberId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Family member not found: " + familyMemberId));

        // Verify family member belongs to beneficiary
        if (!member.getBeneficiaryId().equals(beneficiaryId)) {
            throw new IllegalArgumentException("Family member does not belong to beneficiary");
        }

        return ResponseEntity.ok(mapper.toResponse(member));
    }

    /**
     * Updates a family member's information.
     *
     * Request body (all fields optional):
     * {
     *   "fullName": "أحمد محمد علي",
     *   "relationType": "GRANDSON",
     *   "gender": "MALE",
     *   "canBookAppointments": false
     * }
     *
     * @param beneficiaryId The beneficiary UUID
     * @param familyMemberId The family member UUID to update
     * @param request Update data
     * @return Updated family member
     */
    @PutMapping("/{familyMemberId}")
    @Operation(summary = "Update family member")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Family member updated"),
        @ApiResponse(responseCode = "404", description = "Family member not found")
    })
    public ResponseEntity<FamilyMemberResponse> updateFamilyMember(
            @PathVariable UUID beneficiaryId,
            @PathVariable UUID familyMemberId,
            @Valid @RequestBody UpdateFamilyMemberRequest request) {

        log.info("Updating family member: {} for beneficiary: {}",
                 familyMemberId, beneficiaryId);

        // Get current user
        UUID updatedById = getCurrentUserId();

        // Convert request to command
        UpdateFamilyMemberCommand command = mapper.updateRequestToCommand(request);
        command.setFamilyMemberId(familyMemberId);
        command.setUpdatedById(updatedById);

        // Execute use case
        BeneficiaryFamilyMember updated = updateFamilyMemberUseCase
            .updateFamilyMember(command);

        // Verify belongs to beneficiary
        if (!updated.getBeneficiaryId().equals(beneficiaryId)) {
            throw new IllegalArgumentException("Family member does not belong to beneficiary");
        }

        log.info("Family member updated: {}", familyMemberId);

        return ResponseEntity.ok(mapper.toResponse(updated));
    }

    /**
     * Deletes (soft delete) a family member.
     *
     * @param beneficiaryId The beneficiary UUID
     * @param familyMemberId The family member UUID to delete
     * @return No content response
     */
    @DeleteMapping("/{familyMemberId}")
    @Operation(summary = "Delete family member")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Family member deleted"),
        @ApiResponse(responseCode = "404", description = "Family member not found")
    })
    public ResponseEntity<Void> deleteFamilyMember(
            @PathVariable UUID beneficiaryId,
            @PathVariable UUID familyMemberId) {

        log.info("Deleting family member: {} for beneficiary: {}",
                 familyMemberId, beneficiaryId);

        // Verify family member exists and belongs to beneficiary
        BeneficiaryFamilyMember member = loadFamilyMemberUseCase
            .getFamilyMemberById(familyMemberId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Family member not found: " + familyMemberId));

        if (!member.getBeneficiaryId().equals(beneficiaryId)) {
            throw new IllegalArgumentException("Family member does not belong to beneficiary");
        }

        // Execute delete use case
        deleteFamilyMemberUseCase.deleteFamilyMember(familyMemberId);

        log.info("Family member deleted: {}", familyMemberId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Gets current user ID from security context.
     */
    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // Extract user ID from JWT token or principal
        // Implementation depends on your security configuration
        return UUID.randomUUID(); // Placeholder
    }
}
```

---

#### File 23: `application/familymember/service/FamilyMemberAdminService.java` (NEW)

```java
package com.care.appointment.application.familymember.service;

import com.care.appointment.application.familymember.command.CreateFamilyMemberCommand;
import com.care.appointment.application.familymember.command.UpdateFamilyMemberCommand;
import com.care.appointment.application.familymember.mapper.FamilyMemberDomainMapper;
import com.care.appointment.domain.model.BeneficiaryFamilyMember;
import com.care.appointment.domain.ports.in.familymember.*;
import com.care.appointment.domain.ports.out.familymember.FamilyMemberCrudPort;
import com.care.appointment.domain.ports.out.familymember.FamilyMemberSearchPort;
import com.sharedlib.core.filter.FilterRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Service implementing all family member use cases.
 *
 * Responsibilities:
 * - Validate inputs
 * - Apply business rules
 * - Coordinate with ports
 * - Maintain transactional consistency
 *
 * Business Rules:
 * 1. Prevent duplicate family members (same name + DOB per beneficiary)
 * 2. Validate relation type enum
 * 3. Validate gender enum
 * 4. Cannot delete if has active appointments (if implemented)
 * 5. Soft delete only (no hard delete)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FamilyMemberAdminService implements
    SaveUseCase, UpdateUseCase, LoadUseCase, DeleteUseCase, LoadAllUseCase {

    private final FamilyMemberCrudPort crudPort;
    private final FamilyMemberSearchPort searchPort;
    private final FamilyMemberDomainMapper mapper;

    /**
     * Creates a new family member for a beneficiary.
     *
     * Validations:
     * 1. Beneficiary must exist (optional - depends on requirements)
     * 2. No duplicate (name + DOB combination)
     * 3. Valid relation type
     * 4. Valid gender
     * 5. DOB in past if provided
     *
     * @param command Create request with family member data
     * @return Created family member
     * @throws IllegalArgumentException if validation fails
     */
    @Override
    public BeneficiaryFamilyMember saveFamilyMember(CreateFamilyMemberCommand command) {
        log.info("Creating family member '{}' for beneficiary: {}",
                 command.getFullName(), command.getBeneficiaryId());

        // Validation 1: Check for duplicates
        if (searchPort.existsByBeneficiaryIdAndFullNameAndDateOfBirth(
                command.getBeneficiaryId(),
                command.getFullName(),
                command.getDateOfBirth())) {

            log.warn("Duplicate family member attempt: {} for beneficiary: {}",
                     command.getFullName(), command.getBeneficiaryId());
            throw new IllegalArgumentException(
                "Family member with same name and date of birth already exists");
        }

        // Validation 2: Validate relation type
        validateRelationType(command.getRelationType());

        // Validation 3: Validate gender
        if (command.getGender() != null) {
            validateGender(command.getGender());
        }

        // Convert command to domain model
        BeneficiaryFamilyMember member = mapper.commandToModel(command);

        // Set defaults
        if (member.getCanBookAppointments() == null) {
            member.setCanBookAppointments(true);
        }

        // Persist
        BeneficiaryFamilyMember saved = crudPort.save(member);

        log.info("Family member created successfully with ID: {}", saved.getFamilyMemberId());
        return saved;
    }

    /**
     * Updates an existing family member.
     *
     * Validations:
     * 1. Family member must exist
     * 2. Cannot change beneficiary ID
     * 3. No duplicate (name + DOB) if name/DOB changed
     * 4. Valid enum values if provided
     *
     * @param command Update request
     * @return Updated family member
     * @throws IllegalArgumentException if validation fails
     */
    @Override
    public BeneficiaryFamilyMember updateFamilyMember(UpdateFamilyMemberCommand command) {
        log.info("Updating family member: {}", command.getFamilyMemberId());

        // Load existing
        BeneficiaryFamilyMember existing = crudPort.findById(command.getFamilyMemberId())
            .orElseThrow(() -> new IllegalArgumentException(
                "Family member not found: " + command.getFamilyMemberId()));

        // Check if deleted
        if (existing.getIsDeleted()) {
            throw new IllegalArgumentException("Cannot update deleted family member");
        }

        // Validate enums if provided
        if (command.getRelationType() != null) {
            validateRelationType(command.getRelationType());
        }

        if (command.getGender() != null) {
            validateGender(command.getGender());
        }

        // Check for duplicates if name or DOB changed
        if ((command.getFullName() != null && !command.getFullName().equals(existing.getFullName())) ||
            (command.getDateOfBirth() != null && !command.getDateOfBirth().equals(existing.getDateOfBirth()))) {

            if (searchPort.existsByBeneficiaryIdAndFullNameAndDateOfBirth(
                    existing.getBeneficiaryId(),
                    command.getFullName() != null ? command.getFullName() : existing.getFullName(),
                    command.getDateOfBirth() != null ? command.getDateOfBirth() : existing.getDateOfBirth())) {

                throw new IllegalArgumentException(
                    "Another family member with same name and date of birth already exists");
            }
        }

        // Apply updates
        mapper.updateModelFromCommand(command, existing);
        existing.setUpdatedById(command.getUpdatedById());

        // Persist
        BeneficiaryFamilyMember updated = crudPort.update(existing);

        log.info("Family member updated successfully: {}", updated.getFamilyMemberId());
        return updated;
    }

    /**
     * Loads single family member by ID.
     *
     * @param familyMemberId The family member UUID
     * @return Optional containing family member if found
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<BeneficiaryFamilyMember> getFamilyMemberById(UUID familyMemberId) {
        log.debug("Loading family member by ID: {}", familyMemberId);
        return crudPort.findById(familyMemberId);
    }

    /**
     * Soft deletes a family member.
     *
     * Marks as deleted but preserves data for audit trail.
     *
     * @param familyMemberId The family member UUID
     * @throws IllegalArgumentException if not found
     */
    @Override
    public void deleteFamilyMember(UUID familyMemberId) {
        log.info("Deleting family member: {}", familyMemberId);

        BeneficiaryFamilyMember member = crudPort.findById(familyMemberId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Family member not found: " + familyMemberId));

        if (member.getIsDeleted()) {
            log.warn("Family member already deleted: {}", familyMemberId);
            throw new IllegalArgumentException("Family member is already deleted");
        }

        member.setIsDeleted(true);
        member.setIsActive(false);
        crudPort.update(member);

        log.info("Family member soft-deleted successfully: {}", familyMemberId);
    }

    /**
     * Loads all family members with filtering and pagination.
     *
     * @param beneficiaryId The beneficiary UUID
     * @param filter Filter criteria
     * @param pageable Pagination info
     * @return Page of family members
     */
    @Override
    @Transactional(readOnly = true)
    public Page<BeneficiaryFamilyMember> loadAllFamilyMembers(
            UUID beneficiaryId, FilterRequest filter, Pageable pageable) {

        log.debug("Loading family members for beneficiary: {} with filter and pagination",
                  beneficiaryId);

        return searchPort.search(beneficiaryId, filter, pageable);
    }

    // === VALIDATION METHODS ===

    private void validateRelationType(String relationType) {
        try {
            com.care.appointment.domain.enums.RelationType.fromValue(relationType);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid relation type: {}", relationType);
            throw new IllegalArgumentException("Invalid relation type: " + relationType);
        }
    }

    private void validateGender(String gender) {
        try {
            com.care.appointment.domain.enums.Gender.fromValue(gender);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid gender: {}", gender);
            throw new IllegalArgumentException("Invalid gender: " + gender);
        }
    }
}
```

---

## DATABASE MIGRATIONS

### Liquibase Changesets (in order of execution)

#### Changeset 1: Add columns to beneficiaries table

```xml
<changeSet id="1" author="appointment-team">
    <comment>Add new fields for beneficiary enhancements</comment>

    <addColumn tableName="beneficiaries" schemaName="public">
        <column name="date_of_birth" type="date"/>
        <column name="gender" type="varchar(10)"/>
        <column name="profile_photo_url" type="varchar(500)"/>
        <column name="registration_status" type="varchar(20)" defaultValue="QUICK"/>
        <column name="registration_completed_at" type="timestamp"/>
        <column name="registration_completed_by_user_id" type="uuid"/>
        <column name="preferred_language" type="varchar(5)" defaultValue="EN"/>
    </addColumn>

    <createIndex indexName="ix_appt_beneficiaries_mobile_dob" tableName="beneficiaries" schemaName="public">
        <column name="mobile_number"/>
        <column name="date_of_birth"/>
    </createIndex>

    <createIndex indexName="ix_appt_beneficiaries_registration_status" tableName="beneficiaries" schemaName="public">
        <column name="registration_status"/>
    </createIndex>
</changeSet>
```

#### Changeset 2: Create family_members table

```xml
<changeSet id="2" author="appointment-team">
    <comment>Create beneficiary_family_members table</comment>

    <createTable tableName="beneficiary_family_members" schemaName="public">
        <column name="family_member_id" type="uuid">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <column name="beneficiary_id" type="uuid">
            <constraints nullable="false"/>
        </column>
        <column name="full_name" type="varchar(200)">
            <constraints nullable="false"/>
        </column>
        <column name="relation_type" type="varchar(50)">
            <constraints nullable="false"/>
        </column>
        <column name="date_of_birth" type="date"/>
        <column name="national_id" type="varchar(50)"/>
        <column name="gender" type="varchar(10)"/>
        <column name="can_book_appointments" type="boolean">
            <constraints nullable="false"/>
        </column>
        <column name="is_active" type="boolean">
            <constraints nullable="false"/>
        </column>
        <column name="is_deleted" type="boolean">
            <constraints nullable="false"/>
        </column>
        <column name="created_by_user_id" type="uuid"/>
        <column name="created_at" type="timestamp">
            <constraints nullable="false"/>
        </column>
        <column name="updated_by_user_id" type="uuid"/>
        <column name="updated_at" type="timestamp"/>
        <column name="row_version" type="bigint"/>
    </createTable>

    <createIndex indexName="ix_family_beneficiary" tableName="beneficiary_family_members" schemaName="public">
        <column name="beneficiary_id"/>
    </createIndex>

    <createIndex indexName="ix_family_national_id" tableName="beneficiary_family_members" schemaName="public">
        <column name="national_id"/>
    </createIndex>

    <createIndex indexName="ix_family_active" tableName="beneficiary_family_members" schemaName="public">
        <column name="is_active"/>
    </createIndex>

    <addUniqueConstraint columnNames="beneficiary_id,full_name,date_of_birth"
                        constraintName="ux_family_member_per_beneficiary"
                        tableName="beneficiary_family_members" schemaName="public"/>
</changeSet>
```

---

## TESTING STRATEGY

### Phase 1 Testing (Beneficiary)

**Unit Tests**: `AppointmentServiceApplicationTests`
- ✅ Beneficiary model creation
- ✅ Gender enum conversion
- ✅ Registration status enum conversion
- ✅ BeneficiaryVerificationService.verifyByMobileAndDOB()
- ✅ BeneficiaryVerificationService.verifyByMobileAndMotherName()

**Integration Tests**: `BeneficiaryRepositoryTests`
- ✅ findByMobileNumberAndDateOfBirth() query
- ✅ findByMobileNumberAndMotherName() query
- ✅ existsByNationalId() check
- ✅ existsByMobileNumber() check

**API Tests**: `MobileBeneficiaryControllerTests`
- ✅ POST /api/mobile/beneficiaries/auth/verify - valid credentials
- ✅ POST /api/mobile/beneficiaries/auth/verify - invalid credentials
- ✅ POST /api/mobile/beneficiaries/auth/verify - validation errors

### Phase 2 Testing (Family Members)

**Unit Tests**: `FamilyMemberAdminServiceTests`
- ✅ Create family member - success
- ✅ Create family member - duplicate prevention
- ✅ Create family member - validation
- ✅ Update family member - success
- ✅ Update family member - not found
- ✅ Delete family member - soft delete
- ✅ Load family members - pagination

**Integration Tests**: `BeneficiaryFamilyMemberRepositoryTests`
- ✅ findByBeneficiaryIdAndIsActiveTrueAndIsDeletedFalse()
- ✅ existsByBeneficiaryIdAndFullNameAndDateOfBirth()
- ✅ findActiveByBeneficiaryId()

**API Tests**: `BeneficiaryFamilyControllerTests`
- ✅ POST /api/admin/beneficiaries/{id}/family - create
- ✅ GET /api/admin/beneficiaries/{id}/family - list with pagination
- ✅ GET /api/admin/beneficiaries/{id}/family/{memberId} - get one
- ✅ PUT /api/admin/beneficiaries/{id}/family/{memberId} - update
- ✅ DELETE /api/admin/beneficiaries/{id}/family/{memberId} - delete

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- ✅ All tests passing (unit + integration + API)
- ✅ Code review approved
- ✅ Database migration scripts validated
- ✅ Swagger documentation generated
- ✅ Performance benchmarks acceptable

### Deployment
- ✅ Run Liquibase migrations
- ✅ Deploy service JAR
- ✅ Verify service health endpoint
- ✅ Check logs for errors

### Post-Deployment
- ✅ Smoke tests on API endpoints
- ✅ Database queries working
- ✅ Mobile app can authenticate
- ✅ Monitor error rates for 24 hours

---

**END OF PHASE 1 & 2 DETAILED PLAN**

---

## NEXT PHASES (Summary)

### Phase 3: Documents Module
- Similar structure to Family Members
- Add file upload handling
- Document versioning

### Phase 4: Mobile Registration APIs
- Quick registration endpoint
- Full registration endpoint
- Registration status tracking

### Phase 5: Referrals Module
- Create/update/delete referrals
- Referral status tracking
- Inter-service communication

---

**Prepared by**: Claude AI Assistant
**Date**: 2025-11-01
**Status**: Ready for Implementation

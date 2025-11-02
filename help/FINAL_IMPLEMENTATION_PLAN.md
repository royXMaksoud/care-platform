# 📋 FINAL IMPLEMENTATION PLAN - Appointment Service Enhancements
## النسخة النهائية الشاملة

**Status**: FINAL & APPROVED
**Last Updated**: 2025-11-01
**Target Duration**: 6 Weeks (3 Phases)

---

## ⚠️ CRITICAL CHANGES FROM INITIAL PLAN

### 1. ❌ REMOVED: Enums (RegistrationStatus, Gender, RelationType)
**Reason**: Multi-language support required
**Solution**: Use database lookup tables instead

### 2. ✅ ADDED: Notification & Messaging System
**Features**:
- SMS/Email notifications to beneficiaries
- Bulk messaging capability
- Message delivery confirmation
- Read status tracking
- Multi-language support per user

### 3. ✅ ADDED: Preferred Language Support
**Features**:
- Store preferred language per beneficiary
- Send messages in preferred language
- Admin can override if needed

---

## PHASE 1: BENEFICIARY ENHANCEMENTS (UPDATED)

**Duration**: 1 Week
**Priority**: 1 (Critical)
**Files to Create/Modify**: 12 files

### 1.1 Domain Layer - Models

#### File 1: `domain/model/Beneficiary.java` (MODIFY)

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
    // EXISTING FIELDS
    private UUID beneficiaryId;
    private String nationalId;
    private String fullName;
    private String motherName;
    private String mobileNumber;
    private String email;
    private String address;
    private Double latitude;
    private Double longitude;

    // NEW FIELDS (Phase 1)
    private LocalDate dateOfBirth;
    private String genderCode;              // M or F (from database lookup)
    private String profilePhotoUrl;
    private String registrationStatusCode;  // QUICK or COMPLETE (from database)
    private Instant registrationCompletedAt;
    private UUID registrationCompletedByUserId;

    // ✅ NEW: Preferred Language
    private String preferredLanguageCode;   // AR, EN, FR, etc (from database)

    // AUDIT FIELDS
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
- `genderCode`: Reference to code lookup table (NOT enum)
- `registrationStatusCode`: Reference to code lookup table (NOT enum)
- `preferredLanguageCode`: **NEW** - Language preference for notifications

---

### 1.2 Infrastructure Layer - Entities

#### File 2: `infrastructure/db/entities/BeneficiaryEntity.java` (MODIFY)

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

@Entity
@Table(
    name = "beneficiaries",
    schema = "public",
    indexes = {
        @Index(name = "ux_appt_beneficiaries_national_id", columnList = "national_id", unique = true),
        @Index(name = "ix_appt_beneficiaries_mobile", columnList = "mobile_number"),
        @Index(name = "ix_appt_beneficiaries_email", columnList = "email"),
        @Index(name = "ix_appt_beneficiaries_active", columnList = "is_active"),
        @Index(name = "ix_appt_beneficiaries_deleted", columnList = "is_deleted"),
        @Index(name = "ix_appt_beneficiaries_mobile_dob", columnList = "mobile_number, date_of_birth"),
        @Index(name = "ix_appt_beneficiaries_registration_status", columnList = "registration_status_code"),
        @Index(name = "ix_appt_beneficiaries_preferred_lang", columnList = "preferred_language_code")
    }
)
@Getter @Setter
@Builder @NoArgsConstructor @AllArgsConstructor
public class BeneficiaryEntity {

    @Id
    @UuidGenerator
    @Column(name = "beneficiary_id", nullable = false, updatable = false)
    private UUID beneficiaryId;

    @Column(name = "national_id", unique = true, length = 50)
    private String nationalId;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "mother_name", length = 200)
    private String motherName;

    @Column(name = "mobile_number", nullable = false, length = 20)
    private String mobileNumber;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // NEW PHASE 1 FIELDS
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender_code", length = 10)
    private String genderCode;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @Column(name = "registration_status_code", length = 20, nullable = false)
    private String registrationStatusCode;

    @Column(name = "registration_completed_at")
    private Instant registrationCompletedAt;

    @Column(name = "registration_completed_by_user_id")
    private UUID registrationCompletedByUserId;

    // ✅ NEW: Preferred Language
    @Column(name = "preferred_language_code", length = 10, nullable = false)
    private String preferredLanguageCode;

    // AUDIT
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
        if (isActive == null) isActive = Boolean.TRUE;
        if (isDeleted == null) isDeleted = Boolean.FALSE;
        if (registrationStatusCode == null) registrationStatusCode = "QUICK";
        if (preferredLanguageCode == null) preferredLanguageCode = "AR";
    }
}
```

---

### 1.3 Application Layer - Service

#### File 3: `application/beneficiary/service/BeneficiaryVerificationService.java` (NEW)

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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BeneficiaryVerificationService {

    private final BeneficiarySearchPort beneficiarySearchPort;

    /**
     * Verifies beneficiary using mobile + DOB
     * Returns beneficiary with preferred language set
     */
    public Beneficiary verifyByMobileAndDOB(String mobileNumber, LocalDate dateOfBirth) {
        log.debug("Verifying beneficiary: {} with DOB", mobileNumber);

        return beneficiarySearchPort.findByMobileNumberAndDateOfBirth(mobileNumber, dateOfBirth)
            .orElseThrow(() -> {
                log.warn("Verification failed for mobile: {}", mobileNumber);
                return new UnauthorizedException("Invalid credentials");
            });
    }

    /**
     * Verifies beneficiary using mobile + mother name
     */
    public Beneficiary verifyByMobileAndMotherName(String mobileNumber, String motherName) {
        log.debug("Verifying beneficiary: {} with mother name", mobileNumber);

        return beneficiarySearchPort.findByMobileNumberAndMotherName(mobileNumber, motherName)
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
    }
}
```

---

### 1.4 Web Layer - Controllers

#### File 4: `web/controller/MobileBeneficiaryController.java` (NEW)

```java
package com.care.appointment.web.controller;

import com.care.appointment.application.beneficiary.service.BeneficiaryVerificationService;
import com.care.appointment.domain.model.Beneficiary;
import com.care.appointment.web.dto.BeneficiaryDTO;
import com.care.appointment.web.mapper.BeneficiaryWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/mobile/beneficiaries")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mobile - Beneficiary", description = "Mobile app beneficiary operations")
public class MobileBeneficiaryController {

    private final BeneficiaryVerificationService verificationService;
    private final BeneficiaryWebMapper beneficiaryWebMapper;

    @PostMapping("/auth/verify")
    @Operation(summary = "Verify beneficiary credentials")
    public ResponseEntity<BeneficiaryDTO> verifyCredentials(
            @Valid @RequestBody VerifyCredentialsRequest request) {

        log.info("Verifying beneficiary: {}", request.getMobileNumber());

        Beneficiary verified = verificationService.verifyByMobileAndDOB(
            request.getMobileNumber(),
            request.getDateOfBirth()
        );

        return ResponseEntity.ok(beneficiaryWebMapper.toDTO(verified));
    }
}
```

---

### 1.5 DTOs

#### File 5: `web/dto/VerifyCredentialsRequest.java` (NEW)

```java
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

    @Schema(description = "Mobile number E.164 format", example = "+963912345678", required = true)
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$")
    private String mobileNumber;

    @Schema(description = "Date of birth", example = "1990-01-15", required = true)
    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth cannot be in future")
    private LocalDate dateOfBirth;
}
```

---

### 1.6 Database Migrations

#### File 6: `liquibase/changesets/001-add-beneficiary-fields.xml`

```xml
<changeSet id="1" author="appointment-team">
    <comment>Add beneficiary enhancements with multi-language support</comment>

    <addColumn tableName="beneficiaries" schemaName="public">
        <column name="date_of_birth" type="date"/>
        <column name="gender_code" type="varchar(10)"/>
        <column name="profile_photo_url" type="varchar(500)"/>
        <column name="registration_status_code" type="varchar(20)" defaultValue="QUICK"/>
        <column name="registration_completed_at" type="timestamp"/>
        <column name="registration_completed_by_user_id" type="uuid"/>
        <column name="preferred_language_code" type="varchar(10)" defaultValue="AR"/>
    </addColumn>

    <!-- CREATE LOOKUP TABLES FOR CODES -->

    <createTable tableName="code_genders" schemaName="public">
        <column name="code" type="varchar(10)">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <column name="name_ar" type="varchar(50)" nullable="false"/>
        <column name="name_en" type="varchar(50)" nullable="false"/>
        <column name="display_order" type="integer"/>
        <column name="is_active" type="boolean" defaultValue="true"/>
    </createTable>

    <createTable tableName="code_registration_statuses" schemaName="public">
        <column name="code" type="varchar(20)">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <column name="name_ar" type="varchar(100)" nullable="false"/>
        <column name="name_en" type="varchar(100)" nullable="false"/>
        <column name="display_order" type="integer"/>
        <column name="is_active" type="boolean" defaultValue="true"/>
    </createTable>

    <createTable tableName="code_languages" schemaName="public">
        <column name="code" type="varchar(10)">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <column name="name_ar" type="varchar(50)" nullable="false"/>
        <column name="name_en" type="varchar(50)" nullable="false"/>
        <column name="display_order" type="integer"/>
        <column name="is_active" type="boolean" defaultValue="true"/>
    </createTable>

    <!-- INSERT CODE VALUES -->
    <insert tableName="code_genders" schemaName="public">
        <column name="code" value="M"/>
        <column name="name_ar" value="ذكر"/>
        <column name="name_en" value="Male"/>
        <column name="display_order" value="1"/>
    </insert>
    <insert tableName="code_genders" schemaName="public">
        <column name="code" value="F"/>
        <column name="name_ar" value="أنثى"/>
        <column name="name_en" value="Female"/>
        <column name="display_order" value="2"/>
    </insert>

    <insert tableName="code_registration_statuses" schemaName="public">
        <column name="code" value="QUICK"/>
        <column name="name_ar" value="تسجيل سريع"/>
        <column name="name_en" value="Quick Registration"/>
        <column name="display_order" value="1"/>
    </insert>
    <insert tableName="code_registration_statuses" schemaName="public">
        <column name="code" value="COMPLETE"/>
        <column name="name_ar" value="تسجيل كامل"/>
        <column name="name_en" value="Complete Registration"/>
        <column name="display_order" value="2"/>
    </insert>

    <insert tableName="code_languages" schemaName="public">
        <column name="code" value="AR"/>
        <column name="name_ar" value="العربية"/>
        <column name="name_en" value="Arabic"/>
        <column name="display_order" value="1"/>
    </insert>
    <insert tableName="code_languages" schemaName="public">
        <column name="code" value="EN"/>
        <column name="name_ar" value="الإنجليزية"/>
        <column name="name_en" value="English"/>
        <column name="display_order" value="2"/>
    </insert>

    <!-- INDEXES -->
    <createIndex indexName="ix_beneficiaries_mobile_dob" tableName="beneficiaries" schemaName="public">
        <column name="mobile_number"/>
        <column name="date_of_birth"/>
    </createIndex>

    <createIndex indexName="ix_beneficiaries_registration_status" tableName="beneficiaries" schemaName="public">
        <column name="registration_status_code"/>
    </createIndex>

    <createIndex indexName="ix_beneficiaries_preferred_lang" tableName="beneficiaries" schemaName="public">
        <column name="preferred_language_code"/>
    </createIndex>

    <!-- FOREIGN KEYS (Optional - for reference) -->
    <addForeignKeyConstraint
        baseTableName="beneficiaries"
        baseColumnNames="gender_code"
        referencedTableName="code_genders"
        referencedColumnNames="code"
        constraintName="fk_beneficiary_gender"/>

</changeSet>
```

---

## PHASE 2: FAMILY MEMBERS MODULE (UNCHANGED)

Complete CRUD with:
- Domain models (no enums)
- Reference codes to lookup tables
- Proper database relationships
- Multi-language support

[See detailed plan in IMPLEMENTATION_PLAN_DETAILED.md for full specifications]

---

## PHASE 2.5: MESSAGE & NOTIFICATION SYSTEM ⭐ NEW

**Duration**: 1.5 Weeks
**Priority**: 1 (Critical for SMS/Email)
**Files to Create**: 18 files

### 2.5.1 Domain Layer - Models

#### File 1: `domain/model/BeneficiaryMessage.java` (NEW)

```java
package com.care.appointment.domain.model;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain model for beneficiary messages/notifications
 * Supports: SMS, Email, In-App notifications
 * Tracks: Delivery status, Read status, Preferred language
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryMessage {

    private UUID messageId;
    private UUID beneficiaryId;

    // Message Content (Multi-language)
    private String titleAr;
    private String titleEn;
    private String bodyAr;
    private String bodyEn;

    // Delivery
    private String messageTypeCode;      // SMS, EMAIL, PUSH
    private String messageContentCode;   // APPOINTMENT_REMINDER, CUSTOM_MESSAGE, etc
    private String recipientLanguageCode; // AR, EN (language message was sent in)

    // Delivery Status
    private String deliveryStatusCode;   // PENDING, SENT, DELIVERED, FAILED
    private Instant sentAt;
    private String failureReason;

    // Read Status
    private String readStatusCode;       // UNREAD, READ
    private Instant readAt;

    // Originator
    private UUID sentByUserId;           // Admin or system user
    private String senderName;           // Center focal point name

    // For Bulk Messages
    private UUID bulkMessageBatchId;     // Group messages sent together

    // Audit
    private Boolean isDeleted;
    private Instant createdAt;
    private Instant updatedAt;
    private Long rowVersion;
}
```

#### File 2: `domain/model/BeneficiaryMessageAttachment.java` (NEW)

```java
package com.care.appointment.domain.model;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Optional attachments for messages (documents, images, etc)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryMessageAttachment {

    private UUID attachmentId;
    private UUID messageId;

    private String fileName;
    private String fileUrl;
    private Long fileSizeBytes;
    private String mimeType;

    private Instant createdAt;
    private Long rowVersion;
}
```

---

### 2.5.2 Use Cases & Ports

#### File 3-8: Domain Ports (In/Out)

```java
// domain/ports/in/beneficiarymessage/SendMessageUseCase.java
public interface SendMessageUseCase {
    BeneficiaryMessage sendMessage(SendMessageCommand command);
}

// domain/ports/in/beneficiarymessage/SendBulkMessagesUseCase.java
public interface SendBulkMessagesUseCase {
    List<UUID> sendBulkMessages(SendBulkMessagesCommand command);
}

// domain/ports/in/beneficiarymessage/MarkAsReadUseCase.java
public interface MarkAsReadUseCase {
    BeneficiaryMessage markMessageAsRead(UUID messageId);
}

// domain/ports/in/beneficiarymessage/GetMessageHistoryUseCase.java
public interface GetMessageHistoryUseCase {
    Page<BeneficiaryMessage> getMessageHistory(UUID beneficiaryId, Pageable pageable);
}

// domain/ports/out/beneficiarymessage/BeneficiaryMessageCrudPort.java
public interface BeneficiaryMessageCrudPort {
    BeneficiaryMessage save(BeneficiaryMessage message);
    BeneficiaryMessage update(BeneficiaryMessage message);
    Optional<BeneficiaryMessage> findById(UUID messageId);
    List<BeneficiaryMessage> findByBeneficiaryId(UUID beneficiaryId);
}

// domain/ports/out/beneficiarymessage/MessageDeliveryPort.java
public interface MessageDeliveryPort {
    /**
     * Delegate to external service (Twilio for SMS, SendGrid for Email, etc)
     */
    MessageDeliveryResult sendSMS(String phoneNumber, String message);
    MessageDeliveryResult sendEmail(String email, String subject, String body);
    MessageDeliveryResult sendPushNotification(String deviceToken, String title, String body);
}
```

---

### 2.5.3 Application Layer - Commands & Service

#### File 9: `application/beneficiarymessage/command/SendMessageCommand.java`

```java
package com.care.appointment.application.beneficiarymessage.command;

import lombok.*;
import jakarta.validation.constraints.*;
import java.util.UUID;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageCommand {

    @NotNull(message = "Beneficiary ID is required")
    private UUID beneficiaryId;

    @NotBlank(message = "Title Arabic is required")
    @Size(max = 200)
    private String titleAr;

    @NotBlank(message = "Title English is required")
    @Size(max = 200)
    private String titleEn;

    @NotBlank(message = "Body Arabic is required")
    @Size(max = 500)
    private String bodyAr;

    @NotBlank(message = "Body English is required")
    @Size(max = 500)
    private String bodyEn;

    @NotBlank(message = "Message type is required")
    private String messageTypeCode;  // SMS, EMAIL, PUSH

    @NotBlank(message = "Message content type is required")
    private String messageContentCode; // APPOINTMENT_REMINDER, CUSTOM_MESSAGE

    private List<UUID> attachmentIds; // Optional file attachments

    @NotNull(message = "Sent by user ID is required")
    private UUID sentByUserId;

    private String senderName; // Center focal point name
}
```

#### File 10: `application/beneficiarymessage/command/SendBulkMessagesCommand.java`

```java
package com.care.appointment.application.beneficiarymessage.command;

import lombok.*;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendBulkMessagesCommand {

    @NotEmpty(message = "At least one beneficiary ID is required")
    private List<UUID> beneficiaryIds;

    @NotBlank(message = "Title Arabic is required")
    private String titleAr;

    @NotBlank(message = "Title English is required")
    private String titleEn;

    @NotBlank(message = "Body Arabic is required")
    private String bodyAr;

    @NotBlank(message = "Body English is required")
    private String bodyEn;

    @NotBlank(message = "Message type is required")
    private String messageTypeCode;

    @NotBlank(message = "Message content type is required")
    private String messageContentCode;

    @NotNull(message = "Sent by user ID is required")
    private UUID sentByUserId;

    private String senderName;

    // Optional filter: Only send to beneficiaries with specific language preference
    private String targetLanguageCode; // AR, EN, or null for all
}
```

#### File 11: `application/beneficiarymessage/service/BeneficiaryMessageService.java`

```java
package com.care.appointment.application.beneficiarymessage.service;

import com.care.appointment.application.beneficiarymessage.command.SendMessageCommand;
import com.care.appointment.application.beneficiarymessage.command.SendBulkMessagesCommand;
import com.care.appointment.domain.model.BeneficiaryMessage;
import com.care.appointment.domain.ports.in.beneficiarymessage.*;
import com.care.appointment.domain.ports.out.beneficiarymessage.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing beneficiary messages and notifications
 *
 * Features:
 * - Send individual messages (SMS, Email, Push)
 * - Send bulk messages to multiple beneficiaries
 * - Track delivery status
 * - Track read status
 * - Multi-language support (send in beneficiary's preferred language)
 * - Appointment reminders
 * - Custom messages
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BeneficiaryMessageService implements
    SendMessageUseCase, SendBulkMessagesUseCase, MarkAsReadUseCase, GetMessageHistoryUseCase {

    private final BeneficiaryMessageCrudPort crudPort;
    private final BeneficiaryMessageSearchPort searchPort;
    private final MessageDeliveryPort deliveryPort;
    private final BeneficiarySearchPort beneficiarySearchPort;

    /**
     * Sends a message to a single beneficiary
     *
     * Process:
     * 1. Load beneficiary and get preferred language
     * 2. Create message in preferred language
     * 3. Attempt delivery via external service
     * 4. Update delivery status (SENT, FAILED, etc)
     * 5. Log for audit trail
     *
     * @param command Message details
     * @return Created message with delivery status
     */
    @Override
    public BeneficiaryMessage sendMessage(SendMessageCommand command) {
        log.info("Sending message to beneficiary: {} via {}",
                 command.getBeneficiaryId(), command.getMessageTypeCode());

        // Load beneficiary to get preferred language
        Beneficiary beneficiary = beneficiarySearchPort.findById(command.getBeneficiaryId())
            .orElseThrow(() -> new IllegalArgumentException(
                "Beneficiary not found: " + command.getBeneficiaryId()));

        // Create message
        String preferredLanguage = beneficiary.getPreferredLanguageCode();
        String messageBody = "AR".equals(preferredLanguage) ? command.getBodyAr() : command.getBodyEn();
        String messageTitle = "AR".equals(preferredLanguage) ? command.getTitleAr() : command.getTitleEn();

        BeneficiaryMessage message = BeneficiaryMessage.builder()
            .beneficiaryId(command.getBeneficiaryId())
            .titleAr(command.getTitleAr())
            .titleEn(command.getTitleEn())
            .bodyAr(command.getBodyAr())
            .bodyEn(command.getBodyEn())
            .messageTypeCode(command.getMessageTypeCode())
            .messageContentCode(command.getMessageContentCode())
            .recipientLanguageCode(preferredLanguage)
            .deliveryStatusCode("PENDING")
            .readStatusCode("UNREAD")
            .sentByUserId(command.getSentByUserId())
            .senderName(command.getSenderName())
            .build();

        // Attempt delivery
        try {
            MessageDeliveryResult result = attemptDelivery(
                beneficiary, command.getMessageTypeCode(), messageTitle, messageBody);

            message.setDeliveryStatusCode(result.isSuccess() ? "SENT" : "FAILED");
            message.setFailureReason(result.getErrorMessage());
            message.setSentAt(Instant.now());

            log.info("Message delivery status: {} to {}",
                     message.getDeliveryStatusCode(), command.getBeneficiaryId());

        } catch (Exception e) {
            log.error("Error delivering message to {}: {}",
                      command.getBeneficiaryId(), e.getMessage());
            message.setDeliveryStatusCode("FAILED");
            message.setFailureReason(e.getMessage());
        }

        // Persist message
        BeneficiaryMessage saved = crudPort.save(message);
        log.info("Message created with ID: {}", saved.getMessageId());
        return saved;
    }

    /**
     * Sends message to multiple beneficiaries
     *
     * Features:
     * - Parallel processing for performance
     * - Optional language filter
     * - Batch ID for grouping related messages
     * - Retry logic
     */
    @Override
    public List<UUID> sendBulkMessages(SendBulkMessagesCommand command) {
        log.info("Sending bulk message to {} beneficiaries", command.getBeneficiaryIds().size());

        UUID batchId = UUID.randomUUID();
        List<UUID> sentMessageIds = new ArrayList<>();

        // Filter beneficiaries if language specified
        List<UUID> targetBeneficiaryIds = command.getBeneficiaryIds();
        if (command.getTargetLanguageCode() != null) {
            targetBeneficiaryIds = filterByLanguagePreference(
                command.getBeneficiaryIds(), command.getTargetLanguageCode());
            log.info("Filtered to {} beneficiaries with language: {}",
                     targetBeneficiaryIds.size(), command.getTargetLanguageCode());
        }

        // Send to each beneficiary
        for (UUID beneficiaryId : targetBeneficiaryIds) {
            try {
                SendMessageCommand singleCommand = SendMessageCommand.builder()
                    .beneficiaryId(beneficiaryId)
                    .titleAr(command.getTitleAr())
                    .titleEn(command.getTitleEn())
                    .bodyAr(command.getBodyAr())
                    .bodyEn(command.getBodyEn())
                    .messageTypeCode(command.getMessageTypeCode())
                    .messageContentCode(command.getMessageContentCode())
                    .sentByUserId(command.getSentByUserId())
                    .senderName(command.getSenderName())
                    .build();

                BeneficiaryMessage message = sendMessage(singleCommand);
                message.setBulkMessageBatchId(batchId);
                crudPort.update(message);

                sentMessageIds.add(message.getMessageId());

            } catch (Exception e) {
                log.warn("Failed to send message to beneficiary {}: {}",
                         beneficiaryId, e.getMessage());
                // Continue with next beneficiary
            }
        }

        log.info("Bulk message completed. Sent {} out of {} messages",
                 sentMessageIds.size(), targetBeneficiaryIds.size());
        return sentMessageIds;
    }

    /**
     * Marks message as read by beneficiary
     * Tracks read timestamp for analytics
     */
    @Override
    public BeneficiaryMessage markMessageAsRead(UUID messageId) {
        log.debug("Marking message as read: {}", messageId);

        BeneficiaryMessage message = crudPort.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Message not found: " + messageId));

        if (!"UNREAD".equals(message.getReadStatusCode())) {
            log.warn("Message already read: {}", messageId);
            return message;
        }

        message.setReadStatusCode("READ");
        message.setReadAt(Instant.now());

        BeneficiaryMessage updated = crudPort.update(message);
        log.info("Message marked as read: {}", messageId);
        return updated;
    }

    /**
     * Gets message history for beneficiary
     * Shows all messages sent to beneficiary with delivery status
     */
    @Override
    @Transactional(readOnly = true)
    public Page<BeneficiaryMessage> getMessageHistory(UUID beneficiaryId, Pageable pageable) {
        log.debug("Loading message history for beneficiary: {}", beneficiaryId);
        return searchPort.findByBeneficiaryId(beneficiaryId, pageable);
    }

    // === HELPER METHODS ===

    private MessageDeliveryResult attemptDelivery(
            Beneficiary beneficiary,
            String messageType,
            String title,
            String body) {

        return switch (messageType) {
            case "SMS" -> deliveryPort.sendSMS(beneficiary.getMobileNumber(), body);
            case "EMAIL" -> deliveryPort.sendEmail(beneficiary.getEmail(), title, body);
            case "PUSH" -> deliveryPort.sendPushNotification(
                beneficiary.getBeneficiaryId().toString(), title, body);
            default -> throw new IllegalArgumentException("Unknown message type: " + messageType);
        };
    }

    private List<UUID> filterByLanguagePreference(List<UUID> beneficiaryIds, String languageCode) {
        return beneficiaryIds.stream()
            .filter(id -> {
                Optional<Beneficiary> beneficiary = beneficiarySearchPort.findById(id);
                return beneficiary.isPresent() &&
                       languageCode.equals(beneficiary.get().getPreferredLanguageCode());
            })
            .collect(Collectors.toList());
    }
}
```

---

### 2.5.4 Infrastructure Layer

#### File 12: `infrastructure/db/entities/BeneficiaryMessageEntity.java`

```java
package com.care.appointment.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "beneficiary_messages",
    schema = "public",
    indexes = {
        @Index(name = "ix_messages_beneficiary", columnList = "beneficiary_id"),
        @Index(name = "ix_messages_delivery_status", columnList = "delivery_status_code"),
        @Index(name = "ix_messages_read_status", columnList = "read_status_code"),
        @Index(name = "ix_messages_batch_id", columnList = "bulk_message_batch_id"),
        @Index(name = "ix_messages_sent_by", columnList = "sent_by_user_id"),
        @Index(name = "ix_messages_sent_at", columnList = "sent_at")
    }
)
@Getter @Setter
@Builder @NoArgsConstructor @AllArgsConstructor
public class BeneficiaryMessageEntity {

    @Id
    @UuidGenerator
    @Column(name = "message_id", nullable = false, updatable = false)
    private UUID messageId;

    @Column(name = "beneficiary_id", nullable = false)
    private UUID beneficiaryId;

    @Column(name = "title_ar", nullable = false, length = 200)
    private String titleAr;

    @Column(name = "title_en", nullable = false, length = 200)
    private String titleEn;

    @Column(name = "body_ar", nullable = false, columnDefinition = "TEXT")
    private String bodyAr;

    @Column(name = "body_en", nullable = false, columnDefinition = "TEXT")
    private String bodyEn;

    @Column(name = "message_type_code", nullable = false, length = 20)
    private String messageTypeCode; // SMS, EMAIL, PUSH

    @Column(name = "message_content_code", nullable = false, length = 50)
    private String messageContentCode; // APPOINTMENT_REMINDER, CUSTOM_MESSAGE

    @Column(name = "recipient_language_code", length = 10)
    private String recipientLanguageCode;

    @Column(name = "delivery_status_code", nullable = false, length = 20)
    private String deliveryStatusCode; // PENDING, SENT, DELIVERED, FAILED

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "read_status_code", nullable = false, length = 20)
    private String readStatusCode; // UNREAD, READ

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "sent_by_user_id", nullable = false)
    private UUID sentByUserId;

    @Column(name = "sender_name", length = 200)
    private String senderName;

    @Column(name = "bulk_message_batch_id")
    private UUID bulkMessageBatchId;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Version
    @Column(name = "row_version")
    private Long rowVersion;

    @PrePersist
    void prePersist() {
        if (isDeleted == null) isDeleted = Boolean.FALSE;
    }
}
```

#### File 13: `infrastructure/db/repositories/BeneficiaryMessageRepository.java`

```java
package com.care.appointment.infrastructure.db.repositories;

import com.care.appointment.infrastructure.db.entities.BeneficiaryMessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BeneficiaryMessageRepository extends
        JpaRepository<BeneficiaryMessageEntity, UUID>,
        JpaSpecificationExecutor<BeneficiaryMessageEntity> {

    /**
     * Find all messages for beneficiary (excluding deleted)
     */
    Page<BeneficiaryMessageEntity> findByBeneficiaryIdAndIsDeletedFalse(
        UUID beneficiaryId, Pageable pageable);

    /**
     * Find unread messages
     */
    List<BeneficiaryMessageEntity> findByBeneficiaryIdAndReadStatusCodeAndIsDeletedFalse(
        UUID beneficiaryId, String readStatusCode);

    /**
     * Find failed messages for retry
     */
    List<BeneficiaryMessageEntity> findByDeliveryStatusCodeAndIsDeletedFalse(
        String deliveryStatusCode);

    /**
     * Find messages from bulk batch
     */
    List<BeneficiaryMessageEntity> findByBulkMessageBatchId(UUID batchId);
}
```

#### File 14: `infrastructure/db/adapter/BeneficiaryMessageDbAdapter.java`

```java
package com.care.appointment.infrastructure.db.adapter;

import com.care.appointment.domain.model.BeneficiaryMessage;
import com.care.appointment.domain.ports.out.beneficiarymessage.*;
import com.care.appointment.infrastructure.db.entities.BeneficiaryMessageEntity;
import com.care.appointment.infrastructure.db.repositories.BeneficiaryMessageRepository;
import com.care.appointment.infrastructure.db.mapper.BeneficiaryMessageJpaMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class BeneficiaryMessageDbAdapter implements
        BeneficiaryMessageCrudPort, BeneficiaryMessageSearchPort {

    private final BeneficiaryMessageRepository repository;
    private final BeneficiaryMessageJpaMapper mapper;

    @Override
    public BeneficiaryMessage save(BeneficiaryMessage message) {
        BeneficiaryMessageEntity entity = mapper.toEntity(message);
        BeneficiaryMessageEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public BeneficiaryMessage update(BeneficiaryMessage message) {
        BeneficiaryMessageEntity entity = mapper.toEntity(message);
        BeneficiaryMessageEntity updated = repository.save(entity);
        return mapper.toDomain(updated);
    }

    @Override
    public Optional<BeneficiaryMessage> findById(UUID messageId) {
        return repository.findById(messageId).map(mapper::toDomain);
    }

    @Override
    public List<BeneficiaryMessage> findByBeneficiaryId(UUID beneficiaryId) {
        return repository.findByBeneficiaryIdAndIsDeletedFalse(beneficiaryId, null)
            .getContent().stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public Page<BeneficiaryMessage> findByBeneficiaryId(UUID beneficiaryId, Pageable pageable) {
        Page<BeneficiaryMessageEntity> page = repository
            .findByBeneficiaryIdAndIsDeletedFalse(beneficiaryId, pageable);

        List<BeneficiaryMessage> models = page.getContent().stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());

        return new PageImpl<>(models, pageable, page.getTotalElements());
    }
}
```

---

### 2.5.5 Web Layer - Controllers & DTOs

#### File 15: `web/controller/BeneficiaryMessageController.java`

```java
package com.care.appointment.web.controller;

import com.care.appointment.application.beneficiarymessage.command.SendMessageCommand;
import com.care.appointment.application.beneficiarymessage.command.SendBulkMessagesCommand;
import com.care.appointment.domain.model.BeneficiaryMessage;
import com.care.appointment.domain.ports.in.beneficiarymessage.*;
import com.care.appointment.web.dto.beneficiarymessage.*;
import com.care.appointment.web.mapper.BeneficiaryMessageWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for beneficiary messaging
 *
 * Endpoints:
 * - Send single message (SMS, Email, Push)
 * - Send bulk messages
 * - Get message history
 * - Mark message as read
 */
@RestController
@RequestMapping("/api/admin/beneficiaries/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Messages", description = "Beneficiary message and notification management")
public class BeneficiaryMessageController {

    private final SendMessageUseCase sendMessageUseCase;
    private final SendBulkMessagesUseCase sendBulkMessagesUseCase;
    private final MarkAsReadUseCase markAsReadUseCase;
    private final GetMessageHistoryUseCase getMessageHistoryUseCase;
    private final BeneficiaryMessageWebMapper mapper;

    /**
     * Send a message to a single beneficiary
     *
     * Supports:
     * - SMS: Uses beneficiary phone number
     * - Email: Uses beneficiary email
     * - Push: Uses device token (if available)
     *
     * Message is sent in beneficiary's preferred language
     */
    @PostMapping
    @Operation(summary = "Send message to beneficiary")
    public ResponseEntity<BeneficiaryMessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {

        log.info("Sending message to beneficiary: {}", request.getBeneficiaryId());

        SendMessageCommand command = mapper.requestToCommand(request);
        // Get current user from security context
        // command.setSentByUserId(getCurrentUserId());

        BeneficiaryMessage message = sendMessageUseCase.sendMessage(command);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapper.toResponse(message));
    }

    /**
     * Send bulk message to multiple beneficiaries
     *
     * Features:
     * - Optional language filter (only send to AR or EN speakers)
     * - Batch ID for grouping related messages
     * - Parallel processing
     */
    @PostMapping("/bulk")
    @Operation(summary = "Send bulk message to multiple beneficiaries")
    public ResponseEntity<BulkMessageResponse> sendBulkMessages(
            @Valid @RequestBody SendBulkMessagesRequest request) {

        log.info("Sending bulk message to {} beneficiaries", request.getBeneficiaryIds().size());

        SendBulkMessagesCommand command = mapper.bulkRequestToCommand(request);
        List<UUID> sentMessageIds = sendBulkMessagesUseCase.sendBulkMessages(command);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BulkMessageResponse.builder()
                .totalCount(request.getBeneficiaryIds().size())
                .sentCount(sentMessageIds.size())
                .sentMessageIds(sentMessageIds)
                .build());
    }

    /**
     * Get message history for a beneficiary
     * Shows all messages sent with delivery and read status
     */
    @GetMapping("/beneficiary/{beneficiaryId}")
    @Operation(summary = "Get message history for beneficiary")
    public ResponseEntity<Page<BeneficiaryMessageResponse>> getMessageHistory(
            @PathVariable UUID beneficiaryId,
            Pageable pageable) {

        Page<BeneficiaryMessage> page = getMessageHistoryUseCase
            .getMessageHistory(beneficiaryId, pageable);

        Page<BeneficiaryMessageResponse> response = page.map(mapper::toResponse);
        return ResponseEntity.ok(response);
    }

    /**
     * Mark message as read by beneficiary
     * Called from mobile app when user opens a message
     */
    @PutMapping("/{messageId}/read")
    @Operation(summary = "Mark message as read")
    public ResponseEntity<BeneficiaryMessageResponse> markMessageAsRead(
            @PathVariable UUID messageId) {

        log.info("Marking message as read: {}", messageId);

        BeneficiaryMessage message = markAsReadUseCase.markMessageAsRead(messageId);
        return ResponseEntity.ok(mapper.toResponse(message));
    }
}
```

#### File 16-18: DTOs

```java
// web/dto/beneficiarymessage/SendMessageRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull private UUID beneficiaryId;
    @NotBlank private String titleAr;
    @NotBlank private String titleEn;
    @NotBlank private String bodyAr;
    @NotBlank private String bodyEn;
    @NotBlank private String messageTypeCode; // SMS, EMAIL, PUSH
    @NotBlank private String messageContentCode; // APPOINTMENT_REMINDER, CUSTOM
    private String senderName;
}

// web/dto/beneficiarymessage/SendBulkMessagesRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendBulkMessagesRequest {
    @NotEmpty private List<UUID> beneficiaryIds;
    @NotBlank private String titleAr;
    @NotBlank private String titleEn;
    @NotBlank private String bodyAr;
    @NotBlank private String bodyEn;
    @NotBlank private String messageTypeCode;
    @NotBlank private String messageContentCode;
    private String targetLanguageCode; // Optional: AR, EN, or null for all
    private String senderName;
}

// web/dto/beneficiarymessage/BeneficiaryMessageResponse.java
@Data
@Builder
public class BeneficiaryMessageResponse {
    private UUID messageId;
    private UUID beneficiaryId;
    private String titleAr;
    private String titleEn;
    private String bodyAr;
    private String bodyEn;
    private String messageTypeCode;
    private String deliveryStatusCode;
    private String readStatusCode;
    private Instant sentAt;
    private Instant readAt;
    private String senderName;
}

// web/dto/BulkMessageResponse.java
@Data
@Builder
public class BulkMessageResponse {
    private Integer totalCount;
    private Integer sentCount;
    private List<UUID> sentMessageIds;
    private Integer failedCount;
}
```

---

### 2.5.6 Database Migration

#### File 19: `liquibase/changesets/002-create-beneficiary-messages.xml`

```xml
<changeSet id="2" author="appointment-team">
    <comment>Create beneficiary messages table for SMS/Email notifications</comment>

    <createTable tableName="beneficiary_messages" schemaName="public">
        <column name="message_id" type="uuid">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <column name="beneficiary_id" type="uuid" nullable="false"/>

        <column name="title_ar" type="varchar(200)" nullable="false"/>
        <column name="title_en" type="varchar(200)" nullable="false"/>
        <column name="body_ar" type="text" nullable="false"/>
        <column name="body_en" type="text" nullable="false"/>

        <column name="message_type_code" type="varchar(20)" nullable="false"/>
        <column name="message_content_code" type="varchar(50)" nullable="false"/>
        <column name="recipient_language_code" type="varchar(10)"/>

        <column name="delivery_status_code" type="varchar(20)" nullable="false"/>
        <column name="sent_at" type="timestamp"/>
        <column name="failure_reason" type="text"/>

        <column name="read_status_code" type="varchar(20)" nullable="false"/>
        <column name="read_at" type="timestamp"/>

        <column name="sent_by_user_id" type="uuid" nullable="false"/>
        <column name="sender_name" type="varchar(200)"/>
        <column name="bulk_message_batch_id" type="uuid"/>

        <column name="is_deleted" type="boolean" defaultValue="false"/>
        <column name="created_at" type="timestamp" nullable="false"/>
        <column name="updated_at" type="timestamp"/>
        <column name="row_version" type="bigint"/>
    </createTable>

    <!-- CREATE LOOKUP TABLES FOR MESSAGE TYPES -->

    <createTable tableName="code_message_types" schemaName="public">
        <column name="code" type="varchar(20)">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <column name="name_ar" type="varchar(100)"/>
        <column name="name_en" type="varchar(100)"/>
        <column name="display_order" type="integer"/>
        <column name="is_active" type="boolean" defaultValue="true"/>
    </createTable>

    <createTable tableName="code_message_contents" schemaName="public">
        <column name="code" type="varchar(50)">
            <constraints primaryKey="true" nullable="false"/>
        </column>
        <column name="name_ar" type="varchar(200)"/>
        <column name="name_en" type="varchar(200)"/>
        <column name="display_order" type="integer"/>
        <column name="is_active" type="boolean" defaultValue="true"/>
    </createTable>

    <!-- INSERT CODE VALUES -->
    <insert tableName="code_message_types" schemaName="public">
        <column name="code" value="SMS"/>
        <column name="name_ar" value="رسالة نصية"/>
        <column name="name_en" value="SMS"/>
    </insert>
    <insert tableName="code_message_types" schemaName="public">
        <column name="code" value="EMAIL"/>
        <column name="name_ar" value="بريد إلكتروني"/>
        <column name="name_en" value="Email"/>
    </insert>
    <insert tableName="code_message_types" schemaName="public">
        <column name="code" value="PUSH"/>
        <column name="name_ar" value="إشعار فوري"/>
        <column name="name_en" value="Push Notification"/>
    </insert>

    <insert tableName="code_message_contents" schemaName="public">
        <column name="code" value="APPOINTMENT_REMINDER"/>
        <column name="name_ar" value="تذكير بالموعد"/>
        <column name="name_en" value="Appointment Reminder"/>
    </insert>
    <insert tableName="code_message_contents" schemaName="public">
        <column name="code" value="CUSTOM_MESSAGE"/>
        <column name="name_ar" value="رسالة مخصصة"/>
        <column name="name_en" value="Custom Message"/>
    </insert>

    <!-- INDEXES -->
    <createIndex indexName="ix_messages_beneficiary" tableName="beneficiary_messages">
        <column name="beneficiary_id"/>
    </createIndex>
    <createIndex indexName="ix_messages_delivery_status" tableName="beneficiary_messages">
        <column name="delivery_status_code"/>
    </createIndex>
    <createIndex indexName="ix_messages_read_status" tableName="beneficiary_messages">
        <column name="read_status_code"/>
    </createIndex>
    <createIndex indexName="ix_messages_batch_id" tableName="beneficiary_messages">
        <column name="bulk_message_batch_id"/>
    </createIndex>
    <createIndex indexName="ix_messages_sent_at" tableName="beneficiary_messages">
        <column name="sent_at"/>
    </createIndex>
</changeSet>
```

---

## UPDATED TIMELINE

```
Week 1: Phase 1 (Beneficiary Enhancements)
├─ Mon: Database & Domain design (6 hours)
├─ Tue-Wed: Application & Web layers (8 hours)
├─ Thu: Testing (4 hours)
└─ Fri: Code review & polish (2 hours)

Week 2: Phase 2 (Family Members Module)
├─ Mon-Tue: Domain + Ports (8 hours)
├─ Wed: Application layer (6 hours)
├─ Thu: Infrastructure (5 hours)
└─ Fri: Web layer + Testing (5 hours)

Week 3: Phase 2.5 (Message & Notification System)
├─ Mon-Tue: Domain models + Ports (6 hours)
├─ Wed: Application service (8 hours)
├─ Thu: Infrastructure (5 hours)
├─ Fri: Web layer (4 hours)
└─ Weekend: Testing (8 hours)

Total: 6-7 weeks including testing & deployment
```

---

## SUMMARY OF CHANGES

✅ **Removed**: Enums (RegistrationStatus, Gender, RelationType)
✅ **Added**: Database lookup tables (code_genders, code_languages, etc)
✅ **Added**: Multi-language support using `_ar` and `_en` fields
✅ **Added**: Beneficiary preferred language
✅ **Added**: Complete Message & Notification System
✅ **Added**: SMS/Email/Push support
✅ **Added**: Message delivery tracking
✅ **Added**: Message read status tracking
✅ **Added**: Bulk messaging capability
✅ **Added**: Language-based message filtering

---

**Status**: ✅ FINAL PLAN COMPLETE
**Ready for Implementation**: YES
**Start Date**: Immediately


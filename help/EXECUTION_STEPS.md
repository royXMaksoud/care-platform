# 🚀 خطوات التنفيذ الفعلية - Step by Step

## اليوم: الإثنين

### الصباح (6 ساعات)

#### ⏰ الساعة 8:00 - 9:00 (1 ساعة)
**Task: إنشاء الملفات الأساسية للـ Phase 1**

```bash
# 1. نسخ الملف الأساسي
cp FINAL_IMPLEMENTATION_PLAN.md YOUR_PROJECT/

# 2. إنشاء المجلدات
mkdir -p src/main/java/com/care/appointment/domain/enums/

# 3. التحقق من structure
ls -la src/main/java/com/care/appointment/
```

#### 📝 الملف 1: تحديث Beneficiary.java
**المسار**: `src/main/java/com/care/appointment/domain/model/Beneficiary.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Beneficiary {
    // EXISTING FIELDS (without change)
    private UUID beneficiaryId;
    private String nationalId;
    private String fullName;
    private String motherName;
    private String mobileNumber;
    private String email;
    private String address;
    private Double latitude;
    private Double longitude;

    // NEW FIELDS - Phase 1
    private LocalDate dateOfBirth;
    private String genderCode;              // M or F
    private String profilePhotoUrl;
    private String registrationStatusCode;  // QUICK or COMPLETE
    private Instant registrationCompletedAt;
    private UUID registrationCompletedByUserId;
    private String preferredLanguageCode;   // AR or EN ⭐ NEW

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

**✅ Checklist**:
- [ ] فتح الملف الأصلي
- [ ] أضف السطور الجديدة (14 سطر فقط)
- [ ] احفظ الملف
- [ ] Compile: `mvn clean compile`

---

#### ⏰ الساعة 9:00 - 10:00 (1 ساعة)
**Task: تحديث BeneficiaryEntity.java**

**المسار**: `src/main/java/com/care/appointment/infrastructure/db/entities/BeneficiaryEntity.java`

```java
// أضف هذه الحقول فقط:

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

@Column(name = "preferred_language_code", length = 10, nullable = false)
private String preferredLanguageCode;

// UPDATE @Table annotation - أضف الـ indexes:
@Index(name = "ix_appt_beneficiaries_mobile_dob", columnList = "mobile_number, date_of_birth"),
@Index(name = "ix_appt_beneficiaries_registration_status", columnList = "registration_status_code"),
@Index(name = "ix_appt_beneficiaries_preferred_lang", columnList = "preferred_language_code")

// أضف PrePersist method:
@PrePersist
void prePersist() {
    if (isActive == null) isActive = Boolean.TRUE;
    if (isDeleted == null) isDeleted = Boolean.FALSE;
    if (registrationStatusCode == null) registrationStatusCode = "QUICK";
    if (preferredLanguageCode == null) preferredLanguageCode = "AR";
}
```

**✅ Checklist**:
- [ ] فتح الملف
- [ ] أضف الحقول (7 حقول)
- [ ] أضف الـ indexes في @Table
- [ ] أضف PrePersist method
- [ ] احفظ الملف
- [ ] Compile: `mvn clean compile`

---

#### ⏰ الساعة 10:00 - 11:00 (1 ساعة)
**Task: تحديث BeneficiaryRepository.java**

**المسار**: `src/main/java/com/care/appointment/infrastructure/db/repositories/BeneficiaryRepository.java`

```java
// أضف هذه الـ methods:

Optional<BeneficiaryEntity> findByMobileNumberAndDateOfBirth(
    String mobileNumber, LocalDate dateOfBirth);

Optional<BeneficiaryEntity> findByMobileNumberAndMotherName(
    String mobileNumber, String motherName);

List<BeneficiaryEntity> findByRegistrationStatus(String registrationStatusCode);

boolean existsByNationalId(String nationalId);

boolean existsByMobileNumber(String mobileNumber);
```

**✅ Checklist**:
- [ ] فتح الملف
- [ ] أضف 5 methods
- [ ] احفظ الملف
- [ ] Compile: `mvn clean compile`

---

#### ⏰ الساعة 11:00 - 12:00 (1 ساعة)
**Task: إنشاء BeneficiaryVerificationService.java (جديد)**

**المسار**: `src/main/java/com/care/appointment/application/beneficiary/service/BeneficiaryVerificationService.java`

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

    public Beneficiary verifyByMobileAndDOB(String mobileNumber, LocalDate dateOfBirth) {
        log.debug("Verifying beneficiary: {}", mobileNumber);
        return beneficiarySearchPort.findByMobileNumberAndDateOfBirth(mobileNumber, dateOfBirth)
            .orElseThrow(() -> {
                log.warn("Verification failed for mobile: {}", mobileNumber);
                return new UnauthorizedException("Invalid credentials");
            });
    }

    public Beneficiary verifyByMobileAndMotherName(String mobileNumber, String motherName) {
        log.debug("Verifying beneficiary: {} with mother name", mobileNumber);
        return beneficiarySearchPort.findByMobileNumberAndMotherName(mobileNumber, motherName)
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
    }
}
```

**✅ Checklist**:
- [ ] إنشاء ملف جديد
- [ ] نسخ الكود أعلاه
- [ ] احفظ الملف
- [ ] Compile: `mvn clean compile`

---

### بعد الظهر (4 ساعات)

#### ⏰ الساعة 2:00 - 3:00 (1 ساعة)
**Task: إنشاء MobileBeneficiaryController.java (جديد)**

**المسار**: `src/main/java/com/care/appointment/web/controller/MobileBeneficiaryController.java`

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

**✅ Checklist**:
- [ ] إنشاء ملف جديد
- [ ] نسخ الكود
- [ ] احفظ الملف
- [ ] Compile: `mvn clean compile`

---

#### ⏰ الساعة 3:00 - 4:00 (1 ساعة)
**Task: إنشاء VerifyCredentialsRequest.java (جديد)**

**المسار**: `src/main/java/com/care/appointment/web/dto/VerifyCredentialsRequest.java`

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

**✅ Checklist**:
- [ ] إنشاء ملف جديد
- [ ] نسخ الكود
- [ ] احفظ الملف
- [ ] Compile: `mvn clean compile`

---

#### ⏰ الساعة 4:00 - 5:00 (1 ساعة)
**Task: تحديث BeneficiaryDTO.java**

**المسار**: `src/main/java/com/care/appointment/web/dto/BeneficiaryDTO.java`

```java
// أضف هذه الحقول في الـ class:

@Schema(description = "Date of birth", example = "1990-01-15")
private LocalDate dateOfBirth;

@Schema(description = "Gender code", example = "M", allowableValues = {"M", "F"})
private String genderCode;

@Schema(description = "Profile photo URL")
private String profilePhotoUrl;

@Schema(description = "Registration status code", example = "QUICK",
        allowableValues = {"QUICK", "COMPLETE"})
private String registrationStatusCode;

@Schema(description = "Registration completed at")
private Instant registrationCompletedAt;

@Schema(description = "Preferred language code", example = "AR",
        allowableValues = {"AR", "EN"})
private String preferredLanguageCode;
```

**✅ Checklist**:
- [ ] فتح الملف الموجود
- [ ] أضف 6 حقول جديدة
- [ ] احفظ الملف
- [ ] Compile: `mvn clean compile`

---

#### ⏰ الساعة 5:00 - 6:00 (1 ساعة)
**Task: إنشاء Database Migration (Liquibase)**

**المسار**: `src/main/resources/liquibase/changesets/001-add-beneficiary-fields.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="1" author="appointment-team">
        <comment>Add beneficiary enhancements with multi-language support</comment>

        <!-- ADD COLUMNS TO BENEFICIARIES TABLE -->
        <addColumn tableName="beneficiaries" schemaName="public">
            <column name="date_of_birth" type="date"/>
            <column name="gender_code" type="varchar(10)"/>
            <column name="profile_photo_url" type="varchar(500)"/>
            <column name="registration_status_code" type="varchar(20)" defaultValue="QUICK"/>
            <column name="registration_completed_at" type="timestamp"/>
            <column name="registration_completed_by_user_id" type="uuid"/>
            <column name="preferred_language_code" type="varchar(10)" defaultValue="AR"/>
        </addColumn>

        <!-- CREATE LOOKUP TABLES -->
        <createTable tableName="code_genders" schemaName="public">
            <column name="code" type="varchar(10)">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="name_ar" type="varchar(50)" nullable="false"/>
            <column name="name_en" type="varchar(50)" nullable="false"/>
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

        <!-- INSERT DATA -->
        <insert tableName="code_genders">
            <column name="code" value="M"/>
            <column name="name_ar" value="ذكر"/>
            <column name="name_en" value="Male"/>
            <column name="display_order" value="1"/>
        </insert>
        <insert tableName="code_genders">
            <column name="code" value="F"/>
            <column name="name_ar" value="أنثى"/>
            <column name="name_en" value="Female"/>
            <column name="display_order" value="2"/>
        </insert>

        <insert tableName="code_languages">
            <column name="code" value="AR"/>
            <column name="name_ar" value="العربية"/>
            <column name="name_en" value="Arabic"/>
            <column name="display_order" value="1"/>
        </insert>
        <insert tableName="code_languages">
            <column name="code" value="EN"/>
            <column name="name_ar" value="الإنجليزية"/>
            <column name="name_en" value="English"/>
            <column name="display_order" value="2"/>
        </insert>

        <!-- CREATE INDEXES -->
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
    </changeSet>

</databaseChangeLog>
```

**✅ Checklist**:
- [ ] إنشاء المجلد: `src/main/resources/liquibase/changesets/`
- [ ] إنشاء ملف XML جديد
- [ ] نسخ الكود أعلاه
- [ ] احفظ الملف
- [ ] تشغيل: `mvn liquibase:update`

---

### نهاية اليوم (الساعة 6:00 مساءً)

#### ✅ التحقق النهائي:
```bash
# 1. compile النهائي
mvn clean compile

# 2. تشغيل unit tests
mvn test

# 3. التحقق من Database
psql -U postgres -d appointment_db -c "\dt code_*"
```

---

## اليوم الثاني (الثلاثاء)

### الصباح (4 ساعات)

#### ⏰ الساعة 8:00 - 12:00
**Task: كتابة الاختبارات**

```bash
# 1. إنشاء test class
mkdir -p src/test/java/com/care/appointment/application/beneficiary/service

# 2. Test file:
# BeneficiaryVerificationServiceTest.java

# 3. Test cases:
# - test_verifyByMobileAndDOB_Success
# - test_verifyByMobileAndDOB_NotFound
# - test_verifyByMobileAndMotherName_Success
# - test_verifyByMobileAndMotherName_NotFound

# 4. تشغيل:
mvn test
```

---

### بعد الظهر (4 ساعات)

#### ⏰ الساعة 2:00 - 6:00
**Task: API Testing**

```bash
# 1. تشغيل التطبيق
mvn spring-boot:run

# 2. اختبار الـ endpoint:
curl -X POST http://localhost:6064/api/mobile/beneficiaries/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "+963912345678",
    "dateOfBirth": "1990-01-15"
  }'

# 3. تحقق من Swagger:
# http://localhost:6064/swagger-ui.html

# 4. Manual testing من Postman
```

---

## اليوم الثالث (الأربعاء)

### الصباح + بعد الظهر (8 ساعات)

**Phase 2: Family Members Module**

اتبع نفس الخطوات لكن لـ Family Members:
1. Domain Model
2. Entity
3. Repository
4. Service
5. Controller
6. DTOs
7. Database Migration
8. Tests

---

## ملاحظات مهمة

### ⚠️ لا تنسى:
- [ ] `mvn clean compile` بعد كل ملف
- [ ] استخدم جداول البحث - لا Enums
- [ ] أضف `preferredLanguageCode` في كل مكان
- [ ] اختبر Database migration
- [ ] اكتب unit tests
- [ ] اختبر API endpoints

### 🔍 إذا حدث خطأ:

**خطأ: Cannot find symbol**
```bash
mvn clean compile
```

**خطأ: Database migration failed**
```sql
-- Check if table exists
\dt beneficiaries
-- Check columns
\d beneficiaries
```

**خطأ: API not working**
```bash
# Restart the app
mvn spring-boot:run
```

---

## الملف الرسمي المرجعي

إذا احتجت تفاصيل أكثر: اقرأ **FINAL_IMPLEMENTATION_PLAN.md**

---

**Status**: ✅ جاهز للتنفيذ الآن
**المدة الإجمالية**: 3 أيام (Phase 1 فقط)
**البدء**: اليوم الإثنين


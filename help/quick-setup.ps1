# Quick Setup Script - Phase 1 Automated
# Run: .\quick-setup.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Phase 1: Beneficiary Enhancements - Quick Setup" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$PROJECT_PATH = "C:\Java\care\Code\appointment-service"
$DOMAIN_PATH = "$PROJECT_PATH\src\main\java\com\care\appointment\domain\model"
$ENTITY_PATH = "$PROJECT_PATH\src\main\java\com\care\appointment\infrastructure\db\entities"
$REPO_PATH = "$PROJECT_PATH\src\main\java\com\care\appointment\infrastructure\db\repositories"
$SERVICE_PATH = "$PROJECT_PATH\src\main\java\com\care\appointment\application\beneficiary\service"
$CONTROLLER_PATH = "$PROJECT_PATH\src\main\java\com\care\appointment\web\controller"
$DTO_PATH = "$PROJECT_PATH\src\main\java\com\care\appointment\web\dto"
$DB_PATH = "$PROJECT_PATH\src\main\resources\liquibase\changesets"

Write-Host "Step 1: Checking Project Structure..." -ForegroundColor Yellow
if (Test-Path $PROJECT_PATH) {
    Write-Host "✓ Project found at: $PROJECT_PATH" -ForegroundColor Green
} else {
    Write-Host "✗ Project NOT found. Please check the path." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Step 2: Creating Directory Structure..." -ForegroundColor Yellow

@(
    $SERVICE_PATH,
    $CONTROLLER_PATH,
    $DB_PATH
) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "✓ Created: $_" -ForegroundColor Green
    } else {
        Write-Host "✓ Already exists: $_" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 3: Files to Create/Modify..." -ForegroundColor Yellow
Write-Host ""

# File 1: BeneficiaryVerificationService.java
Write-Host "1. Creating BeneficiaryVerificationService.java..."
$verificationServiceContent = @'
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
'@

$verificationServicePath = "$SERVICE_PATH\BeneficiaryVerificationService.java"
if (-not (Test-Path $verificationServicePath)) {
    Set-Content -Path $verificationServicePath -Value $verificationServiceContent
    Write-Host "✓ Created: BeneficiaryVerificationService.java" -ForegroundColor Green
} else {
    Write-Host "✓ Already exists: BeneficiaryVerificationService.java" -ForegroundColor Green
}

Write-Host ""

# File 2: MobileBeneficiaryController.java
Write-Host "2. Creating MobileBeneficiaryController.java..."
$controllerContent = @'
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
'@

$controllerPath = "$CONTROLLER_PATH\MobileBeneficiaryController.java"
if (-not (Test-Path $controllerPath)) {
    Set-Content -Path $controllerPath -Value $controllerContent
    Write-Host "✓ Created: MobileBeneficiaryController.java" -ForegroundColor Green
} else {
    Write-Host "✓ Already exists: MobileBeneficiaryController.java" -ForegroundColor Green
}

Write-Host ""

# File 3: VerifyCredentialsRequest.java
Write-Host "3. Creating VerifyCredentialsRequest.java..."
$requestContent = @'
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
'@

$requestPath = "$DTO_PATH\VerifyCredentialsRequest.java"
if (-not (Test-Path $requestPath)) {
    Set-Content -Path $requestPath -Value $requestContent
    Write-Host "✓ Created: VerifyCredentialsRequest.java" -ForegroundColor Green
} else {
    Write-Host "✓ Already exists: VerifyCredentialsRequest.java" -ForegroundColor Green
}

Write-Host ""

# File 4: Liquibase Migration
Write-Host "4. Creating Liquibase Migration Script..."
$liquibaseContent = @'
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

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

        <createTable tableName="code_genders" schemaName="public">
            <column name="code" type="varchar(10)">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="name_ar" type="varchar(50)" nullable="false"/>
            <column name="name_en" type="varchar(50)" nullable="false"/>
        </createTable>

        <createTable tableName="code_languages" schemaName="public">
            <column name="code" type="varchar(10)">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="name_ar" type="varchar(50)" nullable="false"/>
            <column name="name_en" type="varchar(50)" nullable="false"/>
        </createTable>

        <insert tableName="code_genders">
            <column name="code" value="M"/>
            <column name="name_ar" value="ذكر"/>
            <column name="name_en" value="Male"/>
        </insert>
        <insert tableName="code_genders">
            <column name="code" value="F"/>
            <column name="name_ar" value="أنثى"/>
            <column name="name_en" value="Female"/>
        </insert>

        <insert tableName="code_languages">
            <column name="code" value="AR"/>
            <column name="name_ar" value="العربية"/>
            <column name="name_en" value="Arabic"/>
        </insert>
        <insert tableName="code_languages">
            <column name="code" value="EN"/>
            <column name="name_ar" value="الإنجليزية"/>
            <column name="name_en" value="English"/>
        </insert>

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
'@

$dbFilePath = "$DB_PATH\001-add-beneficiary-fields.xml"
if (-not (Test-Path $dbFilePath)) {
    Set-Content -Path $dbFilePath -Value $liquibaseContent
    Write-Host "✓ Created: 001-add-beneficiary-fields.xml" -ForegroundColor Green
} else {
    Write-Host "✓ Already exists: 001-add-beneficiary-fields.xml" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 4: Build & Test" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Compile
Write-Host "Compiling project..." -ForegroundColor Yellow
Push-Location $PROJECT_PATH
mvn clean compile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Compilation successful!" -ForegroundColor Green
} else {
    Write-Host "✗ Compilation failed. Check errors above." -ForegroundColor Red
    Pop-Location
    exit
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Yellow
mvn test

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Tests passed!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some tests failed. Check output above." -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Beneficiary.java (add 7 new fields)" -ForegroundColor Cyan
Write-Host "2. Update BeneficiaryEntity.java (add 7 columns + indexes)" -ForegroundColor Cyan
Write-Host "3. Update BeneficiaryRepository.java (add 5 methods)" -ForegroundColor Cyan
Write-Host "4. Update BeneficiaryDTO.java (add 6 fields)" -ForegroundColor Cyan
Write-Host "5. Run: mvn liquibase:update" -ForegroundColor Cyan
Write-Host "6. Run: mvn spring-boot:run" -ForegroundColor Cyan
Write-Host ""
Write-Host "Read EXECUTION_STEPS.md for detailed step-by-step instructions" -ForegroundColor Green
Write-Host ""

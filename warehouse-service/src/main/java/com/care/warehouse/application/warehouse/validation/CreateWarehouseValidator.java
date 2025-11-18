package com.care.warehouse.application.warehouse.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.ports.out.WarehouseRepositoryPort;
import com.sharedlib.core.dto.ErrorResponse;
import com.sharedlib.core.exception.ValidationException;
import com.sharedlib.core.i18n.MessageResolver;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Validator for warehouse creation.
 * Validates required fields, lat/long ranges, tenantId presence, and hierarchy loops.
 */
@Component
@RequiredArgsConstructor
public class CreateWarehouseValidator {

    private final WarehouseRepositoryPort warehouseRepositoryPort;
    private final MessageResolver messageResolver;
    private final CustomFieldsValidator customFieldsValidator;

    public void validate(Warehouse warehouse) {
        if (warehouse == null) {
            throw new ValidationException("error.validation", List.of(
                    ErrorResponse.ValidationError.builder()
                            .field(null)
                            .code("error.validation")
                            .message(messageResolver.getMessage("error.validation"))
                            .build()
            ));
        }

        List<ErrorResponse.ValidationError> errors = new ArrayList<>();

        // Validate tenantId presence (from TenantContext, not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("tenantId")
                    .code("error.warehouse.tenant.required")
                    .message(messageResolver.getMessage("error.warehouse.tenant.required"))
                    .build());
        } else {
            warehouse.setTenantId(tenantId);
        }

        // Validate code (required)
        String code = warehouse.getCode();
        if (StringUtils.isBlank(code)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("code")
                    .code("error.warehouse.code.required")
                    .message(messageResolver.getMessage("error.warehouse.code.required"))
                    .build());
        } else if (code.length() > 100) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("code")
                    .code("error.warehouse.code.size.exceeded")
                    .message(messageResolver.getMessage("error.warehouse.code.size.exceeded"))
                    .build());
        }

        // Validate warehouseType (required)
        if (warehouse.getWarehouseType() == null) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("warehouseType")
                    .code("error.warehouse.type.required")
                    .message(messageResolver.getMessage("error.warehouse.type.required"))
                    .build());
        }

        // Validate nameTranslations (at least one translation required)
        Map<String, String> nameTranslations = warehouse.getNameTranslations();
        if (nameTranslations == null || nameTranslations.isEmpty()) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("nameTranslations")
                    .code("error.warehouse.nameTranslations.required")
                    .message(messageResolver.getMessage("error.warehouse.nameTranslations.required"))
                    .build());
        } else {
            // Validate language codes (ISO 639-1 format: 2 characters)
            for (String langCode : nameTranslations.keySet()) {
                if (langCode == null || langCode.length() < 2 || langCode.length() > 10) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("nameTranslations")
                            .code("error.warehouse.languageCode.invalid")
                            .message(messageResolver.getMessage("error.warehouse.languageCode.invalid", new Object[]{langCode}))
                            .build());
                }
            }
        }

        // Validate descriptionTranslations (optional, but if provided, validate language codes)
        Map<String, String> descriptionTranslations = warehouse.getDescriptionTranslations();
        if (descriptionTranslations != null && !descriptionTranslations.isEmpty()) {
            for (String langCode : descriptionTranslations.keySet()) {
                if (langCode == null || langCode.length() < 2 || langCode.length() > 10) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("descriptionTranslations")
                            .code("error.warehouse.languageCode.invalid")
                            .message(messageResolver.getMessage("error.warehouse.languageCode.invalid", new Object[]{langCode}))
                            .build());
                }
            }
        }

        // Validate latitude range (-90 to 90)
        Double latitude = warehouse.getLatitude();
        if (latitude != null && (latitude < -90 || latitude > 90)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("latitude")
                    .code("error.warehouse.latitude.range")
                    .message(messageResolver.getMessage("error.warehouse.latitude.range"))
                    .build());
        }

        // Validate longitude range (-180 to 180)
        Double longitude = warehouse.getLongitude();
        if (longitude != null && (longitude < -180 || longitude > 180)) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("longitude")
                    .code("error.warehouse.longitude.range")
                    .message(messageResolver.getMessage("error.warehouse.longitude.range"))
                    .build());
        }

        // Validate hierarchy (no self-parent loops)
        UUID parentWarehouseId = warehouse.getParentWarehouseId();
        if (parentWarehouseId != null && tenantId != null) {
            // Check if parent exists and is valid
            if (!warehouseRepositoryPort.isValidParent(parentWarehouseId, tenantId)) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("parentWarehouseId")
                        .code("error.warehouse.parent.invalid")
                        .message(messageResolver.getMessage("error.warehouse.parent.invalid"))
                        .build());
            }
        }

        // Validate city length if provided
        String city = warehouse.getCity();
        if (city != null && city.length() > 100) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("city")
                    .code("error.warehouse.city.size.exceeded")
                    .message(messageResolver.getMessage("error.warehouse.city.size.exceeded"))
                    .build());
        }

        // Validate address line 1 length if provided
        String addressLine1 = warehouse.getAddressLine1();
        if (addressLine1 != null && addressLine1.length() > 255) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("addressLine1")
                    .code("error.warehouse.address.size.exceeded")
                    .message(messageResolver.getMessage("error.warehouse.address.size.exceeded"))
                    .build());
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }

        // Validate uniqueness (code must be unique per tenant)
        if (tenantId != null && StringUtils.isNotBlank(code)) {
            if (warehouseRepositoryPort.existsByTenantIdAndCode(tenantId, code)) {
                throw new ValidationException("error.validation", List.of(
                        ErrorResponse.ValidationError.builder()
                                .field("code")
                                .code("error.warehouse.code.duplicate")
                                .message(messageResolver.getMessage("error.warehouse.code.duplicate"))
                                .build()
                ));
            }
        }

        // Validate custom fields
            customFieldsValidator.validate(warehouse.getCustomData(), com.care.warehouse.domain.enums.EntityType.WAREHOUSE);
    }
}


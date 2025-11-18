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
 * Validator for warehouse updates.
 * Validates required fields, lat/long ranges, tenantId presence, and hierarchy loops.
 */
@Component
@RequiredArgsConstructor
public class UpdateWarehouseValidator {

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
        }

        // Validate code if provided (required if updating)
        String code = warehouse.getCode();
        if (StringUtils.isNotBlank(code)) {
            if (code.length() > 100) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("code")
                        .code("error.warehouse.code.size.exceeded")
                        .message(messageResolver.getMessage("error.warehouse.code.size.exceeded"))
                        .build());
            }
        }

        // Validate warehouseType if provided
        // (not required on update, but if provided must be valid)

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
        UUID warehouseId = warehouse.getId();
        
        if (parentWarehouseId != null && warehouseId != null && tenantId != null) {
            // Check: cannot set itself as parent
            if (parentWarehouseId.equals(warehouseId)) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("parentWarehouseId")
                        .code("error.warehouse.parent.self")
                        .message(messageResolver.getMessage("error.warehouse.parent.self"))
                        .build());
            }
            
            // Check: cannot set a child as parent (circular reference)
            if (isCircularReference(warehouseId, parentWarehouseId, tenantId)) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("parentWarehouseId")
                        .code("error.warehouse.parent.circular")
                        .message(messageResolver.getMessage("error.warehouse.parent.circular"))
                        .build());
            }
            
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

        // Validate nameTranslations language codes if provided
        Map<String, String> nameTranslations = warehouse.getNameTranslations();
        if (nameTranslations != null && !nameTranslations.isEmpty()) {
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

        // Validate descriptionTranslations language codes if provided
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

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }

        // Validate uniqueness (code must be unique per tenant, excluding current warehouse)
        if (tenantId != null && StringUtils.isNotBlank(code) && warehouseId != null) {
            var existingWarehouse = warehouseRepositoryPort.findByTenantIdAndCode(tenantId, code);
            if (existingWarehouse.isPresent() && !existingWarehouse.get().getId().equals(warehouseId)) {
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

    /**
     * Check if setting parentWarehouseId would create a circular reference.
     * A circular reference occurs when the parent is a descendant of the current warehouse.
     */
    private boolean isCircularReference(UUID warehouseId, UUID parentWarehouseId, UUID tenantId) {
        // Check if parentWarehouseId is a descendant of warehouseId
        // This would create a cycle: warehouse -> parent -> ... -> warehouse
        UUID currentParentId = parentWarehouseId;
        int maxDepth = 100; // Prevent infinite loops
        int depth = 0;
        
        while (currentParentId != null && depth < maxDepth) {
            var parentOpt = warehouseRepositoryPort.load(currentParentId);
            if (parentOpt.isEmpty()) {
                break;
            }
            
            Warehouse parent = parentOpt.get();
            if (parent.getId().equals(warehouseId)) {
                return true; // Circular reference detected
            }
            
            currentParentId = parent.getParentWarehouseId();
            depth++;
        }
        
        return false;
    }
}


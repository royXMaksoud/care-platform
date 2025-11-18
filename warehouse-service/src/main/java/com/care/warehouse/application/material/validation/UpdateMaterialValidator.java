package com.care.warehouse.application.material.validation;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.warehouse.validation.CustomFieldsValidator;
import com.care.warehouse.domain.model.Material;
import com.care.warehouse.domain.ports.out.MaterialRepositoryPort;
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
 * Validator for material updates.
 * Validates required fields, determiners, and tenantId presence.
 */
@Component
@RequiredArgsConstructor
public class UpdateMaterialValidator {

    private final MaterialRepositoryPort materialRepositoryPort;
    private final MessageResolver messageResolver;
    private final CustomFieldsValidator customFieldsValidator;

    public void validate(Material material) {
        if (material == null) {
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
                    .code("error.material.tenant.required")
                    .message(messageResolver.getMessage("error.material.tenant.required"))
                    .build());
        }

        // Validate code if provided
        String code = material.getCode();
        if (StringUtils.isNotBlank(code)) {
            if (code.length() > 100) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("code")
                        .code("error.material.code.size.exceeded")
                        .message(messageResolver.getMessage("error.material.code.size.exceeded"))
                        .build());
            }
        }

        // Validate nameTranslations language codes if provided
        Map<String, String> nameTranslations = material.getNameTranslations();
        if (nameTranslations != null && !nameTranslations.isEmpty()) {
            for (String langCode : nameTranslations.keySet()) {
                if (langCode == null || langCode.length() < 2 || langCode.length() > 10) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("nameTranslations")
                            .code("error.material.languageCode.invalid")
                            .message(messageResolver.getMessage("error.material.languageCode.invalid", new Object[]{langCode}))
                            .build());
                }
            }
        }

        // Validate descriptionTranslations language codes if provided
        Map<String, String> descriptionTranslations = material.getDescriptionTranslations();
        if (descriptionTranslations != null && !descriptionTranslations.isEmpty()) {
            for (String langCode : descriptionTranslations.keySet()) {
                if (langCode == null || langCode.length() < 2 || langCode.length() > 10) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("descriptionTranslations")
                            .code("error.material.languageCode.invalid")
                            .message(messageResolver.getMessage("error.material.languageCode.invalid", new Object[]{langCode}))
                            .build());
                }
            }
        }

        // Validate determiners if provided
        List<Material.MaterialDeterminer> determiners = material.getDeterminers();
        if (determiners != null && !determiners.isEmpty()) {
            for (Material.MaterialDeterminer determiner : determiners) {
                if (determiner.getType() == null) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("determiners")
                            .code("error.material.determiner.type.required")
                            .message(messageResolver.getMessage("error.material.determiner.type.required"))
                            .build());
                }
                if (StringUtils.isNotBlank(determiner.getValue()) && determiner.getValue().length() > 255) {
                    errors.add(ErrorResponse.ValidationError.builder()
                            .field("determiners")
                            .code("error.material.determiner.value.size.exceeded")
                            .message(messageResolver.getMessage("error.material.determiner.value.size.exceeded"))
                            .build());
                }
            }
        }

        // Validate isTrackable consistency
        if (Boolean.TRUE.equals(material.getIsTrackable())) {
            if (determiners == null || determiners.isEmpty()) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("isTrackable")
                        .code("error.material.trackable.requires.determiner")
                        .message(messageResolver.getMessage("error.material.trackable.requires.determiner"))
                        .build());
            }
        }

        // Validate reorderLevel if provided (must be >= 0)
        Integer reorderLevel = material.getReorderLevel();
        if (reorderLevel != null && reorderLevel < 0) {
            errors.add(ErrorResponse.ValidationError.builder()
                    .field("reorderLevel")
                    .code("error.material.reorderLevel.invalid")
                    .message(messageResolver.getMessage("error.material.reorderLevel.invalid"))
                    .build());
        }

        // Validate unit if provided (must be non-empty and <= 50 characters)
        String unit = material.getUnit();
        if (unit != null) {
            if (StringUtils.isBlank(unit)) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("unit")
                        .code("error.material.unit.empty")
                        .message(messageResolver.getMessage("error.material.unit.empty"))
                        .build());
            } else if (unit.length() > 50) {
                errors.add(ErrorResponse.ValidationError.builder()
                        .field("unit")
                        .code("error.material.unit.size.exceeded")
                        .message(messageResolver.getMessage("error.material.unit.size.exceeded"))
                        .build());
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("error.validation", errors);
        }

        // Validate uniqueness (code must be unique per tenant, excluding current material)
        UUID materialId = material.getId();
        if (tenantId != null && StringUtils.isNotBlank(code) && materialId != null) {
            var existingMaterial = materialRepositoryPort.findByTenantIdAndCode(tenantId, code);
            if (existingMaterial.isPresent() && !existingMaterial.get().getId().equals(materialId)) {
                throw new ValidationException("error.validation", List.of(
                        ErrorResponse.ValidationError.builder()
                                .field("code")
                                .code("error.material.code.duplicate")
                                .message(messageResolver.getMessage("error.material.code.duplicate"))
                                .build()
                ));
            }
        }

        // Validate determiner uniqueness (excluding current material)
        if (tenantId != null && determiners != null && !determiners.isEmpty() && materialId != null) {
            for (Material.MaterialDeterminer determiner : determiners) {
                if (StringUtils.isNotBlank(determiner.getValue())) {
                    var existingMaterial = materialRepositoryPort.findByDeterminerValue(tenantId, determiner.getValue());
                    if (existingMaterial.isPresent() && !existingMaterial.get().getId().equals(materialId)) {
                        throw new ValidationException("error.validation", List.of(
                                ErrorResponse.ValidationError.builder()
                                        .field("determiners")
                                        .code("error.material.determiner.duplicate")
                                        .message(messageResolver.getMessage("error.material.determiner.duplicate", new Object[]{determiner.getValue()}))
                                        .build()
                        ));
                    }
                }
            }
        }

        // Validate custom attributes against metadata definitions
        customFieldsValidator.validate(material.getCustomAttributes(), com.care.warehouse.domain.enums.EntityType.MATERIAL);
    }
}


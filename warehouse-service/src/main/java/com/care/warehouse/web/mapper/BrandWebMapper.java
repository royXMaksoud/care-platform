package com.care.warehouse.web.mapper;

import com.care.warehouse.application.brand.command.CreateBrandCommand;
import com.care.warehouse.application.brand.command.UpdateBrandCommand;
import com.care.warehouse.domain.model.Brand;
import com.care.warehouse.web.dto.brand.BrandResponse;
import com.care.warehouse.web.dto.brand.CreateBrandRequest;
import com.care.warehouse.web.dto.brand.UpdateBrandRequest;
import com.sharedlib.core.context.CurrentUserContext;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Mapper to convert between Web layer DTOs and Domain models/Commands related to Brand.
 */
@Component
public class BrandWebMapper {

    /**
     * Converts CreateBrandRequest to CreateBrandCommand.
     */
    public CreateBrandCommand toCreateCommand(CreateBrandRequest request) {
        return CreateBrandCommand.builder()
                .nameTranslations(request.getNameTranslations())
                .countryOrigin(request.getCountryOrigin())
                .customAttributes(request.getCustomAttributes())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts UpdateBrandRequest to UpdateBrandCommand.
     */
    public UpdateBrandCommand toUpdateCommand(java.util.UUID brandId, UpdateBrandRequest request) {
        return UpdateBrandCommand.builder()
                .id(brandId)
                .nameTranslations(request.getNameTranslations())
                .countryOrigin(request.getCountryOrigin())
                .customAttributes(request.getCustomAttributes())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts domain model Brand to API response DTO.
     */
    public BrandResponse toResponse(Brand brand) {
        // Resolve display name based on current user language
        String userLanguage = CurrentUserContext.getUserLanguage();
        String displayName = resolveTranslation(brand.getNameTranslations(), userLanguage);
        
        return BrandResponse.builder()
                .id(brand.getId())
                .tenantId(brand.getTenantId())
                .nameTranslations(brand.getNameTranslations())
                .displayName(displayName)
                .countryOrigin(brand.getCountryOrigin())
                .customAttributes(brand.getCustomAttributes())
                .isActive(brand.getIsActive())
                .isDeleted(brand.getIsDeleted())
                .createdById(brand.getCreatedById())
                .createdAt(brand.getCreatedAt())
                .updatedById(brand.getUpdatedById())
                .updatedAt(brand.getUpdatedAt())
                .rowVersion(brand.getRowVersion())
                .build();
    }

    /**
     * Resolves translation from a translations map based on language code.
     * Falls back to "en" if user language not available, then to first available translation.
     */
    private String resolveTranslation(Map<String, String> translations, String userLanguage) {
        if (translations == null || translations.isEmpty()) {
            return null;
        }

        // Try user's language first
        if (userLanguage != null && translations.containsKey(userLanguage)) {
            return translations.get(userLanguage);
        }

        // Fall back to English
        if (translations.containsKey("en")) {
            return translations.get("en");
        }

        // Fall back to first available translation
        return translations.values().iterator().next();
    }
}


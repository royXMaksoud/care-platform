package com.care.warehouse.web.mapper;

import com.care.warehouse.application.material.command.CreateMaterialCommand;
import com.care.warehouse.application.material.command.UpdateMaterialCommand;
import com.care.warehouse.domain.model.Material;
import com.care.warehouse.web.dto.material.CreateMaterialRequest;
import com.care.warehouse.web.dto.material.MaterialResponse;
import com.care.warehouse.web.dto.material.UpdateMaterialRequest;
import com.sharedlib.core.context.CurrentUserContext;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Mapper to convert between Web layer DTOs and Domain models/Commands related to Material.
 */
@Component
public class MaterialWebMapper {

    /**
     * Converts CreateMaterialRequest to CreateMaterialCommand.
     *
     * @param request the web DTO used to create a material
     * @return create command
     */
    public CreateMaterialCommand toCreateCommand(CreateMaterialRequest request) {
        return CreateMaterialCommand.builder()
                .code(request.getCode())
                .nameTranslations(request.getNameTranslations())
                .descriptionTranslations(request.getDescriptionTranslations())
                .categoryId(request.getCategoryId())
                .brandId(request.getBrandId())
                .determiners(convertDeterminerDtos(request.getDeterminers()))
                .isTrackable(request.getIsTrackable())
                .status(request.getStatus())
                .customAttributes(request.getCustomAttributes())
                .reorderLevel(request.getReorderLevel())
                .unit(request.getUnit())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts UpdateMaterialRequest to UpdateMaterialCommand.
     *
     * @param materialId the ID of the material to be updated
     * @param request    the web DTO used to update a material
     * @return update command
     */
    public UpdateMaterialCommand toUpdateCommand(UUID materialId, UpdateMaterialRequest request) {
        return UpdateMaterialCommand.builder()
                .id(materialId)
                .code(request.getCode())
                .nameTranslations(request.getNameTranslations())
                .descriptionTranslations(request.getDescriptionTranslations())
                .categoryId(request.getCategoryId())
                .brandId(request.getBrandId())
                .determiners(convertUpdateDeterminerDtos(request.getDeterminers()))
                .isTrackable(request.getIsTrackable())
                .status(request.getStatus())
                .customAttributes(request.getCustomAttributes())
                .reorderLevel(request.getReorderLevel())
                .unit(request.getUnit())
                .isActive(request.getIsActive())
                .build();
    }

    /**
     * Converts domain model Material to API response DTO.
     *
     * @param material the domain model
     * @return API response object
     */
    public MaterialResponse toResponse(Material material) {
        // Resolve display name and description based on current user language
        String userLanguage = CurrentUserContext.getUserLanguage();
        String displayName = resolveTranslation(material.getNameTranslations(), userLanguage);
        String displayDescription = resolveTranslation(material.getDescriptionTranslations(), userLanguage);
        
        return MaterialResponse.builder()
                .id(material.getId())
                .tenantId(material.getTenantId())
                .code(material.getCode())
                .nameTranslations(material.getNameTranslations())
                .displayName(displayName)
                .descriptionTranslations(material.getDescriptionTranslations())
                .displayDescription(displayDescription)
                .categoryId(material.getCategoryId())
                .brandId(material.getBrandId())
                .determiners(convertDeterminers(material.getDeterminers()))
                .isTrackable(material.getIsTrackable())
                .status(material.getStatus())
                .customAttributes(material.getCustomAttributes())
                .reorderLevel(material.getReorderLevel())
                .unit(material.getUnit())
                .isActive(material.getIsActive())
                .isDeleted(material.getIsDeleted())
                .createdById(material.getCreatedById())
                .createdAt(material.getCreatedAt())
                .updatedById(material.getUpdatedById())
                .updatedAt(material.getUpdatedAt())
                .rowVersion(material.getRowVersion())
                .build();
    }

    /**
     * Convert a list of Material domain models to list of MaterialResponse DTOs.
     */
    public List<MaterialResponse> toMaterialResponseList(List<Material> materials) {
        return materials.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Convert DTO determiners to domain determiners.
     */
    private List<Material.MaterialDeterminer> convertDeterminerDtos(
            List<CreateMaterialRequest.MaterialDeterminerDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return null;
        }
        return dtos.stream()
                .map(dto -> Material.MaterialDeterminer.builder()
                        .type(dto.getType())
                        .value(dto.getValue())
                        .metadata(dto.getMetadata())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Convert DTO determiners to domain determiners (for update).
     */
    private List<Material.MaterialDeterminer> convertUpdateDeterminerDtos(
            List<UpdateMaterialRequest.MaterialDeterminerDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return null;
        }
        return dtos.stream()
                .map(dto -> Material.MaterialDeterminer.builder()
                        .type(dto.getType())
                        .value(dto.getValue())
                        .metadata(dto.getMetadata())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Convert domain determiners to response DTO determiners.
     */
    private List<MaterialResponse.MaterialDeterminerDto> convertDeterminers(
            List<Material.MaterialDeterminer> determiners) {
        if (determiners == null || determiners.isEmpty()) {
            return null;
        }
        return determiners.stream()
                .map(d -> MaterialResponse.MaterialDeterminerDto.builder()
                        .type(d.getType())
                        .value(d.getValue())
                        .metadata(d.getMetadata())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Resolves translation from a translations map based on language code.
     * Falls back to "en" if user language not available, then to first available translation.
     * 
     * @param translations Map of language code to translated text
     * @param userLanguage User's preferred language code
     * @return Resolved translation or null if no translations available
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


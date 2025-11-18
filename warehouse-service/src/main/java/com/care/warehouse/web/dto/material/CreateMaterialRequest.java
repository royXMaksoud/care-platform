package com.care.warehouse.web.dto.material;

import com.care.warehouse.domain.enums.DeterminerType;
import com.care.warehouse.domain.enums.MaterialStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request DTO used to create a new Material.
 * All required fields must be provided by the client.
 */
@Getter
@Setter
public class CreateMaterialRequest {

    @NotBlank(message = "{material.code.required}")
    @Size(max = 100, message = "{material.code.max}")
    private String code;

    /**
     * Multilingual material names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    @NotNull(message = "{material.nameTranslations.required}")
    private Map<String, String> nameTranslations;

    /**
     * Multilingual material descriptions.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated description
     */
    private Map<String, String> descriptionTranslations;

    private UUID categoryId;

    private UUID brandId;

    /**
     * Material determiners (unique identifiers).
     * Each determiner has a type and value.
     */
    @Valid
    private List<MaterialDeterminerDto> determiners;

    private Boolean isTrackable;

    private MaterialStatus status;

    /**
     * Custom attributes (tenant-specific fields).
     * Example: {"weight": 1.5, "dimensions": {"length": 10, "width": 5}}
     */
    private Map<String, Object> customAttributes;

    /**
     * Minimum stock level threshold for reorder.
     * When stock falls below this level, reorder should be triggered.
     * Optional field for inventory management.
     */
    private Integer reorderLevel;

    /**
     * Unit of measurement for the material.
     * Examples: "KG", "PCS", "L", "M", "BOX", "PACK", etc.
     * Optional field for inventory tracking.
     */
    @Size(max = 50, message = "{material.unit.max}")
    private String unit;

    private Boolean isActive;

    /**
     * DTO for material determiner.
     */
    @Getter
    @Setter
    public static class MaterialDeterminerDto {
        @NotNull(message = "{material.determiner.type.required}")
        private DeterminerType type;
        
        @NotBlank(message = "{material.determiner.value.required}")
        @Size(max = 255, message = "{material.determiner.value.max}")
        private String value;
        
        /**
         * Optional metadata for the determiner.
         */
        private Map<String, Object> metadata;
    }
}


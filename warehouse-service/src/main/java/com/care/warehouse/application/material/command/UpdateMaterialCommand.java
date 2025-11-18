package com.care.warehouse.application.material.command;

import com.care.warehouse.domain.enums.MaterialStatus;
import com.care.warehouse.domain.model.Material;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Command object used to update an existing Material.
 * This belongs to the application layer (Command side) in Clean Architecture.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMaterialCommand {
    
    /** The unique identifier of the material to be updated */
    private UUID id;
    
    private String code;
    private Map<String, String> nameTranslations;
    private Map<String, String> descriptionTranslations;
    private UUID categoryId;
    private UUID brandId;
    private List<Material.MaterialDeterminer> determiners;
    private Boolean isTrackable;
    private MaterialStatus status;
    private Map<String, Object> customAttributes;
    private Integer reorderLevel;
    private String unit;
    private Boolean isActive;
}


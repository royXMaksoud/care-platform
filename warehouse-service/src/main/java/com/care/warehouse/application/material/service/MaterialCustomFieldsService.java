package com.care.warehouse.application.material.service;

import com.care.warehouse.application.customfield.service.CustomFieldService;
import com.care.warehouse.domain.enums.EntityType;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.domain.ports.in.GetMaterialByIdUseCase;
import com.sharedlib.core.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing Material custom fields.
 * 
 * This is a convenience wrapper around the generic CustomFieldService,
 * specifically for Material entities. It provides:
 * - Material-specific custom field operations
 * - Automatic validation that material exists
 * - Simplified API for Material custom fields
 * 
 * **Usage**:
 * ```java
 * // Get custom fields for a material
 * Map<String, Object> values = materialCustomFieldsService.getCustomFields(materialId);
 * 
 * // Save custom fields for a material
 * Map<String, Object> values = Map.of("warranty_period", 24);
 * materialCustomFieldsService.saveCustomFields(materialId, values);
 * ```
 * 
 * @author CARE Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaterialCustomFieldsService {

    private final CustomFieldService customFieldService;
    private final GetMaterialByIdUseCase getMaterialByIdUseCase;

    /**
     * Get all custom field values for a material.
     * 
     * Validates that the material exists before retrieving custom fields.
     * 
     * @param materialId Material ID
     * @return Map of fieldKey -> value, empty map if no custom fields found
     * @throws NotFoundException if material not found
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomFields(UUID materialId) {
        // Validate material exists
        getMaterialByIdUseCase.getMaterialById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found with id: " + materialId));
        
        // Get custom field values
        return customFieldService.getValues(EntityType.MATERIAL, materialId);
    }

    /**
     * Save or update custom field values for a material.
     * 
     * Validates:
     * - Material exists
     * - Custom field values match field definitions
     * - Required fields are present
     * - Data types, min/max, allowed values are valid
     * 
     * @param materialId Material ID
     * @param values Map of fieldKey -> value to save
     * @return Map of fieldKey -> saved value
     * @throws NotFoundException if material not found
     * @throws com.sharedlib.core.exception.ValidationException if validation fails
     */
    @Transactional
    public Map<String, Object> saveCustomFields(UUID materialId, Map<String, Object> values) {
        // Validate material exists
        getMaterialByIdUseCase.getMaterialById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found with id: " + materialId));
        
        // Save custom field values (validation happens inside CustomFieldService)
        return customFieldService.saveValues(EntityType.MATERIAL, materialId, values);
    }

    /**
     * Get all active custom field definitions for Material entity type.
     * 
     * This can be used to:
     * - Build dynamic forms in the UI
     * - Display field metadata
     * - Validate field keys before saving
     * 
     * @return List of active custom field definitions for Material
     */
    @Transactional(readOnly = true)
    public List<CustomFieldDefinition> getFieldDefinitions() {
        return customFieldService.getFieldDefinitions(EntityType.MATERIAL);
    }

    /**
     * Delete all custom field values for a material.
     * 
     * @param materialId Material ID
     * @throws NotFoundException if material not found
     */
    @Transactional
    public void deleteCustomFields(UUID materialId) {
        // Validate material exists
        getMaterialByIdUseCase.getMaterialById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found with id: " + materialId));
        
        // Delete custom field values
        customFieldService.deleteValues(EntityType.MATERIAL, materialId);
    }
}


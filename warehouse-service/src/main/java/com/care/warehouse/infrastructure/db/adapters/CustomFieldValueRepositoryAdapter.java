package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.enums.EntityType;
import com.care.warehouse.domain.model.CustomFieldValue;
import com.care.warehouse.domain.ports.out.customfield.CustomFieldDefinitionPort;
import com.care.warehouse.domain.ports.out.customfield.CustomFieldValuePort;
import com.care.warehouse.infrastructure.db.entities.CustomFieldValueEntity;
import com.care.warehouse.infrastructure.db.mappers.CustomFieldValueJpaMapper;
import com.care.warehouse.infrastructure.db.repository.CustomFieldValueJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Adapter implementation for CustomFieldValuePort.
 * 
 * Extends BaseJpaAdapter from shared-lib for standard CRUD operations.
 * Provides entity record queries and bulk operations for custom field values.
 * 
 * @author CARE Team
 */
@Component
public class CustomFieldValueRepositoryAdapter
        extends BaseJpaAdapter<CustomFieldValue, CustomFieldValueEntity, UUID, FilterRequest>
        implements CustomFieldValuePort {

    private final CustomFieldValueJpaRepository repository;
    private final CustomFieldValueJpaMapper mapper;
    private final CustomFieldDefinitionPort definitionPort;

    public CustomFieldValueRepositoryAdapter(
            CustomFieldValueJpaRepository repository,
            CustomFieldValueJpaMapper mapper,
            CustomFieldDefinitionPort definitionPort) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
        this.definitionPort = definitionPort;
    }

    /**
     * Build JPA Specification for dynamic filtering.
     * Always adds tenant filter.
     */
    @Override
    protected Specification<CustomFieldValueEntity> buildSpecification(FilterRequest filter) {
        UUID tenantId = TenantContext.get();
        Specification<CustomFieldValueEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return tenantSpec;
        }

        Specification<CustomFieldValueEntity> filterSpec = new com.sharedlib.core.filter.GenericSpecificationBuilder<CustomFieldValueEntity>(
                Set.of("id", "tenantId", "entityType", "entityRecordId", "fieldId"))
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();

        return tenantSpec.and(filterSpec);
    }

    @Override
    public List<CustomFieldValue> findByTenantIdAndEntityTypeAndEntityRecordId(
            UUID tenantId, EntityType entityType, UUID entityRecordId) {
        return repository.findByTenantIdAndEntityTypeAndEntityRecordId(tenantId, entityType, entityRecordId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CustomFieldValue> findByTenantIdAndEntityTypeAndEntityRecordIdAndFieldId(
            UUID tenantId, EntityType entityType, UUID entityRecordId, UUID fieldId) {
        return repository.findByTenantIdAndEntityTypeAndEntityRecordIdAndFieldId(tenantId, entityType, entityRecordId, fieldId)
                .map(mapper::toDomain);
    }

    @Override
    @Transactional
    public List<CustomFieldValue> saveOrUpdateValues(
            UUID tenantId, EntityType entityType, UUID entityRecordId, Map<String, Object> values) {
        
        List<CustomFieldValue> savedValues = new ArrayList<>();
        
        // Get all field definitions for this entity type
        List<com.care.warehouse.domain.model.CustomFieldDefinition> definitions = 
                definitionPort.findActiveByTenantIdAndEntityType(tenantId, entityType);
        
        // Create a map of fieldKey -> fieldDefinition for quick lookup
        Map<String, com.care.warehouse.domain.model.CustomFieldDefinition> definitionMap = definitions.stream()
                .collect(Collectors.toMap(
                        com.care.warehouse.domain.model.CustomFieldDefinition::getFieldKey,
                        def -> def
                ));
        
        // Get existing values
        List<CustomFieldValue> existingValues = findByTenantIdAndEntityTypeAndEntityRecordId(
                tenantId, entityType, entityRecordId);
        Map<UUID, CustomFieldValue> existingValueMap = existingValues.stream()
                .collect(Collectors.toMap(CustomFieldValue::getFieldId, v -> v));
        
        // Process each value in the input map
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            String fieldKey = entry.getKey();
            Object value = entry.getValue();
            
            // Find field definition
            com.care.warehouse.domain.model.CustomFieldDefinition definition = definitionMap.get(fieldKey);
            if (definition == null) {
                // Field definition not found - skip or throw error?
                // For now, skip unknown fields
                continue;
            }
            
            // Check if value already exists
            CustomFieldValue existingValue = existingValueMap.get(definition.getId());
            
            if (existingValue != null) {
                // Update existing value
                existingValue.setValue(value);
                CustomFieldValue saved = save(existingValue);
                savedValues.add(saved);
            } else {
                // Create new value
                CustomFieldValue newValue = CustomFieldValue.builder()
                        .tenantId(tenantId)
                        .entityType(entityType)
                        .entityRecordId(entityRecordId)
                        .fieldId(definition.getId())
                        .value(value)
                        .build();
                CustomFieldValue saved = save(newValue);
                savedValues.add(saved);
            }
        }
        
        // Delete values that are not in the input map
        Set<String> providedFieldKeys = values.keySet();
        for (CustomFieldValue existingValue : existingValues) {
            com.care.warehouse.domain.model.CustomFieldDefinition def = definitionPort.load(existingValue.getFieldId())
                    .orElse(null);
            if (def != null && !providedFieldKeys.contains(def.getFieldKey())) {
                // This field was not provided in the input - delete it
                delete(existingValue.getId());
            }
        }
        
        return savedValues;
    }

    @Override
    @Transactional
    public void deleteByTenantIdAndEntityTypeAndEntityRecordId(
            UUID tenantId, EntityType entityType, UUID entityRecordId) {
        repository.deleteByTenantIdAndEntityTypeAndEntityRecordId(tenantId, entityType, entityRecordId);
    }

    @Override
    public List<CustomFieldValue> findByTenantIdAndFieldId(UUID tenantId, UUID fieldId) {
        return repository.findByTenantIdAndFieldId(tenantId, fieldId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}


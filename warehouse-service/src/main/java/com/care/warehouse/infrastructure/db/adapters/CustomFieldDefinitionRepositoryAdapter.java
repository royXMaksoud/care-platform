package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.enums.EntityType;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.domain.ports.out.customfield.CustomFieldDefinitionPort;
import com.care.warehouse.domain.ports.out.customfielddefinition.CustomFieldDefinitionCrudPort;
import com.care.warehouse.domain.ports.out.customfielddefinition.CustomFieldDefinitionSearchPort;
import com.care.warehouse.infrastructure.db.entities.CustomFieldDefinitionEntity;
import com.care.warehouse.infrastructure.db.mappers.CustomFieldDefinitionJpaMapper;
import com.care.warehouse.infrastructure.db.repository.CustomFieldDefinitionJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericSpecificationBuilder;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter implementation for CustomFieldDefinitionPort.
 * 
 * Extends BaseJpaAdapter from shared-lib for standard CRUD operations.
 * Provides entity-type specific queries for custom field definitions.
 * 
 * @author CARE Team
 */
@Component
public class CustomFieldDefinitionRepositoryAdapter
        extends BaseJpaAdapter<CustomFieldDefinition, CustomFieldDefinitionEntity, UUID, FilterRequest>
        implements CustomFieldDefinitionPort, CustomFieldDefinitionCrudPort, CustomFieldDefinitionSearchPort {

    private final CustomFieldDefinitionJpaRepository repository;
    private final CustomFieldDefinitionJpaMapper mapper;

    public CustomFieldDefinitionRepositoryAdapter(
            CustomFieldDefinitionJpaRepository repository,
            CustomFieldDefinitionJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Build JPA Specification for dynamic filtering.
     * Always adds tenant and soft-delete filters.
     */
    @Override
    protected Specification<CustomFieldDefinitionEntity> buildSpecification(FilterRequest filter) {
        UUID tenantId = TenantContext.get();
        Specification<CustomFieldDefinitionEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        Specification<CustomFieldDefinitionEntity> notDeletedSpec = (root, query, cb) -> 
            cb.equal(root.get("isDeleted"), false);
        
        Specification<CustomFieldDefinitionEntity> baseSpec = tenantSpec.and(notDeletedSpec);
        
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return baseSpec;
        }

        Specification<CustomFieldDefinitionEntity> filterSpec = new GenericSpecificationBuilder<CustomFieldDefinitionEntity>(
                java.util.Set.of("id", "tenantId", "entityType", "fieldKey", "dataType", "isRequired", 
                       "isActive", "isDeleted", "sortOrder"))
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();

        return baseSpec.and(filterSpec);
    }

    @Override
    public List<CustomFieldDefinition> findActiveByTenantIdAndEntityType(UUID tenantId, EntityType entityType) {
        return repository.findActiveByTenantIdAndEntityType(tenantId, entityType).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CustomFieldDefinition> findByTenantIdAndEntityTypeAndFieldKey(
            UUID tenantId, EntityType entityType, String fieldKey) {
        return repository.findByTenantIdAndEntityTypeAndFieldKey(tenantId, entityType, fieldKey)
                .map(mapper::toDomain);
    }

    @Override
    public boolean existsByTenantIdAndEntityTypeAndFieldKey(
            UUID tenantId, EntityType entityType, String fieldKey) {
        return repository.existsByTenantIdAndEntityTypeAndFieldKey(tenantId, entityType, fieldKey);
    }

    // CustomFieldDefinitionCrudPort methods
    
    @Override
    public List<CustomFieldDefinition> findByTenantIdAndEntityType(UUID tenantId, EntityType entityType) {
        return repository.findByTenantIdAndEntityType(tenantId, entityType).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomFieldDefinition> findGlobalByEntityType(EntityType entityType) {
        // Global fields are those with isGlobal = true or tenantId = null
        // For now, we'll return empty list as global fields are not yet implemented
        // TODO: Implement global fields support when needed
        return List.of();
    }
}

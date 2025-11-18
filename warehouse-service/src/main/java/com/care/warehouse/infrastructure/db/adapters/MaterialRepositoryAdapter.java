package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Material;
import com.care.warehouse.domain.ports.out.MaterialRepositoryPort;
import com.care.warehouse.domain.ports.out.MaterialSearchPort;
import com.care.warehouse.infrastructure.db.config.MaterialFilterConfig;
import com.care.warehouse.infrastructure.db.entities.MaterialEntity;
import com.care.warehouse.infrastructure.db.mappers.MaterialJpaMapper;
import com.care.warehouse.infrastructure.db.repository.MaterialJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericSpecificationBuilder;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Adapter implementation for MaterialRepositoryPort and MaterialSearchPort.
 * Extends BaseJpaAdapter from shared-lib for standard CRUD and search operations.
 * 
 * This adapter:
 * - Converts between domain model (Material) and entity (MaterialEntity)
 * - Handles tenant isolation automatically
 * - Provides filtering capabilities via JpaSpecificationExecutor
 */
@Component
public class MaterialRepositoryAdapter
        extends BaseJpaAdapter<Material, MaterialEntity, UUID, FilterRequest>
        implements MaterialRepositoryPort, MaterialSearchPort {

    private final MaterialJpaRepository repository;
    private final MaterialJpaMapper mapper;

    public MaterialRepositoryAdapter(
            MaterialJpaRepository repository,
            MaterialJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    protected Specification<MaterialEntity> buildSpecification(FilterRequest filter) {
        // Always add tenant filter for tenant isolation
        UUID tenantId = TenantContext.get();
        Specification<MaterialEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        // Add soft delete filter (only non-deleted materials)
        Specification<MaterialEntity> notDeletedSpec = (root, query, cb) -> 
            cb.equal(root.get("isDeleted"), false);
        
        // Combine tenant and soft delete filters
        Specification<MaterialEntity> baseSpec = tenantSpec.and(notDeletedSpec);
        
        // If no filter provided, return base specification
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return baseSpec;
        }

        // Build dynamic specification from filter request
        Specification<MaterialEntity> filterSpec = new GenericSpecificationBuilder<MaterialEntity>(
                MaterialFilterConfig.ALLOWED_FIELDS)
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();

        // Combine all specifications
        return baseSpec.and(filterSpec);
    }

    @Override
    public boolean existsByTenantIdAndCode(UUID tenantId, String code) {
        return repository.existsByTenantIdAndCode(tenantId, code);
    }

    @Override
    public Optional<Material> findByTenantIdAndCode(UUID tenantId, String code) {
        return repository.findByTenantIdAndCode(tenantId, code)
                .map(entity -> mapper.toDomain(entity));
    }

    @Override
    public Optional<Material> findByDeterminerValue(UUID tenantId, String determinerValue) {
        return repository.findByDeterminerValueNative(tenantId, determinerValue)
                .map(entity -> mapper.toDomain(entity));
    }

    @Override
    public boolean existsByDeterminerValue(UUID tenantId, String determinerValue) {
        return repository.existsByDeterminerValueNative(tenantId, determinerValue);
    }
}


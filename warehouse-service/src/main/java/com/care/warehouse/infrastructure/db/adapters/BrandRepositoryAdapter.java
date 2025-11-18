package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Brand;
import com.care.warehouse.domain.ports.out.BrandRepositoryPort;
import com.care.warehouse.infrastructure.db.config.BrandFilterConfig;
import com.care.warehouse.infrastructure.db.entities.BrandEntity;
import com.care.warehouse.infrastructure.db.mappers.BrandJpaMapper;
import com.care.warehouse.infrastructure.db.repository.BrandJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericSpecificationBuilder;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Adapter implementation for BrandRepositoryPort.
 * Extends BaseJpaAdapter from shared-lib for standard CRUD and search operations.
 * 
 * This adapter:
 * - Converts between domain model (Brand) and entity (BrandEntity)
 * - Handles tenant isolation automatically
 * - Provides filtering capabilities via JpaSpecificationExecutor
 */
@Component
public class BrandRepositoryAdapter
        extends BaseJpaAdapter<Brand, BrandEntity, UUID, FilterRequest>
        implements BrandRepositoryPort, com.care.warehouse.domain.ports.out.BrandSearchPort {

    private final BrandJpaRepository repository;
    private final BrandJpaMapper mapper;

    public BrandRepositoryAdapter(
            BrandJpaRepository repository,
            BrandJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    protected Specification<BrandEntity> buildSpecification(FilterRequest filter) {
        // Always add tenant filter for tenant isolation
        UUID tenantId = TenantContext.get();
        Specification<BrandEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        // Add soft delete filter (only non-deleted brands)
        Specification<BrandEntity> notDeletedSpec = (root, query, cb) -> 
            cb.equal(root.get("isDeleted"), false);
        
        // Combine tenant and soft delete filters
        Specification<BrandEntity> baseSpec = tenantSpec.and(notDeletedSpec);
        
        // If no filter provided, return base specification
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return baseSpec;
        }

        // Build dynamic specification from filter request
        Specification<BrandEntity> filterSpec = new GenericSpecificationBuilder<BrandEntity>(
                BrandFilterConfig.ALLOWED_FIELDS)
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();

        // Combine all specifications
        return baseSpec.and(filterSpec);
    }

    @Override
    public boolean existsByNameForTenant(UUID tenantId, String name, UUID excludeId) {
        String namePattern = "%" + name + "%";
        return repository.existsByNameForTenant(tenantId, namePattern, excludeId);
    }

    @Override
    public Optional<Brand> findByTenantIdAndName(UUID tenantId, String name) {
        String namePattern = "%" + name + "%";
        return repository.findByNameContaining(tenantId, namePattern).stream()
                .findFirst()
                .map(entity -> mapper.toDomain(entity));
    }
}


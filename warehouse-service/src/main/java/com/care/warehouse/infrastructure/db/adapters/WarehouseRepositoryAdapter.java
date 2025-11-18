package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.ports.out.WarehouseRepositoryPort;
import com.care.warehouse.domain.ports.out.WarehouseSearchPort;
import com.care.warehouse.infrastructure.db.config.WarehouseFilterConfig;
import com.care.warehouse.infrastructure.db.entities.WarehouseEntity;
import com.care.warehouse.infrastructure.db.mappers.WarehouseJpaMapper;
import com.care.warehouse.infrastructure.db.repository.WarehouseJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericSpecificationBuilder;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Adapter implementation for WarehouseRepositoryPort and WarehouseSearchPort.
 * Extends BaseJpaAdapter from shared-lib for standard CRUD and search operations.
 * 
 * This adapter:
 * - Converts between domain model (Warehouse) and entity (WarehouseEntity)
 * - Handles tenant isolation automatically
 * - Provides filtering capabilities via JpaSpecificationExecutor
 */
@Component
public class WarehouseRepositoryAdapter
        extends BaseJpaAdapter<Warehouse, WarehouseEntity, UUID, FilterRequest>
        implements WarehouseRepositoryPort, WarehouseSearchPort {

    private final WarehouseJpaRepository repository;
    private final WarehouseJpaMapper mapper;

    public WarehouseRepositoryAdapter(
            WarehouseJpaRepository repository,
            WarehouseJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    protected Specification<WarehouseEntity> buildSpecification(FilterRequest filter) {
        // Always add tenant filter for tenant isolation
        UUID tenantId = TenantContext.get();
        Specification<WarehouseEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        // Add soft delete filter (only non-deleted warehouses)
        Specification<WarehouseEntity> notDeletedSpec = (root, query, cb) -> 
            cb.equal(root.get("isDeleted"), false);
        
        // Combine tenant and soft delete filters
        Specification<WarehouseEntity> baseSpec = tenantSpec.and(notDeletedSpec);
        
        // If no filter provided, return base specification
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return baseSpec;
        }

        // Build dynamic specification from filter request
        Specification<WarehouseEntity> filterSpec = new GenericSpecificationBuilder<WarehouseEntity>(
                WarehouseFilterConfig.ALLOWED_FIELDS)
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
    public Optional<Warehouse> findByTenantIdAndCode(UUID tenantId, String code) {
        return repository.findByTenantIdAndCode(tenantId, code)
                .map(entity -> mapper.toDomain(entity));
    }

    @Override
    public boolean hasChildren(UUID warehouseId, UUID tenantId) {
        return repository.hasChildren(warehouseId, tenantId);
    }

    @Override
    public boolean isValidParent(UUID parentWarehouseId, UUID tenantId) {
        return repository.isValidParent(parentWarehouseId, tenantId);
    }
}


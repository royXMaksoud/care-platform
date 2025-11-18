package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.WarehouseMaterialStock;
import com.care.warehouse.domain.ports.out.warehousematerialstock.WarehouseMaterialStockCrudPort;
import com.care.warehouse.infrastructure.db.entities.WarehouseMaterialStockEntity;
import com.care.warehouse.infrastructure.db.mappers.WarehouseMaterialStockJpaMapper;
import com.care.warehouse.infrastructure.db.repository.WarehouseMaterialStockJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter implementation for WarehouseMaterialStockCrudPort.
 * Extends BaseJpaAdapter from shared-lib for standard CRUD operations.
 */
@Component
public class WarehouseMaterialStockRepositoryAdapter
        extends BaseJpaAdapter<WarehouseMaterialStock, WarehouseMaterialStockEntity, UUID, com.sharedlib.core.filter.FilterRequest>
        implements WarehouseMaterialStockCrudPort {

    private final WarehouseMaterialStockJpaRepository repository;
    private final WarehouseMaterialStockJpaMapper mapper;

    public WarehouseMaterialStockRepositoryAdapter(
            WarehouseMaterialStockJpaRepository repository,
            WarehouseMaterialStockJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<WarehouseMaterialStock> findByMaterialAndWarehouseAndLot(
            UUID tenantId, UUID materialId, UUID warehouseId, String lotNumber) {
        return repository.findByMaterialAndWarehouseAndLot(tenantId, materialId, warehouseId, lotNumber)
                .map(mapper::toDomain);
    }

    @Override
    public List<WarehouseMaterialStock> findByMaterialId(UUID tenantId, UUID materialId) {
        return repository.findByMaterialId(tenantId, materialId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarehouseMaterialStock> findByWarehouseId(UUID tenantId, UUID warehouseId) {
        return repository.findByWarehouseId(tenantId, warehouseId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarehouseMaterialStock> findBelowReorderLevel(UUID tenantId) {
        return repository.findBelowReorderLevel(tenantId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    protected Specification<WarehouseMaterialStockEntity> buildSpecification(FilterRequest filter) {
        // Always add tenant filter for tenant isolation
        UUID tenantId = TenantContext.get();
        Specification<WarehouseMaterialStockEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        // Add soft delete filter (only non-deleted stock)
        Specification<WarehouseMaterialStockEntity> notDeletedSpec = (root, query, cb) -> 
            cb.equal(root.get("isDeleted"), false);
        
        // Combine tenant and soft delete filters
        Specification<WarehouseMaterialStockEntity> baseSpec = tenantSpec.and(notDeletedSpec);
        
        // If no filter provided, return base specification
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return baseSpec;
        }
        
        // For now, just return base spec since WarehouseMaterialStock doesn't have complex filtering
        // If needed, can add GenericSpecificationBuilder similar to other adapters
        return baseSpec;
    }
}


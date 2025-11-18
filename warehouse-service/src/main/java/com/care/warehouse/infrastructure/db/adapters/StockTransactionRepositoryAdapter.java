package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.StockTransaction;
import com.care.warehouse.domain.ports.out.stock.StockTransactionPort;
import com.care.warehouse.infrastructure.db.entities.StockTransactionEntity;
import com.care.warehouse.infrastructure.db.mappers.StockTransactionJpaMapper;
import com.care.warehouse.infrastructure.db.repository.StockTransactionJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

/**
 * Adapter implementation for StockTransactionPort.
 * Extends BaseJpaAdapter from shared-lib for standard CRUD operations.
 * 
 * This adapter:
 * - Converts between domain model (StockTransaction) and entity (StockTransactionEntity)
 * - Handles tenant isolation automatically
 * - Provides filtering capabilities via JpaSpecificationExecutor
 * 
 * @author CARE Team
 */
@Component
public class StockTransactionRepositoryAdapter
        extends BaseJpaAdapter<StockTransaction, StockTransactionEntity, UUID, FilterRequest>
        implements StockTransactionPort {

    private static final Set<String> ALLOWED_FILTER_FIELDS = Set.of(
            "transactionId",
            "tenantId",
            "materialId",
            "transactionType",
            "sourceWarehouseId",
            "targetWarehouseId",
            "quantity",
            "reason",
            "referenceDocument",
            "createdById",
            "createdAt",
            "notes"
    );

    private final StockTransactionJpaRepository repository;
    private final StockTransactionJpaMapper mapper;

    public StockTransactionRepositoryAdapter(
            StockTransactionJpaRepository repository,
            StockTransactionJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    protected Specification<StockTransactionEntity> buildSpecification(FilterRequest filter) {
        // Always add tenant filter for tenant isolation
        UUID tenantId = TenantContext.get();
        Specification<StockTransactionEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        // If no filter provided, return tenant specification only
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return tenantSpec;
        }

        // Build dynamic specification from filter request
        // Note: For stock transactions, we may want to add specific field mappings
        // For now, using generic specification builder
        Specification<StockTransactionEntity> filterSpec = new com.sharedlib.core.filter.GenericSpecificationBuilder<StockTransactionEntity>(ALLOWED_FILTER_FIELDS)
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();

        // Combine tenant and filter specifications
        return tenantSpec.and(filterSpec);
    }
}


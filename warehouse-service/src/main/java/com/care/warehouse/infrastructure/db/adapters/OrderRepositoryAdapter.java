package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.enums.OrderStatus;
import com.care.warehouse.domain.model.Order;
import com.care.warehouse.domain.ports.out.order.OrderCrudPort;
import com.care.warehouse.infrastructure.db.entities.OrderEntity;
import com.care.warehouse.infrastructure.db.entities.OrderItemEntity;
import com.care.warehouse.infrastructure.db.mappers.OrderJpaMapper;
import com.care.warehouse.infrastructure.db.repository.OrderJpaRepository;
import com.care.warehouse.infrastructure.db.repository.OrderItemJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter implementation for OrderCrudPort.
 * Extends BaseJpaAdapter from shared-lib for standard CRUD operations.
 *
 * This adapter:
 * - Converts between domain model (Order) and entity (OrderEntity)
 * - Handles order items persistence
 * - Handles tenant isolation automatically
 */
@Component
@Slf4j
public class OrderRepositoryAdapter
        extends BaseJpaAdapter<Order, OrderEntity, UUID, FilterRequest>
        implements OrderCrudPort {

    private final OrderJpaRepository repository;
    private final OrderItemJpaRepository itemRepository;
    private final OrderJpaMapper mapper;

    public OrderRepositoryAdapter(
            OrderJpaRepository repository,
            OrderItemJpaRepository itemRepository,
            OrderJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.itemRepository = itemRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Order save(Order domain) {
        // Convert domain to entity
        OrderEntity entity = mapper.toEntity(domain);

        // Persist entity
        OrderEntity saved = repository.save(entity);

        // Save order items if present
        if (domain.getItems() != null && !domain.getItems().isEmpty()) {
            // Delete existing items (if any)
            itemRepository.deleteByOrderId(saved.getId());

            // Save new items
            domain.getItems().forEach(item -> {
                OrderItemEntity itemEntity = mapper.itemDomainToEntity(item);
                itemEntity.setOrderId(saved.getId());
                itemRepository.save(itemEntity);
            });
        }

        // Load saved order with items
        return loadWithItems(saved.getId());
    }

    @Override
    @Transactional
    public Optional<Order> load(UUID id) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return Optional.empty();
        }

        return repository.findByIdAndTenantId(id, tenantId)
                .map(this::mapWithItems);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repository.findById(id).ifPresent(entity -> {
            entity.setIsDeleted(true);
            repository.save(entity);
        });
    }

    @Override
    public List<Order> findByWarehouseId(UUID tenantId, UUID warehouseId) {
        return repository.findByWarehouseId(warehouseId, tenantId).stream()
                .map(this::mapWithItems)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByStatus(UUID tenantId, OrderStatus status) {
        return repository.findByStatus(status, tenantId).stream()
                .map(this::mapWithItems)
                .collect(Collectors.toList());
    }

    @Override
    protected Specification<OrderEntity> buildSpecification(FilterRequest filter) {
        // Always add tenant filter for tenant isolation
        UUID tenantId = TenantContext.get();
        Specification<OrderEntity> tenantSpec = (root, query, cb) ->
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();

        // Add soft delete filter (only non-deleted orders)
        Specification<OrderEntity> notDeletedSpec = (root, query, cb) ->
            cb.equal(root.get("isDeleted"), false);

        // Combine tenant and soft delete filters
        return tenantSpec.and(notDeletedSpec);
    }

    /**
     * Load an order with its items by ID.
     */
    private Order loadWithItems(UUID orderId) {
        Optional<OrderEntity> entity = repository.findById(orderId);
        if (entity.isEmpty()) {
            return null;
        }

        return mapWithItems(entity.get());
    }

    /**
     * Map OrderEntity to Order domain model with items.
     */
    private Order mapWithItems(OrderEntity entity) {
        Order order = mapper.toDomain(entity);

        // Load items for this order
        List<OrderItemEntity> items = itemRepository.findByOrderId(entity.getId());
        if (!items.isEmpty()) {
            order.setItems(items.stream()
                    .map(mapper::itemEntityToDomain)
                    .collect(Collectors.toList()));
        }

        return order;
    }
}

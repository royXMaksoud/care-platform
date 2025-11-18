package com.care.warehouse.application.warehouse.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.warehouse.command.CreateWarehouseCommand;
import com.care.warehouse.application.warehouse.command.UpdateWarehouseCommand;
import com.care.warehouse.application.warehouse.mapper.WarehouseAppMapper;
import com.care.warehouse.application.warehouse.query.ListWarehousesQuery;
import com.care.warehouse.application.warehouse.validation.CreateWarehouseValidator;
import com.care.warehouse.application.warehouse.validation.UpdateWarehouseValidator;
import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.domain.ports.iot.IoTEventGateway;
import com.care.warehouse.domain.ports.out.WarehouseRepositoryPort;
import com.care.warehouse.domain.ports.out.WarehouseSearchPort;
import com.care.warehouse.domain.ports.traceability.TraceabilityLedgerPort;
import com.sharedlib.core.application.service.CrudApplicationService;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.i18n.MessageResolver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * WarehouseServiceImpl implements use cases for Warehouse aggregate.
 * Extends generic CrudApplicationService and injects domain-specific logic via hooks.
 */
@Service
public class WarehouseServiceImpl
        extends CrudApplicationService<UUID, Warehouse, CreateWarehouseCommand, UpdateWarehouseCommand, Warehouse, FilterRequest>
        implements CreateWarehouseUseCase, UpdateWarehouseUseCase, GetWarehouseByIdUseCase, ListWarehousesUseCase {

    private final CreateWarehouseValidator createWarehouseValidator;
    private final UpdateWarehouseValidator updateWarehouseValidator;
    private final MessageResolver messageResolver;
    private final IoTEventGateway iotEventGateway;
    private final TraceabilityLedgerPort traceabilityLedgerPort;

    public WarehouseServiceImpl(
            WarehouseRepositoryPort crudPort,
            WarehouseSearchPort searchPort,
            WarehouseAppMapper mapper,
            CreateWarehouseValidator createWarehouseValidator,
            UpdateWarehouseValidator updateWarehouseValidator,
            MessageResolver messageResolver,
            IoTEventGateway iotEventGateway,
            TraceabilityLedgerPort traceabilityLedgerPort) {
        super(crudPort, searchPort, mapper);
        this.createWarehouseValidator = createWarehouseValidator;
        this.updateWarehouseValidator = updateWarehouseValidator;
        this.messageResolver = messageResolver;
        this.iotEventGateway = iotEventGateway;
        this.traceabilityLedgerPort = traceabilityLedgerPort;
    }

    // ----------------------
    // Hooks implementations
    // ----------------------

    // Track operation type and previous state for IoT/Blockchain integration
    private final ThreadLocal<Boolean> isCreateOperation = new ThreadLocal<>();
    private final ThreadLocal<Warehouse> previousState = new ThreadLocal<>();

    @Override
    protected Warehouse beforeCreate(Warehouse warehouse) {
        isCreateOperation.set(true);
        previousState.remove(); // No previous state for create
        
        // Enrich audit info if available
        if (warehouse.getCreatedById() == null && CurrentUserContext.get() != null) {
            warehouse.setCreatedById(CurrentUserContext.get().userId());
        }

        // Set tenantId from TenantContext (not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId != null && warehouse.getTenantId() == null) {
            warehouse.setTenantId(tenantId);
        }

        // Domain validations BEFORE persist
        createWarehouseValidator.validate(warehouse);
        return warehouse;
    }

    @Override
    protected Warehouse beforeUpdate(Warehouse current, UpdateWarehouseCommand cmd) {
        isCreateOperation.set(false);
        
        // Store previous state for blockchain traceability (before modifications)
        // Create a copy to preserve the original state
        Warehouse previous = Warehouse.builder()
                .id(current.getId())
                .tenantId(current.getTenantId())
                .code(current.getCode())
                .nameTranslations(current.getNameTranslations())
                .descriptionTranslations(current.getDescriptionTranslations())
                .warehouseType(current.getWarehouseType())
                .parentWarehouseId(current.getParentWarehouseId())
                .countryId(current.getCountryId())
                .locationId(current.getLocationId())
                .addressLine1(current.getAddressLine1())
                .addressLine2(current.getAddressLine2())
                .city(current.getCity())
                .state(current.getState())
                .postalCode(current.getPostalCode())
                .countryCode(current.getCountryCode())
                .latitude(current.getLatitude())
                .longitude(current.getLongitude())
                .timeZone(current.getTimeZone())
                .customData(current.getCustomData())
                .isActive(current.getIsActive())
                .isDeleted(current.getIsDeleted())
                .createdById(current.getCreatedById())
                .createdAt(current.getCreatedAt())
                .updatedById(current.getUpdatedById())
                .updatedAt(current.getUpdatedAt())
                .rowVersion(current.getRowVersion())
                .build();
        previousState.set(previous);
        
        // Ensure tenantId is set (from TenantContext, not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId != null) {
            current.setTenantId(tenantId);
        }

        // Maintain audit fields (updatedBy/updatedAt)
        if (CurrentUserContext.get() != null) {
            current.setUpdatedById(CurrentUserContext.get().userId());
        }

        // Run update validations
        updateWarehouseValidator.validate(current);
        return current;
    }

    @Override
    protected void afterSave(Warehouse saved) {
        // Publish IoT events and blockchain traceability records
        // These are called after successful database commit
        
        try {
            // Build metadata for events
            Map<String, Object> eventMetadata = buildEventMetadata();
            
            Boolean isCreate = isCreateOperation.get();
            if (isCreate != null && isCreate) {
                // This is a create operation
                iotEventGateway.notifyWarehouseCreated(saved, eventMetadata);
                traceabilityLedgerPort.recordWarehouseCreated(saved, eventMetadata);
            } else {
                // This is an update operation
                Warehouse previous = previousState.get();
                iotEventGateway.notifyWarehouseUpdated(saved, eventMetadata);
                traceabilityLedgerPort.recordWarehouseUpdated(saved, previous, eventMetadata);
            }
        } catch (Exception e) {
            // Log but don't fail the transaction if IoT/Blockchain integration fails
            // This ensures business logic continues even if external systems are down
            org.slf4j.LoggerFactory.getLogger(WarehouseServiceImpl.class)
                    .error("Failed to publish IoT event or record blockchain transaction for warehouse {}: {}",
                            saved.getId(), e.getMessage(), e);
        } finally {
            // Always clear thread locals
            isCreateOperation.remove();
            previousState.remove();
        }
    }

    @Override
    protected NotFoundException notFound(UUID id) {
        // i18n-friendly NotFoundException
        return new NotFoundException(
                messageResolver.getMessage("error.warehouse.not-found", new Object[]{id.toString()})
        );
    }

    // ----------------------
    // UseCase adapters
    // ----------------------

    @Override
    @Transactional
    public Warehouse createWarehouse(CreateWarehouseCommand command) {
        return create(command); // uses template method + hooks
    }

    @Override
    @Transactional
    public Warehouse updateWarehouse(UpdateWarehouseCommand command) {
        return update(command.getId(), command); // uses template method + hooks
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Warehouse> getWarehouseById(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.warehouse.not-found", new Object[]{id.toString()}));
        }
        
        // Load with tenant check
        Warehouse warehouse = getById(id);
        if (warehouse == null || !warehouse.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        return Optional.of(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Warehouse> listWarehouses(ListWarehousesQuery query, Pageable pageable) {
        // Never pass null down; guard with empty FilterRequest if needed upstream.
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }

    /**
     * Override delete to add IoT and blockchain integration.
     */
    @Override
    @Transactional
    public void delete(UUID id) {
        // Load warehouse before deletion to get state for IoT/Blockchain
        Warehouse warehouse = crudPort.load(id)
                .orElseThrow(() -> notFound(id));
        
        UUID tenantId = TenantContext.get();
        if (tenantId != null && !warehouse.getTenantId().equals(tenantId)) {
            throw notFound(id); // Tenant isolation check
        }
        
        // Perform deletion
        crudPort.delete(id);
        
        // Publish IoT and blockchain events after successful deletion
        try {
            Map<String, Object> eventMetadata = buildEventMetadata();
            iotEventGateway.notifyWarehouseDeleted(id, tenantId, eventMetadata);
            traceabilityLedgerPort.recordWarehouseDeleted(id, tenantId, warehouse, eventMetadata);
        } catch (Exception e) {
            // Log but don't fail if IoT/Blockchain integration fails
            org.slf4j.LoggerFactory.getLogger(WarehouseServiceImpl.class)
                    .error("Failed to publish IoT event or record blockchain transaction for warehouse deletion {}: {}",
                            id, e.getMessage(), e);
        }
    }

    /**
     * Build event metadata for IoT and blockchain events.
     * Includes user context, tenant context, and timestamp.
     */
    private Map<String, Object> buildEventMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        
        // Add user context
        if (CurrentUserContext.hasUser()) {
            var currentUser = CurrentUserContext.get();
            metadata.put("userId", currentUser.userId());
            metadata.put("userEmail", currentUser.email());
            metadata.put("userLanguage", currentUser.language());
        }
        
        // Add tenant context
        UUID tenantId = TenantContext.get();
        if (tenantId != null) {
            metadata.put("tenantId", tenantId);
        }
        
        // Add timestamp
        metadata.put("timestamp", java.time.Instant.now().toString());
        
        return metadata;
    }
}


package com.care.warehouse.application.material.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.material.command.CreateMaterialCommand;
import com.care.warehouse.application.material.command.UpdateMaterialCommand;
import com.care.warehouse.application.material.mapper.MaterialAppMapper;
import com.care.warehouse.application.material.query.SearchMaterialsQuery;
import com.care.warehouse.application.material.validation.CreateMaterialValidator;
import com.care.warehouse.application.material.validation.UpdateMaterialValidator;
import com.care.warehouse.domain.model.Material;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.domain.ports.iot.IoTEventGateway;
import com.care.warehouse.domain.ports.out.MaterialRepositoryPort;
import com.care.warehouse.domain.ports.out.MaterialSearchPort;
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
 * MaterialServiceImpl implements use cases for Material aggregate.
 * Extends generic CrudApplicationService and injects domain-specific logic via hooks.
 */
@Service
public class MaterialServiceImpl
        extends CrudApplicationService<UUID, Material, CreateMaterialCommand, UpdateMaterialCommand, Material, FilterRequest>
        implements CreateMaterialUseCase, UpdateMaterialUseCase, GetMaterialByIdUseCase, SearchMaterialsUseCase, DeleteMaterialUseCase {

    private final CreateMaterialValidator createMaterialValidator;
    private final UpdateMaterialValidator updateMaterialValidator;
    private final MessageResolver messageResolver;
    private final IoTEventGateway iotEventGateway;
    private final TraceabilityLedgerPort traceabilityLedgerPort;
    private final MaterialRepositoryPort materialRepositoryPort;

    public MaterialServiceImpl(
            MaterialRepositoryPort crudPort,
            MaterialSearchPort searchPort,
            MaterialAppMapper mapper,
            CreateMaterialValidator createMaterialValidator,
            UpdateMaterialValidator updateMaterialValidator,
            MessageResolver messageResolver,
            IoTEventGateway iotEventGateway,
            TraceabilityLedgerPort traceabilityLedgerPort) {
        super(crudPort, searchPort, mapper);
        this.createMaterialValidator = createMaterialValidator;
        this.updateMaterialValidator = updateMaterialValidator;
        this.messageResolver = messageResolver;
        this.iotEventGateway = iotEventGateway;
        this.traceabilityLedgerPort = traceabilityLedgerPort;
        this.materialRepositoryPort = crudPort;
    }

    // ----------------------
    // Hooks implementations
    // ----------------------

    // Track operation type and previous state for IoT/Blockchain integration
    private final ThreadLocal<Boolean> isCreateOperation = new ThreadLocal<>();
    private final ThreadLocal<Material> previousState = new ThreadLocal<>();

    @Override
    protected Material beforeCreate(Material material) {
        isCreateOperation.set(true);
        previousState.remove(); // No previous state for create
        
        // Enrich audit info if available
        if (material.getCreatedById() == null && CurrentUserContext.get() != null) {
            material.setCreatedById(CurrentUserContext.get().userId());
        }

        // Set tenantId from TenantContext (not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId != null && material.getTenantId() == null) {
            material.setTenantId(tenantId);
        }

        // Domain validations BEFORE persist
        createMaterialValidator.validate(material);
        return material;
    }

    @Override
    protected Material beforeUpdate(Material current, UpdateMaterialCommand cmd) {
        isCreateOperation.set(false);
        
        // Store previous state for blockchain traceability (before modifications)
        Material previous = Material.builder()
                .id(current.getId())
                .tenantId(current.getTenantId())
                .code(current.getCode())
                .nameTranslations(current.getNameTranslations())
                .descriptionTranslations(current.getDescriptionTranslations())
                .categoryId(current.getCategoryId())
                .brandId(current.getBrandId())
                .determiners(current.getDeterminers())
                .isTrackable(current.getIsTrackable())
                .status(current.getStatus())
                .customAttributes(current.getCustomAttributes())
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
        updateMaterialValidator.validate(current);
        return current;
    }

    @Override
    protected void afterSave(Material saved) {
        // Publish IoT events and blockchain traceability records
        // These are called after successful database commit
        
        try {
            // Build metadata for events
            Map<String, Object> eventMetadata = buildEventMetadata();
            
            Boolean isCreate = isCreateOperation.get();
            if (isCreate != null && isCreate) {
                // This is a create operation
                // Build MaterialCreated event payload with all required fields
                Map<String, Object> materialCreatedPayload = new HashMap<>();
                materialCreatedPayload.put("materialId", saved.getId());
                materialCreatedPayload.put("tenantId", saved.getTenantId());
                materialCreatedPayload.put("code", saved.getCode());
                materialCreatedPayload.put("nameTranslations", saved.getNameTranslations());
                materialCreatedPayload.put("categoryId", saved.getCategoryId());
                materialCreatedPayload.put("brandId", saved.getBrandId());
                materialCreatedPayload.put("reorderLevel", saved.getReorderLevel());
                materialCreatedPayload.put("unit", saved.getUnit());
                materialCreatedPayload.put("isTrackable", saved.getIsTrackable());
                materialCreatedPayload.put("status", saved.getStatus() != null ? saved.getStatus().name() : null);
                materialCreatedPayload.put("createdAt", saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : null);
                
                iotEventGateway.sendCustomEvent("MATERIAL_CREATED", null, materialCreatedPayload, eventMetadata);
                traceabilityLedgerPort.recordCustomEvent("MATERIAL_CREATED", null, materialCreatedPayload, eventMetadata);
            } else {
                // This is an update operation
                Material previous = previousState.get();
                iotEventGateway.sendCustomEvent("MATERIAL_UPDATED", null,
                    Map.of("materialId", saved.getId(), "code", saved.getCode()), eventMetadata);
                traceabilityLedgerPort.recordCustomEvent("MATERIAL_UPDATED", null,
                    Map.of("materialId", saved.getId(), "code", saved.getCode(), 
                           "previousState", previous != null ? previous.getCode() : null), eventMetadata);
            }
        } catch (Exception e) {
            // Log but don't fail the transaction if IoT/Blockchain integration fails
            org.slf4j.LoggerFactory.getLogger(MaterialServiceImpl.class)
                    .error("Failed to publish IoT event or record blockchain transaction for material {}: {}",
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
                messageResolver.getMessage("error.material.not-found", new Object[]{id.toString()})
        );
    }

    // ----------------------
    // UseCase adapters
    // ----------------------

    @Override
    @Transactional
    public Material createMaterial(CreateMaterialCommand command) {
        return create(command); // uses template method + hooks
    }

    @Override
    @Transactional
    public Material updateMaterial(UpdateMaterialCommand command) {
        return update(command.getId(), command); // uses template method + hooks
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Material> getMaterialById(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.material.not-found", new Object[]{id.toString()}));
        }
        
        // Load with tenant check
        Material material = getById(id);
        if (material == null || !material.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        return Optional.of(material);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Material> searchMaterials(SearchMaterialsQuery query, Pageable pageable) {
        // Never pass null down; guard with empty FilterRequest if needed upstream.
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }

    @Override
    @Transactional
    public void deleteMaterial(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.material.not-found", new Object[]{id.toString()}));
        }
        
        // Load material with tenant check
        Material material = getById(id);
        if (material == null || !material.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        // Check if material is already deleted
        if (Boolean.TRUE.equals(material.getIsDeleted())) {
            throw new NotFoundException(messageResolver.getMessage("error.material.not-found", new Object[]{id.toString()}));
        }
        
        // TODO: Add dependency validation (e.g., check if material has stock items or orders)
        // For now, we allow soft delete without dependency checks
        
        // Perform soft delete
        material.setIsDeleted(true);
        material.setIsActive(false);
        if (CurrentUserContext.get() != null) {
            material.setUpdatedById(CurrentUserContext.get().userId());
        }
        material.setUpdatedAt(java.time.Instant.now());
        
        // Save updated material
        materialRepositoryPort.save(material);
        
        // Publish deletion event
        try {
            Map<String, Object> eventMetadata = buildEventMetadata();
            iotEventGateway.sendCustomEvent("MATERIAL_DELETED", null,
                    Map.of("materialId", material.getId(), "code", material.getCode()), eventMetadata);
            traceabilityLedgerPort.recordCustomEvent("MATERIAL_DELETED", null,
                    Map.of("materialId", material.getId(), "code", material.getCode()), eventMetadata);
        } catch (Exception e) {
            // Log but don't fail the transaction if IoT/Blockchain integration fails
            org.slf4j.LoggerFactory.getLogger(MaterialServiceImpl.class)
                    .error("Failed to publish IoT event or record blockchain transaction for material deletion {}: {}",
                            material.getId(), e.getMessage(), e);
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


package com.care.warehouse.application.customfielddefinition.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.customfielddefinition.command.CreateCustomFieldDefinitionCommand;
import com.care.warehouse.application.customfielddefinition.command.UpdateCustomFieldDefinitionCommand;
import com.care.warehouse.application.customfielddefinition.mapper.CustomFieldDefinitionAppMapper;
import com.care.warehouse.application.customfielddefinition.query.GetAllCustomFieldDefinitionsQuery;
import com.care.warehouse.application.customfielddefinition.validation.CreateValidator;
import com.care.warehouse.application.customfielddefinition.validation.UpdateValidator;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.domain.ports.in.customfielddefinition.*;
import com.care.warehouse.domain.ports.out.customfielddefinition.CustomFieldDefinitionCrudPort;
import com.care.warehouse.domain.ports.out.customfielddefinition.CustomFieldDefinitionSearchPort;
import com.sharedlib.core.application.service.CrudApplicationService;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.i18n.MessageResolver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * CustomFieldDefinitionServiceImpl implements use cases for CustomFieldDefinition aggregate.
 * Extends generic CrudApplicationService and injects domain-specific logic via hooks.
 */
@Service
public class CustomFieldDefinitionServiceImpl
        extends CrudApplicationService<UUID, CustomFieldDefinition, CreateCustomFieldDefinitionCommand, UpdateCustomFieldDefinitionCommand, CustomFieldDefinition, FilterRequest>
        implements SaveUseCase, UpdateCustomFieldDefinitionUseCase, LoadUseCase, DeleteCustomFieldDefinitionUseCase, LoadAllUseCase {

    private final CreateValidator createValidator;
    private final UpdateValidator updateValidator;
    private final MessageResolver messageResolver;

    public CustomFieldDefinitionServiceImpl(
            CustomFieldDefinitionCrudPort crudPort,
            CustomFieldDefinitionSearchPort searchPort,
            CustomFieldDefinitionAppMapper mapper,
            CreateValidator createValidator,
            UpdateValidator updateValidator,
            MessageResolver messageResolver) {
        super(crudPort, searchPort, mapper);
        this.createValidator = createValidator;
        this.updateValidator = updateValidator;
        this.messageResolver = messageResolver;
    }

    // ----------------------
    // Hooks implementations
    // ----------------------

    @Override
    protected CustomFieldDefinition beforeCreate(CustomFieldDefinition definition) {
        // Enrich audit info if available
        if (definition.getCreatedById() == null && CurrentUserContext.get() != null) {
            definition.setCreatedById(CurrentUserContext.get().userId());
        }

        // Set tenantId from TenantContext (not from client) unless it's global
        if (!Boolean.TRUE.equals(definition.getIsGlobal())) {
            UUID tenantId = TenantContext.get();
            if (tenantId != null && definition.getTenantId() == null) {
                definition.setTenantId(tenantId);
            }
        }

        // Domain validations BEFORE persist
        createValidator.validate(definition);
        return definition;
    }

    @Override
    protected CustomFieldDefinition beforeUpdate(CustomFieldDefinition current, UpdateCustomFieldDefinitionCommand cmd) {
        // Ensure tenantId is set (from TenantContext, not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId != null && !Boolean.TRUE.equals(current.getIsGlobal())) {
            current.setTenantId(tenantId);
        }

        // Maintain audit fields (updatedBy/updatedAt)
        if (CurrentUserContext.get() != null) {
            current.setUpdatedById(CurrentUserContext.get().userId());
        }

        // Run update validations
        updateValidator.validate(current);
        return current;
    }

    @Override
    protected NotFoundException notFound(UUID id) {
        // i18n-friendly NotFoundException
        return new NotFoundException(
                messageResolver.getMessage("error.customFieldDefinition.not-found", new Object[]{id.toString()})
        );
    }

    // ----------------------
    // UseCase adapters
    // ----------------------

    @Override
    @Transactional
    public CustomFieldDefinition save(CreateCustomFieldDefinitionCommand command) {
        return create(command); // uses template method + hooks
    }

    @Override
    @Transactional
    public CustomFieldDefinition update(UpdateCustomFieldDefinitionCommand command) {
        return update(command.getId(), command); // uses template method + hooks
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CustomFieldDefinition> getCustomFieldDefinitionById(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.customFieldDefinition.not-found", new Object[]{id.toString()}));
        }
        
        // Load with tenant check
        CustomFieldDefinition definition = getById(id);
        if (definition == null) {
            throw notFound(id);
        }
        
        // Check tenant access (allow global fields or same tenant)
        if (!Boolean.TRUE.equals(definition.getIsGlobal()) && !definition.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        return Optional.of(definition);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomFieldDefinition> getAll(GetAllCustomFieldDefinitionsQuery query, Pageable pageable) {
        // Never pass null down; guard with empty FilterRequest if needed upstream.
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }
}


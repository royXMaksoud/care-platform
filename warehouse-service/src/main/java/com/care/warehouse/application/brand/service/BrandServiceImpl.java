package com.care.warehouse.application.brand.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.brand.command.CreateBrandCommand;
import com.care.warehouse.application.brand.command.UpdateBrandCommand;
import com.care.warehouse.application.brand.mapper.BrandAppMapper;
import com.care.warehouse.application.brand.query.SearchBrandsQuery;
import com.care.warehouse.application.brand.validation.CreateBrandValidator;
import com.care.warehouse.application.brand.validation.UpdateBrandValidator;
import com.care.warehouse.domain.model.Brand;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.domain.ports.out.BrandRepositoryPort;
import com.care.warehouse.domain.ports.out.BrandSearchPort;
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
 * BrandServiceImpl implements use cases for Brand aggregate.
 * Extends generic CrudApplicationService and injects domain-specific logic via hooks.
 */
@Service
public class BrandServiceImpl
        extends CrudApplicationService<UUID, Brand, CreateBrandCommand, UpdateBrandCommand, Brand, FilterRequest>
        implements CreateBrandUseCase, UpdateBrandUseCase, GetBrandByIdUseCase, SearchBrandsUseCase, DeleteBrandUseCase {

    private final CreateBrandValidator createBrandValidator;
    private final UpdateBrandValidator updateBrandValidator;
    private final MessageResolver messageResolver;
    private final BrandRepositoryPort brandRepositoryPort;

    public BrandServiceImpl(
            BrandRepositoryPort crudPort,
            BrandSearchPort searchPort,
            BrandAppMapper mapper,
            CreateBrandValidator createBrandValidator,
            UpdateBrandValidator updateBrandValidator,
            MessageResolver messageResolver) {
        super(crudPort, searchPort, mapper);
        this.createBrandValidator = createBrandValidator;
        this.updateBrandValidator = updateBrandValidator;
        this.messageResolver = messageResolver;
        this.brandRepositoryPort = crudPort;
    }

    // ----------------------
    // Hooks implementations
    // ----------------------

    @Override
    protected Brand beforeCreate(Brand brand) {
        // Enrich audit info if available
        if (brand.getCreatedById() == null && CurrentUserContext.get() != null) {
            brand.setCreatedById(CurrentUserContext.get().userId());
        }

        // Set tenantId from TenantContext (not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId != null && brand.getTenantId() == null) {
            brand.setTenantId(tenantId);
        }

        // Domain validations BEFORE persist
        createBrandValidator.validate(brand);
        return brand;
    }

    @Override
    protected Brand beforeUpdate(Brand current, UpdateBrandCommand cmd) {
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
        updateBrandValidator.validate(current);
        return current;
    }

    @Override
    protected NotFoundException notFound(UUID id) {
        // i18n-friendly NotFoundException
        return new NotFoundException(
                messageResolver.getMessage("error.brand.not-found", new Object[]{id.toString()})
        );
    }

    // ----------------------
    // UseCase adapters
    // ----------------------

    @Override
    @Transactional
    public Brand createBrand(CreateBrandCommand command) {
        return create(command); // uses template method + hooks
    }

    @Override
    @Transactional
    public Brand updateBrand(UpdateBrandCommand command) {
        return update(command.getId(), command); // uses template method + hooks
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Brand> getBrandById(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.brand.not-found", new Object[]{id.toString()}));
        }
        
        // Load with tenant check
        Brand brand = getById(id);
        if (brand == null || !brand.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        return Optional.of(brand);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Brand> searchBrands(SearchBrandsQuery query, Pageable pageable) {
        // Never pass null down; guard with empty FilterRequest if needed upstream.
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }

    @Override
    @Transactional
    public void deleteBrand(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.brand.not-found", new Object[]{id.toString()}));
        }
        
        // Load brand with tenant check
        Brand brand = getById(id);
        if (brand == null || !brand.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        // Check if brand is already deleted
        if (Boolean.TRUE.equals(brand.getIsDeleted())) {
            throw new NotFoundException(messageResolver.getMessage("error.brand.not-found", new Object[]{id.toString()}));
        }
        
        // TODO: Add dependency validation (e.g., check if materials reference this brand)
        // For now, we allow soft delete without dependency checks
        
        // Perform soft delete
        brand.setIsDeleted(true);
        brand.setIsActive(false);
        if (CurrentUserContext.get() != null) {
            brand.setUpdatedById(CurrentUserContext.get().userId());
        }
        brand.setUpdatedAt(java.time.Instant.now());
        
        // Save updated brand
        brandRepositoryPort.save(brand);
    }
}


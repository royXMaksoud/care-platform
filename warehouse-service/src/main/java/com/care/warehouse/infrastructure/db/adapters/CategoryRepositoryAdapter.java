package com.care.warehouse.infrastructure.db.adapters;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Category;
import com.care.warehouse.domain.ports.out.CategoryRepositoryPort;
import com.care.warehouse.domain.ports.out.category.CategorySearchPort;
import com.care.warehouse.infrastructure.db.config.CategoryFilterConfig;
import com.care.warehouse.infrastructure.db.entities.CategoryEntity;
import com.care.warehouse.infrastructure.db.mappers.CategoryJpaMapper;
import com.care.warehouse.infrastructure.db.repository.CategoryJpaRepository;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.GenericSpecificationBuilder;
import com.sharedlib.core.persistence.adapter.BaseJpaAdapter;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Adapter implementation for CategoryRepositoryPort and CategorySearchPort.
 * 
 * Extends BaseJpaAdapter from shared-lib for standard CRUD and search operations.
 * 
 * This adapter:
 * - Converts between domain model (Category) and entity (CategoryEntity)
 * - Handles tenant isolation automatically via buildSpecification()
 * - Provides tree-specific query methods (findRootCategories, findChildrenByParentId, etc.)
 * - Supports dynamic filtering and pagination via JpaSpecificationExecutor
 * - Implements circular reference prevention logic using path-based queries
 */
@Component
public class CategoryRepositoryAdapter
        extends BaseJpaAdapter<Category, CategoryEntity, UUID, FilterRequest>
        implements CategoryRepositoryPort, CategorySearchPort {

    private final CategoryJpaRepository repository;
    private final CategoryJpaMapper mapper;

    public CategoryRepositoryAdapter(
            CategoryJpaRepository repository,
            CategoryJpaMapper mapper) {
        super(repository, repository, mapper);
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Build JPA Specification for dynamic filtering.
     * 
     * This method:
     * 1. Always adds tenant filter for tenant isolation
     * 2. Always adds soft-delete filter (only non-deleted categories)
     * 3. Applies additional filters from FilterRequest if provided
     * 
     * The specification is used by JpaSpecificationExecutor for dynamic queries.
     * 
     * @param filter FilterRequest containing criteria, groups, and scopes
     * @return JPA Specification combining tenant, soft-delete, and dynamic filters
     */
    @Override
    protected Specification<CategoryEntity> buildSpecification(FilterRequest filter) {
        // Always add tenant filter for tenant isolation
        UUID tenantId = TenantContext.get();
        Specification<CategoryEntity> tenantSpec = (root, query, cb) -> 
            tenantId != null ? cb.equal(root.get("tenantId"), tenantId) : cb.conjunction();
        
        // Add soft delete filter (only non-deleted categories)
        Specification<CategoryEntity> notDeletedSpec = (root, query, cb) -> 
            cb.equal(root.get("isDeleted"), false);
        
        // Combine tenant and soft delete filters
        Specification<CategoryEntity> baseSpec = tenantSpec.and(notDeletedSpec);
        
        // If no filter provided, return base specification
        if (filter == null ||
                ((filter.getCriteria() == null || filter.getCriteria().isEmpty()) &&
                 (filter.getGroups() == null || filter.getGroups().isEmpty()))) {
            return baseSpec;
        }

        // Build dynamic specification from filter request
        // Uses GenericSpecificationBuilder to convert FilterRequest to JPA Specification
        Specification<CategoryEntity> filterSpec = new GenericSpecificationBuilder<CategoryEntity>(
                CategoryFilterConfig.ALLOWED_FIELDS)
                .withCriteria(filter.getCriteria())
                .withGroups(filter.getGroups())
                .withScopes(filter.getScopes())
                .build();

        // Combine all specifications
        return baseSpec.and(filterSpec);
    }

    @Override
    public boolean existsByNameForTenant(UUID tenantId, String name, UUID excludeId) {
        // Search in name_translations JSONB field
        String namePattern = "%" + name + "%";
        List<CategoryEntity> results = repository.findByNameContaining(tenantId, namePattern);
        
        if (excludeId != null) {
            return results.stream()
                    .anyMatch(c -> !c.getId().equals(excludeId));
        }
        return !results.isEmpty();
    }

    @Override
    public Optional<Category> findByTenantIdAndName(UUID tenantId, String name) {
        String namePattern = "%" + name + "%";
        List<CategoryEntity> results = repository.findByNameContaining(tenantId, namePattern);
        return results.stream()
                .findFirst()
                .map(entity -> mapper.toDomain(entity));
    }

    @Override
    public List<Category> findRootCategories(UUID tenantId) {
        return repository.findRootCategories(tenantId).stream()
                .map(entity -> mapper.toDomain(entity))
                .collect(Collectors.toList());
    }

    @Override
    public List<Category> findChildrenByParentId(UUID tenantId, UUID parentId) {
        return repository.findChildrenByParentId(tenantId, parentId).stream()
                .map(entity -> mapper.toDomain(entity))
                .collect(Collectors.toList());
    }

    @Override
    public List<Category> findDescendants(UUID tenantId, UUID categoryId) {
        // First, get the category to find its path
        Optional<CategoryEntity> categoryOpt = repository.findById(categoryId);
        if (categoryOpt.isEmpty()) {
            return List.of();
        }
        
        CategoryEntity category = categoryOpt.get();
        String pathPattern = category.getPath() + "/%";
        
        return repository.findDescendantsByPath(tenantId, categoryId, pathPattern).stream()
                .map(entity -> mapper.toDomain(entity))
                .collect(Collectors.toList());
    }

    @Override
    public boolean isDescendantOf(UUID tenantId, UUID categoryId, UUID potentialParentId) {
        // Get potential parent's path
        Optional<CategoryEntity> parentOpt = repository.findById(potentialParentId);
        if (parentOpt.isEmpty()) {
            return false;
        }
        
        CategoryEntity parent = parentOpt.get();
        String parentPathPattern = parent.getPath() + "/%";
        
        return repository.isDescendantOf(tenantId, categoryId, parentPathPattern);
    }

    @Override
    public List<Category> findAllByTenantId(UUID tenantId) {
        return repository.findAllByTenantId(tenantId).stream()
                .map(entity -> mapper.toDomain(entity))
                .collect(Collectors.toList());
    }
}


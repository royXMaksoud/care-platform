package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entities.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for CategoryEntity.
 * Extends JpaRepository for CRUD operations.
 */
public interface CategoryJpaRepository extends JpaRepository<CategoryEntity, UUID>, JpaSpecificationExecutor<CategoryEntity> {
    
    /**
     * Find all root categories (categories with parentId = null) for a tenant.
     */
    @Query("SELECT c FROM CategoryEntity c WHERE c.tenantId = :tenantId AND c.parentId IS NULL AND c.isDeleted = false ORDER BY c.createdAt")
    List<CategoryEntity> findRootCategories(@Param("tenantId") UUID tenantId);
    
    /**
     * Find all direct children of a parent category.
     */
    @Query("SELECT c FROM CategoryEntity c WHERE c.tenantId = :tenantId AND c.parentId = :parentId AND c.isDeleted = false ORDER BY c.createdAt")
    List<CategoryEntity> findChildrenByParentId(@Param("tenantId") UUID tenantId, @Param("parentId") UUID parentId);
    
    /**
     * Find all descendants of a category using path.
     * Uses PostgreSQL path matching to find all categories whose path starts with the given path.
     */
    @Query(value = """
        SELECT c.* FROM categories c
        WHERE c.tenant_id = :tenantId
          AND c.is_deleted = false
          AND c.path LIKE :pathPattern
          AND c.id != :categoryId
        ORDER BY c.level, c.created_at
        """, nativeQuery = true)
    List<CategoryEntity> findDescendantsByPath(
        @Param("tenantId") UUID tenantId,
        @Param("categoryId") UUID categoryId,
        @Param("pathPattern") String pathPattern
    );
    
    /**
     * Check if a category is a descendant of another category.
     * Uses path matching to check if category's path starts with potential parent's path.
     */
    @Query(value = """
        SELECT COUNT(c) > 0 FROM categories c
        WHERE c.tenant_id = :tenantId
          AND c.is_deleted = false
          AND c.id = :categoryId
          AND c.path LIKE :parentPathPattern
        """, nativeQuery = true)
    boolean isDescendantOf(
        @Param("tenantId") UUID tenantId,
        @Param("categoryId") UUID categoryId,
        @Param("parentPathPattern") String parentPathPattern
    );
    
    /**
     * Find all categories for a tenant (excluding deleted).
     */
    @Query("SELECT c FROM CategoryEntity c WHERE c.tenantId = :tenantId AND c.isDeleted = false ORDER BY c.level, c.createdAt")
    List<CategoryEntity> findAllByTenantId(@Param("tenantId") UUID tenantId);
    
    /**
     * Find category by ID and tenant ID (excluding deleted).
     */
    @Query("SELECT c FROM CategoryEntity c WHERE c.id = :id AND c.tenantId = :tenantId AND c.isDeleted = false")
    Optional<CategoryEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
    
    /**
     * Search categories by name in translations (JSONB query).
     * Searches in any language within name_translations JSONB field.
     */
    @Query(value = """
        SELECT c.* FROM categories c
        WHERE c.tenant_id = :tenantId
          AND c.is_deleted = false
          AND c.name_translations::text ILIKE :namePattern
        ORDER BY c.level, c.created_at
        """, nativeQuery = true)
    List<CategoryEntity> findByNameContaining(
        @Param("tenantId") UUID tenantId,
        @Param("namePattern") String namePattern
    );
}


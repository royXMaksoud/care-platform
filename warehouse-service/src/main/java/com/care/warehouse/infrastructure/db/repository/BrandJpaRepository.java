package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entities.BrandEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for BrandEntity.
 * Extends JpaRepository for CRUD operations and JpaSpecificationExecutor for dynamic queries.
 */
public interface BrandJpaRepository 
        extends JpaRepository<BrandEntity, UUID>, JpaSpecificationExecutor<BrandEntity> {
    
    /**
     * Find brand by ID and tenant ID (excluding deleted).
     */
    @Query("SELECT b FROM BrandEntity b WHERE b.id = :id AND b.tenantId = :tenantId AND b.isDeleted = false")
    Optional<BrandEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
    
    /**
     * Search brands by name in translations (JSONB query).
     * Searches in any language within name_translations JSONB field.
     */
    @Query(value = """
        SELECT b.* FROM brands b
        WHERE b.tenant_id = :tenantId
          AND b.is_deleted = false
          AND b.name_translations::text ILIKE :namePattern
        ORDER BY b.created_at
        """, nativeQuery = true)
    List<BrandEntity> findByNameContaining(
        @Param("tenantId") UUID tenantId,
        @Param("namePattern") String namePattern
    );
    
    /**
     * Check if brand name exists for a tenant (excluding deleted).
     */
    @Query(value = """
        SELECT COUNT(b) > 0 FROM brands b
        WHERE b.tenant_id = :tenantId
          AND b.is_deleted = false
          AND b.name_translations::text ILIKE :namePattern
          AND (:excludeId IS NULL OR b.id != :excludeId)
        """, nativeQuery = true)
    boolean existsByNameForTenant(
        @Param("tenantId") UUID tenantId,
        @Param("namePattern") String namePattern,
        @Param("excludeId") UUID excludeId
    );
}


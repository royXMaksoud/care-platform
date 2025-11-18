package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.domain.enums.MaterialStatus;
import com.care.warehouse.infrastructure.db.entities.MaterialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for MaterialEntity.
 * Extends JpaRepository for CRUD operations and JpaSpecificationExecutor for dynamic queries.
 */
public interface MaterialJpaRepository 
        extends JpaRepository<MaterialEntity, UUID>, JpaSpecificationExecutor<MaterialEntity> {
    
    /**
     * Check if material code exists for a tenant (excluding deleted).
     */
    @Query("SELECT COUNT(m) > 0 FROM MaterialEntity m WHERE m.tenantId = :tenantId AND m.code = :code AND m.isDeleted = false")
    boolean existsByTenantIdAndCode(@Param("tenantId") UUID tenantId, @Param("code") String code);
    
    /**
     * Find material by tenant ID and code (excluding deleted).
     */
    @Query("SELECT m FROM MaterialEntity m WHERE m.tenantId = :tenantId AND m.code = :code AND m.isDeleted = false")
    Optional<MaterialEntity> findByTenantIdAndCode(@Param("tenantId") UUID tenantId, @Param("code") String code);
    
    /**
     * Find material by determiner value (searching in JSONB determiners array).
     * Uses PostgreSQL JSONB operators to search within the determiners array.
     */
    @Query(value = """
        SELECT m.* FROM materials m
        WHERE m.tenant_id = :tenantId
          AND m.is_deleted = false
          AND m.determiners @> '[{"value": :determinerValue}]'::jsonb
        LIMIT 1
        """, nativeQuery = true)
    Optional<MaterialEntity> findByDeterminerValueNative(
        @Param("tenantId") UUID tenantId,
        @Param("determinerValue") String determinerValue
    );
    
    /**
     * Check if determiner value exists for a tenant.
     */
    @Query(value = """
        SELECT COUNT(m) > 0 FROM materials m
        WHERE m.tenant_id = :tenantId
          AND m.is_deleted = false
          AND m.determiners @> '[{"value": :determinerValue}]'::jsonb
        """, nativeQuery = true)
    boolean existsByDeterminerValueNative(
        @Param("tenantId") UUID tenantId,
        @Param("determinerValue") String determinerValue
    );
    
    /**
     * Find material by ID and tenant ID (excluding deleted).
     */
    @Query("SELECT m FROM MaterialEntity m WHERE m.id = :id AND m.tenantId = :tenantId AND m.isDeleted = false")
    Optional<MaterialEntity> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
}


package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.domain.enums.EntityType;
import com.care.warehouse.infrastructure.db.entities.CustomFieldDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for CustomFieldDefinitionEntity.
 * 
 * Provides CRUD operations and custom queries for custom field definitions.
 * 
 * @author CARE Team
 */
@Repository
public interface CustomFieldDefinitionJpaRepository 
        extends JpaRepository<CustomFieldDefinitionEntity, UUID>,
                JpaSpecificationExecutor<CustomFieldDefinitionEntity> {

    /**
     * Find all field definitions for a tenant and entity type (including inactive).
     * Used to fetch all custom fields for validation.
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @return List of field definitions, ordered by sortOrder
     */
    @Query("SELECT f FROM CustomFieldDefinitionEntity f " +
           "WHERE f.tenantId = :tenantId " +
           "AND f.entityType = :entityType " +
           "AND f.isDeleted = false " +
           "ORDER BY f.sortOrder ASC, f.createdAt ASC")
    List<CustomFieldDefinitionEntity> findByTenantIdAndEntityType(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType
    );

    /**
     * Find all active field definitions for a tenant and entity type.
     * Used to fetch all custom fields that should be displayed/validated for an entity.
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @return List of active field definitions, ordered by sortOrder
     */
    @Query("SELECT f FROM CustomFieldDefinitionEntity f " +
           "WHERE f.tenantId = :tenantId " +
           "AND f.entityType = :entityType " +
           "AND f.isActive = true " +
           "AND f.isDeleted = false " +
           "ORDER BY f.sortOrder ASC, f.createdAt ASC")
    List<CustomFieldDefinitionEntity> findActiveByTenantIdAndEntityType(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType
    );

    /**
     * Find field definition by tenant, entity type, and field key.
     * Used to check if a field definition exists before creating/updating values.
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @param fieldKey Field key
     * @return Optional field definition
     */
    @Query("SELECT f FROM CustomFieldDefinitionEntity f " +
           "WHERE f.tenantId = :tenantId " +
           "AND f.entityType = :entityType " +
           "AND f.fieldKey = :fieldKey " +
           "AND f.isDeleted = false")
    Optional<CustomFieldDefinitionEntity> findByTenantIdAndEntityTypeAndFieldKey(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType,
            @Param("fieldKey") String fieldKey
    );

    /**
     * Check if a field definition exists for a tenant and entity type.
     * Used for validation before creating new definitions.
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @param fieldKey Field key
     * @return true if exists, false otherwise
     */
    @Query("SELECT COUNT(f) > 0 FROM CustomFieldDefinitionEntity f " +
           "WHERE f.tenantId = :tenantId " +
           "AND f.entityType = :entityType " +
           "AND f.fieldKey = :fieldKey " +
           "AND f.isDeleted = false")
    boolean existsByTenantIdAndEntityTypeAndFieldKey(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType,
            @Param("fieldKey") String fieldKey
    );

    /**
     * Find field definition by ID and tenant (for tenant isolation).
     * 
     * @param id Field definition ID
     * @param tenantId Tenant ID
     * @return Optional field definition
     */
    @Query("SELECT f FROM CustomFieldDefinitionEntity f " +
           "WHERE f.id = :id " +
           "AND f.tenantId = :tenantId " +
           "AND f.isDeleted = false")
    Optional<CustomFieldDefinitionEntity> findByIdAndTenantId(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

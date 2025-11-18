package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.domain.enums.EntityType;
import com.care.warehouse.infrastructure.db.entities.CustomFieldValueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for CustomFieldValueEntity.
 * 
 * Provides CRUD operations and custom queries for custom field values.
 * 
 * @author CARE Team
 */
@Repository
public interface CustomFieldValueJpaRepository 
        extends JpaRepository<CustomFieldValueEntity, UUID>,
                JpaSpecificationExecutor<CustomFieldValueEntity> {

    /**
     * Find all custom field values for an entity record.
     * Used to fetch all custom field values when loading an entity (Material, Warehouse, etc.).
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @param entityRecordId Entity record ID
     * @return List of custom field values
     */
    @Query("SELECT v FROM CustomFieldValueEntity v " +
           "WHERE v.tenantId = :tenantId " +
           "AND v.entityType = :entityType " +
           "AND v.entityRecordId = :entityRecordId")
    List<CustomFieldValueEntity> findByTenantIdAndEntityTypeAndEntityRecordId(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType,
            @Param("entityRecordId") UUID entityRecordId
    );

    /**
     * Find a specific custom field value for an entity record.
     * Used to check if a value exists before updating.
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @param entityRecordId Entity record ID
     * @param fieldId Field definition ID
     * @return Optional custom field value
     */
    @Query("SELECT v FROM CustomFieldValueEntity v " +
           "WHERE v.tenantId = :tenantId " +
           "AND v.entityType = :entityType " +
           "AND v.entityRecordId = :entityRecordId " +
           "AND v.fieldId = :fieldId")
    Optional<CustomFieldValueEntity> findByTenantIdAndEntityTypeAndEntityRecordIdAndFieldId(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType,
            @Param("entityRecordId") UUID entityRecordId,
            @Param("fieldId") UUID fieldId
    );

    /**
     * Delete all custom field values for an entity record.
     * Used when deleting an entity (Material, Warehouse, etc.).
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @param entityRecordId Entity record ID
     */
    @Modifying
    @Query("DELETE FROM CustomFieldValueEntity v " +
           "WHERE v.tenantId = :tenantId " +
           "AND v.entityType = :entityType " +
           "AND v.entityRecordId = :entityRecordId")
    void deleteByTenantIdAndEntityTypeAndEntityRecordId(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType,
            @Param("entityRecordId") UUID entityRecordId
    );

    /**
     * Find all custom field values for a specific field definition.
     * Used for reporting/analytics (e.g., all materials with warranty_period > 24).
     * 
     * @param tenantId Tenant ID
     * @param fieldId Field definition ID
     * @return List of custom field values
     */
    @Query("SELECT v FROM CustomFieldValueEntity v " +
           "WHERE v.tenantId = :tenantId " +
           "AND v.fieldId = :fieldId")
    List<CustomFieldValueEntity> findByTenantIdAndFieldId(
            @Param("tenantId") UUID tenantId,
            @Param("fieldId") UUID fieldId
    );

    /**
     * Count custom field values for an entity record.
     * Used for validation (e.g., check if all required fields have values).
     * 
     * @param tenantId Tenant ID
     * @param entityType Entity type
     * @param entityRecordId Entity record ID
     * @return Count of custom field values
     */
    @Query("SELECT COUNT(v) FROM CustomFieldValueEntity v " +
           "WHERE v.tenantId = :tenantId " +
           "AND v.entityType = :entityType " +
           "AND v.entityRecordId = :entityRecordId")
    long countByTenantIdAndEntityTypeAndEntityRecordId(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") EntityType entityType,
            @Param("entityRecordId") UUID entityRecordId
    );
}


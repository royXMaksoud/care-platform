package com.care.warehouse.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * Base entity class for all warehouse service entities.
 * 
 * Provides common fields:
 * - id: UUID primary key
 * - tenantId: For multi-tenant isolation
 * - Audit fields: createdAt, updatedAt, createdById, updatedById
 * - Soft delete flags: isActive, isDeleted
 * - Version: For optimistic locking
 * 
 * All entities should extend this class to ensure consistent structure
 * and automatic tenant isolation.
 */
@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /**
     * Tenant ID for multi-tenant isolation.
     * This field should be automatically populated from TenantContext
     * and filtered in all queries to ensure tenant isolation.
     */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /**
     * Soft delete flag - marks entity as deleted without physical removal
     */
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    /**
     * Active flag - marks entity as active/inactive
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * User ID who created this entity
     */
    @Column(name = "created_by_id")
    private UUID createdById;

    /**
     * Timestamp when entity was created
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * User ID who last updated this entity
     */
    @Column(name = "updated_by_id")
    private UUID updatedById;

    /**
     * Timestamp when entity was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    /**
     * Version field for optimistic locking
     */
    @Version
    @Column(name = "row_version")
    private Long rowVersion;

    /**
     * Pre-persist callback to set tenant ID and audit fields
     */
    @PrePersist
    protected void prePersist() {
        // Set tenant ID from TenantContext if not already set
        if (tenantId == null) {
            tenantId = com.care.warehouse.application.common.context.TenantContext.get();
        }
        
        // Set created by from CurrentUserContext if not already set
        if (createdById == null) {
            com.sharedlib.core.context.CurrentUser currentUser = 
                com.sharedlib.core.context.CurrentUserContext.get();
            if (currentUser != null) {
                createdById = currentUser.userId();
            }
        }
        
        // Initialize flags if null
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    /**
     * Pre-update callback to set audit fields
     */
    @PreUpdate
    protected void preUpdate() {
        // Set updated by from CurrentUserContext
        com.sharedlib.core.context.CurrentUser currentUser = 
            com.sharedlib.core.context.CurrentUserContext.get();
        if (currentUser != null) {
            updatedById = currentUser.userId();
        }
    }
}


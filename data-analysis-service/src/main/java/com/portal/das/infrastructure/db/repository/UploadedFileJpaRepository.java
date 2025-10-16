package com.portal.das.infrastructure.db.repository;

import com.portal.das.infrastructure.db.entities.UploadedFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA Repository for UploadedFileEntity
 * Provides CRUD operations and query capabilities
 */
@Repository
public interface UploadedFileJpaRepository 
        extends JpaRepository<UploadedFileEntity, UUID>, 
                JpaSpecificationExecutor<UploadedFileEntity> {
    
    // Custom query methods can be added here if needed
    // For example:
    // List<UploadedFileEntity> findByUploadedByAndIsDeletedFalse(UUID uploadedBy);
}



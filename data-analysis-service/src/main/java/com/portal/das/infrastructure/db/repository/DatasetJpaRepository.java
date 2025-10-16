package com.portal.das.infrastructure.db.repository;

import com.portal.das.infrastructure.db.entities.DatasetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA Repository for DatasetEntity
 */
@Repository
public interface DatasetJpaRepository 
        extends JpaRepository<DatasetEntity, UUID>, 
                JpaSpecificationExecutor<DatasetEntity> {
    
    /**
     * Find all datasets by file ID
     */
    List<DatasetEntity> findByFileIdAndIsDeletedFalse(UUID fileId);
}


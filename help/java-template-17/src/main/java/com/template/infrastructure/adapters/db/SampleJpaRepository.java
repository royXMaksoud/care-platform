package com.template.infrastructure.adapters.db;

import com.template.infrastructure.adapters.db.entity.SampleJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * JPA Repository for SampleJpaEntity.
 * 
 * This repository handles database operations for sample entities.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Repository
public interface SampleJpaRepository extends JpaRepository<SampleJpaEntity, UUID> {
    
    /**
     * Find all entities by status.
     * 
     * @param status the status to filter by
     * @return list of entities with the given status
     */
    List<SampleJpaEntity> findByStatus(String status);
} 
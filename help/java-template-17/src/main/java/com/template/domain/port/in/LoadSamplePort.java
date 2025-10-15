package com.template.domain.port.in;

import com.template.domain.model.SampleEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Input port interface for loading SampleEntity from external sources.
 * 
 * This is an example of an input port in Clean Architecture.
 * Implementations will be in the infrastructure layer.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
public interface LoadSamplePort {
    
    /**
     * Load a sample entity by ID.
     * 
     * @param id the entity ID
     * @return Optional containing the entity if found
     */
    Optional<SampleEntity> loadById(UUID id);
    
    /**
     * Load all sample entities.
     * 
     * @return List of all sample entities
     */
    List<SampleEntity> loadAll();
    
    /**
     * Load sample entities by status.
     * 
     * @param status the status to filter by
     * @return List of sample entities with the given status
     */
    List<SampleEntity> loadByStatus(String status);
} 
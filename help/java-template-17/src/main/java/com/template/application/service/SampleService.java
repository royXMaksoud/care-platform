package com.template.application.service;

import com.template.domain.model.SampleEntity;
import com.template.domain.port.in.LoadSamplePort;
import com.template.domain.port.out.SaveSamplePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Application service for SampleEntity business logic.
 * 
 * This service implements the business use cases using the domain ports.
 * It orchestrates the domain logic and external dependencies.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SampleService {
    
    private final LoadSamplePort loadSamplePort;
    private final SaveSamplePort saveSamplePort;
    
    /**
     * Create a new sample entity.
     * 
     * @param name the entity name
     * @param description the entity description
     * @return the created entity
     */
    public SampleEntity createSample(String name, String description) {
        log.debug("Creating sample entity with name: {}", name);
        
        SampleEntity sampleEntity = SampleEntity.builder()
                .id(UUID.randomUUID())
                .name(name)
                .description(description)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        SampleEntity savedEntity = saveSamplePort.save(sampleEntity);
        log.debug("Created sample entity with ID: {}", savedEntity.getId());
        
        return savedEntity;
    }
    
    /**
     * Get a sample entity by ID.
     * 
     * @param id the entity ID
     * @return Optional containing the entity if found
     */
    public Optional<SampleEntity> getSampleById(UUID id) {
        log.debug("Loading sample entity with ID: {}", id);
        return loadSamplePort.loadById(id);
    }
    
    /**
     * Get all sample entities.
     * 
     * @return List of all sample entities
     */
    public List<SampleEntity> getAllSamples() {
        log.debug("Loading all sample entities");
        return loadSamplePort.loadAll();
    }
    
    /**
     * Get active sample entities.
     * 
     * @return List of active sample entities
     */
    public List<SampleEntity> getActiveSamples() {
        log.debug("Loading active sample entities");
        return loadSamplePort.loadByStatus("ACTIVE");
    }
    
    /**
     * Update a sample entity status.
     * 
     * @param id the entity ID
     * @param newStatus the new status
     * @return Optional containing the updated entity if found
     */
    public Optional<SampleEntity> updateSampleStatus(UUID id, String newStatus) {
        log.debug("Updating sample entity status. ID: {}, New Status: {}", id, newStatus);
        
        return loadSamplePort.loadById(id)
                .map(sampleEntity -> {
                    sampleEntity.updateStatus(newStatus);
                    return saveSamplePort.update(sampleEntity);
                });
    }
    
    /**
     * Delete a sample entity.
     * 
     * @param id the entity ID to delete
     * @return true if the entity was found and deleted
     */
    public boolean deleteSample(UUID id) {
        log.debug("Deleting sample entity with ID: {}", id);
        
        Optional<SampleEntity> existingEntity = loadSamplePort.loadById(id);
        if (existingEntity.isPresent()) {
            saveSamplePort.deleteById(id);
            log.debug("Deleted sample entity with ID: {}", id);
            return true;
        }
        
        log.warn("Sample entity with ID {} not found for deletion", id);
        return false;
    }
} 
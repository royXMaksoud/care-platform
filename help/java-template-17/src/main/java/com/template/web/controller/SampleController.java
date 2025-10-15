package com.template.web.controller;

import com.template.application.service.SampleService;
import com.template.shared.dto.SampleDto;
import com.template.shared.mapper.SampleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for SampleEntity operations.
 * 
 * This controller exposes REST endpoints for CRUD operations on sample entities.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Slf4j
@RestController
@RequestMapping("/api/samples")
@RequiredArgsConstructor
public class SampleController {
    
    private final SampleService sampleService;
    private final SampleMapper sampleMapper;
    
    /**
     * Create a new sample entity.
     * 
     * @param request the creation request
     * @return the created entity
     */
    @PostMapping
    public ResponseEntity<SampleDto> createSample(@RequestBody CreateSampleRequest request) {
        log.debug("Creating sample entity with name: {}", request.getName());
        
        var sampleEntity = sampleService.createSample(request.getName(), request.getDescription());
        var sampleDto = sampleMapper.toDto(sampleEntity);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(sampleDto);
    }
    
    /**
     * Get a sample entity by ID.
     * 
     * @param id the entity ID
     * @return the entity if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<SampleDto> getSampleById(@PathVariable UUID id) {
        log.debug("Getting sample entity with ID: {}", id);
        
        return sampleService.getSampleById(id)
                .map(sampleMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all sample entities.
     * 
     * @return list of all sample entities
     */
    @GetMapping
    public ResponseEntity<List<SampleDto>> getAllSamples() {
        log.debug("Getting all sample entities");
        
        var sampleEntities = sampleService.getAllSamples();
        var sampleDtos = sampleMapper.toDtoList(sampleEntities);
        
        return ResponseEntity.ok(sampleDtos);
    }
    
    /**
     * Get active sample entities.
     * 
     * @return list of active sample entities
     */
    @GetMapping("/active")
    public ResponseEntity<List<SampleDto>> getActiveSamples() {
        log.debug("Getting active sample entities");
        
        var sampleEntities = sampleService.getActiveSamples();
        var sampleDtos = sampleMapper.toDtoList(sampleEntities);
        
        return ResponseEntity.ok(sampleDtos);
    }
    
    /**
     * Update a sample entity status.
     * 
     * @param id the entity ID
     * @param request the status update request
     * @return the updated entity if found
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<SampleDto> updateSampleStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request) {
        log.debug("Updating sample entity status. ID: {}, Status: {}", id, request.getStatus());
        
        return sampleService.updateSampleStatus(id, request.getStatus())
                .map(sampleMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Delete a sample entity.
     * 
     * @param id the entity ID to delete
     * @return no content if deleted successfully
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSample(@PathVariable UUID id) {
        log.debug("Deleting sample entity with ID: {}", id);
        
        boolean deleted = sampleService.deleteSample(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Request DTO for creating a sample entity.
     */
    public static class CreateSampleRequest {
        private String name;
        private String description;
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
    
    /**
     * Request DTO for updating sample entity status.
     */
    public static class UpdateStatusRequest {
        private String status;
        
        // Getters and setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
} 
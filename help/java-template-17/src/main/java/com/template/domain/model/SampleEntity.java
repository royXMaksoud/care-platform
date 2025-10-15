package com.template.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Sample domain entity for demonstration purposes.
 * 
 * This is an example of how to structure domain entities in Clean Architecture.
 * Replace this with your actual business entities.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SampleEntity {
    
    private UUID id;
    private String name;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * Domain business logic method example.
     * 
     * @return true if the entity is active
     */
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
    
    /**
     * Domain business logic method example.
     * 
     * @param newStatus the new status to set
     */
    public void updateStatus(String newStatus) {
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
    }
} 
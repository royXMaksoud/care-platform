package com.template.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for SampleEntity data transfer.
 * 
 * This DTO is used for API communication and data transfer between layers.
 * 
 * @author Template Team
 * @version 1.0
 * @since 2025-08-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SampleDto {
    
    private UUID id;
    private String name;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 
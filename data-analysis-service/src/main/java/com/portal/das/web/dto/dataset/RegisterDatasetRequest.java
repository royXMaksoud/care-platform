package com.portal.das.web.dto.dataset;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for registering a dataset
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDatasetRequest {
    /**
     * The uploaded file ID to create dataset from
     */
    @NotNull(message = "error.validation.fileid.required")
    private UUID fileId;

    /**
     * Optional name for the dataset
     */
    private String name;

    /**
     * Optional description
     */
    private String description;
}


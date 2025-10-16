package com.portal.das.domain.model;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model representing a registered dataset
 * A dataset is created from an uploaded file and contains profiling information
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dataset {
    /**
     * Unique identifier for the dataset
     */
    private UUID datasetId;

    /**
     * Reference to the source file
     */
    private UUID fileId;

    /**
     * Human-readable name for the dataset
     */
    private String name;

    /**
     * Description of the dataset
     */
    private String description;

    /**
     * Number of rows in the dataset (excluding header)
     */
    private Integer rowCount;

    /**
     * Number of columns in the dataset
     */
    private Integer columnCount;

    /**
     * CSV header (column names) as JSON array
     * Example: ["column1", "column2", "column3"]
     */
    private String headerJson;

    /**
     * Dataset profile information as JSON
     * Contains column-level statistics, type inference, null counts, etc.
     */
    private String profileJson;

    /**
     * Dataset status
     */
    @Builder.Default
    private DatasetStatus status = DatasetStatus.REGISTERED;

    /**
     * Whether the dataset is active
     */
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Whether the dataset is deleted (soft delete)
     */
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * User who registered the dataset
     */
    private UUID createdBy;

    /**
     * Timestamp when dataset was registered
     */
    private Instant createdAt;

    /**
     * User who last updated the dataset
     */
    private UUID updatedBy;

    /**
     * Timestamp of last update
     */
    private Instant updatedAt;

    /**
     * Version for optimistic locking
     */
    private Long rowVersion;

    /**
     * Dataset status enumeration
     */
    public enum DatasetStatus {
        REGISTERED,   // Dataset registered but profile not yet computed
        PROFILING,    // Profile computation in progress
        PROFILED,     // Profile successfully computed
        ERROR         // Error occurred during profiling
    }
}



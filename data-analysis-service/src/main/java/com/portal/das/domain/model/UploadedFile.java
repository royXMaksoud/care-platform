package com.portal.das.domain.model;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model representing an uploaded file
 * This is a clean domain object independent of persistence concerns
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadedFile {
    /**
     * Unique identifier for the uploaded file
     */
    private UUID fileId;

    /**
     * Original filename as provided by the user
     */
    private String originalFilename;

    /**
     * Normalized filename stored in the file system (CSV format)
     * Format: {uuid}.csv
     */
    private String storedFilename;

    /**
     * Full path where the file is stored
     */
    private String storagePath;

    /**
     * Original file format (xlsx, xls, csv)
     */
    private String originalFormat;

    /**
     * Stored file format (always csv after normalization)
     */
    @Builder.Default
    private String storedFormat = "csv";

    /**
     * Size of the original file in bytes
     */
    private Long originalSize;

    /**
     * Size of the stored (normalized) file in bytes
     */
    private Long storedSize;

    /**
     * MIME type of the original file
     */
    private String mimeType;

    /**
     * Number of rows in the file (excluding header)
     */
    private Integer rowCount;

    /**
     * Number of columns in the file
     */
    private Integer columnCount;

    /**
     * Status of the file (UPLOADED, PROCESSED, ERROR)
     */
    @Builder.Default
    private FileStatus status = FileStatus.UPLOADED;

    /**
     * Error message if processing failed
     */
    private String errorMessage;

    /**
     * Whether the file is active
     */
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Whether the file is deleted (soft delete)
     */
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * User who uploaded the file
     */
    private UUID uploadedBy;

    /**
     * Timestamp when the file was uploaded
     */
    private Instant uploadedAt;

    /**
     * User who last updated the file metadata
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
     * File processing status enumeration
     */
    public enum FileStatus {
        UPLOADED,   // File uploaded but not yet processed
        PROCESSING, // File is being converted/normalized
        PROCESSED,  // File successfully processed and stored
        ERROR       // Error occurred during processing
    }
}


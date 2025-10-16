package com.portal.das.web.dto.file;

import com.portal.das.domain.model.UploadedFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for file upload
 * Contains metadata about the uploaded file
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    /**
     * File identifier
     */
    private UUID fileId;

    /**
     * Original filename
     */
    private String originalFilename;

    /**
     * Stored filename (CSV format)
     */
    private String storedFilename;

    /**
     * Original file format
     */
    private String originalFormat;

    /**
     * Number of rows (excluding header)
     */
    private Integer rowCount;

    /**
     * Number of columns
     */
    private Integer columnCount;

    /**
     * Processing status
     */
    private String status;

    /**
     * Error message if processing failed
     */
    private String errorMessage;

    /**
     * Upload timestamp
     */
    private Instant uploadedAt;

    /**
     * Create response from domain model
     */
    public static FileUploadResponse from(UploadedFile file) {
        return FileUploadResponse.builder()
                .fileId(file.getFileId())
                .originalFilename(file.getOriginalFilename())
                .storedFilename(file.getStoredFilename())
                .originalFormat(file.getOriginalFormat())
                .rowCount(file.getRowCount())
                .columnCount(file.getColumnCount())
                .status(file.getStatus() != null ? file.getStatus().name() : null)
                .errorMessage(file.getErrorMessage())
                .uploadedAt(file.getUploadedAt())
                .build();
    }
}



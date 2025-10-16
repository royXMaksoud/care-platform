package com.portal.das.web.dto.file;

import com.portal.das.domain.model.UploadedFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for file information
 * Contains detailed metadata about a stored file
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileInfoResponse {
    private UUID fileId;
    private String originalFilename;
    private String storedFilename;
    private String storagePath;
    private String originalFormat;
    private String storedFormat;
    private Long originalSize;
    private Long storedSize;
    private String mimeType;
    private Integer rowCount;
    private Integer columnCount;
    private String status;
    private String errorMessage;
    private Boolean isActive;
    private UUID uploadedBy;
    private Instant uploadedAt;
    private UUID updatedBy;
    private Instant updatedAt;

    /**
     * Create response from domain model
     */
    public static FileInfoResponse from(UploadedFile file) {
        return FileInfoResponse.builder()
                .fileId(file.getFileId())
                .originalFilename(file.getOriginalFilename())
                .storedFilename(file.getStoredFilename())
                .storagePath(file.getStoragePath())
                .originalFormat(file.getOriginalFormat())
                .storedFormat(file.getStoredFormat())
                .originalSize(file.getOriginalSize())
                .storedSize(file.getStoredSize())
                .mimeType(file.getMimeType())
                .rowCount(file.getRowCount())
                .columnCount(file.getColumnCount())
                .status(file.getStatus() != null ? file.getStatus().name() : null)
                .errorMessage(file.getErrorMessage())
                .isActive(file.getIsActive())
                .uploadedBy(file.getUploadedBy())
                .uploadedAt(file.getUploadedAt())
                .updatedBy(file.getUpdatedBy())
                .updatedAt(file.getUpdatedAt())
                .build();
    }
}



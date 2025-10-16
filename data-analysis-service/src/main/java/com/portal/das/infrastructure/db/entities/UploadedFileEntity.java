package com.portal.das.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for uploaded_file table
 * Represents the database persistence model
 */
@Entity
@Table(name = "uploaded_file")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadedFileEntity {

    @Id
    @Column(name = "file_id", nullable = false, updatable = false)
    private UUID fileId;

    @Column(name = "original_filename", nullable = false, length = 500)
    private String originalFilename;

    @Column(name = "stored_filename", length = 500)
    private String storedFilename;

    @Column(name = "storage_path", length = 1000)
    private String storagePath;

    @Column(name = "original_format", length = 10)
    private String originalFormat;

    @Column(name = "stored_format", length = 10)
    private String storedFormat;

    @Column(name = "original_size")
    private Long originalSize;

    @Column(name = "stored_size")
    private Long storedSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "column_count")
    private Integer columnCount;

    @Column(name = "status", length = 20)
    @Enumerated(EnumType.STRING)
    private FileStatus status;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Version
    @Column(name = "row_version")
    private Long rowVersion;

    /**
     * File status enumeration
     */
    public enum FileStatus {
        UPLOADED,
        PROCESSING,
        PROCESSED,
        ERROR
    }
}



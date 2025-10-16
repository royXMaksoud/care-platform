package com.portal.das.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for dataset table
 * Represents a registered dataset with profiling information
 */
@Entity
@Table(name = "dataset")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetEntity {

    @Id
    @Column(name = "dataset_id", nullable = false, updatable = false)
    private UUID datasetId;

    @Column(name = "file_id", nullable = false)
    private UUID fileId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "column_count")
    private Integer columnCount;

    @Column(name = "header_json", columnDefinition = "TEXT")
    private String headerJson;

    @Column(name = "profile_json", columnDefinition = "TEXT")
    private String profileJson;

    @Column(name = "status", length = 20)
    @Enumerated(EnumType.STRING)
    private DatasetStatus status;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Version
    @Column(name = "row_version")
    private Long rowVersion;

    /**
     * Dataset status enumeration
     */
    public enum DatasetStatus {
        REGISTERED,
        PROFILING,
        PROFILED,
        ERROR
    }
}


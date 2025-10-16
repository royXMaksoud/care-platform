package com.portal.das.infrastructure.db.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity for job_record table
 */
@Entity
@Table(name = "job_record", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobEntity {

    @Id
    @Column(name = "job_id")
    private UUID jobId;

    @Column(name = "job_type", length = 50)
    private String jobType;

    @Column(name = "status", length = 20)
    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @Column(name = "progress")
    private Integer progress;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public enum JobStatus {
        PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED
    }
}


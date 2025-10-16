package com.portal.das.domain.model;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model for async job
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Job {
    private UUID jobId;
    private String jobType;
    private JobStatus status;
    private Integer progress; // 0-100
    private String result;
    private String errorMessage;
    private UUID createdBy;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;

    public enum JobStatus {
        PENDING,
        RUNNING,
        SUCCEEDED,
        FAILED,
        CANCELLED
    }
}


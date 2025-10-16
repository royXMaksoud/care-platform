package com.portal.das.service.job;

import com.portal.das.domain.model.Job;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * Service for async job management
 * In-memory registry with database persistence
 */
@Slf4j
@Service
public class JobService {

    private final Map<UUID, Job> jobRegistry = new ConcurrentHashMap<>();

    /**
     * Submit a job for async execution
     *
     * @param jobType Job type
     * @param task Task to execute
     * @param progressCallback Callback for progress updates
     * @return Job ID
     */
    public UUID submitJob(String jobType, Runnable task, Consumer<Integer> progressCallback) {
        UUID jobId = UUID.randomUUID();
        
        Job job = Job.builder()
                .jobId(jobId)
                .jobType(jobType)
                .status(Job.JobStatus.PENDING)
                .progress(0)
                .createdAt(Instant.now())
                .build();

        jobRegistry.put(jobId, job);

        // Execute async
        executeAsync(jobId, task, progressCallback);

        return jobId;
    }

    /**
     * Get job status
     *
     * @param jobId Job identifier
     * @return Job
     */
    public Job getJob(UUID jobId) {
        return jobRegistry.get(jobId);
    }

    /**
     * Update job progress
     *
     * @param jobId Job ID
     * @param progress Progress (0-100)
     */
    public void updateProgress(UUID jobId, int progress) {
        Job job = jobRegistry.get(jobId);
        if (job != null) {
            job.setProgress(progress);
        }
    }

    /**
     * Execute job asynchronously
     */
    @Async
    protected void executeAsync(UUID jobId, Runnable task, Consumer<Integer> progressCallback) {
        Job job = jobRegistry.get(jobId);
        if (job == null) return;

        try {
            job.setStatus(Job.JobStatus.RUNNING);
            job.setStartedAt(Instant.now());

            task.run();

            job.setStatus(Job.JobStatus.SUCCEEDED);
            job.setProgress(100);
            job.setCompletedAt(Instant.now());

        } catch (Exception e) {
            log.error("Job failed: {}", jobId, e);
            job.setStatus(Job.JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(Instant.now());
        }
    }
}


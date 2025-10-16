package com.portal.das.web.controller;

import com.portal.das.domain.model.Job;
import com.portal.das.service.job.JobService;
import com.sharedlib.core.web.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * REST Controller for job management and progress tracking
 */
@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Async job management and progress tracking")
public class JobController {

    private final JobService jobService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    /**
     * Get job status
     * GET /api/jobs/{id}
     *
     * @param jobId Job identifier
     * @return Job status
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get job status", description = "Get current status and progress of a job")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ApiResponse<Job> getJobStatus(@PathVariable("id") UUID jobId) {
        log.info("Getting job status: {}", jobId);

        Job job = jobService.getJob(jobId);
        if (job == null) {
            return ApiResponse.fail("Job not found");
        }

        return ApiResponse.ok(job);
    }

    /**
     * Stream job progress events (Server-Sent Events)
     * GET /api/jobs/{id}/events
     *
     * @param jobId Job identifier
     * @return SSE emitter
     */
    @GetMapping(value = "/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream job progress", description = "Stream real-time job progress updates via SSE")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public SseEmitter streamJobProgress(@PathVariable("id") UUID jobId) {
        log.info("Streaming progress for job: {}", jobId);

        SseEmitter emitter = new SseEmitter(300000L); // 5 minutes timeout

        executor.execute(() -> {
            try {
                while (true) {
                    Job job = jobService.getJob(jobId);
                    
                    if (job == null) {
                        emitter.completeWithError(new RuntimeException("Job not found"));
                        break;
                    }

                    // Send progress event
                    emitter.send(SseEmitter.event()
                            .name("progress")
                            .data(Map.of(
                                    "jobId", job.getJobId(),
                                    "status", job.getStatus(),
                                    "progress", job.getProgress() != null ? job.getProgress() : 0
                            )));

                    // Complete if job is done
                    if (job.getStatus() == Job.JobStatus.SUCCEEDED || 
                        job.getStatus() == Job.JobStatus.FAILED) {
                        emitter.complete();
                        break;
                    }

                    Thread.sleep(1000); // Poll every second
                }
            } catch (Exception e) {
                log.error("SSE error", e);
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private static class Map {
        public static java.util.Map<String, Object> of(String k1, Object v1, String k2, Object v2, String k3, Object v3) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put(k1, v1);
            map.put(k2, v2);
            map.put(k3, v3);
            return map;
        }
    }
}


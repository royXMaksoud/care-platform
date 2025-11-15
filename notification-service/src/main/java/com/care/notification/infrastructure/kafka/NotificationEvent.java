package com.care.notification.infrastructure.kafka;

import com.care.notification.application.dto.NotificationRequest;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kafka event message for asynchronous notification processing
 * Published to Kafka topic when user requests a notification
 * Consumed by NotificationEventConsumer for actual delivery
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Unique notification ID in database
     */
    @JsonProperty("notification_id")
    private UUID notificationId;
    
    /**
     * Associated campaign ID if this is part of bulk send
     */
    @JsonProperty("campaign_id")
    private UUID campaignId;
    
    /**
     * Full notification request payload
     */
    @JsonProperty("request")
    private NotificationRequest request;
    
    /**
     * Retry count (incremented each time message is reprocessed)
     */
    @JsonProperty("retry_count")
    private int retryCount;
    
    /**
     * Maximum number of retries allowed
     */
    @JsonProperty("max_retries")
    private int maxRetries;
    
    /**
     * Timestamp when event was created
     */
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    /**
     * Current processing timestamp
     */
    @JsonProperty("processed_at")
    private LocalDateTime processedAt;
    
    /**
     * Error message from previous failed attempt (if any)
     */
    @JsonProperty("error_message")
    private String errorMessage;
    
    /**
     * Priority level for processing (NORMAL, HIGH, LOW)
     */
    @JsonProperty("priority")
    @Builder.Default
    private String priority = "NORMAL";
    
    /**
     * Idempotency key to prevent duplicate processing
     */
    @JsonProperty("idempotency_key")
    private String idempotencyKey;
    
    /**
     * Tenant ID for multi-tenant isolation
     */
    @JsonProperty("tenant_id")
    private UUID tenantId;
    
    /**
     * Constructor from NotificationRequest for easy creation
     */
    public static NotificationEvent fromRequest(UUID notificationId, NotificationRequest request) {
        return NotificationEvent.builder()
            .notificationId(notificationId)
            .request(request)
            .retryCount(0)
            .maxRetries(3)
            .createdAt(LocalDateTime.now())
            .priority("NORMAL")
            .build();
    }
    
    /**
     * Check if this event should be retried
     */
    public boolean isRetryable() {
        return retryCount < maxRetries;
    }
    
    /**
     * Increment retry count
     */
    public void incrementRetry() {
        this.retryCount++;
        this.processedAt = LocalDateTime.now();
    }
}

package com.care.notification.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Webhook event for external delivery confirmation
 * Tracks webhook delivery attempts with retry logic
 */
@Entity
@Table(name = "webhook_events", indexes = {
    @Index(name = "idx_webhook_status", columnList = "status"),
    @Index(name = "idx_webhook_notification", columnList = "notification_id"),
    @Index(name = "idx_webhook_created_at", columnList = "created_at"),
    @Index(name = "idx_webhook_event_type", columnList = "event_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "notification_id", nullable = false)
    private UUID notificationId;

    @Column(name = "webhook_url", nullable = false, length = 500)
    private String webhookUrl;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // sent, delivered, failed, bounced

    @Column(name = "status", nullable = false, length = 20)
    private String status; // pending, success, failed

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload; // JSON webhook payload

    @Column(name = "response_code")
    private Integer responseCode;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "max_retries")
    @Builder.Default
    private Integer maxRetries = 5;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "signature", length = 256)
    private String signature; // HMAC-SHA256 signature for verification

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;
}

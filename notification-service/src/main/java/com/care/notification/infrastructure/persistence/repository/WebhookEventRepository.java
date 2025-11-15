package com.care.notification.infrastructure.persistence.repository;

import com.care.notification.infrastructure.persistence.entity.WebhookEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA Repository for WebhookEventEntity
 * Handles webhook event persistence and querying
 */
@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEventEntity, UUID> {

    /**
     * Find pending webhook events ready for delivery
     * (status='pending' AND nextRetryAt <= now AND retryCount < maxRetries)
     */
    @Query("SELECT w FROM WebhookEventEntity w WHERE " +
           "w.status = 'pending' AND " +
           "w.nextRetryAt <= CURRENT_TIMESTAMP AND " +
           "w.retryCount < w.maxRetries AND " +
           "w.isDeleted = false")
    List<WebhookEventEntity> findPendingWebhooks();

    /**
     * Find all webhook events by notification ID
     */
    List<WebhookEventEntity> findByNotificationId(UUID notificationId);

    /**
     * Find all failed webhook events
     */
    @Query("SELECT w FROM WebhookEventEntity w WHERE " +
           "w.status = 'failed' AND " +
           "w.isDeleted = false")
    List<WebhookEventEntity> findFailedWebhooks();

    /**
     * Find successful webhook events for a notification
     */
    @Query("SELECT w FROM WebhookEventEntity w WHERE " +
           "w.notificationId = :notificationId AND " +
           "w.status = 'success' AND " +
           "w.isDeleted = false")
    List<WebhookEventEntity> findSuccessfulWebhooksByNotification(UUID notificationId);

    /**
     * Count pending webhooks
     */
    @Query("SELECT COUNT(w) FROM WebhookEventEntity w WHERE " +
           "w.status = 'pending' AND " +
           "w.isDeleted = false")
    long countPendingWebhooks();

    /**
     * Find webhooks by event type
     */
    List<WebhookEventEntity> findByEventTypeAndIsDeletedFalse(String eventType);

    /**
     * Find webhooks by status
     */
    List<WebhookEventEntity> findByStatusAndIsDeletedFalse(String status);
}

package com.care.notification.infrastructure.persistence.repository;

import com.care.notification.infrastructure.persistence.entity.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for NotificationEntity
 *
 * Provides database operations for notification persistence:
 * - Idempotency checking
 * - Status tracking and updates
 * - Retry mechanism queries
 * - Audit trail and notification history
 */
@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {

    /**
     * Find a notification by idempotency key to prevent duplicates
     */
    Optional<NotificationEntity> findByIdempotencyKey(String idempotencyKey);

    /**
     * Check if a notification already exists by idempotency key
     */
    boolean existsByIdempotencyKey(String idempotencyKey);

    /**
     * Find all notifications for a beneficiary
     */
    List<NotificationEntity> findByBeneficiaryIdOrderByCreatedAtDesc(UUID beneficiaryId);

    /**
     * Find paginated notifications for a beneficiary
     */
    Page<NotificationEntity> findByBeneficiaryIdOrderByCreatedAtDesc(UUID beneficiaryId, Pageable pageable);

    /**
     * Find notifications by status
     */
    List<NotificationEntity> findByStatusOrderByCreatedAtDesc(NotificationEntity.NotificationStatus status);

    /**
     * Find paginated notifications by status
     */
    Page<NotificationEntity> findByStatusOrderByCreatedAtDesc(NotificationEntity.NotificationStatus status, Pageable pageable);

    /**
     * Find notifications by channel
     */
    List<NotificationEntity> findByChannelOrderByCreatedAtDesc(String channel);

    /**
     * Find notifications by notification type
     */
    List<NotificationEntity> findByNotificationTypeOrderByCreatedAtDesc(String notificationType);

    /**
     * Find failed notifications ready for retry
     * - Status is RETRYING
     * - Retry count < max retries
     * - Current time >= nextRetryAt
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.status = 'RETRYING' AND " +
           "n.retryCount < n.maxRetries AND " +
           "n.nextRetryAt IS NOT NULL AND " +
           "n.nextRetryAt <= CURRENT_TIMESTAMP AND " +
           "n.isDeleted = false " +
           "ORDER BY n.nextRetryAt ASC")
    List<NotificationEntity> findFailedNotificationsForRetry();

    /**
     * Find notifications ready for retry with pagination
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.status IN ('RETRYING', 'FAILED') AND " +
           "n.retryCount < n.maxRetries AND " +
           "n.isDeleted = false " +
           "ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findRetryableNotifications(Pageable pageable);

    /**
     * Find notifications by appointment ID
     */
    List<NotificationEntity> findByAppointmentIdOrderByCreatedAtDesc(UUID appointmentId);

    /**
     * Find successful notifications for delivery confirmation
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.status = 'DELIVERED' AND " +
           "n.deliveredAt IS NOT NULL AND " +
           "n.isDeleted = false")
    List<NotificationEntity> findDeliveredNotifications();

    /**
     * Find bounced email notifications
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.status = 'BOUNCED' AND " +
           "n.channel = 'EMAIL' AND " +
           "n.isDeleted = false")
    List<NotificationEntity> findBouncedEmails();

    /**
     * Find notifications by date range
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.createdAt >= :startDate AND " +
           "n.createdAt <= :endDate AND " +
           "n.isDeleted = false")
    List<NotificationEntity> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Count notifications by status
     */
    long countByStatusAndIsDeletedFalse(NotificationEntity.NotificationStatus status);

    /**
     * Count notifications by channel
     */
    long countByChannelAndIsDeletedFalse(String channel);

    /**
     * Count notifications by notification type
     */
    long countByNotificationTypeAndIsDeletedFalse(String notificationType);

    /**
     * Count successful notifications for a beneficiary
     */
    long countByBeneficiaryIdAndIsSuccessTrueAndIsDeletedFalse(UUID beneficiaryId);

    /**
     * Find notifications for a beneficiary within date range
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.beneficiaryId = :beneficiaryId AND " +
           "n.createdAt >= :startDate AND " +
           "n.createdAt <= :endDate AND " +
           "n.isDeleted = false " +
           "ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findByBeneficiaryAndDateRange(
        @Param("beneficiaryId") UUID beneficiaryId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    /**
     * Find notifications with provider webhook data (for async processing)
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.providerWebhookData IS NOT NULL AND " +
           "n.status != 'DELIVERED' AND " +
           "n.isDeleted = false " +
           "ORDER BY n.updatedAt ASC")
    List<NotificationEntity> findPendingWebhookProcessing();

    /**
     * Find duplicate attempts for same appointment + beneficiary + type (for deduplication)
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.beneficiaryId = :beneficiaryId AND " +
           "n.appointmentId = :appointmentId AND " +
           "n.notificationType = :notificationType AND " +
           "n.isDeleted = false " +
           "ORDER BY n.createdAt DESC")
    List<NotificationEntity> findDuplicateAttempts(
        @Param("beneficiaryId") UUID beneficiaryId,
        @Param("appointmentId") UUID appointmentId,
        @Param("notificationType") String notificationType
    );

    /**
     * Find recent failed notifications for monitoring dashboard
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.status IN ('FAILED', 'BOUNCED') AND " +
           "n.createdAt >= :since AND " +
           "n.isDeleted = false " +
           "ORDER BY n.createdAt DESC")
    List<NotificationEntity> findRecentFailures(
        @Param("since") LocalDateTime since
    );

    /**
     * Find notifications for bulk operations (e.g., appointment reminder campaign)
     */
    @Query("SELECT n FROM NotificationEntity n WHERE " +
           "n.notificationType = :notificationType AND " +
           "n.appointmentId IN (:appointmentIds) AND " +
           "n.isDeleted = false")
    List<NotificationEntity> findByNotificationTypeAndAppointments(
        @Param("notificationType") String notificationType,
        @Param("appointmentIds") List<UUID> appointmentIds
    );

    /**
     * Check if beneficiary has unread notifications (future feature)
     */
    @Query("SELECT COUNT(n) > 0 FROM NotificationEntity n WHERE " +
           "n.beneficiaryId = :beneficiaryId AND " +
           "n.status = 'DELIVERED' AND " +
           "n.isDeleted = false")
    boolean hasUnreadNotifications(@Param("beneficiaryId") UUID beneficiaryId);
}

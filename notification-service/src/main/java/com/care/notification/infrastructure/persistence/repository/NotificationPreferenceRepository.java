package com.care.notification.infrastructure.persistence.repository;

import com.care.notification.infrastructure.persistence.entity.NotificationPreferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for NotificationPreferenceEntity
 *
 * Provides database operations for user notification preferences:
 * - Preference lookups
 * - Channel availability checks
 * - Quiet hours queries
 * - Batch updates for campaign filtering
 */
@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreferenceEntity, UUID> {

    /**
     * Find preferences for a specific beneficiary
     */
    Optional<NotificationPreferenceEntity> findByBeneficiaryId(UUID beneficiaryId);

    /**
     * Find all beneficiaries with a specific channel enabled
     */
    List<NotificationPreferenceEntity> findByEmailEnabledTrue();

    List<NotificationPreferenceEntity> findBySmsEnabledTrue();

    List<NotificationPreferenceEntity> findByPushEnabledTrue();

    /**
     * Find beneficiaries with appointment notifications enabled
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.notifyAppointmentCreated = true AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesWhoWantAppointmentCreatedNotifications();

    /**
     * Find beneficiaries with appointment reminder notifications enabled
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.notifyAppointmentReminder = true AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesWhoWantReminderNotifications();

    /**
     * Find beneficiaries with appointment cancellation notifications enabled
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.notifyAppointmentCancelled = true AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesWhoWantCancellationNotifications();

    /**
     * Find beneficiaries with verified email addresses
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.emailEnabled = true AND " +
           "p.emailVerified = true AND " +
           "p.emailAddress IS NOT NULL AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesWithVerifiedEmail();

    /**
     * Find beneficiaries with verified phone numbers
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.smsEnabled = true AND " +
           "p.smsVerified = true AND " +
           "p.smsNumber IS NOT NULL AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesWithVerifiedPhone();

    /**
     * Find beneficiaries who opted in for marketing
     */
    List<NotificationPreferenceEntity> findByAllowMarketingTrue();

    /**
     * Find beneficiaries with GDPR consent
     */
    List<NotificationPreferenceEntity> findByGdprConsentGivenTrue();

    /**
     * Find beneficiaries using digest notifications (not real-time)
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.digestFrequency IN ('daily', 'weekly') AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesOnDigestMode();

    /**
     * Check if beneficiary wants email notifications
     */
    @Query("SELECT CASE WHEN p IS NOT NULL THEN p.emailEnabled ELSE true END " +
           "FROM NotificationPreferenceEntity p WHERE p.beneficiaryId = :beneficiaryId")
    boolean isEmailNotificationEnabled(@Param("beneficiaryId") UUID beneficiaryId);

    /**
     * Check if beneficiary wants SMS notifications
     */
    @Query("SELECT CASE WHEN p IS NOT NULL THEN p.smsEnabled ELSE false END " +
           "FROM NotificationPreferenceEntity p WHERE p.beneficiaryId = :beneficiaryId")
    boolean isSmsNotificationEnabled(@Param("beneficiaryId") UUID beneficiaryId);

    /**
     * Check if beneficiary wants push notifications
     */
    @Query("SELECT CASE WHEN p IS NOT NULL THEN p.pushEnabled ELSE false END " +
           "FROM NotificationPreferenceEntity p WHERE p.beneficiaryId = :beneficiaryId")
    boolean isPushNotificationEnabled(@Param("beneficiaryId") UUID beneficiaryId);

    /**
     * Check if beneficiary is currently in quiet hours
     * (You'd need to add timezone/quiet hours logic in the service)
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.beneficiaryId = :beneficiaryId AND " +
           "p.quietHoursEnabled = true AND " +
           "p.isDeleted = false")
    Optional<NotificationPreferenceEntity> findWithQuietHours(@Param("beneficiaryId") UUID beneficiaryId);

    /**
     * Find beneficiaries with unverified email addresses
     * (Useful for sending verification reminders)
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.emailEnabled = true AND " +
           "p.emailVerified = false AND " +
           "p.emailAddress IS NOT NULL AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesWithUnverifiedEmail();

    /**
     * Find beneficiaries with unverified phone numbers
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.smsEnabled = true AND " +
           "p.smsVerified = false AND " +
           "p.smsNumber IS NOT NULL AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findBeneficiariesWithUnverifiedPhone();

    /**
     * Count beneficiaries by language preference
     */
    long countByLanguageAndIsDeletedFalse(String language);

    /**
     * Find beneficiaries by language and notification type
     */
    @Query("SELECT p FROM NotificationPreferenceEntity p WHERE " +
           "p.language = :language AND " +
           "p.notifyAppointmentCreated = true AND " +
           "p.isDeleted = false")
    List<NotificationPreferenceEntity> findByLanguageAndWantAppointmentNotifications(
        @Param("language") String language
    );

    /**
     * Bulk find preferences for multiple beneficiaries
     */
    List<NotificationPreferenceEntity> findByBeneficiaryIdIn(List<UUID> beneficiaryIds);

    /**
     * Check if beneficiary exists in preferences
     */
    boolean existsByBeneficiaryId(UUID beneficiaryId);
}

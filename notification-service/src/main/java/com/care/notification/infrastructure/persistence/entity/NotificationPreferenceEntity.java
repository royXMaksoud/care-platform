package com.care.notification.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity for user notification preferences
 *
 * Stores per-user notification channel preferences and settings:
 * - Preferred notification channels
 * - Opt-in/opt-out for different notification types
 * - Quiet hours
 * - Contact information updates
 */
@Entity
@Table(name = "notification_preferences", indexes = {
    @Index(name = "idx_beneficiary_pref", columnList = "beneficiary_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "beneficiary_id", nullable = false, unique = true)
    private UUID beneficiaryId;

    /**
     * Preferred notification channel: SMS, EMAIL, PUSH
     */
    @Column(name = "preferred_channel", length = 20)
    @Builder.Default
    private String preferredChannel = "EMAIL";

    /**
     * Enable multi-channel fallback (if preferred fails)
     */
    @Column(name = "multi_channel_enabled")
    @Builder.Default
    private boolean multiChannelEnabled = true;

    /**
     * Appointment notification preferences
     */
    @Column(name = "notify_appointment_created")
    @Builder.Default
    private boolean notifyAppointmentCreated = true;

    @Column(name = "notify_appointment_reminder")
    @Builder.Default
    private boolean notifyAppointmentReminder = true;

    @Column(name = "notify_appointment_cancelled")
    @Builder.Default
    private boolean notifyAppointmentCancelled = true;

    /**
     * SMS preferences
     */
    @Column(name = "sms_enabled")
    @Builder.Default
    private boolean smsEnabled = false;

    @Column(name = "sms_number", length = 20)
    private String smsNumber;

    @Column(name = "sms_verified")
    @Builder.Default
    private boolean smsVerified = false;

    @Column(name = "sms_verified_at")
    private LocalDateTime smsVerifiedAt;

    /**
     * Email preferences
     */
    @Column(name = "email_enabled")
    @Builder.Default
    private boolean emailEnabled = true;

    @Column(name = "email_address", length = 255)
    private String emailAddress;

    @Column(name = "email_verified")
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    /**
     * Push notification preferences
     */
    @Column(name = "push_enabled")
    @Builder.Default
    private boolean pushEnabled = false;

    @Column(name = "push_device_id", length = 500)
    private String pushDeviceId;

    /**
     * Quiet hours (no notifications between these times)
     */
    @Column(name = "quiet_hours_enabled")
    @Builder.Default
    private boolean quietHoursEnabled = false;

    @Column(name = "quiet_hours_start")
    private String quietHoursStart; // Format: "HH:mm" e.g., "21:00"

    @Column(name = "quiet_hours_end")
    private String quietHoursEnd;   // Format: "HH:mm" e.g., "08:00"

    /**
     * Language preference for notifications
     */
    @Column(name = "language", length = 10)
    @Builder.Default
    private String language = "en";

    /**
     * Timezone for appointment reminders
     */
    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "UTC";

    /**
     * Allow marketing/promotional notifications
     */
    @Column(name = "allow_marketing")
    @Builder.Default
    private boolean allowMarketing = false;

    /**
     * Consent tracking for GDPR
     */
    @Column(name = "gdpr_consent_given")
    @Builder.Default
    private boolean gdprConsentGiven = false;

    @Column(name = "gdpr_consent_date")
    private LocalDateTime gdprConsentDate;

    /**
     * Notification digest preference (daily, weekly, off)
     */
    @Column(name = "digest_frequency", length = 20)
    @Builder.Default
    private String digestFrequency = "off"; // Options: off, daily, weekly

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;
}

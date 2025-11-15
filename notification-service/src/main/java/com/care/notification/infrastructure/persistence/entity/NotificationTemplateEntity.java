package com.care.notification.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity for notification templates
 *
 * Stores reusable email/SMS templates with:
 * - Template content in multiple languages
 * - Variable placeholders (e.g., ${beneficiaryName}, ${appointmentDate})
 * - HTML and plain text versions
 * - Version control and activation management
 */
@Entity
@Table(name = "notification_templates", indexes = {
    @Index(name = "idx_template_type", columnList = "template_type"),
    @Index(name = "idx_notification_type", columnList = "notification_type"),
    @Index(name = "idx_language", columnList = "language"),
    @Index(name = "idx_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    /**
     * Template name for identification
     * Example: "appointment_created_email"
     */
    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;

    /**
     * Type of template: EMAIL, SMS, PUSH
     */
    @Column(name = "template_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TemplateType templateType;

    /**
     * Notification type this template is for
     */
    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;

    /**
     * Language code for this template (en, ar, fr, etc.)
     */
    @Column(name = "language", nullable = false, length = 10)
    private String language;

    /**
     * Subject line (for email) or first line (for SMS)
     */
    @Column(name = "subject", length = 500)
    private String subject;

    /**
     * Template body with variable placeholders
     * Variables use format: {{variableName}} or ${variableName}
     */
    @Column(name = "body", columnDefinition = "TEXT", nullable = false)
    private String body;

    /**
     * HTML version of the template (for email)
     */
    @Column(name = "html_body", columnDefinition = "TEXT")
    private String htmlBody;

    /**
     * Plain text version (fallback if HTML not supported)
     */
    @Column(name = "text_body", columnDefinition = "TEXT")
    private String textBody;

    /**
     * List of expected variables in this template
     * Comma-separated: beneficiaryName,appointmentDate,appointmentTime,centerName
     */
    @Column(name = "expected_variables", columnDefinition = "TEXT")
    private String expectedVariables;

    /**
     * Template version for tracking changes
     */
    @Column(name = "version")
    @Builder.Default
    private int version = 1;

    /**
     * Whether this is the active template for notifications
     */
    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    /**
     * Template description/notes
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * RTL support for Arabic templates
     */
    @Column(name = "is_rtl")
    @Builder.Default
    private boolean isRtl = false;

    /**
     * Maximum length for SMS templates
     * SMS typically limited to 160 characters per segment
     */
    @Column(name = "max_length")
    private Integer maxLength;

    /**
     * Category for template organization
     */
    @Column(name = "category", length = 50)
    private String category;

    /**
     * Retry policy if available (stored as JSON)
     */
    @Column(name = "retry_policy", columnDefinition = "TEXT")
    private String retryPolicy;

    /**
     * User who last modified this template
     */
    @Column(name = "modified_by", length = 100)
    private String modifiedBy;

    /**
     * Reason for the last modification
     */
    @Column(name = "modification_reason", columnDefinition = "TEXT")
    private String modificationReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    @Builder.Default
    private boolean isDeleted = false;

    /**
     * Enum for template types
     */
    public enum TemplateType {
        EMAIL,
        SMS,
        PUSH
    }

    /**
     * Create a default English email template for appointment creation
     */
    public static NotificationTemplateEntity createDefaultAppointmentCreatedTemplate() {
        return NotificationTemplateEntity.builder()
            .templateName("appointment_created_email_en")
            .templateType(TemplateType.EMAIL)
            .notificationType("APPOINTMENT_CREATED")
            .language("en")
            .subject("Your Appointment Confirmation - {{appointmentCode}}")
            .body("Your appointment has been successfully created.")
            .expectedVariables("beneficiaryName,appointmentCode,appointmentDate,appointmentTime,centerName,serviceType")
            .version(1)
            .isActive(true)
            .isRtl(false)
            .category("appointments")
            .build();
    }

    /**
     * Create a default Arabic email template for appointment creation
     */
    public static NotificationTemplateEntity createDefaultArabicAppointmentCreatedTemplate() {
        return NotificationTemplateEntity.builder()
            .templateName("appointment_created_email_ar")
            .templateType(TemplateType.EMAIL)
            .notificationType("APPOINTMENT_CREATED")
            .language("ar")
            .subject("تأكيد موعدك - {{appointmentCode}}")
            .body("تم إنشاء موعدك بنجاح.")
            .expectedVariables("beneficiaryName,appointmentCode,appointmentDate,appointmentTime,centerName,serviceType")
            .version(1)
            .isActive(true)
            .isRtl(true)
            .category("appointments")
            .build();
    }
}

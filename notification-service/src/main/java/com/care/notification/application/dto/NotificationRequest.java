package com.care.notification.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for notification requests
 * Used by other services to request notifications
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private UUID beneficiaryId;
    private String mobileNumber;
    private String email;
    private String deviceId;
    private boolean hasInstalledMobileApp;
    private String preferredChannel; // SMS, EMAIL, PUSH
    private NotificationType notificationType;
    private AppointmentQRDTO appointmentQR;
    private String cancellationReason;

    public enum NotificationType {
        APPOINTMENT_CREATED,
        APPOINTMENT_REMINDER,
        APPOINTMENT_CANCELLED,
        QR_RESEND,
        VERIFICATION_CODE_SENT,
        APPOINTMENT_VERIFIED,
    }
}

package com.care.notification.application.service;

import com.care.notification.application.dto.AppointmentQRDTO;
import com.care.notification.application.dto.NotificationRequest;
import com.care.notification.application.dto.NotificationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Push Notification Service for sending push notifications to mobile apps
 * Supports:
 * - Firebase Cloud Messaging (FCM) for Android
 * - Apple Push Notification (APNs) for iOS
 *
 * Configure your provider credentials in application.yml
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PushNotificationService {

    // TODO: Inject Firebase or APNs client
    // private final FirebaseMessaging firebaseMessaging;
    // private final APNsClient apnsClient;

    @Value("${app.notification.push.enabled:true}")
    private boolean pushEnabled;

    @Value("${app.notification.push.provider:firebase}")
    private String pushProvider;

    /**
     * Send push notification for appointment
     */
    public NotificationResult sendPushNotification(NotificationRequest request) {

        if (!pushEnabled || request.getDeviceId() == null) {
            return NotificationResult.failed("PUSH",
                "Push notifications not enabled or no device ID");
        }

        try {
            String title = buildNotificationTitle(request);
            String body = buildNotificationBody(request);

            switch (request.getNotificationType()) {
                case APPOINTMENT_CREATED:
                    sendAppointmentCreatedPush(request.getDeviceId(), title, body, request.getAppointmentQR());
                    break;
                case APPOINTMENT_REMINDER:
                    sendAppointmentReminderPush(request.getDeviceId(), title, body, request.getAppointmentQR());
                    break;
                case APPOINTMENT_CANCELLED:
                    sendAppointmentCancelledPush(request.getDeviceId(), title, body);
                    break;
                case QR_RESEND:
                    sendQRCodePush(request.getDeviceId(), title, body, request.getAppointmentQR());
                    break;
                default:
                    log.warn("Unknown notification type for push: {}", request.getNotificationType());
            }

            log.info("Push notification sent successfully to device: {}", maskDeviceId(request.getDeviceId()));
            return NotificationResult.success("PUSH");

        } catch (Exception e) {
            log.error("Failed to send push notification to device {}: {}",
                maskDeviceId(request.getDeviceId()), e.getMessage());
            return NotificationResult.failed("PUSH", e.getMessage());
        }
    }

    /**
     * Send appointment created push notification
     */
    private void sendAppointmentCreatedPush(String deviceId, String title, String body,
                                           AppointmentQRDTO appointmentQR) {
        // TODO: Implement push sending
        log.debug("Sending push (appointment created) to device {}: title={}, body={}",
            maskDeviceId(deviceId), title, body);

        /*
        Example with Firebase:
        Message message = Message.builder()
            .setNotification(new Notification(title, body))
            .putData("appointment_code", appointmentQR.getAppointmentCode())
            .putData("appointment_id", appointmentQR.getAppointmentId().toString())
            .putData("type", "APPOINTMENT_CREATED")
            .setToken(deviceId)
            .build();

        String response = FirebaseMessaging.getInstance().send(message);
        */
    }

    /**
     * Send appointment reminder push notification
     */
    private void sendAppointmentReminderPush(String deviceId, String title, String body,
                                            AppointmentQRDTO appointmentQR) {
        log.debug("Sending push (reminder) to device {}: title={}, body={}",
            maskDeviceId(deviceId), title, body);
    }

    /**
     * Send appointment cancelled push notification
     */
    private void sendAppointmentCancelledPush(String deviceId, String title, String body) {
        log.debug("Sending push (cancelled) to device {}: title={}, body={}",
            maskDeviceId(deviceId), title, body);
    }

    /**
     * Send QR code push notification
     */
    private void sendQRCodePush(String deviceId, String title, String body,
                               AppointmentQRDTO appointmentQR) {
        log.debug("Sending push (QR resend) to device {}: title={}, body={}",
            maskDeviceId(deviceId), title, body);
    }

    /**
     * Build notification title based on type
     */
    private String buildNotificationTitle(NotificationRequest request) {
        return switch (request.getNotificationType()) {
            case APPOINTMENT_CREATED -> "موعدك الجديد | New Appointment";
            case APPOINTMENT_REMINDER -> "تذكير بموعدك | Appointment Reminder";
            case APPOINTMENT_CANCELLED -> "موعدك ملغى | Appointment Cancelled";
            case QR_RESEND -> "كود موعدك | Appointment Code";
            default -> "إشعار | Notification";
        };
    }

    /**
     * Build notification body based on type
     */
    private String buildNotificationBody(NotificationRequest request) {
        var qr = request.getAppointmentQR();

        return switch (request.getNotificationType()) {
            case APPOINTMENT_CREATED -> String.format(
                "تم حجز موعدك في %s الساعة %s. كود الموعد: %s",
                qr.getAppointmentDate(), qr.getAppointmentTime(), qr.getAppointmentCode()
            );

            case APPOINTMENT_REMINDER -> String.format(
                "موعدك قريب: %s الساعة %s. كود الموعد: %s",
                qr.getAppointmentDate(), qr.getAppointmentTime(), qr.getAppointmentCode()
            );

            case APPOINTMENT_CANCELLED -> String.format(
                "تم إلغاء موعدك (الكود: %s). السبب: %s",
                qr.getAppointmentCode(),
                request.getCancellationReason() != null ? request.getCancellationReason() : "غير محدد"
            );

            case QR_RESEND -> String.format(
                "إعادة إرسال كود موعدك: %s\nكود التحقق: %s",
                qr.getAppointmentCode(), qr.getVerificationCode()
            );

            default -> "إشعار جديد من النظام";
        };
    }

    /**
     * Mask device ID for logging
     */
    private String maskDeviceId(String deviceId) {
        if (deviceId == null || deviceId.length() < 8) {
            return "****";
        }
        return deviceId.substring(0, 4) + "..." + deviceId.substring(deviceId.length() - 4);
    }

    /**
     * Check if device is reachable (online)
     * TODO: Implement device status check
     */
    public boolean isDeviceOnline(String deviceId) {
        // Check if device has synced recently
        // Return from cache/database
        return true;
    }

    /**
     * Mark device as active
     */
    public void markDeviceAsActive(String deviceId) {
        // Update last activity timestamp in database
        log.debug("Marking device {} as active", maskDeviceId(deviceId));
    }
}

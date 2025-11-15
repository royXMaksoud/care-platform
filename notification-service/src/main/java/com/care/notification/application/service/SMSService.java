package com.care.notification.application.service;

import com.care.notification.application.dto.NotificationRequest;
import com.care.notification.application.dto.NotificationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * SMS Service for sending appointment notifications via SMS
 * Configure your SMS provider (Twilio, AWS SNS, etc.) in application.yml
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SMSService {

    // TODO: Inject actual SMS provider client (e.g., TwilioClient, AmazonSNSClient)
    // private final TwilioClient twilioClient;
    // private final AmazonSNS amazonSNS;

    @Value("${app.notification.sms.enabled:true}")
    private boolean smsEnabled;

    @Value("${app.notification.sms.provider:twilio}")
    private String smsProvider;

    /**
     * Send SMS notification for appointment
     */
    public NotificationResult sendSMSNotification(NotificationRequest request) {

        if (!smsEnabled || request.getMobileNumber() == null) {
            return NotificationResult.failed("SMS", "SMS not enabled or no phone number");
        }

        try {
            String messageBody = buildSMSContent(request);

            // TODO: Implement actual SMS sending based on provider
            switch (request.getNotificationType()) {
                case APPOINTMENT_CREATED:
                    sendAppointmentCreatedSMS(request.getMobileNumber(), messageBody);
                    break;
                case APPOINTMENT_REMINDER:
                    sendAppointmentReminderSMS(request.getMobileNumber(), messageBody);
                    break;
                case APPOINTMENT_CANCELLED:
                    sendAppointmentCancelledSMS(request.getMobileNumber(), messageBody);
                    break;
                case QR_RESEND:
                    sendQRCodeSMS(request.getMobileNumber(), messageBody);
                    break;
                default:
                    log.warn("Unknown notification type for SMS: {}", request.getNotificationType());
            }

            log.info("SMS sent successfully to: {}", maskPhoneNumber(request.getMobileNumber()));
            return NotificationResult.success("SMS");

        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", maskPhoneNumber(request.getMobileNumber()), e.getMessage());
            return NotificationResult.failed("SMS", e.getMessage());
        }
    }

    /**
     * Build SMS content for appointment created
     */
    private void sendAppointmentCreatedSMS(String phoneNumber, String messageBody) {
        // TODO: Implement SMS sending via provider
        log.debug("Sending SMS to {}: {}", maskPhoneNumber(phoneNumber), messageBody);

        /*
        Example with Twilio:
        Message message = Message.creator(
            new PhoneNumber("+966XXXXX"),     // From number
            new PhoneNumber(phoneNumber),     // To number
            messageBody
        ).create();
        */
    }

    /**
     * Build SMS content for appointment reminder
     */
    private void sendAppointmentReminderSMS(String phoneNumber, String messageBody) {
        log.debug("Sending reminder SMS to {}: {}", maskPhoneNumber(phoneNumber), messageBody);
    }

    /**
     * Build SMS content for appointment cancelled
     */
    private void sendAppointmentCancelledSMS(String phoneNumber, String messageBody) {
        log.debug("Sending cancellation SMS to {}: {}", maskPhoneNumber(phoneNumber), messageBody);
    }

    /**
     * Build SMS content for QR code
     */
    private void sendQRCodeSMS(String phoneNumber, String messageBody) {
        log.debug("Sending QR SMS to {}: {}", maskPhoneNumber(phoneNumber), messageBody);
    }

    /**
     * Build SMS message content
     */
    private String buildSMSContent(NotificationRequest request) {
        var qr = request.getAppointmentQR();

        return switch (request.getNotificationType()) {
            case APPOINTMENT_CREATED -> String.format(
                "تم حجز موعدك برقم: %s\nالتاريخ: %s\nالوقت: %s\nكود التحقق: %s\n\nYour appointment code: %s",
                qr.getAppointmentCode(),
                qr.getAppointmentDate(),
                qr.getAppointmentTime(),
                qr.getVerificationCode(),
                qr.getAppointmentCode()
            );

            case APPOINTMENT_REMINDER -> String.format(
                "تذكير: موعدك في %s الساعة %s\nكود الموعد: %s\n\nReminder: Appointment on %s at %s\nCode: %s",
                qr.getAppointmentDate(),
                qr.getAppointmentTime(),
                qr.getAppointmentCode(),
                qr.getAppointmentDate(),
                qr.getAppointmentTime(),
                qr.getAppointmentCode()
            );

            case APPOINTMENT_CANCELLED -> String.format(
                "تم إلغاء موعدك برقم: %s\nالسبب: %s\n\nYour appointment %s was cancelled.\nReason: %s",
                qr.getAppointmentCode(),
                request.getCancellationReason() != null ? request.getCancellationReason() : "غير محدد",
                qr.getAppointmentCode(),
                request.getCancellationReason() != null ? request.getCancellationReason() : "Not specified"
            );

            case QR_RESEND -> String.format(
                "كود موعدك: %s\nكود التحقق: %s\n\nYour appointment code: %s\nVerification: %s",
                qr.getAppointmentCode(),
                qr.getVerificationCode(),
                qr.getAppointmentCode(),
                qr.getVerificationCode()
            );

            default -> "";
        };
    }

    /**
     * Mask phone number for logging
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "****";
        }
        return "*****" + phoneNumber.substring(phoneNumber.length() - 4);
    }
}

package com.care.notification.application.service;

import com.care.notification.application.dto.NotificationRequest;
import com.care.notification.application.dto.NotificationResult;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Email Service for sending appointment notifications via SMTP
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@caremanagement.org}")
    private String fromEmail;

    @Value("${app.notification.email.enabled:true}")
    private boolean emailEnabled;

    /**
     * Send email notification for appointment
     */
    public NotificationResult sendEmailNotification(NotificationRequest request) {

        if (!emailEnabled || request.getEmail() == null) {
            return NotificationResult.failed("EMAIL", "Email not enabled or no address");
        }

        try {
            switch (request.getNotificationType()) {
                case APPOINTMENT_CREATED:
                    sendAppointmentCreatedEmail(request);
                    break;
                case APPOINTMENT_REMINDER:
                    sendAppointmentReminderEmail(request);
                    break;
                case APPOINTMENT_CANCELLED:
                    sendAppointmentCancelledEmail(request);
                    break;
                case QR_RESEND:
                    sendQRCodeEmail(request);
                    break;
                default:
                    log.warn("Unknown notification type for email: {}", request.getNotificationType());
            }

            log.info("Email sent successfully to: {}", request.getEmail());
            return NotificationResult.success("EMAIL");

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", request.getEmail(), e.getMessage());
            return NotificationResult.failed("EMAIL", e.getMessage());
        }
    }

    /**
     * Send appointment created email
     */
    private void sendAppointmentCreatedEmail(NotificationRequest request)
        throws MessagingException {

        String subject = "تم إنشاء موعدك الجديد | Your Appointment Created";
        String htmlContent = buildAppointmentCreatedHtml(request);

        sendHtmlEmail(request.getEmail(), subject, htmlContent);
    }

    /**
     * Send appointment reminder email
     */
    private void sendAppointmentReminderEmail(NotificationRequest request)
        throws MessagingException {

        String subject = "تذكير بموعدك القادم | Appointment Reminder";
        String htmlContent = buildAppointmentReminderHtml(request);

        sendHtmlEmail(request.getEmail(), subject, htmlContent);
    }

    /**
     * Send appointment cancelled email
     */
    private void sendAppointmentCancelledEmail(NotificationRequest request)
        throws MessagingException {

        String subject = "تم إلغاء موعدك | Appointment Cancelled";
        String htmlContent = buildAppointmentCancelledHtml(request);

        sendHtmlEmail(request.getEmail(), subject, htmlContent);
    }

    /**
     * Send QR code via email
     */
    private void sendQRCodeEmail(NotificationRequest request)
        throws MessagingException {

        String subject = "إعادة إرسال كود الموعد | Appointment Code Resent";
        String htmlContent = buildQRCodeHtml(request);

        sendHtmlEmail(request.getEmail(), subject, htmlContent);
    }

    /**
     * Send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true); // true = isHtml

        mailSender.send(message);
    }

    /**
     * Build HTML for appointment created email
     */
    private String buildAppointmentCreatedHtml(NotificationRequest request) {
        var qr = request.getAppointmentQR();

        return String.format("""
            <html dir="rtl" style="font-family: Arial, sans-serif;">
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #2563eb; text-align: center;">تم إنشاء موعدك</h2>
                    <p style="text-align: center; color: #666;">Your appointment has been created successfully</p>

                    <hr style="border: 1px solid #e0e0e0;">

                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin-bottom: 15px;">معلومات الموعد</h3>

                        <p><strong>كود الموعد:</strong> <code style="background: #e0e0e0; padding: 5px;">%s</code></p>
                        <p><strong>التاريخ:</strong> %s</p>
                        <p><strong>الوقت:</strong> %s</p>
                        %s
                        %s
                    </div>

                    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
                        <h3 style="color: #1e40af; margin-top: 0;">كود التحقق (للموظفين)</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 3px; text-align: center;">%s</p>
                        <p style="text-align: center; color: #666; font-size: 12px;">أعط هذا الكود للموظف عند الوصول</p>
                    </div>

                    %s

                    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px;">
                        <h3 style="color: #16a34a;">تعليمات مهمة</h3>
                        <ul style="color: #16a34a;">
                            <li>احفظ كود الموعد في مكان آمن</li>
                            <li>تذكر الموعد قبل موعده بـ 30 دقيقة</li>
                            <li>أحضر هوية شخصية معك</li>
                            <li>في حالة التأخر، أخبر المركز فوراً</li>
                        </ul>
                    </div>

                    <hr style="border: 1px solid #e0e0e0; margin-top: 30px;">

                    <p style="text-align: center; color: #999; font-size: 12px;">
                        <br>
                        هذا البريد الإلكتروني تم إرساله تلقائياً. يرجى عدم الرد عليه.<br>
                        This email was sent automatically. Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
            """,
            qr.getAppointmentCode(),
            qr.getAppointmentDate(),
            qr.getAppointmentTime(),
            qr.getBeneficiaryName() != null ? "<p><strong>المستفيد:</strong> " + qr.getBeneficiaryName() + "</p>" : "",
            qr.getCenterName() != null ? "<p><strong>المركز:</strong> " + qr.getCenterName() + "</p>" : "",
            qr.getVerificationCode(),
            buildQRImageHtml(qr.getQrCodeUrl())
        );
    }

    /**
     * Build HTML for appointment reminder email
     */
    private String buildAppointmentReminderHtml(NotificationRequest request) {
        var qr = request.getAppointmentQR();

        return String.format("""
            <html dir="rtl" style="font-family: Arial, sans-serif;">
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #ea580c; text-align: center;">تذكير بموعدك</h2>

                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ea580c;">
                        <p style="font-size: 16px; color: #7c2d12;">
                            موعدك قريب جداً! الموعد بعد 24 ساعة.
                        </p>
                        <p style="color: #7c2d12;">
                            <strong>التاريخ:</strong> %s<br>
                            <strong>الوقت:</strong> %s
                        </p>
                    </div>

                    <p style="margin: 20px 0; color: #666;">
                        يرجى الحضور قبل الموعد بـ 30 دقيقة على الأقل.
                    </p>

                    %s
                </div>
            </body>
            </html>
            """,
            qr.getAppointmentDate(),
            qr.getAppointmentTime(),
            buildQRImageHtml(qr.getQrCodeUrl())
        );
    }

    /**
     * Build HTML for appointment cancelled email
     */
    private String buildAppointmentCancelledHtml(NotificationRequest request) {
        return String.format("""
            <html dir="rtl" style="font-family: Arial, sans-serif;">
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #dc2626; text-align: center;">تم إلغاء موعدك</h2>

                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px;">
                        <p style="color: #7c2d12;">
                            <strong>السبب:</strong> %s
                        </p>
                    </div>

                    <p style="margin: 20px 0; color: #666;">
                        للمزيد من المعلومات، يرجى التواصل مع المركز مباشرة.
                    </p>
                </div>
            </body>
            </html>
            """,
            request.getCancellationReason() != null ? request.getCancellationReason() : "غير محدد"
        );
    }

    /**
     * Build HTML for QR code email
     */
    private String buildQRCodeHtml(NotificationRequest request) {
        var qr = request.getAppointmentQR();

        return String.format("""
            <html dir="rtl" style="font-family: Arial, sans-serif;">
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #2563eb; text-align: center;">إعادة إرسال كود الموعد</h2>

                    <p style="text-align: center; color: #666;">
                        كود موعدك: <strong>%s</strong>
                    </p>

                    %s
                </div>
            </body>
            </html>
            """,
            qr.getAppointmentCode(),
            buildQRImageHtml(qr.getQrCodeUrl())
        );
    }

    /**
     * Build QR code image HTML
     */
    private String buildQRImageHtml(String qrCodeUrl) {
        if (qrCodeUrl == null || qrCodeUrl.isEmpty()) {
            return "";
        }

        return String.format("""
            <div style="text-align: center; margin: 20px 0;">
                <img src="%s" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #e0e0e0; padding: 10px;">
            </div>
            """, qrCodeUrl);
    }
}

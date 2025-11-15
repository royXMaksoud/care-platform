package com.care.notification.application.service;

import com.care.notification.application.dto.NotificationRequest;
import com.care.notification.application.dto.NotificationResult;
import com.care.notification.infrastructure.kafka.NotificationEvent;
import com.care.notification.infrastructure.kafka.NotificationEventProducer;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity.NotificationStatus;
import com.care.notification.infrastructure.persistence.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationEventProducer kafkaProducer;
    private final EmailService emailService;
    private final SMSService smsService;
    private final PushNotificationService pushNotificationService;

    @Value("${app.notification.default-channel:SMS}")
    private String defaultChannel;

    @Value("${app.notification.max-retries:3}")
    private int maxRetries;

    @Value("${app.notification.kafka.enabled:true}")
    private boolean kafkaEnabled;

    @Transactional
    public NotificationResult notifyAppointmentCreated(NotificationRequest request) {
        log.info("Appointment created for: {}", request.getBeneficiaryId());
        request.setNotificationType(NotificationRequest.NotificationType.APPOINTMENT_CREATED);
        return sendNotification(request);
    }

    @Transactional
    public NotificationResult notifyAppointmentReminder(NotificationRequest request) {
        log.info("Reminder for: {}", request.getBeneficiaryId());
        request.setNotificationType(NotificationRequest.NotificationType.APPOINTMENT_REMINDER);
        return sendNotification(request);
    }

    @Transactional
    public NotificationResult notifyAppointmentCancelled(NotificationRequest request) {
        log.info("Cancelled for: {}", request.getBeneficiaryId());
        request.setNotificationType(NotificationRequest.NotificationType.APPOINTMENT_CANCELLED);
        return sendNotification(request);
    }

    @Transactional
    public NotificationResult resendQRCode(NotificationRequest request) {
        log.info("QR resend for: {}", request.getBeneficiaryId());
        request.setNotificationType(NotificationRequest.NotificationType.QR_RESEND);
        return sendNotification(request);
    }

    @Transactional
    private NotificationResult sendNotification(NotificationRequest request) {
        try {
            String idempotencyKey = generateIdempotencyKey(request);
            Optional<NotificationEntity> existing = notificationRepository.findByIdempotencyKey(idempotencyKey);

            if (existing.isPresent()) {
                log.warn("Duplicate notification");
                return NotificationResult.success(existing.get().getChannel());
            }

            NotificationEntity notification = new NotificationEntity();
            notification.setId(UUID.randomUUID());
            notification.setIdempotencyKey(idempotencyKey);
            notification.setBeneficiaryId(request.getBeneficiaryId());
            notification.setMobileNumber(request.getMobileNumber());
            notification.setEmail(request.getEmail());
            notification.setDeviceId(request.getDeviceId());
            notification.setHasInstalledMobileApp(request.isHasInstalledMobileApp());
            notification.setPreferredChannel(request.getPreferredChannel() != null ? request.getPreferredChannel() : defaultChannel);
            notification.setNotificationType(request.getNotificationType().toString());
            notification.setStatus(NotificationEntity.NotificationStatus.PENDING);
            notification.setRetryCount(0);
            notification.setMaxRetries(maxRetries);
            notification.setCreatedAt(LocalDateTime.now());

            NotificationEntity saved = notificationRepository.save(notification);

            if (kafkaEnabled) {
                publishToKafka(saved, request);
                return NotificationResult.builder()
                    .channel("ASYNC_QUEUED")
                    .success(true)
                    .sentAt(System.currentTimeMillis())
                    .build();
            } else {
                return sendSync(saved, request);
            }

        } catch (Exception e) {
            log.error("Error: {}", e.getMessage(), e);
            return NotificationResult.failed("ERROR", e.getMessage());
        }
    }

    private void publishToKafka(NotificationEntity notification, NotificationRequest request) {
        try {
            NotificationEvent event = NotificationEvent.builder()
                .notificationId(notification.getId())
                .request(request)
                .retryCount(0)
                .maxRetries(maxRetries)
                .idempotencyKey(notification.getIdempotencyKey())
                .createdAt(LocalDateTime.now())
                .priority("NORMAL")
                .build();

            kafkaProducer.publishNotificationEvent(event);
            log.info("Published to Kafka");
        } catch (Exception e) {
            log.error("Kafka publish failed: {}", e.getMessage());
        }
    }

    private NotificationResult sendSync(NotificationEntity notification, NotificationRequest request) {
        String channel = request.getPreferredChannel() != null ? request.getPreferredChannel() : defaultChannel;
        NotificationResult result = sendViaChannel(channel, request);

        if (result.isSuccess()) {
            notification.setStatus(NotificationEntity.NotificationStatus.SENT);
            notification.setChannel(channel);
            notification.setSuccess(true);
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }

        return result;
    }

    private NotificationResult sendViaChannel(String channel, NotificationRequest request) {
        try {
            if ("EMAIL".equalsIgnoreCase(channel)) {
                return emailService.sendEmailNotification(request);
            } else if ("SMS".equalsIgnoreCase(channel)) {
                return smsService.sendSMSNotification(request);
            } else if ("PUSH".equalsIgnoreCase(channel)) {
                return pushNotificationService.sendPushNotification(request);
            }
            return NotificationResult.failed(channel, "Unknown channel");
        } catch (Exception e) {
            log.error("Error via {}: {}", channel, e.getMessage());
            return NotificationResult.failed(channel, e.getMessage());
        }
    }

    private String generateIdempotencyKey(NotificationRequest request) {
        String appointmentId = request.getAppointmentQR() != null ? request.getAppointmentQR().getAppointmentId().toString() : "unknown";
        return String.format("%s:%s:%s", request.getBeneficiaryId(), request.getNotificationType(), appointmentId);
    }

    public List<NotificationEntity> getNotificationHistory(UUID beneficiaryId) {
        return notificationRepository.findByBeneficiaryIdOrderByCreatedAtDesc(beneficiaryId);
    }

    public Optional<NotificationEntity> getNotification(UUID notificationId) {
        return notificationRepository.findById(notificationId);
    }
}

package com.care.notification.infrastructure.kafka;

import com.care.notification.application.dto.NotificationResult;
import com.care.notification.application.service.EmailService;
import com.care.notification.application.service.SMSService;
import com.care.notification.application.service.PushNotificationService;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity;
import com.care.notification.infrastructure.persistence.entity.NotificationEntity.NotificationStatus;
import com.care.notification.infrastructure.persistence.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationEventConsumer {
    
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final SMSService smsService;
    private final PushNotificationService pushNotificationService;
    
    @KafkaListener(
        topics = KafkaConfig.TOPIC_NOTIFICATION_EVENTS,
        groupId = KafkaConfig.CONSUMER_GROUP_NOTIFICATION,
        concurrency = "3"
    )
    public void consumeNotificationEvent(
        @Payload NotificationEvent event,
        Acknowledgment acknowledgment) {
        
        try {
            log.info("Processing notification {}", event.getNotificationId());
            
            NotificationEntity notification = notificationRepository
                .findById(event.getNotificationId())
                .orElse(null);
            
            if (notification == null) {
                log.warn("Notification not found: {}", event.getNotificationId());
                acknowledgment.acknowledge();
                return;
            }
            
            // Try to send notification
            boolean success = attemptSend(notification);
            
            if (success) {
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                notificationRepository.save(notification);
                log.info("Notification {} sent successfully", event.getNotificationId());
                acknowledgment.acknowledge();
            } else {
                // Handle retry
                handleFailure(notification, event);
                acknowledgment.acknowledge();
            }
            
        } catch (Exception e) {
            log.error("Error processing notification: {}", e.getMessage());
            throw new RuntimeException("Processing failed", e);
        }
    }
    
    private boolean attemptSend(NotificationEntity notification) {
        String channel = notification.getPreferredChannel() != null 
            ? notification.getPreferredChannel() 
            : "EMAIL";
        
        try {
            if ("EMAIL".equalsIgnoreCase(channel)) {
                return emailService.sendEmailNotification(null).isSuccess();
            } else if ("SMS".equalsIgnoreCase(channel)) {
                return smsService.sendSMSNotification(null).isSuccess();
            } else if ("PUSH".equalsIgnoreCase(channel)) {
                return pushNotificationService.sendPushNotification(null).isSuccess();
            }
            return false;
        } catch (Exception e) {
            log.error("Send failed: {}", e.getMessage());
            return false;
        }
    }
    
    private void handleFailure(NotificationEntity notification, NotificationEvent event) {
        if (event.isRetryable()) {
            notification.setStatus(NotificationStatus.RETRYING);
            notification.setRetryCount(event.getRetryCount() + 1);
            long delay = (long) (100 * Math.pow(1.5, event.getRetryCount()));
            notification.setNextRetryAt(LocalDateTime.now().plusSeconds(delay / 1000));
            notificationRepository.save(notification);
            log.info("Notification queued for retry");
        } else {
            notification.setStatus(NotificationStatus.FAILED);
            notificationRepository.save(notification);
            log.error("Notification failed - no more retries");
        }
    }
    
    @KafkaListener(topics = KafkaConfig.TOPIC_NOTIFICATION_DLQ)
    public void handleDLQ(@Payload NotificationEvent event) {
        log.error("CRITICAL: Message in DLQ - {}", event.getNotificationId());
    }
}

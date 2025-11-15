package com.care.notification.infrastructure.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Kafka producer for sending notification events asynchronously
 * Publishes NotificationEvent messages to Kafka for async processing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventProducer {
    
    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;
    
    /**
     * Publish notification event to Kafka for async processing
     *
     * @param event The notification event to publish
     */
    public void publishNotificationEvent(NotificationEvent event) {
        try {
            String key = event.getNotificationId().toString();
            
            Message<NotificationEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(KafkaHeaders.TOPIC, KafkaConfig.TOPIC_NOTIFICATION_EVENTS)
                .setHeader("X-Notification-ID", event.getNotificationId().toString())
                .setHeader("X-Priority", event.getPriority())
                .build();
            
            kafkaTemplate.send(message);
            
            log.debug("Notification event published to Kafka: {} with key: {}", 
                event.getNotificationId(), key);
            
        } catch (Exception e) {
            log.error("Failed to publish notification event {}: {}", 
                event.getNotificationId(), e.getMessage(), e);
            throw new RuntimeException("Failed to publish notification event", e);
        }
    }
    
    /**
     * Publish multiple notification events in batch
     *
     * @param events List of notification events
     */
    public void publishNotificationEventsBatch(java.util.List<NotificationEvent> events) {
        events.forEach(this::publishNotificationEvent);
        log.info("Published {} notification events to Kafka", events.size());
    }
}

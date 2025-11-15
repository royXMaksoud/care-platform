package com.care.notification.infrastructure.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Kafka configuration for notification service
 * Defines topics, consumer groups, and Kafka-related beans
 *
 * Configuration is optional and gracefully handles Kafka unavailability
 * for development/testing environments
 */
@Configuration
@EnableKafka
@RequiredArgsConstructor
@Slf4j
public class KafkaConfig {

    // Topic names
    public static final String TOPIC_NOTIFICATION_EVENTS = "notification-events";
    public static final String TOPIC_NOTIFICATION_DLQ = "notification-events-dlq";

    // Consumer groups
    public static final String CONSUMER_GROUP_NOTIFICATION = "notification-service-group";

    /**
     * Create notification-events topic with 3 partitions and 2 replicas
     * This topic receives notification events to be processed asynchronously
     * Only creates the topic if Kafka is enabled
     */
    @Bean
    @ConditionalOnProperty(name = "app.notification.kafka.enabled", havingValue = "true", matchIfMissing = true)
    public NewTopic notificationEventsTopic() {
        log.info("Creating Kafka topic: {}", TOPIC_NOTIFICATION_EVENTS);
        return TopicBuilder.name(TOPIC_NOTIFICATION_EVENTS)
            .partitions(3)  // 3 partitions for parallel processing
            .replicas(1)    // 1 replica for local development, increase to 2 in production
            .config("cleanup.policy", "delete")  // Delete old messages after retention
            .config("retention.ms", String.valueOf(7 * 24 * 60 * 60 * 1000))  // 7 days retention
            .build();
    }

    /**
     * Create DLQ (Dead Letter Queue) for failed notifications
     * Messages that fail after max retries go here for manual review
     * Only creates the topic if Kafka is enabled
     */
    @Bean
    @ConditionalOnProperty(name = "app.notification.kafka.enabled", havingValue = "true", matchIfMissing = true)
    public NewTopic notificationDlqTopic() {
        log.info("Creating Kafka topic: {}", TOPIC_NOTIFICATION_DLQ);
        return TopicBuilder.name(TOPIC_NOTIFICATION_DLQ)
            .partitions(1)  // Single partition for DLQ
            .replicas(1)    // 1 replica for local development, increase to 2 in production
            .config("cleanup.policy", "delete")
            .config("retention.ms", String.valueOf(30 * 24 * 60 * 60 * 1000))  // 30 days for DLQ
            .build();
    }
}

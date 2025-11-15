package com.care.notification.application.service;

import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Firebase Cloud Messaging service for push notifications
 * Supports device-specific and topic-based push notifications
 * Requires Firebase credentials to be configured
 */
@Service
@Slf4j
public class FirebasePushService {

    /**
     * Send push notification to device
     *
     * @param deviceToken Firebase device token
     * @param title Notification title
     * @param body Notification body/message
     * @return Message ID for tracking
     */
    public String sendPushNotification(String deviceToken, String title, String body) {
        try {
            Message message = Message.builder()
                .setToken(deviceToken)
                .setNotification(
                    Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build()
                )
                .putAllData(buildDataPayload(title, body))
                .setAndroidConfig(
                    AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .setNotification(
                            AndroidNotification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .setClickAction("FLUTTER_NOTIFICATION_CLICK")
                                .build()
                        )
                        .build()
                )
                .setApnsConfig(
                    ApnsConfig.builder()
                        .putHeader("apns-priority", "10")
                        .setAps(
                            Aps.builder()
                                .setAlert(ApsAlert.builder()
                                    .setTitle(title)
                                    .setBody(body)
                                    .build()
                                )
                                .setSound("default")
                                .build()
                        )
                        .build()
                )
                .build();

            String messageId = FirebaseMessaging.getInstance().send(message);
            log.info("Push notification sent successfully. Message ID: {}, Device: {}",
                messageId, deviceToken);

            return messageId;
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send push notification to {}: {}", deviceToken, e.getMessage());
            throw new RuntimeException("Push notification delivery failed", e);
        }
    }

    /**
     * Send push to topic (broadcast to all subscribed devices)
     *
     * @param topic Topic name
     * @param title Notification title
     * @param body Notification body/message
     * @return Message ID for tracking
     */
    public String sendPushToTopic(String topic, String title, String body) {
        try {
            Message message = Message.builder()
                .setTopic(topic)
                .setNotification(
                    Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build()
                )
                .putAllData(buildDataPayload(title, body))
                .build();

            String messageId = FirebaseMessaging.getInstance().send(message);
            log.info("Push notification sent to topic '{}'. Message ID: {}", topic, messageId);

            return messageId;
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send push to topic {}: {}", topic, e.getMessage());
            throw new RuntimeException("Topic push notification failed", e);
        }
    }

    /**
     * Subscribe device to topic
     *
     * @param deviceToken Firebase device token
     * @param topic Topic name
     */
    public void subscribeToTopic(String deviceToken, String topic) {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic(List.of(deviceToken), topic);
            log.info("Device {} subscribed to topic {}", deviceToken, topic);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to subscribe to topic: {}", e.getMessage());
        }
    }

    /**
     * Unsubscribe device from topic
     *
     * @param deviceToken Firebase device token
     * @param topic Topic name
     */
    public void unsubscribeFromTopic(String deviceToken, String topic) {
        try {
            FirebaseMessaging.getInstance().unsubscribeFromTopic(List.of(deviceToken), topic);
            log.info("Device {} unsubscribed from topic {}", deviceToken, topic);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to unsubscribe from topic: {}", e.getMessage());
        }
    }

    /**
     * Build data payload for notification
     */
    private Map<String, String> buildDataPayload(String title, String body) {
        Map<String, String> data = new HashMap<>();
        data.put("notification_title", title);
        data.put("notification_body", body);
        data.put("timestamp", System.currentTimeMillis() + "");
        return data;
    }
}

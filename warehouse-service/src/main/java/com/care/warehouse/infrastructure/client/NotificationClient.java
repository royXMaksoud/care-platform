package com.care.warehouse.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client for notification service
 * Used for sending emails, SMS, and push notifications
 */
@FeignClient(
    name = "warehouse-notification-client",
    url = "${notification.service.url}",
    configuration = FeignClientConfiguration.class,
    fallback = NotificationClientFallback.class
)
public interface NotificationClient {
    
    /**
     * Send notification (email/SMS/push)
     */
    @PostMapping("/api/notifications/send")
    Object sendNotification(@RequestBody Object notificationRequest);
}


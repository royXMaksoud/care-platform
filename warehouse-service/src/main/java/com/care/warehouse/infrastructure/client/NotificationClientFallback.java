package com.care.warehouse.infrastructure.client;

import org.springframework.stereotype.Component;

/**
 * Fallback implementation for notification client
 * Used when notification service is unavailable
 */
@Component
public class NotificationClientFallback implements NotificationClient {

    @Override
    public Object sendNotification(Object notificationRequest) {
        // Log the failure but don't throw exception to prevent service disruption
        // In production, this should be logged to a monitoring system
        return new NotificationResult(false, "Notification service unavailable");
    }
    
    /**
     * Simple result DTO for fallback
     */
    public static class NotificationResult {
        private boolean success;
        private String message;
        
        public NotificationResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public String getMessage() {
            return message;
        }
    }
}


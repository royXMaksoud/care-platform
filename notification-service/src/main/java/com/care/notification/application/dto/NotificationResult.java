package com.care.notification.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for notification results
 * Contains status and details of notification delivery
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResult {
    private String channel;
    private boolean success;
    private String errorMessage;
    private long sentAt;

    public static NotificationResult success(String channel) {
        return NotificationResult.builder()
            .channel(channel)
            .success(true)
            .sentAt(System.currentTimeMillis())
            .build();
    }

    public static NotificationResult failed(String channel, String errorMessage) {
        return NotificationResult.builder()
            .channel(channel)
            .success(false)
            .errorMessage(errorMessage)
            .sentAt(System.currentTimeMillis())
            .build();
    }
}

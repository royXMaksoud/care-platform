package com.care.notification.presentation.controller;

import com.care.notification.application.dto.NotificationRequest;
import com.care.notification.application.dto.NotificationResult;
import com.care.notification.application.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Notification API
 * Exposes notification sending endpoints for other microservices
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Multi-channel notification API")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Send appointment created notification
     */
    @PostMapping("/appointment-created")
    @Operation(summary = "Send appointment created notification",
               description = "Sends appointment created notification via preferred/available channels")
    public ResponseEntity<NotificationResult> notifyAppointmentCreated(
            @RequestBody NotificationRequest request) {
        NotificationResult result = notificationService.notifyAppointmentCreated(request);
        return ResponseEntity.status(result.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST).body(result);
    }

    /**
     * Send appointment reminder notification
     */
    @PostMapping("/appointment-reminder")
    @Operation(summary = "Send appointment reminder notification",
               description = "Sends appointment reminder notification via preferred/available channels")
    public ResponseEntity<NotificationResult> notifyAppointmentReminder(
            @RequestBody NotificationRequest request) {
        NotificationResult result = notificationService.notifyAppointmentReminder(request);
        return ResponseEntity.status(result.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST).body(result);
    }

    /**
     * Send appointment cancelled notification
     */
    @PostMapping("/appointment-cancelled")
    @Operation(summary = "Send appointment cancelled notification",
               description = "Sends appointment cancelled notification via preferred/available channels")
    public ResponseEntity<NotificationResult> notifyAppointmentCancelled(
            @RequestBody NotificationRequest request) {
        NotificationResult result = notificationService.notifyAppointmentCancelled(request);
        return ResponseEntity.status(result.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST).body(result);
    }

    /**
     * Resend QR code via preferred channel
     */
    @PostMapping("/resend-qr")
    @Operation(summary = "Resend QR code notification",
               description = "Resends appointment QR code via specified channel (SMS, EMAIL, or PUSH)")
    public ResponseEntity<NotificationResult> resendQRCode(
            @RequestBody NotificationRequest request) {
        NotificationResult result = notificationService.resendQRCode(request);
        return ResponseEntity.status(result.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST).body(result);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Service health check endpoint")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Notification Service is running");
    }
}

package com.care.notification.application.service;

import com.care.notification.infrastructure.persistence.entity.WebhookEventEntity;
import com.care.notification.infrastructure.persistence.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

/**
 * Webhook delivery service for sending delivery confirmation to external systems
 * Implements exponential backoff retry mechanism with signature verification
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookDeliveryService {

    private final WebhookEventRepository webhookEventRepository;
    private final RestTemplate restTemplate;

    @Value("${webhook.secret-key:your-secret-key}")
    private String secretKey;

    @Value("${webhook.timeout-seconds:30}")
    private int timeoutSeconds;

    /**
     * Publish webhook event asynchronously
     *
     * @param event Webhook event to publish
     */
    @Async
    public void publishWebhookEvent(WebhookEventEntity event) {
        // Sign the payload
        String signature = generateSignature(event.getPayload());
        event.setSignature(signature);
        event.setStatus("pending");
        event.setRetryCount(0);
        event.setNextRetryAt(LocalDateTime.now());

        webhookEventRepository.save(event);
        log.info("Webhook event created: {}", event.getId());

        // Attempt immediate delivery
        deliverWebhook(event);
    }

    /**
     * Deliver webhook with retry logic
     *
     * @param event Webhook event to deliver
     */
    private void deliverWebhook(WebhookEventEntity event) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Webhook-Signature", event.getSignature());
            headers.set("X-Webhook-Event-Type", event.getEventType());
            headers.set("X-Webhook-Notification-Id", event.getNotificationId().toString());

            HttpEntity<String> request = new HttpEntity<>(event.getPayload(), headers);

            var response = restTemplate.postForEntity(
                event.getWebhookUrl(),
                request,
                String.class
            );

            event.setStatus("success");
            event.setResponseCode(response.getStatusCode().value());
            event.setProcessedAt(LocalDateTime.now());

            log.info("Webhook delivered successfully: {}", event.getId());
        } catch (Exception e) {
            handleWebhookFailure(event, e);
        }

        webhookEventRepository.save(event);
    }

    /**
     * Handle webhook delivery failure with exponential backoff
     *
     * @param event Webhook event that failed
     * @param exception Exception that occurred
     */
    private void handleWebhookFailure(WebhookEventEntity event, Exception exception) {
        event.setRetryCount(event.getRetryCount() + 1);

        if (event.getRetryCount() >= event.getMaxRetries()) {
            event.setStatus("failed");
            log.error("Webhook delivery failed after {} retries: {}",
                event.getMaxRetries(), event.getId());
        } else {
            // Exponential backoff: 2^n minutes
            long delayMinutes = (long) Math.pow(2, event.getRetryCount());
            event.setNextRetryAt(LocalDateTime.now().plus(delayMinutes, ChronoUnit.MINUTES));
            log.warn("Webhook delivery failed, will retry in {} minutes: {}",
                delayMinutes, event.getId());
        }

        event.setResponseBody(exception.getMessage());
    }

    /**
     * Generate HMAC-SHA256 signature for webhook payload
     *
     * @param payload Webhook payload to sign
     * @return Base64 encoded signature
     */
    private String generateSignature(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8), 0,
                secretKey.getBytes(StandardCharsets.UTF_8).length, "HmacSHA256"
            );
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            log.error("Failed to generate signature: {}", e.getMessage());
            throw new RuntimeException("Signature generation failed", e);
        }
    }

    /**
     * Verify webhook signature (for receiving webhooks from external systems)
     *
     * @param payload Webhook payload
     * @param providedSignature Signature provided by external system
     * @return true if signature is valid
     */
    public boolean verifySignature(String payload, String providedSignature) {
        String calculatedSignature = generateSignature(payload);
        return calculatedSignature.equals(providedSignature);
    }
}

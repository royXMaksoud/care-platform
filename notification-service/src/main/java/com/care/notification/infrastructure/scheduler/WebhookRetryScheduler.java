package com.care.notification.infrastructure.scheduler;

import com.care.notification.infrastructure.persistence.entity.WebhookEventEntity;
import com.care.notification.infrastructure.persistence.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled task for retrying failed webhook deliveries
 * Runs every 5 minutes to process pending webhooks
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookRetryScheduler {

    private final WebhookEventRepository webhookEventRepository;
    private final RestTemplate restTemplate;

    /**
     * Retry pending webhooks every 5 minutes
     * Processes webhooks that are ready for retry based on their nextRetryAt timestamp
     */
    @Scheduled(fixedRate = 300000) // 5 minutes in milliseconds
    public void retryPendingWebhooks() {
        try {
            List<WebhookEventEntity> pendingWebhooks =
                webhookEventRepository.findPendingWebhooks();

            if (pendingWebhooks.isEmpty()) {
                log.debug("No pending webhooks to retry");
                return;
            }

            log.info("Found {} pending webhooks to retry", pendingWebhooks.size());

            for (WebhookEventEntity webhook : pendingWebhooks) {
                retryWebhookDelivery(webhook);
            }
        } catch (Exception e) {
            log.error("Error in webhook retry scheduler: {}", e.getMessage());
        }
    }

    /**
     * Retry delivery of a single webhook
     *
     * @param webhook Webhook event to retry
     */
    private void retryWebhookDelivery(WebhookEventEntity webhook) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Webhook-Signature", webhook.getSignature());
            headers.set("X-Webhook-Event-Type", webhook.getEventType());
            headers.set("X-Webhook-Notification-Id", webhook.getNotificationId().toString());
            headers.set("X-Webhook-Retry-Attempt", String.valueOf(webhook.getRetryCount() + 1));

            HttpEntity<String> request = new HttpEntity<>(webhook.getPayload(), headers);

            var response = restTemplate.postForEntity(
                webhook.getWebhookUrl(),
                request,
                String.class
            );

            webhook.setStatus("success");
            webhook.setResponseCode(response.getStatusCode().value());
            webhook.setProcessedAt(LocalDateTime.now());

            log.info("Webhook retry successful: {}", webhook.getId());
        } catch (Exception e) {
            webhook.setRetryCount(webhook.getRetryCount() + 1);

            if (webhook.getRetryCount() >= webhook.getMaxRetries()) {
                webhook.setStatus("failed");
                log.error("Webhook retry failed after {} attempts: {}",
                    webhook.getMaxRetries(), webhook.getId());
            } else {
                // Exponential backoff: 2^n minutes
                long delayMinutes = (long) Math.pow(2, webhook.getRetryCount());
                webhook.setNextRetryAt(LocalDateTime.now().plus(delayMinutes, ChronoUnit.MINUTES));
                log.warn("Webhook retry failed, scheduling next retry in {} minutes: {}",
                    delayMinutes, webhook.getId());
            }

            webhook.setResponseBody(e.getMessage());
        }

        webhookEventRepository.save(webhook);
    }

    /**
     * Monitor webhook delivery metrics
     */
    @Scheduled(fixedRate = 600000) // 10 minutes
    public void monitorWebhookMetrics() {
        try {
            long pendingCount = webhookEventRepository.countPendingWebhooks();
            List<WebhookEventEntity> failedWebhooks = webhookEventRepository.findFailedWebhooks();

            log.info("Webhook metrics: pending={}, failed={}", pendingCount, failedWebhooks.size());

            if (failedWebhooks.size() > 0) {
                log.warn("There are {} failed webhooks that need attention", failedWebhooks.size());
            }
        } catch (Exception e) {
            log.error("Error monitoring webhook metrics: {}", e.getMessage());
        }
    }
}

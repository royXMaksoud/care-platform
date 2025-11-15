package com.care.notification.application.service;

import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Twilio-based SMS delivery service
 * Sends SMS notifications via Twilio API
 * Requires Twilio credentials to be configured via environment variables
 */
@Service
@Slf4j
public class TwilioSmsService {

    @Value("${twilio.phone-number:#{null}}")
    private String fromPhoneNumber;

    /**
     * Send SMS via Twilio
     *
     * @param phoneNumber Recipient phone number
     * @param messageBody Message content to send
     * @return Message SID for tracking
     */
    public String sendSms(String phoneNumber, String messageBody) {
        if (fromPhoneNumber == null) {
            log.warn("Twilio phone number not configured. SMS not sent.");
            return null;
        }

        try {
            Message message = Message.creator(
                new PhoneNumber(phoneNumber),      // To number
                new PhoneNumber(fromPhoneNumber),  // From number
                messageBody                        // Message body
            ).create();

            log.info("SMS sent successfully. Message SID: {}, To: {}",
                message.getSid(), phoneNumber);

            return message.getSid();
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("SMS delivery failed", e);
        }
    }

    /**
     * Send SMS with retry logic (exponential backoff)
     */
    public String sendSmsWithRetry(String phoneNumber, String messageBody, int maxRetries) {
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return sendSms(phoneNumber, messageBody);
            } catch (Exception e) {
                if (attempt == maxRetries) {
                    log.error("SMS delivery failed after {} attempts", maxRetries);
                    throw e;
                }
                // Exponential backoff: 2^n seconds
                long delayMs = (long) Math.pow(2, attempt - 1) * 1000;
                try {
                    Thread.sleep(delayMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Retry interrupted", ie);
                }
                log.debug("Retry attempt {} for SMS to {}", attempt + 1, phoneNumber);
            }
        }
        return null;
    }
}

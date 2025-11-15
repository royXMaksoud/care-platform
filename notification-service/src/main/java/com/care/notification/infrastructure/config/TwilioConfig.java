package com.care.notification.infrastructure.config;

import com.twilio.Twilio;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

/**
 * Twilio configuration for SMS notifications
 * Initializes Twilio SDK with account credentials
 */
@Component
@Slf4j
public class TwilioConfig {

    @Value("${twilio.account-sid:#{null}}")
    private String accountSid;

    @Value("${twilio.auth-token:#{null}}")
    private String authToken;

    @Value("${twilio.phone-number:#{null}}")
    private String phoneNumber;

    /**
     * Initialize Twilio SDK on application startup
     */
    @PostConstruct
    public void initTwilio() {
        if (accountSid != null && authToken != null) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SDK initialized successfully");
        } else {
            log.warn("Twilio credentials not configured. SMS notifications will be disabled.");
        }
    }

    public String getAccountSid() {
        return accountSid;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public boolean isConfigured() {
        return accountSid != null && authToken != null && phoneNumber != null;
    }
}

package com.portal.das.config;

import jakarta.servlet.*;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import java.io.IOException;
import java.util.UUID;

/**
 * Configuration for observability (MDC, logging, metrics)
 */
@Configuration
public class ObservabilityConfig {

    /**
     * MDC filter to add requestId, userId, tenantId to logs
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public Filter mdcFilter() {
        return new MdcFilter();
    }

    @Slf4j
    public static class MdcFilter implements Filter {

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            try {
                // Add request ID
                String requestId = UUID.randomUUID().toString().substring(0, 8);
                MDC.put("requestId", requestId);

                // Add user ID and tenant ID from security context if available
                try {
                    com.sharedlib.core.context.CurrentUser user = 
                            com.sharedlib.core.context.CurrentUserContext.get();
                    if (user != null) {
                        MDC.put("userId", user.userId().toString());
                        
                        // Try to get tenantId from claims
                        UUID tenantId = user.getUuidClaim("tenantId");
                        if (tenantId != null) {
                            MDC.put("tenantId", tenantId.toString());
                        }
                    }
                } catch (Exception e) {
                    // Ignore if user context not available
                }

                chain.doFilter(request, response);
            } finally {
                MDC.clear();
            }
        }
    }
}


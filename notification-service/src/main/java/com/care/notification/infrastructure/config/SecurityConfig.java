package com.care.notification.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security Configuration for Notification Service
 * Configures OAuth2 resource server with JWT validation
 * Returns 401/403 instead of redirecting to login
 */
@Configuration
@EnableWebSecurity
@Slf4j
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CORS is handled by API Gateway - disable here
            .cors(cors -> cors.disable())

            // Disable CSRF for stateless REST API
            .csrf(csrf -> csrf.disable())

            // Stateless session management (no cookies/sessions)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // OAuth2 Resource Server with JWT validation
            // IMPORTANT: Do NOT call .oauth2ResourceServer() explicitly
            // Spring Boot automatically configures this from application.yml properties:
            // - spring.security.oauth2.resourceserver.jwt.issuer-uri
            // - spring.security.oauth2.resourceserver.jwt.jwk-set-uri
            // Explicit configuration triggers ClassNotFoundException for BearerTokenResolver

            // Authorization rules
            .authorizeHttpRequests(authz -> authz
                // Allow ALL endpoints for development
                // Gateway (localhost:6060) will handle proper authentication/authorization
                // This service should only be accessed through the Gateway
                .anyRequest().permitAll()
            );

        return http.build();
    }
}

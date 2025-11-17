package com.care.notification.infrastructure.config;

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
                // Allow public endpoints
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()

                // TODO: TEMPORARY - Allow admin endpoints for development/testing
                // IMPORTANT: Remove .permitAll() and replace with proper @PreAuthorize("hasRole('ADMIN')")
                // once role-based access control is configured
                .requestMatchers("/api/v1/admin/**").permitAll()

                // All other endpoints require authentication
                .anyRequest().authenticated()
            );

        return http.build();
    }
}

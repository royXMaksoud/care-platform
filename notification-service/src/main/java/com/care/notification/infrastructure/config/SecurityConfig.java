package com.care.notification.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

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
            // CORS Configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

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

                // All other endpoints require authentication
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174"
        ));
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        configuration.setAllowedHeaders(Collections.singletonList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

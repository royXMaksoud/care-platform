package com.care.warehouse.config;

import com.care.warehouse.application.common.filter.TenantContextFilter;
import com.sharedlib.core.security.JwtAuthenticationFilter;
import com.sharedlib.core.security.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for warehouse service.
 * 
 * Features:
 * - JWT-based authentication using shared-lib utilities
 * - Tenant context extraction and isolation
 * - Method-level security for permission checks
 * - Stateless session management
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final TenantContextFilter tenantContextFilter;

    public SecurityConfig(JwtTokenProvider jwtTokenProvider, TenantContextFilter tenantContextFilter) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.tenantContextFilter = tenantContextFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            // Add tenant context filter (runs first, before JWT filter)
            .addFilterBefore(tenantContextFilter, UsernamePasswordAuthenticationFilter.class)
            // Add JWT authentication filter
            .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}


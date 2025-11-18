package com.care.warehouse.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

/**
 * Feign client for authentication service
 * Used for JWT validation and user information retrieval
 */
@FeignClient(
    name = "warehouse-auth-service-client",
    url = "${services.auth.base-url}",
    configuration = FeignClientConfiguration.class
)
public interface AuthServiceClient {
    
    /**
     * Validate JWT token and get user information
     */
    @GetMapping("/api/users/{userId}")
    Object getUserById(
        @PathVariable("userId") UUID userId,
        @RequestHeader("Authorization") String token
    );
}


package com.portal.das.controller;

import com.sharedlib.core.context.CurrentUser;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.web.response.ApiResponse;
import lombok.Builder;
import lombok.Data;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Test controller to verify JWT authentication and authorization
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    /**
     * Public test endpoint - should be blocked by security
     * Requires JWT authentication
     */
    @GetMapping("/auth")
    public ApiResponse<AuthInfo> testAuth() {
        CurrentUser user = CurrentUserContext.get();
        
        AuthInfo authInfo = AuthInfo.builder()
            .userId(user.userId())
            .email(user.email())
            .userType(user.userType())
            .language(user.language())
            .roles(user.roles())
            .permissions(user.permissions())
            .timestamp(LocalDateTime.now())
            .build();
        
        return new ApiResponse<>(true, authInfo, "Authentication successful");
    }

    /**
     * Protected endpoint - requires ADMIN role
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> testAdmin() {
        return ApiResponse.ok("Admin access granted - You have admin privileges");
    }

    /**
     * Protected endpoint - requires ANALYST or ADMIN role
     */
    @GetMapping("/analyst")
    @PreAuthorize("hasAnyRole('ANALYST', 'ADMIN')")
    public ApiResponse<String> testAnalyst() {
        return ApiResponse.ok("Analyst access granted - You have analyst privileges");
    }

    @Data
    @Builder
    public static class AuthInfo {
        private UUID userId;
        private String email;
        private String userType;
        private String language;
        private java.util.List<String> roles;
        private java.util.List<String> permissions;
        private LocalDateTime timestamp;
    }
}


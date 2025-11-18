package com.care.warehouse.web.controller;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.common.permissions.RequireActionPermission;
import com.sharedlib.core.context.CurrentUserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Health and test controller for warehouse service.
 * 
 * Provides endpoints for:
 * - Health checks
 * - Security and tenant context testing
 * - Permission validation examples
 */
@RestController
@RequestMapping("/api/warehouse/v1/health")
@Tag(name = "Health", description = "Health check and security test endpoints")
public class HealthController {

    /**
     * Public health check endpoint
     */
    @GetMapping
    @Operation(summary = "Public health check", description = "Returns service health status")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "warehouse-service");
        return ResponseEntity.ok(response);
    }

    /**
     * Secure test endpoint - requires authentication
     * Tests JWT authentication and CurrentUserContext
     */
    @GetMapping("/secure-test")
    @Operation(summary = "Secure test endpoint", description = "Tests JWT authentication and user context")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<Map<String, Object>> secureTest() {
        Map<String, Object> response = new HashMap<>();
        
        // Get current user from context
        var currentUser = CurrentUserContext.get();
        if (currentUser != null) {
            response.put("authenticated", true);
            response.put("userId", currentUser.userId());
            response.put("email", currentUser.email());
            response.put("userType", currentUser.userType());
            response.put("roles", currentUser.roles());
            response.put("permissions", currentUser.permissions());
        } else {
            response.put("authenticated", false);
        }
        
        // Get tenant from context
        UUID tenantId = TenantContext.get();
        response.put("tenantId", tenantId);
        response.put("hasTenant", tenantId != null);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Permission test endpoint - requires specific permission
     * Example of using @RequireActionPermission annotation
     * 
     * Note: Replace the actionId with actual UUID from access-management-service
     */
    @GetMapping("/permission-test")
    @Operation(summary = "Permission test endpoint", description = "Tests permission checking with @RequireActionPermission")
    @RequireActionPermission(
        actionId = "00000000-0000-0000-0000-000000000001", // TODO: Replace with actual action ID
        messageKey = "error.warehouse.view.forbidden"
    )
    public ResponseEntity<Map<String, Object>> permissionTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Permission check passed");
        response.put("userId", CurrentUserContext.getUserId());
        response.put("tenantId", TenantContext.get());
        return ResponseEntity.ok(response);
    }

    /**
     * Method-level security test endpoint
     * Example of using @PreAuthorize annotation
     */
    @GetMapping("/method-security-test")
    @Operation(summary = "Method security test", description = "Tests @PreAuthorize annotation")
    @PreAuthorize("hasAuthority('WAREHOUSE_VIEW')")
    public ResponseEntity<Map<String, Object>> methodSecurityTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Method-level security check passed");
        response.put("userId", CurrentUserContext.getUserId());
        response.put("tenantId", TenantContext.get());
        return ResponseEntity.ok(response);
    }
}


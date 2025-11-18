package com.care.warehouse.infrastructure.client;

import com.sharedlib.core.permissions.ActionPermissionRequest;
import com.sharedlib.core.permissions.ActionPermissionResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

/**
 * Feign client for access management service
 * Used for permission checks and organization/tenant information
 */
@FeignClient(
    name = "warehouse-access-management-client",
    url = "${services.access-management.base-url}",
    configuration = FeignClientConfiguration.class
)
public interface AccessManagementClient {
    
    /**
     * Check if user has permission for a specific action with scopes
     * TODO: Implement this endpoint in access-management-service
     */
    @PostMapping("/api/permissions/check-action")
    ActionPermissionResult checkPermission(@RequestBody ActionPermissionRequest request);
    
    /**
     * Get organization by ID
     */
    @GetMapping("/api/organizations/{id}")
    Object getOrganization(@PathVariable("id") UUID id);
    
    /**
     * Get tenant information
     */
    @GetMapping("/api/tenants/{id}")
    Object getTenant(@PathVariable("id") UUID id);
}


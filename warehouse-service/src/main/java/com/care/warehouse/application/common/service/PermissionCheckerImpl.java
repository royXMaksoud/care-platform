package com.care.warehouse.application.common.service;

import com.care.warehouse.infrastructure.client.AccessManagementClient;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.permissions.ActionPermissionRequest;
import com.sharedlib.core.permissions.ActionPermissionResult;
import com.sharedlib.core.permissions.PermissionChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Warehouse-service implementation of {@link PermissionChecker}.
 *
 * Delegates to access-management-service via {@link AccessManagementClient} and uses
 * {@link CurrentUserContext} as the primary source of the current user id.
 * 
 * TODO: Implement actual permission checking via AccessManagementClient
 * For now, this is a stub that will be implemented when AccessManagementClient
 * permission endpoints are available.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionCheckerImpl implements PermissionChecker {

    private final AccessManagementClient accessManagementClient;

    @Override
    public ActionPermissionResult checkActionWithScopes(UUID userId,
                                                        UUID systemSectionActionId,
                                                        String scopeType) {
        UUID effectiveUserId = userId != null ? userId : CurrentUserContext.getUserId();
        if (effectiveUserId == null) {
            log.warn("Permission check requested without authenticated user in context");
            return ActionPermissionResult.builder()
                    .actionAllowed(false)
                    .systemSectionActionId(systemSectionActionId)
                    .scopeType(scopeType)
                    .build();
        }

        // TODO: Implement actual permission check via AccessManagementClient
        // For now, return a stub that allows all actions (development mode)
        // In production, this should call accessManagementClient.checkPermission(request)
        
        log.debug("Permission check for user {} and action {} - STUB: allowing all", 
                effectiveUserId, systemSectionActionId);
        
        // Stub implementation - allows all permissions for now
        // Replace with actual implementation:
        /*
        ActionPermissionRequest request = ActionPermissionRequest.builder()
                .userId(effectiveUserId)
                .systemSectionActionId(systemSectionActionId)
                .scopeType(scopeType)
                .build();

        try {
            return accessManagementClient.checkPermission(request);
        } catch (Exception ex) {
            log.error("Failed to fetch permissions from access-management-service for user {} and action {}: {}",
                    effectiveUserId, systemSectionActionId, ex.getMessage());
            // Fail closed: no permission when access-management-service is unavailable
            return ActionPermissionResult.builder()
                    .actionAllowed(false)
                    .systemSectionActionId(systemSectionActionId)
                    .scopeType(scopeType)
                    .build();
        }
        */
        
        // Temporary stub - allows all
        return ActionPermissionResult.builder()
                .actionAllowed(true)
                .systemSectionActionId(systemSectionActionId)
                .scopeType(scopeType)
                .build();
    }
}


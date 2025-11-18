package com.care.warehouse.application.common.permissions;

import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.ForbiddenException;
import com.sharedlib.core.exception.UnauthorizedException;
import com.sharedlib.core.permissions.ActionPermissionResult;
import com.sharedlib.core.permissions.PermissionChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

/**
 * Aspect that enforces {@link RequireActionPermission} before controller/service methods execute.
 * 
 * Features:
 * - Permission checking with scope validation
 * - Auditing of all permission checks for security monitoring
 * - Proper exception handling with localized error messages
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ActionPermissionAspect {

    private final PermissionChecker permissionChecker;

    @Around("@annotation(requireActionPermission)")
    public Object enforcePermission(ProceedingJoinPoint pjp, RequireActionPermission requireActionPermission) throws Throwable {
        Instant startTime = Instant.now();
        UUID currentUserId = CurrentUserContext.getUserId();
        UUID actionId = UUID.fromString(requireActionPermission.actionId());
        String scopeType = requireActionPermission.scopeType();
        String scopeField = requireActionPermission.scopeField();
        String methodName = pjp.getSignature().toShortString();

        // Audit: Permission check initiated
        auditPermissionCheckInitiated(currentUserId, actionId, scopeType, methodName);

        if (currentUserId == null) {
            auditPermissionCheckDenied(null, actionId, scopeType, methodName, "NO_USER", startTime);
            throw new UnauthorizedException("error.unauthorized");
        }

        UUID scopeId = null;
        if (scopeField != null && !scopeField.isBlank()) {
            scopeId = extractScopeId(pjp, scopeField);
        }

        ActionPermissionResult result = permissionChecker.checkActionWithScopes(
                currentUserId,
                actionId,
                scopeType
        );

        var scopes = result.getAllowedScopeValueIds();
        boolean hasAction = result.isActionAllowed();
        boolean hasScopes = scopes != null && !scopes.isEmpty();

        if (!hasAction && !hasScopes) {
            auditPermissionCheckDenied(currentUserId, actionId, scopeType, methodName, "NO_PERMISSION", startTime);
            String key = requireActionPermission.messageKey();
            throw new ForbiddenException(key != null && !key.isBlank()
                    ? key
                    : "error.warehouse.modify.forbidden");
        }

        if (scopeId != null && hasScopes && !scopes.contains(scopeId)) {
            auditPermissionCheckDenied(currentUserId, actionId, scopeType, methodName, "SCOPE_MISMATCH", startTime);
            String key = requireActionPermission.scopeMessageKey();
            if (key == null || key.isBlank()) {
                key = "error.warehouse.scope.modify.forbidden";
            }
            throw new ForbiddenException(key);
        }

        // Audit: Permission check successful
        auditPermissionCheckAllowed(currentUserId, actionId, scopeType, methodName, hasScopes, startTime);

        return pjp.proceed();
    }

    /**
     * Audits the initiation of a permission check.
     */
    private void auditPermissionCheckInitiated(UUID userId, UUID actionId, String scopeType, String methodName) {
        if (log.isDebugEnabled()) {
            log.debug("PERMISSION_CHECK_INITIATED | userId={} | actionId={} | scopeType={} | method={}",
                    userId, actionId, scopeType, methodName);
        }
    }

    /**
     * Audits a successful permission check.
     */
    private void auditPermissionCheckAllowed(UUID userId, UUID actionId, String scopeType,
                                            String methodName, boolean scoped, Instant startTime) {
        long durationMs = java.time.Duration.between(startTime, Instant.now()).toMillis();
        log.info("PERMISSION_CHECK_ALLOWED | userId={} | actionId={} | scopeType={} | method={} | scoped={} | durationMs={}",
                userId, actionId, scopeType, methodName, scoped, durationMs);
    }

    /**
     * Audits a denied permission check with reason.
     */
    private void auditPermissionCheckDenied(UUID userId, UUID actionId, String scopeType,
                                           String methodName, String reason, Instant startTime) {
        long durationMs = java.time.Duration.between(startTime, Instant.now()).toMillis();
        log.warn("PERMISSION_CHECK_DENIED | userId={} | actionId={} | scopeType={} | method={} | reason={} | durationMs={}",
                userId, actionId, scopeType, methodName, reason, durationMs);
    }

    /**
     * Tries to extract a UUID scope id from method arguments by looking for a getter
     * with the provided field name (e.g. "warehouseId" -> getWarehouseId()).
     */
    private UUID extractScopeId(ProceedingJoinPoint pjp, String fieldName) {
        Object[] args = pjp.getArgs();
        if (args == null || args.length == 0) {
            return null;
        }

        String getterName = "get" + capitalize(fieldName);

        for (Object arg : args) {
            if (arg == null) continue;
            try {
                Method m = arg.getClass().getMethod(getterName);
                Object value = m.invoke(arg);
                if (value instanceof UUID uuid) {
                    return uuid;
                }
            } catch (NoSuchMethodException ignored) {
                // This argument does not have the getter, try next one
            } catch (IllegalAccessException | InvocationTargetException ex) {
                log.warn("Failed to extract scopeId via {} on {}: {}", getterName, arg.getClass().getSimpleName(), ex.getMessage());
            }
        }

        return null;
    }

    private String capitalize(String name) {
        if (name == null || name.isBlank()) return name;
        if (name.length() == 1) {
            return name.toUpperCase(Locale.ROOT);
        }
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }
}


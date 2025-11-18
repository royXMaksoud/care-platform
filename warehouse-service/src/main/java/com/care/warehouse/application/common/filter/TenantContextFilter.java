package com.care.warehouse.application.common.filter;

import com.care.warehouse.application.common.context.TenantContext;
import com.sharedlib.core.context.CurrentUser;
import com.sharedlib.core.context.CurrentUserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter that extracts tenant ID from JWT token or request headers
 * and stores it in TenantContext for use throughout the request lifecycle.
 * 
 * Priority order:
 * 1. JWT token claim "tenantId"
 * 2. Request header "x-tenant-id"
 * 
 * The tenant context is automatically cleared after request completion.
 */
@Component
@Order(1) // Execute early in the filter chain
@Slf4j
public class TenantContextFilter extends OncePerRequestFilter {

    private static final String TENANT_ID_HEADER = "x-tenant-id";
    private static final String TENANT_ID_CLAIM = "tenantId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            UUID tenantId = extractTenantId(request);
            
            if (tenantId != null) {
                TenantContext.set(tenantId);
                log.debug("Tenant ID {} extracted and set in context", tenantId);
            } else {
                log.debug("No tenant ID found in request");
            }
            
            filterChain.doFilter(request, response);
        } finally {
            // Always clear ThreadLocal to prevent memory leaks
            TenantContext.clear();
        }
    }

    /**
     * Extracts tenant ID from request.
     * Priority: JWT token claim > Request header
     */
    private UUID extractTenantId(HttpServletRequest request) {
        // First, try to get from CurrentUserContext (JWT token claims)
        CurrentUser currentUser = CurrentUserContext.get();
        if (currentUser != null) {
            UUID tenantIdFromJwt = currentUser.getUuidClaim(TENANT_ID_CLAIM);
            if (tenantIdFromJwt != null) {
                log.debug("Tenant ID extracted from JWT token: {}", tenantIdFromJwt);
                return tenantIdFromJwt;
            }
        }

        // Fallback to request header
        String tenantIdHeader = request.getHeader(TENANT_ID_HEADER);
        if (StringUtils.hasText(tenantIdHeader)) {
            try {
                UUID tenantId = UUID.fromString(tenantIdHeader.trim());
                log.debug("Tenant ID extracted from header: {}", tenantId);
                return tenantId;
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID format in header '{}': {}", TENANT_ID_HEADER, tenantIdHeader);
            }
        }

        return null;
    }
}


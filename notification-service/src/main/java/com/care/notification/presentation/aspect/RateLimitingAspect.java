package com.care.notification.presentation.aspect;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/**
 * Rate limiting aspect using Resilience4j
 * Limits notification API endpoints to prevent abuse
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class RateLimitingAspect {
    
    private final RateLimiterRegistry rateLimiterRegistry;
    
    @Around("execution(* com.care.notification.presentation.controller.NotificationController.*(..))")
    public Object applyRateLimit(ProceedingJoinPoint joinPoint) throws Throwable {
        RateLimiter rateLimiter = rateLimiterRegistry.rateLimiter("notificationServiceLimiter");
        
        if (rateLimiter.acquirePermission()) {
            log.debug("Request allowed");
            return joinPoint.proceed();
        } else {
            log.warn("Rate limit exceeded");
            return new ResponseEntity<>("Too many requests - Rate limit: 100/sec", HttpStatus.TOO_MANY_REQUESTS);
        }
    }
}

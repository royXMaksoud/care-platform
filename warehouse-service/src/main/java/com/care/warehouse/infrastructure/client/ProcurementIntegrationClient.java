package com.care.warehouse.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;
import java.util.UUID;

/**
 * Feign client for procurement service integration.
 * 
 * This client is used to send replenishment orders to the procurement system.
 */
@FeignClient(name = "procurement-service", url = "${procurement.service.url:http://localhost:8080}")
public interface ProcurementIntegrationClient {
    
    /**
     * Create a purchase request from a replenishment order.
     * 
     * @param purchaseRequest Purchase request data
     * @return Created purchase request ID
     */
    @PostMapping("/api/procurement/v1/purchase-requests")
    UUID createPurchaseRequest(@RequestBody Map<String, Object> purchaseRequest);
}


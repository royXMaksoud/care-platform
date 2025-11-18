package com.care.warehouse.infrastructure.iot;

import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.ports.iot.IoTEventGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * No-operation implementation of IoTEventGateway.
 * 
 * This is a stub implementation that simply logs IoT events without actually
 * sending them to any IoT platform. This allows the business logic to be
 * written without external dependencies.
 * 
 * When ready to integrate with a real IoT platform, replace this with a
 * concrete implementation (e.g., AwsIoTEventGateway, MqttIoTEventGateway).
 * 
 * Usage:
 * - Replace this bean with a real implementation when IoT integration is needed
 * - No changes to business logic are required
 */
@Component
@Slf4j
public class NoOpIoTEventGateway implements IoTEventGateway {

    @Override
    public void notifyWarehouseCreated(Warehouse warehouse, Map<String, Object> metadata) {
        log.info("IoT_EVENT | type=WAREHOUSE_CREATED | warehouseId={} | tenantId={} | code={} | metadata={}",
                warehouse.getId(), warehouse.getTenantId(), warehouse.getCode(), metadata);
        // No-op: Real implementation would send event to IoT platform
        // Example: iotClient.publish("warehouse/created", eventPayload);
    }

    @Override
    public void notifyWarehouseUpdated(Warehouse warehouse, Map<String, Object> metadata) {
        log.info("IoT_EVENT | type=WAREHOUSE_UPDATED | warehouseId={} | tenantId={} | code={} | metadata={}",
                warehouse.getId(), warehouse.getTenantId(), warehouse.getCode(), metadata);
        // No-op: Real implementation would send event to IoT platform
        // Example: iotClient.publish("warehouse/updated", eventPayload);
    }

    @Override
    public void notifyWarehouseDeleted(UUID warehouseId, UUID tenantId, Map<String, Object> metadata) {
        log.info("IoT_EVENT | type=WAREHOUSE_DELETED | warehouseId={} | tenantId={} | metadata={}",
                warehouseId, tenantId, metadata);
        // No-op: Real implementation would send event to IoT platform
        // Example: iotClient.publish("warehouse/deleted", eventPayload);
    }

    @Override
    public void sendCustomEvent(String eventType, Warehouse warehouse, Map<String, Object> payload, Map<String, Object> metadata) {
        log.info("IoT_EVENT | type={} | warehouseId={} | tenantId={} | payload={} | metadata={}",
                eventType, warehouse != null ? warehouse.getId() : null,
                warehouse != null ? warehouse.getTenantId() : null, payload, metadata);
        // No-op: Real implementation would send custom event to IoT platform
        // Example: iotClient.publish("warehouse/custom/" + eventType, payload);
    }
}


package com.care.warehouse.domain.ports.iot;

import com.care.warehouse.domain.model.Warehouse;

import java.util.Map;

/**
 * Port interface for IoT event gateway.
 * 
 * This interface defines the contract for sending IoT events when warehouse
 * operations occur. Implementations can send events to edge devices, IoT platforms,
 * or message queues.
 * 
 * Future implementations might integrate with:
 * - AWS IoT Core
 * - Azure IoT Hub
 * - Google Cloud IoT Core
 * - MQTT brokers
 * - Kafka
 * - RabbitMQ
 * 
 * @param <T> Event payload type (can be Warehouse or custom event DTO)
 */
public interface IoTEventGateway {

    /**
     * Notify IoT devices/platforms that a warehouse was created.
     * 
     * @param warehouse The created warehouse
     * @param metadata Optional metadata for the event (e.g., device IDs, configuration)
     */
    void notifyWarehouseCreated(Warehouse warehouse, Map<String, Object> metadata);

    /**
     * Notify IoT devices/platforms that a warehouse was updated.
     * 
     * @param warehouse The updated warehouse
     * @param metadata Optional metadata for the event (e.g., device IDs, configuration)
     */
    void notifyWarehouseUpdated(Warehouse warehouse, Map<String, Object> metadata);

    /**
     * Notify IoT devices/platforms that a warehouse was deleted.
     * 
     * @param warehouseId The ID of the deleted warehouse
     * @param tenantId The tenant ID
     * @param metadata Optional metadata for the event
     */
    void notifyWarehouseDeleted(java.util.UUID warehouseId, java.util.UUID tenantId, Map<String, Object> metadata);

    /**
     * Send a custom IoT event.
     * 
     * @param eventType The type of event (e.g., "WAREHOUSE_STATUS_CHANGED", "INVENTORY_ALERT")
     * @param warehouse The warehouse related to the event
     * @param payload Custom event payload
     * @param metadata Optional metadata
     */
    void sendCustomEvent(String eventType, Warehouse warehouse, Map<String, Object> payload, Map<String, Object> metadata);
}


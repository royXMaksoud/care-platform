package com.care.warehouse.domain.ports.traceability;

import com.care.warehouse.domain.model.Warehouse;

import java.util.Map;
import java.util.UUID;

/**
 * Port interface for blockchain traceability ledger.
 * 
 * This interface defines the contract for recording warehouse operations
 * on a blockchain ledger for immutable audit trail and traceability.
 * 
 * Future implementations might integrate with:
 * - Hyperledger Fabric
 * - Ethereum
 * - Hyperledger Sawtooth
 * - Custom blockchain solutions
 * - Distributed ledger technologies (DLT)
 * 
 * All operations are recorded as immutable transactions on the ledger.
 */
public interface TraceabilityLedgerPort {

    /**
     * Record a warehouse creation event on the blockchain ledger.
     * 
     * @param warehouse The created warehouse
     * @param transactionMetadata Optional metadata for the transaction (e.g., user ID, timestamp, IP address)
     * @return Transaction hash or ID if available, null otherwise
     */
    String recordWarehouseCreated(Warehouse warehouse, Map<String, Object> transactionMetadata);

    /**
     * Record a warehouse update event on the blockchain ledger.
     * 
     * @param warehouse The updated warehouse
     * @param previousState Optional previous state for comparison
     * @param transactionMetadata Optional metadata for the transaction
     * @return Transaction hash or ID if available, null otherwise
     */
    String recordWarehouseUpdated(Warehouse warehouse, Warehouse previousState, Map<String, Object> transactionMetadata);

    /**
     * Record a warehouse deletion event on the blockchain ledger.
     * 
     * @param warehouseId The ID of the deleted warehouse
     * @param tenantId The tenant ID
     * @param warehouseState Final state before deletion
     * @param transactionMetadata Optional metadata for the transaction
     * @return Transaction hash or ID if available, null otherwise
     */
    String recordWarehouseDeleted(UUID warehouseId, UUID tenantId, Warehouse warehouseState, Map<String, Object> transactionMetadata);

    /**
     * Record a custom traceability event on the blockchain ledger.
     * 
     * @param eventType The type of event (e.g., "WAREHOUSE_STATUS_CHANGED", "LOCATION_UPDATED")
     * @param warehouse The warehouse related to the event
     * @param eventData Custom event data
     * @param transactionMetadata Optional metadata for the transaction
     * @return Transaction hash or ID if available, null otherwise
     */
    String recordCustomEvent(String eventType, Warehouse warehouse, Map<String, Object> eventData, Map<String, Object> transactionMetadata);

    /**
     * Verify the integrity of a recorded transaction.
     * 
     * @param transactionHash The transaction hash to verify
     * @return true if transaction is valid and exists, false otherwise
     */
    boolean verifyTransaction(String transactionHash);

    /**
     * Retrieve transaction details from the ledger.
     * 
     * @param transactionHash The transaction hash
     * @return Transaction details or null if not found
     */
    Map<String, Object> getTransactionDetails(String transactionHash);
}


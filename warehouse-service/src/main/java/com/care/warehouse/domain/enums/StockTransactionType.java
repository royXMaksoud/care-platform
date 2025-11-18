package com.care.warehouse.domain.enums;

/**
 * Enumeration for stock transaction types.
 * 
 * Defines the four main categories of stock movements:
 * - IN: Stock increase (purchase, donation, return, production)
 * - OUT: Stock decrease (consumption, sale, disposal, lending)
 * - TRANSFER: Stock movement between warehouses
 * - ADJUSTMENT: Inventory correction (increase or decrease)
 * 
 * @author CARE Team
 */
public enum StockTransactionType {
    
    /**
     * Stock-IN: Increase stock quantity.
     * 
     * Examples:
     * - Purchase from supplier
     * - Donation received
     * - Return from customer
     * - Production output
     * 
     * Requires: target_warehouse_id (where stock is added)
     */
    IN,
    
    /**
     * Stock-OUT: Decrease stock quantity.
     * 
     * Examples:
     * - Sale to customer
     * - Internal consumption
     * - Disposal/waste
     * - Lending to another entity
     * 
     * Requires: source_warehouse_id (where stock is removed from)
     * Validation: Must ensure sufficient stock available before OUT
     */
    OUT,
    
    /**
     * Stock-Transfer: Move stock from one warehouse to another.
     * 
     * This is an atomic operation that:
     * - Decrements source warehouse stock
     * - Increments target warehouse stock
     * 
     * Requires: Both source_warehouse_id and target_warehouse_id
     * Validation: Must ensure sufficient stock in source warehouse
     */
    TRANSFER,
    
    /**
     * Stock-Adjustment: Inventory correction.
     * 
     * Used for:
     * - Physical inventory count corrections
     * - Damage adjustments
     * - Loss adjustments
     * - Found stock
     * 
     * Can be:
     * - Increase: target_warehouse_id only (positive adjustment)
     * - Decrease: source_warehouse_id only (negative adjustment)
     * 
     * Note: Adjustments may bypass normal validation (e.g., can adjust below zero
     * if correcting a data error, but this should be logged and approved)
     */
    ADJUSTMENT
}


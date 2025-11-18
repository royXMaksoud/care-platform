package com.care.warehouse.domain.ports.in.stock;

import com.care.warehouse.application.stock.command.CreateStockTransactionCommand;
import com.care.warehouse.domain.model.StockTransaction;

/**
 * Use case interface for creating a stock transaction.
 * 
 * This use case handles all stock movement types:
 * - Stock-IN (purchase, donation, return, production)
 * - Stock-OUT (consumption, sale, disposal, lending)
 * - Stock-Transfer (warehouse to warehouse)
 * - Stock-Adjustment (inventory correction)
 * 
 * The use case:
 * 1. Validates the transaction request
 * 2. Creates the transaction record
 * 3. Atomically updates stock balances
 * 4. Publishes events (StockUpdated, StockBelowThreshold)
 * 
 * All operations are transactional - if any step fails, everything rolls back.
 * 
 * @author CARE Team
 */
public interface CreateStockTransactionUseCase {
    
    /**
     * Create a stock transaction and update balances.
     * 
     * This method:
     * - Validates transaction data (material exists, warehouses exist, quantity > 0)
     * - For OUT/TRANSFER: Validates sufficient stock available
     * - Creates transaction record in stock_transaction table
     * - Atomically updates stock_balance table(s)
     * - Publishes events for downstream systems
     * 
     * @param command Create stock transaction command
     * @return Created stock transaction
     * @throws com.sharedlib.core.exception.ValidationException if validation fails
     * @throws com.sharedlib.core.exception.NotFoundException if material/warehouse not found
     */
    StockTransaction createStockTransaction(CreateStockTransactionCommand command);
}


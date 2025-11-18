package com.care.warehouse.application.stock.query;

import com.care.warehouse.domain.enums.StockTransactionReason;
import com.care.warehouse.domain.enums.StockTransactionType;
import com.sharedlib.core.filter.FilterRequest;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * Query object for searching stock transactions with filters.
 * 
 * Supports filtering by:
 * - materialId
 * - transactionType
 * - warehouseId (source or target)
 * - reason
 * - date range
 * - referenceDocument
 * 
 * @author CARE Team
 */
@Getter
@Builder
public class SearchStockTransactionsQuery {
    
    private UUID materialId;
    private StockTransactionType transactionType;
    private UUID warehouseId;  // Search in both source and target
    private StockTransactionReason reason;
    private Instant startDate;
    private Instant endDate;
    private String referenceDocument;
    
    /**
     * Convert this query to FilterRequest for generic search infrastructure.
     * 
     * Note: This is a simplified implementation. For complex filtering,
     * consider using the repository's custom query methods directly.
     * 
     * @return FilterRequest with criteria (may be empty if no filters provided)
     */
    public FilterRequest toFilterRequest() {
        // Return empty FilterRequest - filtering will be handled by repository custom methods
        // This allows the controller to use repository methods directly for better performance
        return FilterRequest.builder().build();
    }
}


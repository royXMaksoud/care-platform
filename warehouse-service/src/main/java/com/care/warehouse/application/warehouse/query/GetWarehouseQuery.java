package com.care.warehouse.application.warehouse.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Query object used to retrieve a Warehouse by its unique identifier.
 * This belongs to the application layer (Query side) in Clean Architecture.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetWarehouseQuery {
    
    private UUID id;
}


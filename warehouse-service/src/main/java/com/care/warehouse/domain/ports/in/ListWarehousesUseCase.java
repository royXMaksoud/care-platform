package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.warehouse.query.ListWarehousesQuery;
import com.care.warehouse.domain.model.Warehouse;
import com.sharedlib.core.domain.ports.in.SearchUseCase;
import com.sharedlib.core.filter.FilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Use case interface for listing warehouses with filters.
 */
public interface ListWarehousesUseCase extends SearchUseCase<FilterRequest, Warehouse> {
    
    /**
     * List warehouses with filters and pagination.
     * 
     * @param query List warehouses query with filters
     * @param pageable Pagination information
     * @return Page of warehouses
     */
    default Page<Warehouse> listWarehouses(ListWarehousesQuery query, Pageable pageable) {
        // Convert query to FilterRequest if needed, or use query directly
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }
}


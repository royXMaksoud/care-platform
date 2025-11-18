package com.care.warehouse.application.warehouse.query;

import com.care.warehouse.domain.enums.WarehouseType;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.SearchCriteria;
import com.sharedlib.core.filter.SearchOperation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Query object used to list warehouses with filters.
 * This belongs to the application layer (Query side) in Clean Architecture.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListWarehousesQuery {
    
    private WarehouseType warehouseType;
    private String city;
    private Boolean isActive;
    private UUID countryId;
    private UUID locationId;
    private UUID parentWarehouseId;
    
    /**
     * Convert this query to FilterRequest for use with SearchPort.
     */
    public FilterRequest toFilterRequest() {
        List<SearchCriteria> criteria = new ArrayList<>();
        
        // Add criteria based on query fields
        if (warehouseType != null) {
            criteria.add(SearchCriteria.builder()
                    .key("warehouseType")
                    .operation(SearchOperation.EQUAL)
                    .value(warehouseType.name())
                    .build());
        }
        if (city != null && !city.isBlank()) {
            criteria.add(SearchCriteria.builder()
                    .key("city")
                    .operation(SearchOperation.LIKE)
                    .value("%" + city + "%")
                    .build());
        }
        if (isActive != null) {
            criteria.add(SearchCriteria.builder()
                    .key("isActive")
                    .operation(SearchOperation.EQUAL)
                    .value(isActive.toString())
                    .build());
        }
        if (countryId != null) {
            criteria.add(SearchCriteria.builder()
                    .key("countryId")
                    .operation(SearchOperation.EQUAL)
                    .value(countryId.toString())
                    .build());
        }
        if (locationId != null) {
            criteria.add(SearchCriteria.builder()
                    .key("locationId")
                    .operation(SearchOperation.EQUAL)
                    .value(locationId.toString())
                    .build());
        }
        if (parentWarehouseId != null) {
            criteria.add(SearchCriteria.builder()
                    .key("parentWarehouseId")
                    .operation(SearchOperation.EQUAL)
                    .value(parentWarehouseId.toString())
                    .build());
        }
        
        return FilterRequest.builder()
                .criteria(criteria)
                .build();
    }
}


package com.care.warehouse.application.customfielddefinition.query;

import com.care.warehouse.domain.enums.EntityType;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.filter.SearchCriteria;
import com.sharedlib.core.filter.SearchOperation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Query object used to get all custom field definitions with filters.
 * This belongs to the application layer (Query side) in Clean Architecture.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetAllCustomFieldDefinitionsQuery {
    
    private EntityType entityType;
    private Boolean isGlobal;
    private Boolean isActive;
    
    /**
     * Convert this query to FilterRequest for use with SearchPort.
     */
    public FilterRequest toFilterRequest() {
        List<SearchCriteria> criteria = new ArrayList<>();
        
        // Add criteria based on query fields
        if (entityType != null) {
            criteria.add(SearchCriteria.builder()
                    .key("entityType")
                    .operation(SearchOperation.EQUAL)
                    .value(entityType.name())
                    .build());
        }
        if (isGlobal != null) {
            criteria.add(SearchCriteria.builder()
                    .key("isGlobal")
                    .operation(SearchOperation.EQUAL)
                    .value(isGlobal.toString())
                    .build());
        }
        if (isActive != null) {
            criteria.add(SearchCriteria.builder()
                    .key("isActive")
                    .operation(SearchOperation.EQUAL)
                    .value(isActive.toString())
                    .build());
        }
        
        return FilterRequest.builder()
                .criteria(criteria)
                .build();
    }
}


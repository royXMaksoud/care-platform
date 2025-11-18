package com.care.warehouse.application.brand.query;

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
 * Query object used to search brands with filters.
 * This belongs to the application layer (Query side) in Clean Architecture.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchBrandsQuery {
    
    private String nameSearch; // Search in name translations (any language)
    private String countryOrigin;
    private Boolean isActive;
    
    /**
     * Convert this query to FilterRequest for use with SearchPort.
     */
    public FilterRequest toFilterRequest() {
        List<SearchCriteria> criteria = new ArrayList<>();
        
        // Add criteria based on query fields
        if (countryOrigin != null && !countryOrigin.isBlank()) {
            criteria.add(SearchCriteria.builder()
                    .key("countryOrigin")
                    .operation(SearchOperation.EQUAL)
                    .value(countryOrigin)
                    .build());
        }
        if (isActive != null) {
            criteria.add(SearchCriteria.builder()
                    .key("isActive")
                    .operation(SearchOperation.EQUAL)
                    .value(isActive.toString())
                    .build());
        }
        
        // Note: nameSearch requires custom repository method
        // as it searches within JSONB field
        
        return FilterRequest.builder()
                .criteria(criteria)
                .build();
    }
}


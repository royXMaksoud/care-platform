package com.care.warehouse.application.material.query;

import com.care.warehouse.domain.enums.MaterialStatus;
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
 * Query object used to search materials with filters.
 * This belongs to the application layer (Query side) in Clean Architecture.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchMaterialsQuery {
    
    private String code;
    private UUID categoryId;
    private UUID brandId;
    private MaterialStatus status;
    private Boolean isTrackable;
    private Boolean isActive;
    private String determinerValue; // Search by barcode, serial number, etc.
    private String nameSearch; // Search in name translations (any language)
    
    /**
     * Convert this query to FilterRequest for use with SearchPort.
     */
    public FilterRequest toFilterRequest() {
        List<SearchCriteria> criteria = new ArrayList<>();
        
        // Add criteria based on query fields
        if (code != null && !code.isBlank()) {
            criteria.add(SearchCriteria.builder()
                    .key("code")
                    .operation(SearchOperation.LIKE)
                    .value("%" + code + "%")
                    .build());
        }
        if (categoryId != null) {
            criteria.add(SearchCriteria.builder()
                    .key("categoryId")
                    .operation(SearchOperation.EQUAL)
                    .value(categoryId.toString())
                    .build());
        }
        if (brandId != null) {
            criteria.add(SearchCriteria.builder()
                    .key("brandId")
                    .operation(SearchOperation.EQUAL)
                    .value(brandId.toString())
                    .build());
        }
        if (status != null) {
            criteria.add(SearchCriteria.builder()
                    .key("status")
                    .operation(SearchOperation.EQUAL)
                    .value(status.name())
                    .build());
        }
        if (isTrackable != null) {
            criteria.add(SearchCriteria.builder()
                    .key("isTrackable")
                    .operation(SearchOperation.EQUAL)
                    .value(isTrackable.toString())
                    .build());
        }
        if (isActive != null) {
            criteria.add(SearchCriteria.builder()
                    .key("isActive")
                    .operation(SearchOperation.EQUAL)
                    .value(isActive.toString())
                    .build());
        }
        
        // Note: determinerValue and nameSearch require custom repository methods
        // as they search within JSONB fields
        
        return FilterRequest.builder()
                .criteria(criteria)
                .build();
    }
}


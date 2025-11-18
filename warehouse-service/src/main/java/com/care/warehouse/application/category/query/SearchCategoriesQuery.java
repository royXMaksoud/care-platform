package com.care.warehouse.application.category.query;

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
 * Query object used to search categories with filters.
 * 
 * This query supports filtering by:
 * - parentId: Get all children of a specific category
 * - level: Get categories at a specific depth in the tree
 * - nameSearch: Search in nameTranslations JSONB field
 * - isActive: Filter by active status
 * 
 * This belongs to the application layer (Query side) in Clean Architecture.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchCategoriesQuery {
    
    /**
     * Filter by parent category ID.
     * If provided, returns only direct children of this parent.
     * If null, returns all categories (subject to other filters).
     */
    private UUID parentId;
    
    /**
     * Filter by tree level (depth).
     * 0 = root categories, 1 = first level children, etc.
     * If null, no level filtering is applied.
     */
    private Integer level;
    
    /**
     * Search term to find in nameTranslations JSONB field.
     * Searches across all language translations.
     * If null or empty, no name filtering is applied.
     */
    private String nameSearch;
    
    /**
     * Filter by active status.
     * If null, both active and inactive categories are returned.
     */
    private Boolean isActive;
    
    /**
     * Convert this query to FilterRequest for use with SearchPort.
     * 
     * The FilterRequest is used by the generic search infrastructure
     * to build JPA Specifications for dynamic querying.
     * 
     * @return FilterRequest with criteria matching this query's filters
     */
    public FilterRequest toFilterRequest() {
        List<SearchCriteria> criteria = new ArrayList<>();
        
        // Add criteria based on query fields
        if (parentId != null) {
            criteria.add(SearchCriteria.builder()
                    .key("parentId")
                    .operation(SearchOperation.EQUAL)
                    .value(parentId.toString())
                    .build());
        }
        
        if (level != null) {
            criteria.add(SearchCriteria.builder()
                    .key("level")
                    .operation(SearchOperation.EQUAL)
                    .value(level.toString())
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
        // as it searches within JSONB field (nameTranslations)
        // This will be handled separately in the repository adapter
        
        return FilterRequest.builder()
                .criteria(criteria)
                .build();
    }
}


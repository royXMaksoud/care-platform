package com.care.warehouse.domain.ports.in.customfielddefinition;

import com.care.warehouse.application.customfielddefinition.query.GetAllCustomFieldDefinitionsQuery;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.sharedlib.core.domain.ports.in.SearchUseCase;
import com.sharedlib.core.filter.FilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Use case interface for loading all custom field definitions with filters.
 */
public interface LoadAllUseCase extends SearchUseCase<FilterRequest, CustomFieldDefinition> {
    
    /**
     * Get all custom field definitions with filters and pagination.
     * 
     * @param query Query with filters
     * @param pageable Pagination information
     * @return Page of custom field definitions
     */
    default Page<CustomFieldDefinition> getAll(GetAllCustomFieldDefinitionsQuery query, Pageable pageable) {
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }
}


package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.material.query.SearchMaterialsQuery;
import com.care.warehouse.domain.model.Material;
import com.sharedlib.core.domain.ports.in.SearchUseCase;
import com.sharedlib.core.filter.FilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Use case interface for searching materials with filters.
 */
public interface SearchMaterialsUseCase extends SearchUseCase<FilterRequest, Material> {
    
    /**
     * Search materials with filters and pagination.
     * 
     * @param query Search materials query with filters
     * @param pageable Pagination information
     * @return Page of materials
     */
    default Page<Material> searchMaterials(SearchMaterialsQuery query, Pageable pageable) {
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }
}


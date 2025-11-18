package com.care.warehouse.domain.ports.in;

import com.care.warehouse.application.brand.query.SearchBrandsQuery;
import com.care.warehouse.domain.model.Brand;
import com.sharedlib.core.domain.ports.in.SearchUseCase;
import com.sharedlib.core.filter.FilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Use case interface for searching brands with filters.
 */
public interface SearchBrandsUseCase extends SearchUseCase<FilterRequest, Brand> {
    
    /**
     * Search brands with filters and pagination.
     * 
     * @param query Search brands query with filters
     * @param pageable Pagination information
     * @return Page of brands
     */
    default Page<Brand> searchBrands(SearchBrandsQuery query, Pageable pageable) {
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }
}


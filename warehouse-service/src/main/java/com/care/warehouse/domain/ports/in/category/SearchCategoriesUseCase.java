package com.care.warehouse.domain.ports.in.category;

import com.care.warehouse.application.category.query.SearchCategoriesQuery;
import com.care.warehouse.domain.model.Category;
import com.sharedlib.core.domain.ports.in.SearchUseCase;
import com.sharedlib.core.filter.FilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Use case interface for searching categories with filters and pagination.
 * 
 * This use case supports:
 * - Filtering by parentId (to get children of a specific category)
 * - Filtering by level (to get categories at a specific depth)
 * - Filtering by name (searches in nameTranslations JSONB)
 * - Filtering by isActive status
 * - Pagination support
 */
public interface SearchCategoriesUseCase extends SearchUseCase<FilterRequest, Category> {
    
    /**
     * Search categories with filters and pagination.
     * 
     * @param query Search categories query with filters
     * @param pageable Pagination information (page number, size, sorting)
     * @return Page of categories matching the filters
     */
    default Page<Category> searchCategories(SearchCategoriesQuery query, Pageable pageable) {
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        return search(filterRequest, pageable);
    }
}


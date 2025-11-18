package com.care.warehouse.domain.ports.in;

import com.care.warehouse.web.dto.category.CategoryTreeNode;

import java.util.List;

/**
 * Use case interface for listing categories as a tree structure.
 */
public interface ListCategoriesAsTreeUseCase {
    
    /**
     * Get all categories for the current tenant as a tree structure.
     * 
     * @return List of root category nodes (each with its children recursively)
     */
    List<CategoryTreeNode> listCategoriesAsTree();
}


package com.care.warehouse.web.dto.category;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO representing a category node in a tree structure.
 * Used for tree listing endpoints.
 */
@Getter
@Setter
@Builder
public class CategoryTreeNode {
    
    private UUID id;
    
    /**
     * Multilingual category names.
     */
    private Map<String, String> nameTranslations;
    
    /**
     * Resolved display name based on current user language.
     */
    private String displayName;
    
    private UUID parentId;
    private Integer level;
    private String path;
    private Boolean isActive;
    
    /**
     * List of child categories (recursive tree structure).
     */
    private List<CategoryTreeNode> children;
}


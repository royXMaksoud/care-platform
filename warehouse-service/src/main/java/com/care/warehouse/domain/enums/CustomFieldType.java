package com.care.warehouse.domain.enums;

/**
 * Enumeration for custom field types.
 * Defines the data type and input method for custom fields.
 */
public enum CustomFieldType {
    /**
     * Text input field
     */
    TEXT,
    
    /**
     * Numeric input field
     */
    NUMBER,
    
    /**
     * Date picker field
     */
    DATE,
    
    /**
     * Single selection dropdown
     */
    DROPDOWN_SINGLE,
    
    /**
     * Multiple selection dropdown
     */
    DROPDOWN_MULTI,
    
    /**
     * Boolean checkbox
     */
    BOOLEAN,
    
    /**
     * Media/file upload field
     */
    MEDIA
}


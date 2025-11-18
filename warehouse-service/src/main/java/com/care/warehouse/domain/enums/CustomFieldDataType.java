package com.care.warehouse.domain.enums;

/**
 * Enumeration for custom field data types.
 * 
 * Defines the data type and validation rules for custom field values.
 * Each data type has specific validation requirements:
 * 
 * - STRING: String value with optional min/max length and regex pattern
 * - NUMBER: Numeric value (integer or decimal) with optional min/max range
 * - BOOLEAN: True/false value
 * - DATE: Date value (ISO format: YYYY-MM-DD)
 * - DATETIME: Date and time value (ISO 8601 format)
 * - ENUM: Single selection from allowed_values (dropdown)
 * - LIST: Multiple selections from allowed_values (multi-select)
 * - JSON: Arbitrary JSON object
 * - MEDIA: File reference (URL or file storage ID)
 * 
 * @author CARE Team
 */
public enum CustomFieldDataType {
    
    /**
     * Text string value.
     * Validation: min_length (via min_value), max_length (via max_value), regex_pattern
     * Example: "Product Description", "Serial Number"
     */
    STRING,
    
    /**
     * Numeric value (integer or decimal).
     * Validation: min_value, max_value
     * Example: 123, 123.45, -10.5
     */
    NUMBER,
    
    /**
     * Boolean value (true/false).
     * No additional validation needed.
     * Example: true, false
     */
    BOOLEAN,
    
    /**
     * Date value (YYYY-MM-DD format).
     * Validation: min_date (via min_value as timestamp), max_date (via max_value as timestamp)
     * Example: "2024-01-15"
     */
    DATE,
    
    /**
     * Date and time value (ISO 8601 format).
     * Validation: min_datetime (via min_value as timestamp), max_datetime (via max_value as timestamp)
     * Example: "2024-01-15T10:30:00Z"
     */
    DATETIME,
    
    /**
     * Single selection from allowed_values (dropdown/select).
     * Validation: value must be one of the "code" values in allowed_values array
     * Example: "Samsung", "Apple" (codes from allowed_values)
     */
    ENUM,
    
    /**
     * Multiple selections from allowed_values (multi-select).
     * Validation: all values must be "code" values in allowed_values array
     * Example: ["Samsung", "Apple"] (array of codes)
     */
    LIST,
    
    /**
     * Arbitrary JSON object.
     * Validation: Optional JSON schema validation (future enhancement)
     * Example: {"key": "value", "nested": {...}}
     */
    JSON,
    
    /**
     * File reference (URL or file storage ID/UUID).
     * Validation: file_type, max_file_size (future enhancements)
     * Example: "file://path/to/file.pdf", "uuid-of-file-in-storage"
     */
    MEDIA
}


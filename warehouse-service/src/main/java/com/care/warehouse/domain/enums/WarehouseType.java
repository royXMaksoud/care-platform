package com.care.warehouse.domain.enums;

/**
 * Warehouse type enumeration.
 * 
 * NOTE: This enum is temporary and will be replaced with code_table_value_id
 * reference to support multilingual warehouse types via code_table_value_language.
 * 
 * The enum values will be stored in code_table with code_table_value entries
 * for each type, allowing translations in multiple languages.
 */
public enum WarehouseType {
    /**
     * Main warehouse - primary distribution center
     */
    MAIN,
    
    /**
     * Branch warehouse - regional distribution point
     */
    BRANCH,
    
    /**
     * Store warehouse - retail location warehouse
     */
    STORE,
    
    /**
     * Supplier warehouse - external supplier location
     */
    SUPPLIER,
    
    /**
     * Third-party logistics warehouse - 3PL provider
     */
    THIRD_PARTY_LOGISTICS
}


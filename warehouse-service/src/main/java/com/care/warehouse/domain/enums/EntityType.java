package com.care.warehouse.domain.enums;

/**
 * Enumeration for entity types that support custom fields.
 * 
 * This enum defines all entity types in the warehouse-service that can have
 * custom fields attached via the CustomFieldDefinition and CustomFieldValue system.
 * 
 * **Usage**:
 * - When creating a CustomFieldDefinition, specify which entity type it applies to
 * - When saving CustomFieldValue, specify the entity type and record ID
 * - The CustomFieldService uses this to fetch relevant field definitions
 * 
 * **Extensibility**:
 * To add a new entity type:
 * 1. Add the enum value here
 * 2. Update the database CHECK constraint in migration
 * 3. Update CustomFieldService if needed
 * 
 * @author CARE Team
 */
public enum EntityType {
    /**
     * Material entity - represents products/materials in the warehouse
     */
    MATERIAL,
    
    /**
     * Warehouse entity - represents warehouse locations
     */
    WAREHOUSE,
    
    /**
     * Order entity - represents consumption or replenishment orders
     */
    ORDER,
    
    /**
     * Customer entity - represents customers (future)
     */
    CUSTOMER,
    
    /**
     * Stock item entity - represents stock levels per warehouse per material
     */
    STOCK_ITEM,
    
    /**
     * Brand entity - represents brands/manufacturers
     */
    BRAND,
    
    /**
     * Category entity - represents material categories
     */
    CATEGORY
}


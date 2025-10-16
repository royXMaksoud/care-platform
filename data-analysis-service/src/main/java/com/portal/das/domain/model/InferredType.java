package com.portal.das.domain.model;

/**
 * Enumeration of inferred data types
 * Similar to pandas dtype inference
 */
public enum InferredType {
    /**
     * String/text data
     */
    STRING,

    /**
     * Integer numbers (whole numbers)
     */
    INTEGER,

    /**
     * Decimal/floating point numbers
     */
    DECIMAL,

    /**
     * Boolean values (true/false, yes/no, 1/0)
     */
    BOOLEAN,

    /**
     * Date values (yyyy-MM-dd, dd/MM/yyyy, etc.)
     */
    DATE,

    /**
     * DateTime values (with time component)
     */
    DATETIME
}



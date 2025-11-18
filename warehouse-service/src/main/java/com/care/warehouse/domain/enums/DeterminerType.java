package com.care.warehouse.domain.enums;

/**
 * Enumeration for material determiner types.
 * 
 * Determiners are unique identifiers for materials (e.g., barcode, serial number).
 * A material can have multiple determiners of different types.
 */
public enum DeterminerType {
    /**
     * Barcode (EAN, UPC, etc.)
     */
    BARCODE,
    
    /**
     * Serial number
     */
    SERIAL_NUMBER,
    
    /**
     * IMEI (International Mobile Equipment Identity)
     */
    IMEI,
    
    /**
     * QR code
     */
    QR_CODE,
    
    /**
     * SKU (Stock Keeping Unit)
     */
    SKU,
    
    /**
     * Other custom determiner type
     */
    OTHER
}


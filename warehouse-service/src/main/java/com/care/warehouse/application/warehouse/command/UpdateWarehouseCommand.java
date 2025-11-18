package com.care.warehouse.application.warehouse.command;

import com.care.warehouse.domain.enums.WarehouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Command object used to update an existing Warehouse.
 * This belongs to the application layer (Command side) in Clean Architecture.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWarehouseCommand {
    
    /** The unique identifier of the warehouse to be updated */
    private UUID id;
    
    private String code;
    private Map<String, String> nameTranslations;
    private Map<String, String> descriptionTranslations;
    private WarehouseType warehouseType;
    private UUID parentWarehouseId;
    private UUID countryId;
    private UUID locationId;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String countryCode;
    private Double latitude;
    private Double longitude;
    private String timeZone;
    private Map<String, Object> customData;
    private Boolean isActive;
}


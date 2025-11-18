package com.care.warehouse.web.dto.warehouse;

import com.care.warehouse.domain.enums.WarehouseType;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

/**
 * Request DTO used to update an existing Warehouse.
 * All fields are optional - only provided fields will be updated.
 */
@Getter
@Setter
public class UpdateWarehouseRequest {

    @Size(max = 100, message = "{warehouse.code.max}")
    private String code;

    /**
     * Multilingual warehouse names.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated name
     */
    private Map<String, String> nameTranslations;

    /**
     * Multilingual warehouse descriptions.
     * Key: language code (e.g., "en", "ar", "fr")
     * Value: translated description
     */
    private Map<String, String> descriptionTranslations;

    private WarehouseType warehouseType;

    private UUID parentWarehouseId;

    private UUID countryId;

    private UUID locationId;

    @Size(max = 255, message = "{warehouse.address.max}")
    private String addressLine1;

    @Size(max = 255, message = "{warehouse.address.max}")
    private String addressLine2;

    @Size(max = 100, message = "{warehouse.city.max}")
    private String city;

    @Size(max = 100, message = "{warehouse.state.max}")
    private String state;

    @Size(max = 20, message = "{warehouse.postalCode.max}")
    private String postalCode;

    @Size(max = 2, message = "{warehouse.countryCode.max}")
    private String countryCode;

    private Double latitude;

    private Double longitude;

    @Size(max = 50, message = "{warehouse.timeZone.max}")
    private String timeZone;

    private Map<String, Object> customData;

    private Boolean isActive;
}


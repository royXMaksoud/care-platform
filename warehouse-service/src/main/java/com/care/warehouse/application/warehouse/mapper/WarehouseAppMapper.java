package com.care.warehouse.application.warehouse.mapper;

import com.care.warehouse.application.warehouse.command.CreateWarehouseCommand;
import com.care.warehouse.application.warehouse.command.UpdateWarehouseCommand;
import com.care.warehouse.domain.model.Warehouse;
import com.sharedlib.core.application.mapper.BaseMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.time.Instant;

/**
 * Mapper interface for converting between Warehouse domain model and commands/queries.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface WarehouseAppMapper extends BaseMapper<Warehouse, CreateWarehouseCommand, UpdateWarehouseCommand, Warehouse> {

    @Override
    default Warehouse fromCreate(CreateWarehouseCommand cmd) {
        return Warehouse.builder()
                .id(null) // New warehouse, no ID yet
                .code(cmd.getCode())
                .nameTranslations(cmd.getNameTranslations())
                .descriptionTranslations(cmd.getDescriptionTranslations())
                .warehouseType(cmd.getWarehouseType())
                .parentWarehouseId(cmd.getParentWarehouseId())
                .countryId(cmd.getCountryId())
                .locationId(cmd.getLocationId())
                .addressLine1(cmd.getAddressLine1())
                .addressLine2(cmd.getAddressLine2())
                .city(cmd.getCity())
                .state(cmd.getState())
                .postalCode(cmd.getPostalCode())
                .countryCode(cmd.getCountryCode())
                .latitude(cmd.getLatitude())
                .longitude(cmd.getLongitude())
                .timeZone(cmd.getTimeZone())
                .customData(cmd.getCustomData())
                .isActive(cmd.getIsActive() != null ? cmd.getIsActive() : Boolean.TRUE)
                .isDeleted(Boolean.FALSE)
                .createdAt(Instant.now())
                .rowVersion(0L)
                .build();
    }

    @Override
    default void updateDomain(@MappingTarget Warehouse target, UpdateWarehouseCommand cmd) {
        if (cmd.getCode() != null) target.setCode(cmd.getCode());
        if (cmd.getNameTranslations() != null) target.setNameTranslations(cmd.getNameTranslations());
        if (cmd.getDescriptionTranslations() != null) target.setDescriptionTranslations(cmd.getDescriptionTranslations());
        if (cmd.getWarehouseType() != null) target.setWarehouseType(cmd.getWarehouseType());
        if (cmd.getParentWarehouseId() != null) target.setParentWarehouseId(cmd.getParentWarehouseId());
        if (cmd.getCountryId() != null) target.setCountryId(cmd.getCountryId());
        if (cmd.getLocationId() != null) target.setLocationId(cmd.getLocationId());
        if (cmd.getAddressLine1() != null) target.setAddressLine1(cmd.getAddressLine1());
        if (cmd.getAddressLine2() != null) target.setAddressLine2(cmd.getAddressLine2());
        if (cmd.getCity() != null) target.setCity(cmd.getCity());
        if (cmd.getState() != null) target.setState(cmd.getState());
        if (cmd.getPostalCode() != null) target.setPostalCode(cmd.getPostalCode());
        if (cmd.getCountryCode() != null) target.setCountryCode(cmd.getCountryCode());
        if (cmd.getLatitude() != null) target.setLatitude(cmd.getLatitude());
        if (cmd.getLongitude() != null) target.setLongitude(cmd.getLongitude());
        if (cmd.getTimeZone() != null) target.setTimeZone(cmd.getTimeZone());
        if (cmd.getCustomData() != null) target.setCustomData(cmd.getCustomData());
        if (cmd.getIsActive() != null) target.setIsActive(cmd.getIsActive());
    }

    @Override
    default Warehouse toResponse(Warehouse domain) {
        return domain; // Domain model is the response
    }
}


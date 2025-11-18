package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.infrastructure.db.entities.WarehouseEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between Warehouse domain model and WarehouseEntity.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface WarehouseJpaMapper extends DomainEntityMapper<Warehouse, WarehouseEntity> {

    @Override
    @Mapping(target = "translations", ignore = true) // Ignore lazy-loaded translations in entity
    WarehouseEntity toEntity(Warehouse domain);

    @Override
    // Warehouse domain model doesn't have translations property, so no need to ignore it
    Warehouse toDomain(WarehouseEntity entity);

    @Override
    default void updateEntity(@MappingTarget WarehouseEntity target, Warehouse source) {
        // Update only the properties that exist in both domain and entity
        if (source == null) {
            return;
        }
        if (source.getCode() != null) target.setCode(source.getCode());
        if (source.getNameTranslations() != null) target.setNameTranslations(source.getNameTranslations());
        if (source.getDescriptionTranslations() != null) target.setDescriptionTranslations(source.getDescriptionTranslations());
        if (source.getWarehouseType() != null) target.setWarehouseType(source.getWarehouseType());
        if (source.getParentWarehouseId() != null) target.setParentWarehouseId(source.getParentWarehouseId());
        if (source.getCountryId() != null) target.setCountryId(source.getCountryId());
        if (source.getLocationId() != null) target.setLocationId(source.getLocationId());
        if (source.getAddressLine1() != null) target.setAddressLine1(source.getAddressLine1());
        if (source.getAddressLine2() != null) target.setAddressLine2(source.getAddressLine2());
        if (source.getCity() != null) target.setCity(source.getCity());
        if (source.getState() != null) target.setState(source.getState());
        if (source.getPostalCode() != null) target.setPostalCode(source.getPostalCode());
        if (source.getCountryCode() != null) target.setCountryCode(source.getCountryCode());
        if (source.getLatitude() != null) target.setLatitude(source.getLatitude());
        if (source.getLongitude() != null) target.setLongitude(source.getLongitude());
        if (source.getTimeZone() != null) target.setTimeZone(source.getTimeZone());
        if (source.getCustomData() != null) target.setCustomData(source.getCustomData());
        if (source.getIsActive() != null) target.setIsActive(source.getIsActive());
        if (source.getIsDeleted() != null) target.setIsDeleted(source.getIsDeleted());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
        // Note: translations property is not updated as it's managed separately
    }
}


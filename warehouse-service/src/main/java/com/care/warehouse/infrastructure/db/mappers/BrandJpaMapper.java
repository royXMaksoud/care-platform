package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.Brand;
import com.care.warehouse.infrastructure.db.entities.BrandEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between Brand domain model and BrandEntity.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface BrandJpaMapper extends DomainEntityMapper<Brand, BrandEntity> {
    
    @Override
    default void updateEntity(@MappingTarget BrandEntity target, Brand source) {
        if (source == null) {
            return;
        }
        if (source.getNameTranslations() != null) target.setNameTranslations(source.getNameTranslations());
        if (source.getCountryOrigin() != null) target.setCountryOrigin(source.getCountryOrigin());
        if (source.getCustomAttributes() != null) target.setCustomAttributes(source.getCustomAttributes());
        if (source.getIsActive() != null) target.setIsActive(source.getIsActive());
        if (source.getIsDeleted() != null) target.setIsDeleted(source.getIsDeleted());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
    }
}


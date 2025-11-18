package com.care.warehouse.application.brand.mapper;

import com.care.warehouse.application.brand.command.CreateBrandCommand;
import com.care.warehouse.application.brand.command.UpdateBrandCommand;
import com.care.warehouse.domain.model.Brand;
import com.sharedlib.core.application.mapper.BaseMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.time.Instant;

/**
 * Mapper interface for converting between Brand domain model and commands/queries.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface BrandAppMapper extends BaseMapper<Brand, CreateBrandCommand, UpdateBrandCommand, Brand> {

    @Override
    default Brand fromCreate(CreateBrandCommand cmd) {
        return Brand.builder()
                .id(null) // New brand, no ID yet
                .nameTranslations(cmd.getNameTranslations())
                .countryOrigin(cmd.getCountryOrigin())
                .customAttributes(cmd.getCustomAttributes())
                .isActive(cmd.getIsActive() != null ? cmd.getIsActive() : Boolean.TRUE)
                .isDeleted(Boolean.FALSE)
                .createdAt(Instant.now())
                .rowVersion(0L)
                .build();
    }

    @Override
    default void updateDomain(@MappingTarget Brand target, UpdateBrandCommand cmd) {
        if (cmd.getNameTranslations() != null) target.setNameTranslations(cmd.getNameTranslations());
        if (cmd.getCountryOrigin() != null) target.setCountryOrigin(cmd.getCountryOrigin());
        if (cmd.getCustomAttributes() != null) target.setCustomAttributes(cmd.getCustomAttributes());
        if (cmd.getIsActive() != null) target.setIsActive(cmd.getIsActive());
    }

    @Override
    default Brand toResponse(Brand domain) {
        return domain; // Domain model is the response
    }
}


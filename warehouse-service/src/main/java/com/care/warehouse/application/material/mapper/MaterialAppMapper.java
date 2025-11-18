package com.care.warehouse.application.material.mapper;

import com.care.warehouse.application.material.command.CreateMaterialCommand;
import com.care.warehouse.application.material.command.UpdateMaterialCommand;
import com.care.warehouse.domain.model.Material;
import com.sharedlib.core.application.mapper.BaseMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.time.Instant;

/**
 * Mapper interface for converting between Material domain model and commands/queries.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface MaterialAppMapper extends BaseMapper<Material, CreateMaterialCommand, UpdateMaterialCommand, Material> {

    @Override
    default Material fromCreate(CreateMaterialCommand cmd) {
        return Material.builder()
                .id(null) // New material, no ID yet
                .code(cmd.getCode())
                .nameTranslations(cmd.getNameTranslations())
                .descriptionTranslations(cmd.getDescriptionTranslations())
                .categoryId(cmd.getCategoryId())
                .brandId(cmd.getBrandId())
                .determiners(cmd.getDeterminers())
                .isTrackable(cmd.getIsTrackable() != null ? cmd.getIsTrackable() : false)
                .status(cmd.getStatus() != null ? cmd.getStatus() : com.care.warehouse.domain.enums.MaterialStatus.ACTIVE)
                .customAttributes(cmd.getCustomAttributes())
                .reorderLevel(cmd.getReorderLevel())
                .unit(cmd.getUnit())
                .isActive(cmd.getIsActive() != null ? cmd.getIsActive() : Boolean.TRUE)
                .isDeleted(Boolean.FALSE)
                .createdAt(Instant.now())
                .rowVersion(0L)
                .build();
    }

    @Override
    default void updateDomain(@MappingTarget Material target, UpdateMaterialCommand cmd) {
        if (cmd.getCode() != null) target.setCode(cmd.getCode());
        if (cmd.getNameTranslations() != null) target.setNameTranslations(cmd.getNameTranslations());
        if (cmd.getDescriptionTranslations() != null) target.setDescriptionTranslations(cmd.getDescriptionTranslations());
        if (cmd.getCategoryId() != null) target.setCategoryId(cmd.getCategoryId());
        if (cmd.getBrandId() != null) target.setBrandId(cmd.getBrandId());
        if (cmd.getDeterminers() != null) target.setDeterminers(cmd.getDeterminers());
        if (cmd.getIsTrackable() != null) target.setIsTrackable(cmd.getIsTrackable());
        if (cmd.getStatus() != null) target.setStatus(cmd.getStatus());
        if (cmd.getCustomAttributes() != null) target.setCustomAttributes(cmd.getCustomAttributes());
        if (cmd.getReorderLevel() != null) target.setReorderLevel(cmd.getReorderLevel());
        if (cmd.getUnit() != null) target.setUnit(cmd.getUnit());
        if (cmd.getIsActive() != null) target.setIsActive(cmd.getIsActive());
    }

    @Override
    default Material toResponse(Material domain) {
        return domain; // Domain model is the response
    }
}


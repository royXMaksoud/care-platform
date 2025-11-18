package com.care.warehouse.application.category.mapper;

import com.care.warehouse.application.category.command.CreateCategoryCommand;
import com.care.warehouse.application.category.command.UpdateCategoryCommand;
import com.care.warehouse.domain.model.Category;
import com.sharedlib.core.application.mapper.BaseMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.time.Instant;

/**
 * Mapper interface for converting between Category domain model and commands/queries.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface CategoryAppMapper extends BaseMapper<Category, CreateCategoryCommand, UpdateCategoryCommand, Category> {

    @Override
    default Category fromCreate(CreateCategoryCommand cmd) {
        return Category.builder()
                .id(null) // New category, no ID yet
                .nameTranslations(cmd.getNameTranslations())
                .parentId(cmd.getParentId())
                .level(null) // Will be calculated by database trigger or service
                .path(null) // Will be calculated by database trigger or service
                .isActive(cmd.getIsActive() != null ? cmd.getIsActive() : Boolean.TRUE)
                .isDeleted(Boolean.FALSE)
                .createdAt(Instant.now())
                .rowVersion(0L)
                .build();
    }

    @Override
    default void updateDomain(@MappingTarget Category target, UpdateCategoryCommand cmd) {
        if (cmd.getNameTranslations() != null) target.setNameTranslations(cmd.getNameTranslations());
        if (cmd.getParentId() != null) {
            // Parent change will trigger path and level recalculation
            target.setParentId(cmd.getParentId());
            // Reset level and path - they will be recalculated
            target.setLevel(null);
            target.setPath(null);
        }
        if (cmd.getIsActive() != null) target.setIsActive(cmd.getIsActive());
    }

    @Override
    default Category toResponse(Category domain) {
        return domain; // Domain model is the response
    }
}


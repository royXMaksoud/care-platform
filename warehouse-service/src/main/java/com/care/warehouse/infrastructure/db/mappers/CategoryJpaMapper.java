package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.Category;
import com.care.warehouse.infrastructure.db.entities.CategoryEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between Category domain model and CategoryEntity.
 * Uses MapStruct for automatic mapping generation.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface CategoryJpaMapper extends DomainEntityMapper<Category, CategoryEntity> {
    
    @Override
    default void updateEntity(@MappingTarget CategoryEntity target, Category source) {
        if (source == null) {
            return;
        }
        if (source.getNameTranslations() != null) target.setNameTranslations(source.getNameTranslations());
        if (source.getParentId() != null) target.setParentId(source.getParentId());
        if (source.getLevel() != null) target.setLevel(source.getLevel());
        if (source.getPath() != null) target.setPath(source.getPath());
        if (source.getIsActive() != null) target.setIsActive(source.getIsActive());
        if (source.getIsDeleted() != null) target.setIsDeleted(source.getIsDeleted());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
    }
}


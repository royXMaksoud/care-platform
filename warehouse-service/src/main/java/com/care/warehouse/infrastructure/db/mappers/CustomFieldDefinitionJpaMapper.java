package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.infrastructure.db.entities.CustomFieldDefinitionEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapper between CustomFieldDefinition domain model and CustomFieldDefinitionEntity.
 * 
 * Converts between domain model (used in business logic) and JPA entity (used for persistence).
 * 
 * @author CARE Team
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface CustomFieldDefinitionJpaMapper extends DomainEntityMapper<CustomFieldDefinition, CustomFieldDefinitionEntity> {
    
    @Override
    CustomFieldDefinition toDomain(CustomFieldDefinitionEntity entity);
    
    @Override
    CustomFieldDefinitionEntity toEntity(CustomFieldDefinition domain);
    
    @Override
    default void updateEntity(@MappingTarget CustomFieldDefinitionEntity target, CustomFieldDefinition source) {
        if (source == null) {
            return;
        }
        if (source.getEntityType() != null) target.setEntityType(source.getEntityType());
        if (source.getFieldKey() != null) target.setFieldKey(source.getFieldKey());
        if (source.getLabelTranslations() != null) target.setLabelTranslations(source.getLabelTranslations());
        if (source.getDataType() != null) target.setDataType(source.getDataType());
        if (source.getIsRequired() != null) target.setIsRequired(source.getIsRequired());
        if (source.getAllowedValues() != null) target.setAllowedValues(source.getAllowedValues());
        if (source.getMinValue() != null) target.setMinValue(source.getMinValue());
        if (source.getMaxValue() != null) target.setMaxValue(source.getMaxValue());
        if (source.getSortOrder() != null) target.setSortOrder(source.getSortOrder());
        if (source.getIsActive() != null) target.setIsActive(source.getIsActive());
        if (source.getIsDeleted() != null) target.setIsDeleted(source.getIsDeleted());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
    }
}

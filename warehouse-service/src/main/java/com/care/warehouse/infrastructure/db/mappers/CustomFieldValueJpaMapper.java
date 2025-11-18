package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.CustomFieldValue;
import com.care.warehouse.infrastructure.db.entities.CustomFieldValueEntity;
import com.sharedlib.core.persistence.mapper.DomainEntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * MapStruct mapper between CustomFieldValue domain model and CustomFieldValueEntity.
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
public interface CustomFieldValueJpaMapper extends DomainEntityMapper<CustomFieldValue, CustomFieldValueEntity> {
    
    @Override
    CustomFieldValue toDomain(CustomFieldValueEntity entity);
    
    @Override
    CustomFieldValueEntity toEntity(CustomFieldValue domain);
    
    @Override
    default void updateEntity(@MappingTarget CustomFieldValueEntity target, CustomFieldValue source) {
        if (source == null) {
            return;
        }
        if (source.getEntityType() != null) target.setEntityType(source.getEntityType());
        if (source.getEntityRecordId() != null) target.setEntityRecordId(source.getEntityRecordId());
        if (source.getFieldId() != null) target.setFieldId(source.getFieldId());
        if (source.getValue() != null) target.setValue(source.getValue());
        if (source.getCreatedById() != null) target.setCreatedById(source.getCreatedById());
        if (source.getCreatedAt() != null) target.setCreatedAt(source.getCreatedAt());
        if (source.getUpdatedById() != null) target.setUpdatedById(source.getUpdatedById());
        if (source.getUpdatedAt() != null) target.setUpdatedAt(source.getUpdatedAt());
        if (source.getRowVersion() != null) target.setRowVersion(source.getRowVersion());
    }
}


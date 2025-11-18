package com.care.warehouse.infrastructure.mapper;

import com.care.warehouse.domain.model.Zone;
import com.care.warehouse.infrastructure.db.entity.ZoneEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    unmappedSourcePolicy = ReportingPolicy.IGNORE
)
public interface ZoneMapper {
    
    /**
     * Convert JPA entity to domain model
     */
    Zone entityToDomain(ZoneEntity entity);
    
    /**
     * Convert domain model to JPA entity
     */
    ZoneEntity domainToEntity(Zone domain);
}

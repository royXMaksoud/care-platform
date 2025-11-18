package com.care.warehouse.infrastructure.mapper;

import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.infrastructure.db.entity.WarehouseEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    unmappedSourcePolicy = ReportingPolicy.IGNORE
)
public interface WarehouseMapper {
    
    /**
     * Convert JPA entity to domain model
     */
    Warehouse entityToDomain(WarehouseEntity entity);
    
    /**
     * Convert domain model to JPA entity
     */
    WarehouseEntity domainToEntity(Warehouse domain);
}

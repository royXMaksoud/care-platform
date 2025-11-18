package com.care.warehouse.infrastructure.mapper;

import com.care.warehouse.domain.model.Bin;
import com.care.warehouse.infrastructure.db.entity.BinEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    unmappedSourcePolicy = ReportingPolicy.IGNORE
)
public interface BinMapper {
    
    /**
     * Convert JPA entity to domain model
     */
    Bin entityToDomain(BinEntity entity);
    
    /**
     * Convert domain model to JPA entity
     */
    BinEntity domainToEntity(Bin domain);
}

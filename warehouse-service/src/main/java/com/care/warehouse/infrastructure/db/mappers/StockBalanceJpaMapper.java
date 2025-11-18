package com.care.warehouse.infrastructure.db.mappers;

import com.care.warehouse.domain.model.StockBalance;
import com.care.warehouse.infrastructure.db.entities.StockBalanceEntity;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between StockBalance domain model and StockBalanceEntity.
 * Uses MapStruct for automatic mapping generation.
 * 
 * Note: StockBalance has a composite primary key (warehouseId, materialId),
 * so it doesn't extend DomainEntityMapper which expects a single UUID key.
 * 
 * @author CARE Team
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface StockBalanceJpaMapper {
    
    /**
     * Convert StockBalanceEntity to StockBalance domain model.
     * 
     * @param entity JPA entity
     * @return Domain model
     */
    StockBalance toDomain(StockBalanceEntity entity);
    
    /**
     * Convert StockBalance domain model to StockBalanceEntity.
     * 
     * @param domain Domain model
     * @return JPA entity
     */
    StockBalanceEntity toEntity(StockBalance domain);
}


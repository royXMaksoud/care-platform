package com.care.warehouse.application.stock.mapper;

import com.care.warehouse.application.stock.command.CreateStockTransactionCommand;
import com.care.warehouse.domain.model.StockTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between stock application layer objects and domain models.
 * Uses MapStruct for automatic mapping generation.
 * 
 * @author CARE Team
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface StockAppMapper {
    
    /**
     * Convert CreateStockTransactionCommand to StockTransaction domain model.
     * 
     * @param command Command object
     * @return Domain model
     */
    StockTransaction toDomain(CreateStockTransactionCommand command);
}


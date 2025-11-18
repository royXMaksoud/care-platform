package com.care.warehouse.web.mapper;

import com.care.warehouse.application.stock.command.CreateStockTransactionCommand;
import com.care.warehouse.domain.model.StockBalance;
import com.care.warehouse.domain.model.StockTransaction;
import com.care.warehouse.web.dto.stock.CreateStockTransactionRequest;
import com.care.warehouse.web.dto.stock.StockBalanceResponse;
import com.care.warehouse.web.dto.stock.StockTransactionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

/**
 * Mapper interface for converting between web DTOs and application/domain models for stock operations.
 * Uses MapStruct for automatic mapping generation.
 * 
 * @author CARE Team
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface StockWebMapper {
    
    /**
     * Convert CreateStockTransactionRequest to CreateStockTransactionCommand.
     * 
     * @param request Request DTO
     * @return Command object
     */
    CreateStockTransactionCommand toCommand(CreateStockTransactionRequest request);
    
    /**
     * Convert StockTransaction domain model to StockTransactionResponse.
     * 
     * @param transaction Domain model
     * @return Response DTO
     */
    StockTransactionResponse toResponse(StockTransaction transaction);
    
    /**
     * Convert StockBalance domain model to StockBalanceResponse.
     * 
     * @param balance Domain model
     * @return Response DTO
     */
    StockBalanceResponse toResponse(StockBalance balance);
}


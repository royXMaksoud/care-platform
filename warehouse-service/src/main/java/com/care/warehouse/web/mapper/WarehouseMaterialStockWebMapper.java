package com.care.warehouse.web.mapper;

import com.care.warehouse.application.warehousematerialstock.command.ReleaseStockCommand;
import com.care.warehouse.application.warehousematerialstock.command.ReserveStockCommand;
import com.care.warehouse.application.warehousematerialstock.command.UpdateStockCommand;
import com.care.warehouse.domain.model.WarehouseMaterialStock;
import com.care.warehouse.web.dto.warehousematerialstock.ReleaseStockRequest;
import com.care.warehouse.web.dto.warehousematerialstock.ReserveStockRequest;
import com.care.warehouse.web.dto.warehousematerialstock.UpdateStockRequest;
import com.care.warehouse.web.dto.warehousematerialstock.WarehouseMaterialStockResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper to convert between Web layer DTOs and Domain models/Commands related to WarehouseMaterialStock.
 */
@Component
public class WarehouseMaterialStockWebMapper {

    /**
     * Converts UpdateStockRequest to UpdateStockCommand.
     */
    public UpdateStockCommand toUpdateCommand(UpdateStockRequest request) {
        return UpdateStockCommand.builder()
                .materialId(request.getMaterialId())
                .warehouseId(request.getWarehouseId())
                .stockCurrent(request.getStockCurrent())
                .stockReserved(request.getStockReserved())
                .reorderLevel(request.getReorderLevel())
                .expiryDate(request.getExpiryDate())
                .lotNumber(request.getLotNumber())
                .binLocationCode(request.getBinLocationCode())
                .build();
    }

    /**
     * Converts ReserveStockRequest to ReserveStockCommand.
     */
    public ReserveStockCommand toReserveCommand(ReserveStockRequest request) {
        return ReserveStockCommand.builder()
                .materialId(request.getMaterialId())
                .warehouseId(request.getWarehouseId())
                .quantity(request.getQuantity())
                .lotNumber(request.getLotNumber())
                .reservationReference(request.getReservationReference())
                .build();
    }

    /**
     * Converts ReleaseStockRequest to ReleaseStockCommand.
     */
    public ReleaseStockCommand toReleaseCommand(ReleaseStockRequest request) {
        return ReleaseStockCommand.builder()
                .materialId(request.getMaterialId())
                .warehouseId(request.getWarehouseId())
                .quantity(request.getQuantity())
                .lotNumber(request.getLotNumber())
                .reservationReference(request.getReservationReference())
                .build();
    }

    /**
     * Converts domain model WarehouseMaterialStock to API response DTO.
     */
    public WarehouseMaterialStockResponse toResponse(WarehouseMaterialStock stock) {
        return WarehouseMaterialStockResponse.builder()
                .id(stock.getId())
                .tenantId(stock.getTenantId())
                .materialId(stock.getMaterialId())
                .warehouseId(stock.getWarehouseId())
                .stockCurrent(stock.getStockCurrent())
                .stockReserved(stock.getStockReserved())
                .availableStock(stock.getAvailableStock())
                .reorderLevel(stock.getReorderLevel())
                .isBelowReorderLevel(stock.isBelowReorderLevel())
                .expiryDate(stock.getExpiryDate())
                .lotNumber(stock.getLotNumber())
                .binLocationCode(stock.getBinLocationCode())
                .isActive(stock.getIsActive())
                .isDeleted(stock.getIsDeleted())
                .createdById(stock.getCreatedById())
                .createdAt(stock.getCreatedAt())
                .updatedById(stock.getUpdatedById())
                .updatedAt(stock.getUpdatedAt())
                .rowVersion(stock.getRowVersion())
                .build();
    }
}


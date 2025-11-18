package com.care.warehouse.web.mapper;

import com.care.warehouse.domain.model.Bin;
import com.care.warehouse.web.dto.BinRequest;
import com.care.warehouse.web.dto.BinResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class BinWebMapper {
    
    public BinResponse toResponse(Bin domain) {
        if (domain == null) {
            return null;
        }
        
        return BinResponse.builder()
            .id(domain.getId())
            .tenantId(domain.getTenantId())
            .zoneId(domain.getZoneId())
            .code(domain.getCode())
            .name(domain.getName())
            .binType(domain.getBinType())
            .status(domain.getStatus())
            .maxWeightKg(domain.getMaxWeightKg())
            .currentWeightKg(domain.getCurrentWeightKg())
            .capacityCubicMeters(domain.getCapacityCubicMeters())
            .currentOccupancyCubicMeters(domain.getCurrentOccupancyCubicMeters())
            .availableCapacityCubicMeters(domain.getAvailableCapacity())
            .utilizationPercentage(domain.getUtilizationPercentage())
            .aisleNumber(domain.getAisleNumber())
            .shelfNumber(domain.getShelfNumber())
            .levelNumber(domain.getLevelNumber())
            .barcode(domain.getBarcode())
            .locationString(domain.getLocationString())
            .createdAt(domain.getCreatedAt())
            .updatedAt(domain.getUpdatedAt())
            .rowVersion(domain.getRowVersion())
            .build();
    }
    
    public Bin toDomain(BinRequest request, UUID tenantId) {
        if (request == null) {
            return null;
        }
        
        return Bin.builder()
            .tenantId(tenantId)
            .zoneId(request.getZoneId())
            .code(request.getCode())
            .name(request.getName())
            .binType(request.getBinType())
            .status(request.getStatus())
            .maxWeightKg(request.getMaxWeightKg())
            .capacityCubicMeters(request.getCapacityCubicMeters())
            .aisleNumber(request.getAisleNumber())
            .shelfNumber(request.getShelfNumber())
            .levelNumber(request.getLevelNumber())
            .barcode(request.getBarcode())
            .build();
    }
}

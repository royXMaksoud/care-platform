package com.care.warehouse.web.mapper;

import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.web.dto.WarehouseRequest;
import com.care.warehouse.web.dto.WarehouseResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class WarehouseWebMapper {
    
    public WarehouseResponse toResponse(Warehouse domain) {
        if (domain == null) {
            return null;
        }
        
        return WarehouseResponse.builder()
            .id(domain.getId())
            .tenantId(domain.getTenantId())
            .code(domain.getCode())
            .name(domain.getName())
            .description(domain.getDescription())
            .status(domain.getStatus())
            .capacityCubicMeters(domain.getCapacityCubicMeters())
            .currentOccupancyCubicMeters(domain.getCurrentOccupancyCubicMeters())
            .availableCapacityCubicMeters(domain.getAvailableCapacity())
            .utilizationPercentage(domain.getUtilizationPercentage())
            .isPrimary(domain.getIsPrimary())
            .metadata(domain.getMetadata())
            .createdAt(domain.getCreatedAt())
            .updatedAt(domain.getUpdatedAt())
            .rowVersion(domain.getRowVersion())
            .build();
    }
    
    public Warehouse toDomain(WarehouseRequest request, UUID tenantId) {
        if (request == null) {
            return null;
        }
        
        return Warehouse.builder()
            .tenantId(tenantId)
            .code(request.getCode())
            .name(request.getName())
            .description(request.getDescription())
            .status(request.getStatus())
            .capacityCubicMeters(request.getCapacityCubicMeters())
            .isPrimary(request.getIsPrimary())
            .metadata(request.getMetadata())
            .build();
    }
}

package com.care.warehouse.web.mapper;

import com.care.warehouse.domain.model.Zone;
import com.care.warehouse.web.dto.ZoneRequest;
import com.care.warehouse.web.dto.ZoneResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ZoneWebMapper {
    
    public ZoneResponse toResponse(Zone domain) {
        if (domain == null) {
            return null;
        }
        
        return ZoneResponse.builder()
            .id(domain.getId())
            .tenantId(domain.getTenantId())
            .warehouseId(domain.getWarehouseId())
            .code(domain.getCode())
            .name(domain.getName())
            .zoneType(domain.getZoneType())
            .status(domain.getStatus())
            .capacityCubicMeters(domain.getCapacityCubicMeters())
            .currentOccupancyCubicMeters(domain.getCurrentOccupancyCubicMeters())
            .availableCapacityCubicMeters(domain.getAvailableCapacity())
            .utilizationPercentage(domain.getUtilizationPercentage())
            .temperatureControlled(domain.getTemperatureControlled())
            .temperatureMin(domain.getTemperatureMin())
            .temperatureMax(domain.getTemperatureMax())
            .createdAt(domain.getCreatedAt())
            .updatedAt(domain.getUpdatedAt())
            .rowVersion(domain.getRowVersion())
            .build();
    }
    
    public Zone toDomain(ZoneRequest request, UUID tenantId) {
        if (request == null) {
            return null;
        }
        
        return Zone.builder()
            .tenantId(tenantId)
            .warehouseId(request.getWarehouseId())
            .code(request.getCode())
            .name(request.getName())
            .zoneType(request.getZoneType())
            .status(request.getStatus())
            .capacityCubicMeters(request.getCapacityCubicMeters())
            .temperatureControlled(request.getTemperatureControlled())
            .temperatureMin(request.getTemperatureMin())
            .temperatureMax(request.getTemperatureMax())
            .build();
    }
}

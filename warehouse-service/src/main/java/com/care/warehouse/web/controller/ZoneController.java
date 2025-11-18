package com.care.warehouse.web.controller;

import com.care.warehouse.domain.model.Zone;
import com.care.warehouse.domain.port.ZoneCrudPort;
import com.care.warehouse.web.dto.ZoneRequest;
import com.care.warehouse.web.dto.ZoneResponse;
import com.care.warehouse.web.mapper.ZoneWebMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/zones")
@RequiredArgsConstructor
@Validated
public class ZoneController {
    
    private final ZoneCrudPort zoneCrudPort;
    private final ZoneWebMapper zoneWebMapper;
    
    /**
     * Get all zones (with optional filtering)
     */
    @GetMapping
    public ResponseEntity<Page<ZoneResponse>> getAllZones(
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) String zoneType,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        
        Page<Zone> page = zoneCrudPort.findAll(pageable);
        
        // Filter by warehouse if provided
        if (warehouseId != null) {
            var filtered = page.getContent().stream()
                .filter(z -> z.getWarehouseId().equals(warehouseId))
                .collect(Collectors.toList());
            page = new PageImpl<>(filtered, pageable, filtered.size());
        }
        
        // Filter by zone type if provided
        if (zoneType != null && !zoneType.isBlank()) {
            var filtered = page.getContent().stream()
                .filter(z -> z.getZoneType().equals(zoneType))
                .collect(Collectors.toList());
            page = new PageImpl<>(filtered, pageable, filtered.size());
        }
        
        // Filter by status if provided
        if (status != null && !status.isBlank()) {
            var filtered = page.getContent().stream()
                .filter(z -> z.getStatus().equals(status))
                .collect(Collectors.toList());
            page = new PageImpl<>(filtered, pageable, filtered.size());
        }
        
        var response = page.map(zoneWebMapper::toResponse);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get zone by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ZoneResponse> getZone(@PathVariable @NotNull UUID id) {
        var zone = zoneCrudPort.findById(id);
        return zone
            .map(z -> ResponseEntity.ok(zoneWebMapper.toResponse(z)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new zone
     */
    @PostMapping
    public ResponseEntity<ZoneResponse> createZone(
            @Valid @RequestBody ZoneRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) UUID tenantId) {
        
        var domain = zoneWebMapper.toDomain(request, tenantId);
        var created = zoneCrudPort.create(domain);
        var response = zoneWebMapper.toResponse(created);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Update zone
     */
    @PutMapping("/{id}")
    public ResponseEntity<ZoneResponse> updateZone(
            @PathVariable @NotNull UUID id,
            @Valid @RequestBody ZoneRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) UUID tenantId) {
        
        var existing = zoneCrudPort.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        var domain = existing.get();
        domain.setCode(request.getCode());
        domain.setName(request.getName());
        domain.setZoneType(request.getZoneType());
        domain.setStatus(request.getStatus());
        domain.setCapacityCubicMeters(request.getCapacityCubicMeters());
        domain.setTemperatureControlled(request.getTemperatureControlled());
        domain.setTemperatureMin(request.getTemperatureMin());
        domain.setTemperatureMax(request.getTemperatureMax());
        
        var updated = zoneCrudPort.update(domain);
        var response = zoneWebMapper.toResponse(updated);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete zone
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteZone(@PathVariable @NotNull UUID id) {
        var existing = zoneCrudPort.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        zoneCrudPort.delete(id);
        return ResponseEntity.noContent().build();
    }
}

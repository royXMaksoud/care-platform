package com.care.warehouse.web.controller;

import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.port.WarehouseCrudPort;
import com.care.warehouse.web.dto.WarehouseRequest;
import com.care.warehouse.web.dto.WarehouseResponse;
import com.care.warehouse.web.mapper.WarehouseWebMapper;
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
@RequestMapping("/api/v1/warehouses")
@RequiredArgsConstructor
@Validated
public class WarehouseController {
    
    private final WarehouseCrudPort warehouseCrudPort;
    private final WarehouseWebMapper warehouseWebMapper;
    
    /**
     * Get all warehouses for the current tenant
     */
    @GetMapping
    public ResponseEntity<Page<WarehouseResponse>> getAllWarehouses(
            @RequestParam(required = false) String status,
            Pageable pageable) {
        
        Page<Warehouse> page = warehouseCrudPort.findAll(pageable);
        
        // Filter by status if provided
        if (status != null && !status.isBlank()) {
            var filtered = page.getContent().stream()
                .filter(w -> w.getStatus().equals(status))
                .collect(Collectors.toList());
            page = new PageImpl<>(filtered, pageable, filtered.size());
        }
        
        var response = page.map(warehouseWebMapper::toResponse);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get warehouse by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<WarehouseResponse> getWarehouse(@PathVariable @NotNull UUID id) {
        var warehouse = warehouseCrudPort.findById(id);
        return warehouse
            .map(w -> ResponseEntity.ok(warehouseWebMapper.toResponse(w)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new warehouse
     */
    @PostMapping
    public ResponseEntity<WarehouseResponse> createWarehouse(
            @Valid @RequestBody WarehouseRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) UUID tenantId) {
        
        var domain = warehouseWebMapper.toDomain(request, tenantId);
        var created = warehouseCrudPort.create(domain);
        var response = warehouseWebMapper.toResponse(created);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Update warehouse
     */
    @PutMapping("/{id}")
    public ResponseEntity<WarehouseResponse> updateWarehouse(
            @PathVariable @NotNull UUID id,
            @Valid @RequestBody WarehouseRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) UUID tenantId) {
        
        var existing = warehouseCrudPort.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        var domain = existing.get();
        domain.setCode(request.getCode());
        domain.setName(request.getName());
        domain.setDescription(request.getDescription());
        domain.setStatus(request.getStatus());
        domain.setCapacityCubicMeters(request.getCapacityCubicMeters());
        domain.setIsPrimary(request.getIsPrimary());
        domain.setMetadata(request.getMetadata());
        
        var updated = warehouseCrudPort.update(domain);
        var response = warehouseWebMapper.toResponse(updated);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete warehouse
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable @NotNull UUID id) {
        var existing = warehouseCrudPort.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        warehouseCrudPort.delete(id);
        return ResponseEntity.noContent().build();
    }
}

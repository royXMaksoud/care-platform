package com.care.warehouse.web.controller;

import com.care.warehouse.domain.model.Bin;
import com.care.warehouse.domain.port.BinCrudPort;
import com.care.warehouse.web.dto.BinRequest;
import com.care.warehouse.web.dto.BinResponse;
import com.care.warehouse.web.mapper.BinWebMapper;
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
@RequestMapping("/api/v1/bins")
@RequiredArgsConstructor
@Validated
public class BinController {
    
    private final BinCrudPort binCrudPort;
    private final BinWebMapper binWebMapper;
    
    /**
     * Get all bins (with optional filtering)
     */
    @GetMapping
    public ResponseEntity<Page<BinResponse>> getAllBins(
            @RequestParam(required = false) UUID zoneId,
            @RequestParam(required = false) String binType,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        
        Page<Bin> page = binCrudPort.findAll(pageable);
        
        // Filter by zone if provided
        if (zoneId != null) {
            var filtered = page.getContent().stream()
                .filter(b -> b.getZoneId().equals(zoneId))
                .collect(Collectors.toList());
            page = new PageImpl<>(filtered, pageable, filtered.size());
        }
        
        // Filter by bin type if provided
        if (binType != null && !binType.isBlank()) {
            var filtered = page.getContent().stream()
                .filter(b -> b.getBinType().equals(binType))
                .collect(Collectors.toList());
            page = new PageImpl<>(filtered, pageable, filtered.size());
        }
        
        // Filter by status if provided
        if (status != null && !status.isBlank()) {
            var filtered = page.getContent().stream()
                .filter(b -> b.getStatus().equals(status))
                .collect(Collectors.toList());
            page = new PageImpl<>(filtered, pageable, filtered.size());
        }
        
        var response = page.map(binWebMapper::toResponse);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get bin by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BinResponse> getBin(@PathVariable @NotNull UUID id) {
        var bin = binCrudPort.findById(id);
        return bin
            .map(b -> ResponseEntity.ok(binWebMapper.toResponse(b)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new bin
     */
    @PostMapping
    public ResponseEntity<BinResponse> createBin(
            @Valid @RequestBody BinRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) UUID tenantId) {
        
        var domain = binWebMapper.toDomain(request, tenantId);
        var created = binCrudPort.create(domain);
        var response = binWebMapper.toResponse(created);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Update bin
     */
    @PutMapping("/{id}")
    public ResponseEntity<BinResponse> updateBin(
            @PathVariable @NotNull UUID id,
            @Valid @RequestBody BinRequest request,
            @RequestHeader(value = "X-Tenant-ID", required = true) UUID tenantId) {
        
        var existing = binCrudPort.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        var domain = existing.get();
        domain.setCode(request.getCode());
        domain.setName(request.getName());
        domain.setBinType(request.getBinType());
        domain.setStatus(request.getStatus());
        domain.setMaxWeightKg(request.getMaxWeightKg());
        domain.setCapacityCubicMeters(request.getCapacityCubicMeters());
        domain.setAisleNumber(request.getAisleNumber());
        domain.setShelfNumber(request.getShelfNumber());
        domain.setLevelNumber(request.getLevelNumber());
        domain.setBarcode(request.getBarcode());
        
        var updated = binCrudPort.update(domain);
        var response = binWebMapper.toResponse(updated);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete bin
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBin(@PathVariable @NotNull UUID id) {
        var existing = binCrudPort.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        binCrudPort.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.care.warehouse.web.controller;

import com.care.warehouse.application.brand.command.CreateBrandCommand;
import com.care.warehouse.application.brand.command.UpdateBrandCommand;
import com.care.warehouse.application.brand.query.SearchBrandsQuery;
import com.care.warehouse.domain.model.Brand;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.web.dto.brand.BrandResponse;
import com.care.warehouse.web.dto.brand.CreateBrandRequest;
import com.care.warehouse.web.dto.brand.UpdateBrandRequest;
import com.care.warehouse.web.mapper.BrandWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller for Brand management.
 * 
 * All endpoints are under /api/warehouse/v1/brands
 * Tenant isolation is enforced automatically via TenantContext.
 */
@RestController
@RequestMapping("/api/warehouse/v1/brands")
@RequiredArgsConstructor
@Tag(name = "Brand Management", description = "APIs for managing brand entities")
public class BrandController {

    // Inject use-case interfaces => decoupled from concrete service classes
    private final CreateBrandUseCase createBrandUseCase;
    private final UpdateBrandUseCase updateBrandUseCase;
    private final GetBrandByIdUseCase getBrandByIdUseCase;
    private final SearchBrandsUseCase searchBrandsUseCase;
    private final DeleteBrandUseCase deleteBrandUseCase;
    private final BrandWebMapper mapper;

    @PostMapping
    @Operation(summary = "Create a new brand", description = "Creates a new brand with the provided data")
    @ApiResponse(responseCode = "201", description = "Brand created successfully",
            content = @Content(schema = @Schema(implementation = BrandResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<BrandResponse> createBrand(@Valid @RequestBody CreateBrandRequest request) {
        CreateBrandCommand command = mapper.toCreateCommand(request);
        Brand createdBrand = createBrandUseCase.createBrand(command);
        BrandResponse body = mapper.toResponse(createdBrand);
        return ResponseEntity
                .created(URI.create("/api/warehouse/v1/brands/" + body.getId()))
                .body(body);
    }

    @PutMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Update an existing brand", description = "Updates an existing brand with the provided data")
    @ApiResponse(responseCode = "200", description = "Brand updated successfully",
            content = @Content(schema = @Schema(implementation = BrandResponse.class)))
    @ApiResponse(responseCode = "404", description = "Brand not found")
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<BrandResponse> updateBrand(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBrandRequest request) {

        UpdateBrandCommand command = mapper.toUpdateCommand(id, request);
        Brand updatedBrand = updateBrandUseCase.updateBrand(command);
        return ResponseEntity.ok(mapper.toResponse(updatedBrand));
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Get brand by ID", description = "Retrieves a brand by its unique identifier")
    @ApiResponse(responseCode = "200", description = "Brand found",
            content = @Content(schema = @Schema(implementation = BrandResponse.class)))
    @ApiResponse(responseCode = "404", description = "Brand not found")
    public ResponseEntity<BrandResponse> getBrandById(@PathVariable UUID id) {
        Optional<Brand> brand = getBrandByIdUseCase.getBrandById(id);
        return brand.map(mapper::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Search brands", description = "Searches brands with optional filters and pagination")
    @ApiResponse(responseCode = "200", description = "Brands retrieved successfully")
    public ResponseEntity<Page<BrandResponse>> searchBrands(
            @RequestParam(required = false) String nameSearch,
            @RequestParam(required = false) String countryOrigin,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 10) Pageable pageable) {

        // Build query from request parameters
        SearchBrandsQuery query = SearchBrandsQuery.builder()
                .nameSearch(nameSearch)
                .countryOrigin(countryOrigin)
                .isActive(isActive)
                .build();

        Page<Brand> brands = searchBrandsUseCase.searchBrands(query, pageable);
        Page<BrandResponse> responsePage = brands.map(mapper::toResponse);
        return ResponseEntity.ok(responsePage);
    }

    @DeleteMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(
            summary = "Delete a brand",
            description = "Soft deletes a brand by setting isDeleted = true. " +
                    "The brand will not be returned in search results but data is preserved."
    )
    @ApiResponse(responseCode = "204", description = "Brand deleted successfully")
    @ApiResponse(responseCode = "404", description = "Brand not found")
    public ResponseEntity<Void> deleteBrand(@PathVariable UUID id) {
        deleteBrandUseCase.deleteBrand(id);
        return ResponseEntity.noContent().build();
    }
}


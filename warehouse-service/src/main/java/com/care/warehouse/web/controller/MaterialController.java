package com.care.warehouse.web.controller;

import com.care.warehouse.application.material.command.CreateMaterialCommand;
import com.care.warehouse.application.material.command.UpdateMaterialCommand;
import com.care.warehouse.application.material.query.SearchMaterialsQuery;
import com.care.warehouse.domain.enums.MaterialStatus;
import com.care.warehouse.domain.model.Material;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.application.material.service.MaterialCustomFieldsService;
import com.care.warehouse.web.dto.material.CreateMaterialRequest;
import com.care.warehouse.web.dto.material.MaterialCustomFieldsRequest;
import com.care.warehouse.web.dto.material.MaterialCustomFieldsResponse;
import com.care.warehouse.web.dto.material.MaterialResponse;
import com.care.warehouse.web.dto.material.UpdateMaterialRequest;
import com.care.warehouse.web.mapper.MaterialWebMapper;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller for Material management.
 * 
 * All endpoints are under /api/warehouse/v1/materials
 * Tenant isolation is enforced automatically via TenantContext.
 */
@RestController
@RequestMapping("/api/warehouse/v1/materials")
@RequiredArgsConstructor
@Tag(name = "Material Management", description = "APIs for managing material entities")
public class MaterialController {

    // Inject use-case interfaces => decoupled from concrete service classes
    private final CreateMaterialUseCase createMaterialUseCase;
    private final UpdateMaterialUseCase updateMaterialUseCase;
    private final GetMaterialByIdUseCase getMaterialByIdUseCase;
    private final SearchMaterialsUseCase searchMaterialsUseCase;
    private final DeleteMaterialUseCase deleteMaterialUseCase;
    private final MaterialWebMapper mapper;
    private final MaterialCustomFieldsService materialCustomFieldsService;

    @PostMapping
    @Operation(summary = "Create a new material", description = "Creates a new material with the provided data")
    @ApiResponse(responseCode = "201", description = "Material created successfully",
            content = @Content(schema = @Schema(implementation = MaterialResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<MaterialResponse> createMaterial(@Valid @RequestBody CreateMaterialRequest request) {
        CreateMaterialCommand command = mapper.toCreateCommand(request);
        Material createdMaterial = createMaterialUseCase.createMaterial(command);
        MaterialResponse body = mapper.toResponse(createdMaterial);
        return ResponseEntity
                .created(URI.create("/api/warehouse/v1/materials/" + body.getId()))
                .body(body);
    }

    @PutMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Update an existing material", description = "Updates an existing material with the provided data")
    @ApiResponse(responseCode = "200", description = "Material updated successfully",
            content = @Content(schema = @Schema(implementation = MaterialResponse.class)))
    @ApiResponse(responseCode = "404", description = "Material not found")
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<MaterialResponse> updateMaterial(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMaterialRequest request) {

        UpdateMaterialCommand command = mapper.toUpdateCommand(id, request);
        Material updatedMaterial = updateMaterialUseCase.updateMaterial(command);
        return ResponseEntity.ok(mapper.toResponse(updatedMaterial));
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Get material by ID", description = "Retrieves a material by its unique identifier")
    @ApiResponse(responseCode = "200", description = "Material found",
            content = @Content(schema = @Schema(implementation = MaterialResponse.class)))
    @ApiResponse(responseCode = "404", description = "Material not found")
    public ResponseEntity<MaterialResponse> getMaterialById(@PathVariable UUID id) {
        Optional<Material> material = getMaterialByIdUseCase.getMaterialById(id);
        return material.map(mapper::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Search materials", description = "Searches materials with optional filters and pagination")
    @ApiResponse(responseCode = "200", description = "Materials retrieved successfully")
    public ResponseEntity<Page<MaterialResponse>> searchMaterials(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isTrackable,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String determinerValue,
            @RequestParam(required = false) String nameSearch,
            @PageableDefault(size = 10) Pageable pageable) {

        // Build query from request parameters
        MaterialStatus materialStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                materialStatus = MaterialStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, will be ignored
            }
        }

        SearchMaterialsQuery query = SearchMaterialsQuery.builder()
                .code(code)
                .categoryId(categoryId)
                .brandId(brandId)
                .status(materialStatus)
                .isTrackable(isTrackable)
                .isActive(isActive)
                .determinerValue(determinerValue)
                .nameSearch(nameSearch)
                .build();

        Page<Material> materials = searchMaterialsUseCase.searchMaterials(query, pageable);
        Page<MaterialResponse> responsePage = materials.map(mapper::toResponse);
        return ResponseEntity.ok(responsePage);
    }

    @PostMapping("/{id:[0-9a-fA-F\\-]{36}}/custom-fields")
    @Operation(
            summary = "Save custom fields for a material",
            description = "Saves or updates custom field values for a material. " +
                    "Values are validated against CustomFieldDefinition metadata. " +
                    "Required fields must be present, and values must match data types and constraints."
    )
    @ApiResponse(responseCode = "200", description = "Custom fields saved successfully",
            content = @Content(schema = @Schema(implementation = MaterialCustomFieldsResponse.class)))
    @ApiResponse(responseCode = "404", description = "Material not found")
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<MaterialCustomFieldsResponse> saveCustomFields(
            @PathVariable UUID id,
            @Valid @RequestBody MaterialCustomFieldsRequest request) {
        
        Map<String, Object> savedValues = materialCustomFieldsService.saveCustomFields(
                id, request.getCustomFields());
        
        MaterialCustomFieldsResponse response = MaterialCustomFieldsResponse.builder()
                .customFields(savedValues)
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}/custom-fields")
    @Operation(
            summary = "Get custom fields for a material",
            description = "Retrieves all custom field values for a material. " +
                    "Returns an empty map if no custom fields are defined."
    )
    @ApiResponse(responseCode = "200", description = "Custom fields retrieved successfully",
            content = @Content(schema = @Schema(implementation = MaterialCustomFieldsResponse.class)))
    @ApiResponse(responseCode = "404", description = "Material not found")
    public ResponseEntity<MaterialCustomFieldsResponse> getCustomFields(@PathVariable UUID id) {
        Map<String, Object> values = materialCustomFieldsService.getCustomFields(id);
        
        MaterialCustomFieldsResponse response = MaterialCustomFieldsResponse.builder()
                .customFields(values)
                .build();
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(
            summary = "Delete a material",
            description = "Soft deletes a material by setting isDeleted = true. " +
                    "The material will not be returned in search results but data is preserved."
    )
    @ApiResponse(responseCode = "204", description = "Material deleted successfully")
    @ApiResponse(responseCode = "404", description = "Material not found")
    public ResponseEntity<Void> deleteMaterial(@PathVariable UUID id) {
        deleteMaterialUseCase.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }
}


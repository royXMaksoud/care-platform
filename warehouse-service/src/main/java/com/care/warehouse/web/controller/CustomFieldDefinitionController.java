package com.care.warehouse.web.controller;

import com.care.warehouse.application.customfielddefinition.command.CreateCustomFieldDefinitionCommand;
import com.care.warehouse.application.customfielddefinition.command.UpdateCustomFieldDefinitionCommand;
import com.care.warehouse.application.customfielddefinition.query.GetAllCustomFieldDefinitionsQuery;
import com.care.warehouse.domain.model.CustomFieldDefinition;
import com.care.warehouse.domain.ports.in.customfielddefinition.*;
import com.care.warehouse.web.dto.customfielddefinition.CreateCustomFieldDefinitionRequest;
import com.care.warehouse.web.dto.customfielddefinition.CustomFieldDefinitionResponse;
import com.care.warehouse.web.dto.customfielddefinition.UpdateCustomFieldDefinitionRequest;
import com.care.warehouse.web.mapper.CustomFieldDefinitionWebMapper;
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
 * REST Controller for CustomFieldDefinition management.
 * 
 * All endpoints are under /api/warehouse/v1/custom-field-definitions
 * Tenant isolation is enforced automatically via TenantContext.
 */
@RestController
@RequestMapping("/api/warehouse/v1/custom-field-definitions")
@RequiredArgsConstructor
@Tag(name = "Custom Field Definition Management", description = "APIs for managing metadata-based dynamic field definitions")
public class CustomFieldDefinitionController {

    private final SaveUseCase saveUseCase;
    private final UpdateCustomFieldDefinitionUseCase updateUseCase;
    private final LoadUseCase loadUseCase;
    private final LoadAllUseCase loadAllUseCase;
    private final DeleteCustomFieldDefinitionUseCase deleteUseCase;
    private final CustomFieldDefinitionWebMapper mapper;

    @PostMapping
    @Operation(summary = "Create a new custom field definition", description = "Creates metadata for a custom field")
    @ApiResponse(responseCode = "201", description = "Custom field definition created successfully",
            content = @Content(schema = @Schema(implementation = CustomFieldDefinitionResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<CustomFieldDefinitionResponse> createCustomFieldDefinition(
            @Valid @RequestBody CreateCustomFieldDefinitionRequest request) {
        CreateCustomFieldDefinitionCommand command = mapper.toCreateCommand(request);
        CustomFieldDefinition created = saveUseCase.save(command);
        CustomFieldDefinitionResponse body = mapper.toResponse(created);
        return ResponseEntity
                .created(URI.create("/api/warehouse/v1/custom-field-definitions/" + body.getId()))
                .body(body);
    }

    @PutMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Update an existing custom field definition", description = "Updates metadata for a custom field")
    @ApiResponse(responseCode = "200", description = "Custom field definition updated successfully",
            content = @Content(schema = @Schema(implementation = CustomFieldDefinitionResponse.class)))
    @ApiResponse(responseCode = "404", description = "Custom field definition not found")
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<CustomFieldDefinitionResponse> updateCustomFieldDefinition(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCustomFieldDefinitionRequest request) {
        UpdateCustomFieldDefinitionCommand command = mapper.toUpdateCommand(id, request);
        CustomFieldDefinition updated = updateUseCase.update(command);
        return ResponseEntity.ok(mapper.toResponse(updated));
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Get custom field definition by ID", description = "Retrieves a custom field definition by its unique identifier")
    @ApiResponse(responseCode = "200", description = "Custom field definition found",
            content = @Content(schema = @Schema(implementation = CustomFieldDefinitionResponse.class)))
    @ApiResponse(responseCode = "404", description = "Custom field definition not found")
    public ResponseEntity<CustomFieldDefinitionResponse> getCustomFieldDefinitionById(@PathVariable UUID id) {
        Optional<CustomFieldDefinition> definition = loadUseCase.getCustomFieldDefinitionById(id);
        return definition.map(mapper::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "Get all custom field definitions", description = "Retrieves all custom field definitions with optional filters")
    @ApiResponse(responseCode = "200", description = "Custom field definitions retrieved successfully")
    public ResponseEntity<Page<CustomFieldDefinitionResponse>> getAllCustomFieldDefinitions(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Boolean isGlobal,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 10) Pageable pageable) {
        
        // Build query from request parameters
        GetAllCustomFieldDefinitionsQuery query = GetAllCustomFieldDefinitionsQuery.builder()
                .entityType(entityType != null ? com.care.warehouse.domain.enums.EntityType.valueOf(entityType.toUpperCase()) : null)
                .isGlobal(isGlobal)
                .isActive(isActive)
                .build();

        Page<CustomFieldDefinition> definitions = loadAllUseCase.getAll(query, pageable);
        Page<CustomFieldDefinitionResponse> responsePage = definitions.map(mapper::toResponse);
        return ResponseEntity.ok(responsePage);
    }

    @DeleteMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Delete custom field definition", description = "Deletes a custom field definition by ID")
    @ApiResponse(responseCode = "204", description = "Custom field definition deleted successfully")
    @ApiResponse(responseCode = "404", description = "Custom field definition not found")
    public ResponseEntity<Void> deleteCustomFieldDefinition(@PathVariable UUID id) {
        deleteUseCase.delete(id);
        return ResponseEntity.noContent().build();
    }
}


package com.care.warehouse.web.controller;

import com.care.warehouse.application.category.command.CreateCategoryCommand;
import com.care.warehouse.application.category.command.UpdateCategoryCommand;
import com.care.warehouse.application.category.query.SearchCategoriesQuery;
import com.care.warehouse.domain.model.Category;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.domain.ports.in.category.SearchCategoriesUseCase;
import com.care.warehouse.web.dto.category.CategoryResponse;
import com.care.warehouse.web.dto.category.CategoryTreeNode;
import com.care.warehouse.web.dto.category.CreateCategoryRequest;
import com.care.warehouse.web.dto.category.UpdateCategoryRequest;
import com.care.warehouse.web.mapper.CategoryWebMapper;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller for Category management.
 * 
 * All endpoints are under /api/warehouse/v1/categories
 * Tenant isolation is enforced automatically via TenantContext.
 */
@RestController
@RequestMapping("/api/warehouse/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category Management", description = "APIs for managing category tree structure")
public class CategoryController {

    // Inject use-case interfaces => decoupled from concrete service classes
    private final CreateCategoryUseCase createCategoryUseCase;
    private final UpdateCategoryUseCase updateCategoryUseCase;
    private final GetCategoryByIdUseCase getCategoryByIdUseCase;
    private final ListCategoriesAsTreeUseCase listCategoriesAsTreeUseCase;
    private final SearchCategoriesUseCase searchCategoriesUseCase;
    private final DeleteCategoryUseCase deleteCategoryUseCase;
    private final CategoryWebMapper mapper;

    @PostMapping
    @Operation(summary = "Create a new category", description = "Creates a new category with the provided data")
    @ApiResponse(responseCode = "201", description = "Category created successfully",
            content = @Content(schema = @Schema(implementation = CategoryResponse.class)))
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CreateCategoryCommand command = mapper.toCreateCommand(request);
        Category createdCategory = createCategoryUseCase.createCategory(command);
        CategoryResponse body = mapper.toResponse(createdCategory);
        return ResponseEntity
                .created(URI.create("/api/warehouse/v1/categories/" + body.getId()))
                .body(body);
    }

    @PutMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Update an existing category", description = "Updates an existing category with the provided data")
    @ApiResponse(responseCode = "200", description = "Category updated successfully",
            content = @Content(schema = @Schema(implementation = CategoryResponse.class)))
    @ApiResponse(responseCode = "404", description = "Category not found")
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        UpdateCategoryCommand command = mapper.toUpdateCommand(id, request);
        Category updatedCategory = updateCategoryUseCase.updateCategory(command);
        return ResponseEntity.ok(mapper.toResponse(updatedCategory));
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(summary = "Get category by ID", description = "Retrieves a category by its unique identifier")
    @ApiResponse(responseCode = "200", description = "Category found",
            content = @Content(schema = @Schema(implementation = CategoryResponse.class)))
    @ApiResponse(responseCode = "404", description = "Category not found")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable UUID id) {
        Optional<Category> category = getCategoryByIdUseCase.getCategoryById(id);
        return category.map(mapper::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/tree")
    @Operation(summary = "List categories as tree", 
               description = "Retrieves all categories organized as a hierarchical tree structure. " +
                           "Root categories are at the top level, with children nested recursively.")
    @ApiResponse(responseCode = "200", description = "Categories retrieved successfully")
    public ResponseEntity<List<CategoryTreeNode>> listCategoriesAsTree() {
        List<CategoryTreeNode> tree = listCategoriesAsTreeUseCase.listCategoriesAsTree();
        return ResponseEntity.ok(tree);
    }

    @GetMapping
    @Operation(summary = "Search categories with filters and pagination", 
               description = "Searches categories with optional filters (parentId, level, nameSearch, isActive) " +
                           "and pagination support. Useful for getting flat lists or filtered subsets of categories.")
    @ApiResponse(responseCode = "200", description = "Categories retrieved successfully")
    public ResponseEntity<Page<CategoryResponse>> searchCategories(
            @RequestParam(required = false) UUID parentId,
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) String nameSearch,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20) Pageable pageable) {

        // Build query from request parameters
        SearchCategoriesQuery query = SearchCategoriesQuery.builder()
                .parentId(parentId)
                .level(level)
                .nameSearch(nameSearch)
                .isActive(isActive)
                .build();

        Page<Category> categories = searchCategoriesUseCase.searchCategories(query, pageable);
        Page<CategoryResponse> responsePage = categories.map(mapper::toResponse);
        return ResponseEntity.ok(responsePage);
    }

    @DeleteMapping("/{id:[0-9a-fA-F\\-]{36}}")
    @Operation(
            summary = "Delete a category",
            description = "Soft deletes a category and all its descendants (cascade delete) by setting isDeleted = true. " +
                    "Categories will not be returned in search results but data is preserved."
    )
    @ApiResponse(responseCode = "204", description = "Category deleted successfully")
    @ApiResponse(responseCode = "404", description = "Category not found")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        deleteCategoryUseCase.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}


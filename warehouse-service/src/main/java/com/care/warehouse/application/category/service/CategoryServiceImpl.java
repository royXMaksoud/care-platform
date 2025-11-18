package com.care.warehouse.application.category.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.category.command.CreateCategoryCommand;
import com.care.warehouse.application.category.command.UpdateCategoryCommand;
import com.care.warehouse.application.category.mapper.CategoryAppMapper;
import com.care.warehouse.application.category.validation.CreateCategoryValidator;
import com.care.warehouse.application.category.validation.UpdateCategoryValidator;
import com.care.warehouse.domain.model.Category;
import com.care.warehouse.application.category.query.SearchCategoriesQuery;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.domain.ports.in.category.SearchCategoriesUseCase;
import com.care.warehouse.domain.ports.out.CategoryRepositoryPort;
import com.care.warehouse.domain.ports.out.category.CategorySearchPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.care.warehouse.web.dto.category.CategoryTreeNode;
import com.sharedlib.core.application.service.CrudApplicationService;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.filter.FilterRequest;
import com.sharedlib.core.i18n.MessageResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * CategoryServiceImpl implements use cases for Category aggregate.
 * Extends generic CrudApplicationService and injects domain-specific logic via hooks.
 */
/**
 * CategoryServiceImpl implements use cases for Category aggregate.
 * 
 * This service handles:
 * - CRUD operations for categories
 * - Tree structure management (parent-child relationships)
 * - Circular reference prevention
 * - Level and path calculation
 * - Tree building for hierarchical display
 * - Search and pagination
 * 
 * Key features:
 * - Multi-tenant isolation (enforced via TenantContext)
 * - Multilingual support (JSONB nameTranslations)
 * - Recursive tree operations with path-based queries
 * - Automatic level calculation based on parent's level
 * - Path tracking for efficient descendant queries
 * 
 * @author CARE Team
 */
@Service
public class CategoryServiceImpl
        extends CrudApplicationService<UUID, Category, CreateCategoryCommand, UpdateCategoryCommand, Category, FilterRequest>
        implements CreateCategoryUseCase, UpdateCategoryUseCase, GetCategoryByIdUseCase, 
                   ListCategoriesAsTreeUseCase, SearchCategoriesUseCase, DeleteCategoryUseCase {

    private final CreateCategoryValidator createCategoryValidator;
    private final UpdateCategoryValidator updateCategoryValidator;
    private final MessageResolver messageResolver;
    private final CategoryRepositoryPort categoryRepositoryPort;

    private final CategorySearchPort categorySearchPort;

    /**
     * Constructor for CategoryServiceImpl.
     * 
     * @param crudPort Repository port for CRUD operations
     * @param categorySearchPort Search port for search operations with pagination
     * @param mapper Mapper for converting between commands and domain models
     * @param createCategoryValidator Validator for category creation
     * @param updateCategoryValidator Validator for category updates (includes circular reference check)
     * @param messageResolver Message resolver for i18n error messages
     * @param categoryRepositoryPort Repository port for tree-specific queries
     */
    public CategoryServiceImpl(
            CategoryRepositoryPort crudPort,
            CategorySearchPort categorySearchPort,
            CategoryAppMapper mapper,
            CreateCategoryValidator createCategoryValidator,
            UpdateCategoryValidator updateCategoryValidator,
            MessageResolver messageResolver,
            CategoryRepositoryPort categoryRepositoryPort) {
        super(crudPort, categorySearchPort, mapper);
        this.categorySearchPort = categorySearchPort;
        this.createCategoryValidator = createCategoryValidator;
        this.updateCategoryValidator = updateCategoryValidator;
        this.messageResolver = messageResolver;
        this.categoryRepositoryPort = categoryRepositoryPort;
    }

    // ----------------------
    // Hooks implementations
    // ----------------------

    @Override
    protected Category beforeCreate(Category category) {
        // Enrich audit info if available
        if (category.getCreatedById() == null && CurrentUserContext.get() != null) {
            category.setCreatedById(CurrentUserContext.get().userId());
        }

        // Set tenantId from TenantContext (not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId != null && category.getTenantId() == null) {
            category.setTenantId(tenantId);
        }

        // Domain validations BEFORE persist
        createCategoryValidator.validate(category);
        
        // Calculate level and path if not set (database trigger will also do this, but we can pre-calculate)
        calculateLevelAndPath(category);
        
        return category;
    }

    @Override
    protected Category beforeUpdate(Category current, UpdateCategoryCommand cmd) {
        // Ensure tenantId is set (from TenantContext, not from client)
        UUID tenantId = TenantContext.get();
        if (tenantId != null) {
            current.setTenantId(tenantId);
        }

        // Maintain audit fields (updatedBy/updatedAt)
        if (CurrentUserContext.get() != null) {
            current.setUpdatedById(CurrentUserContext.get().userId());
        }

        // Run update validations
        updateCategoryValidator.validate(current);
        
        // If parent changed, recalculate level and path
        if (cmd.getParentId() != null && !Objects.equals(cmd.getParentId(), current.getParentId())) {
            current.setParentId(cmd.getParentId());
            calculateLevelAndPath(current);
        }
        
        return current;
    }

    @Override
    protected void afterSave(Category saved) {
        // After save, ensure path and level are correct (database trigger should handle this)
        // But we can reload to get the calculated values
        var reloaded = categoryRepositoryPort.load(saved.getId());
        if (reloaded.isPresent()) {
            Category updated = reloaded.get();
            saved.setLevel(updated.getLevel());
            saved.setPath(updated.getPath());
        }
    }

    @Override
    protected NotFoundException notFound(UUID id) {
        // i18n-friendly NotFoundException
        return new NotFoundException(
                messageResolver.getMessage("error.category.not-found", new Object[]{id.toString()})
        );
    }

    // ----------------------
    // UseCase adapters
    // ----------------------

    @Override
    @Transactional
    public Category createCategory(CreateCategoryCommand command) {
        return create(command); // uses template method + hooks
    }

    @Override
    @Transactional
    public Category updateCategory(UpdateCategoryCommand command) {
        return update(command.getId(), command); // uses template method + hooks
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Category> getCategoryById(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.category.not-found", new Object[]{id.toString()}));
        }
        
        // Load with tenant check
        Category category = getById(id);
        if (category == null || !category.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        return Optional.of(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryTreeNode> listCategoriesAsTree() {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return List.of();
        }
        
        // Get all categories for the tenant
        List<Category> allCategories = categoryRepositoryPort.findAllByTenantId(tenantId);
        
        // Build tree structure
        return buildTree(allCategories);
    }

    /**
     * Calculate level and path for a category based on its parent.
     * 
     * This method is called before persisting a category to pre-calculate
     * the level and path fields. The database trigger will also calculate these,
     * but pre-calculation allows us to use them in validation logic.
     * 
     * **Level Calculation**:
     * - Root categories (parentId = null) have level = 0
     * - Child categories have level = parent.level + 1
     * - Example: Root (0) -> Child (1) -> Grandchild (2)
     * 
     * **Path Calculation**:
     * - Root categories: "/{categoryId}"
     * - Child categories: "{parentPath}/{categoryId}"
     * - Example: "/root-id" -> "/root-id/child-id" -> "/root-id/child-id/grandchild-id"
     * 
     * The path is used for:
     * - Efficient descendant queries (using LIKE pattern matching)
     * - Circular reference detection
     * - Tree traversal optimization
     * 
     * Note: For new categories (id = null), path cannot be calculated until after save.
     * In this case, path will be set by the database trigger.
     * 
     * @param category Category to calculate level and path for
     */
    /**
     * Calculate level and path for a category based on its parent.
     * 
     * This method enforces the 3-level hierarchy constraint:
     * - Level 0 = root category (category)
     * - Level 1 = subcategory
     * - Level 2 = itemCategory
     * - Level 3+ = not allowed (will throw ValidationException)
     * 
     * @param category Category to calculate level and path for
     * @throws ValidationException if level would exceed 2 (max 3 levels)
     */
    private void calculateLevelAndPath(Category category) {
        UUID parentId = category.getParentId();
        UUID tenantId = category.getTenantId();
        
        if (parentId == null) {
            // Root category
            category.setLevel(0);
            // Path will be set after save when we have the ID
            if (category.getId() != null) {
                category.setPath("/" + category.getId());
            }
        } else {
            // Get parent category
            var parentOpt = categoryRepositoryPort.load(parentId);
            if (parentOpt.isPresent()) {
                Category parent = parentOpt.get();
                Integer newLevel = parent.getLevel() + 1;
                
                // Enforce 3-level hierarchy: level must be <= 2
                if (newLevel > 2) {
                    throw new com.sharedlib.core.exception.ValidationException(
                            "error.category.maxLevelExceeded",
                            List.of(com.sharedlib.core.dto.ErrorResponse.ValidationError.builder()
                                    .field("parentId")
                                    .code("error.category.maxLevelExceeded")
                                    .message(messageResolver.getMessage("error.category.maxLevelExceeded"))
                                    .build())
                    );
                }
                
                category.setLevel(newLevel);
                // Path will be set after save when we have the ID
                if (category.getId() != null && parent.getPath() != null) {
                    category.setPath(parent.getPath() + "/" + category.getId());
                }
            } else {
                // Parent not found, treat as root
                category.setLevel(0);
                if (category.getId() != null) {
                    category.setPath("/" + category.getId());
                }
            }
        }
    }

    /**
     * Build tree structure from flat list of categories.
     * 
     * This method converts a flat list of categories into a hierarchical tree structure.
     * 
     * **Algorithm**:
     * 1. First pass: Create a map of category ID -> CategoryTreeNode
     *    - Each category is converted to a CategoryTreeNode with empty children list
     *    - This allows O(1) lookup by ID
     * 
     * 2. Second pass: Build parent-child relationships
     *    - For each category, if it has a parentId:
     *      - Find the parent node in the map
     *      - Add current node to parent's children list
     *    - If parentId is null or parent not found, treat as root node
     * 
     * 3. Sort: Sort roots and children by display name for consistent ordering
     * 
     * **Time Complexity**: O(n) where n is the number of categories
     * **Space Complexity**: O(n) for the map and tree structure
     * 
     * **Example**:
     * Input: [A (root), B (parent=A), C (parent=A), D (parent=B)]
     * Output: [A { children: [B { children: [D] }, C] }]
     * 
     * @param categories Flat list of categories (all categories for the tenant)
     * @return List of root CategoryTreeNode objects with nested children
     */
    private List<CategoryTreeNode> buildTree(List<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return List.of();
        }
        
        // Create a map of category ID to tree node
        Map<UUID, CategoryTreeNode> nodeMap = new HashMap<>();
        
        // First pass: create all nodes
        for (Category category : categories) {
            CategoryTreeNode node = CategoryTreeNode.builder()
                    .id(category.getId())
                    .nameTranslations(category.getNameTranslations())
                    .displayName(resolveDisplayName(category.getNameTranslations()))
                    .parentId(category.getParentId())
                    .level(category.getLevel())
                    .path(category.getPath())
                    .isActive(category.getIsActive())
                    .children(new ArrayList<>())
                    .build();
            nodeMap.put(category.getId(), node);
        }
        
        // Second pass: build parent-child relationships
        List<CategoryTreeNode> roots = new ArrayList<>();
        for (Category category : categories) {
            CategoryTreeNode node = nodeMap.get(category.getId());
            UUID parentId = category.getParentId();
            
            if (parentId == null) {
                // Root node
                roots.add(node);
            } else {
                // Child node - add to parent's children
                CategoryTreeNode parent = nodeMap.get(parentId);
                if (parent != null) {
                    parent.getChildren().add(node);
                } else {
                    // Parent not found in list, treat as root
                    roots.add(node);
                }
            }
        }
        
        // Sort roots and children by creation order (or name)
        roots.sort(Comparator.comparing(CategoryTreeNode::getDisplayName));
        for (CategoryTreeNode root : roots) {
            sortChildren(root);
        }
        
        return roots;
    }

    /**
     * Recursively sort children in a tree node.
     * 
     * This method performs a depth-first traversal of the tree,
     * sorting children at each level by their display name.
     * 
     * **Recursive Algorithm**:
     * 1. Sort current node's children by displayName
     * 2. For each child, recursively sort its children
     * 3. Base case: Node with no children (leaf node) - nothing to sort
     * 
     * **Sorting Order**:
     * - Uses displayName (resolved from nameTranslations based on user language)
     * - Case-sensitive alphabetical order
     * - Ensures consistent tree display across requests
     * 
     * **Time Complexity**: O(n log n) where n is total number of nodes
     * (due to sorting at each level)
     * 
     * @param node Tree node to sort children for (recursively)
     */
    private void sortChildren(CategoryTreeNode node) {
        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            node.getChildren().sort(Comparator.comparing(CategoryTreeNode::getDisplayName));
            for (CategoryTreeNode child : node.getChildren()) {
                sortChildren(child);
            }
        }
    }

    /**
     * Resolve display name from translations based on current user language.
     * 
     * Language resolution priority:
     * 1. User's preferred language (from CurrentUserContext)
     * 2. English ("en") as fallback
     * 3. First available translation as last resort
     * 
     * @param translations Map of language codes to translated names
     * @return Resolved display name or null if translations are empty
     */
    private String resolveDisplayName(Map<String, String> translations) {
        if (translations == null || translations.isEmpty()) {
            return null;
        }
        
        String userLanguage = CurrentUserContext.getUserLanguage();
        
        // Try user's language first
        if (userLanguage != null && translations.containsKey(userLanguage)) {
            return translations.get(userLanguage);
        }
        
        // Fall back to English
        if (translations.containsKey("en")) {
            return translations.get("en");
        }
        
        // Fall back to first available translation
        return translations.values().iterator().next();
    }

    /**
     * Search categories with filters and pagination.
     * 
     * Supports filtering by:
     * - parentId: Get children of a specific category
     * - level: Get categories at a specific depth
     * - nameSearch: Search in nameTranslations (handled separately via repository)
     * - isActive: Filter by active status
     * 
     * @param query Search query with filters
     * @param pageable Pagination information (page, size, sort)
     * @return Page of categories matching the filters
     */
    @Override
    @Transactional(readOnly = true)
    public Page<Category> searchCategories(SearchCategoriesQuery query, Pageable pageable) {
        // Convert query to FilterRequest for generic search infrastructure
        FilterRequest filterRequest = query != null ? query.toFilterRequest() : new FilterRequest();
        
        // If nameSearch is provided, we need to handle it separately
        // as it requires JSONB query which is not supported by generic specification builder
        if (query != null && query.getNameSearch() != null && !query.getNameSearch().isBlank()) {
            // For name search, we'll use a different approach
            // Get all matching categories by name, then apply other filters
            UUID tenantId = TenantContext.get();
            if (tenantId != null) {
                List<Category> nameMatches = categoryRepositoryPort.findByTenantIdAndName(
                        tenantId, query.getNameSearch())
                        .map(List::of)
                        .orElse(List.of());
                
                // Filter by other criteria
                if (query.getParentId() != null) {
                    nameMatches = nameMatches.stream()
                            .filter(c -> query.getParentId().equals(c.getParentId()))
                            .toList();
                }
                if (query.getLevel() != null) {
                    nameMatches = nameMatches.stream()
                            .filter(c -> query.getLevel().equals(c.getLevel()))
                            .toList();
                }
                if (query.getIsActive() != null) {
                    nameMatches = nameMatches.stream()
                            .filter(c -> query.getIsActive().equals(c.getIsActive()))
                            .toList();
                }
                
                // Convert to page (simplified - in production, use proper pagination)
                // For now, return all results (pagination would require more complex logic)
                return new org.springframework.data.domain.PageImpl<>(nameMatches, pageable, nameMatches.size());
            }
        }
        
        // Use generic search for non-name-search queries
        return search(filterRequest, pageable);
    }

    @Override
    @Transactional
    public void deleteCategory(UUID id) {
        // Ensure tenant isolation
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            throw new NotFoundException(messageResolver.getMessage("error.category.not-found", new Object[]{id.toString()}));
        }
        
        // Load category with tenant check
        Category category = getById(id);
        if (category == null || !category.getTenantId().equals(tenantId)) {
            throw notFound(id);
        }
        
        // Check if category is already deleted
        if (Boolean.TRUE.equals(category.getIsDeleted())) {
            throw new NotFoundException(messageResolver.getMessage("error.category.not-found", new Object[]{id.toString()}));
        }
        
        // TODO: Add dependency validation (e.g., check if materials reference this category)
        // For now, we allow soft delete without dependency checks
        
        // Perform soft delete on category and all descendants (cascade)
        softDeleteCategoryAndDescendants(category, tenantId);
    }

    /**
     * Soft delete a category and all its descendants (cascade delete).
     * 
     * This method:
     * 1. Soft deletes the category itself
     * 2. Recursively soft deletes all child categories
     * 
     * @param category Category to delete
     * @param tenantId Tenant ID for isolation
     */
    private void softDeleteCategoryAndDescendants(Category category, UUID tenantId) {
        // Get all descendants using category ID
        List<Category> descendants = categoryRepositoryPort.findDescendants(tenantId, category.getId());
        
        // Soft delete all descendants first (children before parent)
        for (Category descendant : descendants) {
            if (!Boolean.TRUE.equals(descendant.getIsDeleted())) {
                descendant.setIsDeleted(true);
                descendant.setIsActive(false);
                if (CurrentUserContext.get() != null) {
                    descendant.setUpdatedById(CurrentUserContext.get().userId());
                }
                descendant.setUpdatedAt(java.time.Instant.now());
                categoryRepositoryPort.save(descendant);
            }
        }
        
        // Finally, soft delete the category itself
        category.setIsDeleted(true);
        category.setIsActive(false);
        if (CurrentUserContext.get() != null) {
            category.setUpdatedById(CurrentUserContext.get().userId());
        }
        category.setUpdatedAt(java.time.Instant.now());
        categoryRepositoryPort.save(category);
    }
}


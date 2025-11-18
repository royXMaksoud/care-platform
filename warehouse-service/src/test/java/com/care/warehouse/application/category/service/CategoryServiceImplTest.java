package com.care.warehouse.application.category.service;

import com.care.warehouse.application.category.command.CreateCategoryCommand;
import com.care.warehouse.application.category.command.UpdateCategoryCommand;
import com.care.warehouse.application.category.mapper.CategoryAppMapper;
import com.care.warehouse.application.category.validation.CreateCategoryValidator;
import com.care.warehouse.application.category.validation.UpdateCategoryValidator;
import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Category;
import com.care.warehouse.domain.ports.out.CategoryRepositoryPort;
import com.care.warehouse.domain.ports.out.category.CategorySearchPort;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.i18n.MessageResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CategoryServiceImpl.
 * 
 * Tests cover:
 * - Category creation
 * - Category update
 * - Category retrieval by ID
 * - Tree building logic
 * - Level and path calculation
 * - Tenant isolation
 * 
 * @author CARE Team
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CategoryServiceImpl Tests")
class CategoryServiceImplTest {

    @Mock
    private CategoryRepositoryPort categoryRepositoryPort;

    @Mock
    private CategorySearchPort categorySearchPort;

    @Mock
    private CategoryAppMapper categoryAppMapper;

    @Mock
    private CreateCategoryValidator createCategoryValidator;

    @Mock
    private UpdateCategoryValidator updateCategoryValidator;

    @Mock
    private MessageResolver messageResolver;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private UUID testTenantId;
    private UUID testCategoryId;
    private UUID testParentId;

    @BeforeEach
    void setUp() {
        testTenantId = UUID.randomUUID();
        testCategoryId = UUID.randomUUID();
        testParentId = UUID.randomUUID();
        
        TenantContext.set(testTenantId);
    }

    @Test
    @DisplayName("Should create category successfully")
    void shouldCreateCategory_Successfully() {
        // Given
        CreateCategoryCommand command = CreateCategoryCommand.builder()
                .nameTranslations(Map.of("en", "Test Category"))
                .parentId(null)
                .build();

        Category domainCategory = Category.builder()
                .id(testCategoryId)
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Test Category"))
                .parentId(null)
                .level(0)
                .path("/" + testCategoryId)
                .build();

        when(categoryAppMapper.fromCreate(command)).thenReturn(domainCategory);
        when(categoryRepositoryPort.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            // Ensure the saved entity has the ID
            if (saved.getId() == null) {
                saved.setId(testCategoryId);
            }
            return saved;
        });
        when(categoryAppMapper.toResponse(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepositoryPort.load(testCategoryId)).thenReturn(Optional.of(domainCategory));
        doNothing().when(createCategoryValidator).validate(any(Category.class));

        // When
        Category result = categoryService.createCategory(command);

        // Then
        assertNotNull(result);
        assertEquals(testCategoryId, result.getId());
        verify(createCategoryValidator).validate(any(Category.class));
        verify(categoryRepositoryPort).save(any(Category.class));
    }

    @Test
    @DisplayName("Should update category successfully")
    void shouldUpdateCategory_Successfully() {
        // Given
        UpdateCategoryCommand command = UpdateCategoryCommand.builder()
                .id(testCategoryId)
                .nameTranslations(Map.of("en", "Updated Category"))
                .build();

        Category existingCategory = Category.builder()
                .id(testCategoryId)
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Original Category"))
                .parentId(null)
                .level(0)
                .path("/" + testCategoryId)
                .build();

        Category updatedCategory = Category.builder()
                .id(testCategoryId)
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Updated Category"))
                .parentId(null)
                .level(0)
                .path("/" + testCategoryId)
                .build();

        when(categoryRepositoryPort.load(testCategoryId)).thenReturn(Optional.of(existingCategory));
        doAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setNameTranslations(command.getNameTranslations());
            return null;
        }).when(categoryAppMapper).updateDomain(any(Category.class), eq(command));
        when(categoryRepositoryPort.save(any(Category.class))).thenReturn(updatedCategory);
        when(categoryAppMapper.toResponse(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepositoryPort.load(testCategoryId)).thenReturn(Optional.of(updatedCategory));
        doNothing().when(updateCategoryValidator).validate(any(Category.class));

        // When
        Category result = categoryService.updateCategory(command);

        // Then
        assertNotNull(result);
        assertEquals("Updated Category", result.getNameTranslations().get("en"));
        verify(updateCategoryValidator).validate(any(Category.class));
        verify(categoryRepositoryPort).save(any(Category.class));
    }

    @Test
    @DisplayName("Should throw NotFoundException when category not found")
    void shouldThrowNotFoundException_WhenCategoryNotFound() {
        // Given
        when(categoryRepositoryPort.load(testCategoryId)).thenReturn(Optional.empty());
        when(messageResolver.getMessage(anyString(), any())).thenReturn("Category not found");

        // When & Then
        assertThrows(NotFoundException.class, 
                () -> categoryService.getCategoryById(testCategoryId));
    }

    @Test
    @DisplayName("Should throw NotFoundException when category belongs to different tenant")
    void shouldThrowNotFoundException_WhenCategoryBelongsToDifferentTenant() {
        // Given
        UUID differentTenantId = UUID.randomUUID();
        Category category = Category.builder()
                .id(testCategoryId)
                .tenantId(differentTenantId)
                .build();

        when(categoryRepositoryPort.load(testCategoryId)).thenReturn(Optional.of(category));
        when(messageResolver.getMessage(anyString(), any())).thenReturn("Category not found");

        // When & Then
        assertThrows(NotFoundException.class, 
                () -> categoryService.getCategoryById(testCategoryId));
    }

    @Test
    @DisplayName("Should build tree structure correctly")
    void shouldBuildTreeStructure_Correctly() {
        // Given
        Category root1 = Category.builder()
                .id(UUID.randomUUID())
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Root 1"))
                .parentId(null)
                .level(0)
                .path("/root1")
                .build();

        Category child1 = Category.builder()
                .id(UUID.randomUUID())
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Child 1"))
                .parentId(root1.getId())
                .level(1)
                .path("/root1/child1")
                .build();

        List<Category> allCategories = List.of(root1, child1);

        when(categoryRepositoryPort.findAllByTenantId(testTenantId)).thenReturn(allCategories);

        // When
        var tree = categoryService.listCategoriesAsTree();

        // Then
        assertNotNull(tree);
        assertEquals(1, tree.size()); // One root category
        verify(categoryRepositoryPort).findAllByTenantId(testTenantId);
    }
}


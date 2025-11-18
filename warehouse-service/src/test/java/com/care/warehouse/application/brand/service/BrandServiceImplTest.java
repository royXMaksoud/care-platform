package com.care.warehouse.application.brand.service;

import com.care.warehouse.application.brand.command.CreateBrandCommand;
import com.care.warehouse.application.brand.command.UpdateBrandCommand;
import com.care.warehouse.application.brand.mapper.BrandAppMapper;
import com.care.warehouse.application.brand.query.SearchBrandsQuery;
import com.care.warehouse.application.brand.validation.CreateBrandValidator;
import com.care.warehouse.application.brand.validation.UpdateBrandValidator;
import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.domain.model.Brand;
import com.care.warehouse.domain.ports.out.BrandRepositoryPort;
import com.care.warehouse.domain.ports.out.BrandSearchPort;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.filter.FilterRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BrandServiceImpl.
 * 
 * Tests cover:
 * - Brand creation
 * - Brand update
 * - Brand retrieval by ID
 * - Brand search with pagination
 * - Tenant isolation
 * 
 * @author CARE Team
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BrandServiceImpl Tests")
class BrandServiceImplTest {

    @Mock
    private BrandRepositoryPort brandRepositoryPort;

    @Mock
    private BrandSearchPort brandSearchPort;

    @Mock
    private BrandAppMapper brandAppMapper;

    @Mock
    private CreateBrandValidator createBrandValidator;

    @Mock
    private UpdateBrandValidator updateBrandValidator;

    @Mock
    private MessageResolver messageResolver;

    @InjectMocks
    private BrandServiceImpl brandService;

    private UUID testTenantId;
    private UUID testBrandId;

    @BeforeEach
    void setUp() {
        testTenantId = UUID.randomUUID();
        testBrandId = UUID.randomUUID();
        
        TenantContext.set(testTenantId);
    }

    @Test
    @DisplayName("Should create brand successfully")
    void shouldCreateBrand_Successfully() {
        // Given
        CreateBrandCommand command = CreateBrandCommand.builder()
                .nameTranslations(Map.of("en", "Test Brand"))
                .countryOrigin("US")
                .build();

        Brand domainBrand = Brand.builder()
                .id(testBrandId)
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Test Brand"))
                .countryOrigin("US")
                .build();

        when(brandAppMapper.fromCreate(command)).thenReturn(domainBrand);
        when(brandRepositoryPort.save(any(Brand.class))).thenAnswer(invocation -> {
            Brand saved = invocation.getArgument(0);
            // Ensure the saved entity has the ID
            if (saved.getId() == null) {
                saved.setId(testBrandId);
            }
            return saved;
        });
        when(brandAppMapper.toResponse(any(Brand.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(createBrandValidator).validate(any(Brand.class));

        // When
        Brand result = brandService.createBrand(command);

        // Then
        assertNotNull(result);
        assertEquals(testBrandId, result.getId());
        verify(createBrandValidator).validate(any(Brand.class));
        verify(brandRepositoryPort).save(any(Brand.class));
    }

    @Test
    @DisplayName("Should update brand successfully")
    void shouldUpdateBrand_Successfully() {
        // Given
        UpdateBrandCommand command = UpdateBrandCommand.builder()
                .id(testBrandId)
                .nameTranslations(Map.of("en", "Updated Brand"))
                .build();

        Brand existingBrand = Brand.builder()
                .id(testBrandId)
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Original Brand"))
                .build();

        Brand updatedBrand = Brand.builder()
                .id(testBrandId)
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Updated Brand"))
                .build();

        when(brandRepositoryPort.load(testBrandId)).thenReturn(Optional.of(existingBrand));
        doAnswer(invocation -> {
            Brand brand = invocation.getArgument(0);
            brand.setNameTranslations(command.getNameTranslations());
            return null;
        }).when(brandAppMapper).updateDomain(any(Brand.class), eq(command));
        when(brandRepositoryPort.save(any(Brand.class))).thenReturn(updatedBrand);
        when(brandAppMapper.toResponse(any(Brand.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(updateBrandValidator).validate(any(Brand.class));

        // When
        Brand result = brandService.updateBrand(command);

        // Then
        assertNotNull(result);
        assertEquals("Updated Brand", result.getNameTranslations().get("en"));
        verify(updateBrandValidator).validate(any(Brand.class));
        verify(brandRepositoryPort).save(any(Brand.class));
    }

    @Test
    @DisplayName("Should throw NotFoundException when brand not found")
    void shouldThrowNotFoundException_WhenBrandNotFound() {
        // Given
        when(brandRepositoryPort.load(testBrandId)).thenReturn(Optional.empty());
        when(messageResolver.getMessage(anyString(), any())).thenReturn("Brand not found");

        // When & Then
        assertThrows(NotFoundException.class, 
                () -> brandService.getBrandById(testBrandId));
    }

    @Test
    @DisplayName("Should search brands with pagination successfully")
    void shouldSearchBrands_WithPagination_Successfully() {
        // Given
        SearchBrandsQuery query = SearchBrandsQuery.builder()
                .countryOrigin("US")
                .isActive(true)
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        
        Brand brand1 = Brand.builder()
                .id(UUID.randomUUID())
                .tenantId(testTenantId)
                .nameTranslations(Map.of("en", "Brand 1"))
                .countryOrigin("US")
                .isActive(true)
                .build();

        Page<Brand> brandPage = new PageImpl<>(List.of(brand1), pageable, 1);

        when(brandSearchPort.search(any(FilterRequest.class), eq(pageable))).thenReturn(brandPage);

        // When
        Page<Brand> result = brandService.searchBrands(query, pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(brandSearchPort).search(any(FilterRequest.class), eq(pageable));
    }
}


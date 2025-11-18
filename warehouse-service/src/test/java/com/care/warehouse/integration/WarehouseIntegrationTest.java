package com.care.warehouse.integration;

import com.care.warehouse.infrastructure.db.entity.WarehouseEntity;
import com.care.warehouse.infrastructure.db.repository.WarehouseJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Warehouse management.
 * Tests full flow from repository to entity persistence with H2 database.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Warehouse Integration Tests")
class WarehouseIntegrationTest {

    @Autowired
    private WarehouseJpaRepository warehouseRepository;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        // Clean up any existing data
        warehouseRepository.deleteAll();
    }

    @Nested
    @DisplayName("Warehouse Creation Flow Tests")
    class WarehouseCreationFlowTests {

        @Test
        @DisplayName("Should create and persist warehouse with all fields")
        void shouldCreateAndPersistWarehouse() {
            // Given
            WarehouseEntity warehouse = WarehouseEntity.builder()
                    .tenantId(tenantId)
                    .code("WH-001")
                    .name("Main Warehouse")
                    .status("ACTIVE")
                    .isPrimary(true)
                    .capacityCubicMeters(new BigDecimal("1000.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();

            // When
            WarehouseEntity saved = warehouseRepository.save(warehouse);

            // Then
            assertNotNull(saved.getId(), "ID should be generated");
            assertEquals("WH-001", saved.getCode());
            assertEquals("Main Warehouse", saved.getName());
            assertEquals("ACTIVE", saved.getStatus());
            assertTrue(saved.getIsPrimary());
            assertEquals(new BigDecimal("1000.00"), saved.getCapacityCubicMeters());

            // Verify can be retrieved
            Optional<WarehouseEntity> retrieved = warehouseRepository.findByTenantIdAndCode(tenantId, "WH-001");
            assertTrue(retrieved.isPresent(), "Should be able to retrieve saved warehouse");
            assertEquals(saved.getId(), retrieved.get().getId());
        }

        @Test
        @DisplayName("Should enforce unique code per tenant")
        void shouldEnforceUniqueCodePerTenant() {
            // Given - create first warehouse
            WarehouseEntity warehouse1 = createWarehouse("WH-001", "Warehouse 1");
            warehouseRepository.save(warehouse1);

            // When - try to create another with same code
            WarehouseEntity warehouse2 = createWarehouse("WH-001", "Duplicate Code");

            // Then - should throw exception on save (unique constraint)
            assertThrows(Exception.class, () -> {
                warehouseRepository.saveAndFlush(warehouse2);
            }, "Should not allow duplicate code for same tenant");
        }

        @Test
        @DisplayName("Should allow same code for different tenants")
        void shouldAllowSameCodeForDifferentTenants() {
            // Given
            UUID tenant1 = UUID.randomUUID();
            UUID tenant2 = UUID.randomUUID();

            WarehouseEntity warehouse1 = WarehouseEntity.builder()
                    .tenantId(tenant1)
                    .code("WH-001")
                    .name("Tenant 1 Warehouse")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("100.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();

            WarehouseEntity warehouse2 = WarehouseEntity.builder()
                    .tenantId(tenant2)
                    .code("WH-001")
                    .name("Tenant 2 Warehouse")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("100.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();

            // When
            WarehouseEntity saved1 = warehouseRepository.save(warehouse1);
            WarehouseEntity saved2 = warehouseRepository.save(warehouse2);

            // Then
            assertNotEquals(saved1.getId(), saved2.getId(), "Different warehouses should have different IDs");
            assertEquals("WH-001", saved1.getCode());
            assertEquals("WH-001", saved2.getCode());
        }
    }

    @Nested
    @DisplayName("Warehouse Capacity Management Tests")
    class WarehouseCapacityManagementTests {

        @Test
        @DisplayName("Should update warehouse occupancy")
        void shouldUpdateWarehouseOccupancy() {
            // Given
            WarehouseEntity warehouse = createWarehouse("WH-001", "Main Warehouse");
            warehouse.setCapacityCubicMeters(new BigDecimal("1000.00"));
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("100.00"));
            WarehouseEntity saved = warehouseRepository.save(warehouse);

            // When - update occupancy
            saved.setCurrentOccupancyCubicMeters(new BigDecimal("500.00"));
            WarehouseEntity updated = warehouseRepository.save(saved);

            // Then
            assertEquals(new BigDecimal("500.00"), updated.getCurrentOccupancyCubicMeters());

            // Verify persisted
            Optional<WarehouseEntity> retrieved = warehouseRepository.findById(updated.getId());
            assertTrue(retrieved.isPresent());
            assertEquals(new BigDecimal("500.00"), retrieved.get().getCurrentOccupancyCubicMeters());
        }

        @Test
        @DisplayName("Should track warehouse utilization over time")
        void shouldTrackWarehouseUtilization() {
            // Given
            WarehouseEntity warehouse = createWarehouse("WH-001", "Main Warehouse");
            warehouse.setCapacityCubicMeters(new BigDecimal("1000.00"));
            warehouse.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);
            WarehouseEntity saved = warehouseRepository.save(warehouse);

            // When - simulate filling warehouse
            BigDecimal[] occupancyLevels = {
                    new BigDecimal("200.00"),
                    new BigDecimal("500.00"),
                    new BigDecimal("800.00"),
                    new BigDecimal("1000.00")
            };

            for (BigDecimal level : occupancyLevels) {
                saved.setCurrentOccupancyCubicMeters(level);
                saved = warehouseRepository.save(saved);
            }

            // Then
            Optional<WarehouseEntity> retrieved = warehouseRepository.findById(saved.getId());
            assertTrue(retrieved.isPresent());
            assertEquals(new BigDecimal("1000.00"), retrieved.get().getCurrentOccupancyCubicMeters(),
                    "Final occupancy should be at full capacity");
        }
    }

    @Nested
    @DisplayName("Warehouse Status Lifecycle Tests")
    class WarehouseStatusLifecycleTests {

        @Test
        @DisplayName("Should transition warehouse through status lifecycle")
        void shouldTransitionWarehouseStatus() {
            // Given
            WarehouseEntity warehouse = createWarehouse("WH-001", "Main Warehouse");
            warehouse.setStatus("ACTIVE");
            WarehouseEntity saved = warehouseRepository.save(warehouse);

            // When - transition to MAINTENANCE
            saved.setStatus("MAINTENANCE");
            WarehouseEntity maintenance = warehouseRepository.save(saved);

            // Then
            assertEquals("MAINTENANCE", maintenance.getStatus());

            // Verify not returned by active query
            Page<WarehouseEntity> activeWarehouses = warehouseRepository.findActiveByTenantId(
                    tenantId, PageRequest.of(0, 10));
            assertEquals(0, activeWarehouses.getTotalElements(), "Maintenance warehouse should not appear in active list");

            // When - transition back to ACTIVE
            maintenance.setStatus("ACTIVE");
            WarehouseEntity active = warehouseRepository.save(maintenance);

            // Then - should appear in active list again
            activeWarehouses = warehouseRepository.findActiveByTenantId(tenantId, PageRequest.of(0, 10));
            assertEquals(1, activeWarehouses.getTotalElements(), "Active warehouse should appear in active list");
        }

        @Test
        @DisplayName("Should soft delete warehouse")
        void shouldSoftDeleteWarehouse() {
            // Given
            WarehouseEntity warehouse = createWarehouse("WH-001", "Main Warehouse");
            WarehouseEntity saved = warehouseRepository.save(warehouse);
            UUID warehouseId = saved.getId();

            // When - soft delete
            saved.setIsDeleted(true);
            warehouseRepository.save(saved);

            // Then - should not be found by normal queries
            Optional<WarehouseEntity> byCode = warehouseRepository.findByTenantIdAndCode(tenantId, "WH-001");
            assertFalse(byCode.isPresent(), "Soft deleted warehouse should not be found by code");

            Optional<WarehouseEntity> byIdAndTenant = warehouseRepository.findByIdAndTenantId(warehouseId, tenantId);
            assertFalse(byIdAndTenant.isPresent(), "Soft deleted warehouse should not be found by ID and tenant");

            // But should still exist in database
            Optional<WarehouseEntity> byId = warehouseRepository.findById(warehouseId);
            assertTrue(byId.isPresent(), "Soft deleted warehouse should still exist in database");
            assertTrue(byId.get().getIsDeleted(), "IsDeleted flag should be true");
        }
    }

    @Nested
    @DisplayName("Primary Warehouse Tests")
    class PrimaryWarehouseTests {

        @Test
        @DisplayName("Should find primary warehouse for tenant")
        void shouldFindPrimaryWarehouse() {
            // Given - create multiple warehouses, one primary
            WarehouseEntity primary = createWarehouse("WH-PRIMARY", "Primary Warehouse");
            primary.setIsPrimary(true);
            warehouseRepository.save(primary);

            WarehouseEntity secondary = createWarehouse("WH-SECONDARY", "Secondary Warehouse");
            secondary.setIsPrimary(false);
            warehouseRepository.save(secondary);

            // When
            Optional<WarehouseEntity> result = warehouseRepository.findPrimaryByTenantId(tenantId);

            // Then
            assertTrue(result.isPresent(), "Should find primary warehouse");
            assertEquals("WH-PRIMARY", result.get().getCode());
            assertTrue(result.get().getIsPrimary());
        }

        @Test
        @DisplayName("Should return empty when no primary warehouse exists")
        void shouldReturnEmptyWhenNoPrimary() {
            // Given - create only non-primary warehouses
            WarehouseEntity warehouse = createWarehouse("WH-001", "Warehouse");
            warehouse.setIsPrimary(false);
            warehouseRepository.save(warehouse);

            // When
            Optional<WarehouseEntity> result = warehouseRepository.findPrimaryByTenantId(tenantId);

            // Then
            assertFalse(result.isPresent(), "Should return empty when no primary warehouse");
        }
    }

    @Nested
    @DisplayName("Multi-Tenant Isolation Tests")
    class MultiTenantIsolationTests {

        @Test
        @DisplayName("Should maintain complete tenant isolation")
        void shouldMaintainTenantIsolation() {
            // Given - warehouses for different tenants
            UUID tenant1 = UUID.randomUUID();
            UUID tenant2 = UUID.randomUUID();

            // Tenant 1 warehouses
            for (int i = 1; i <= 3; i++) {
                WarehouseEntity wh = WarehouseEntity.builder()
                        .tenantId(tenant1)
                        .code("T1-WH-00" + i)
                        .name("Tenant 1 Warehouse " + i)
                        .status("ACTIVE")
                        .isPrimary(i == 1)
                        .capacityCubicMeters(new BigDecimal("100.00"))
                        .currentOccupancyCubicMeters(BigDecimal.ZERO)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .isDeleted(false)
                        .rowVersion(0)
                        .build();
                warehouseRepository.save(wh);
            }

            // Tenant 2 warehouses
            for (int i = 1; i <= 2; i++) {
                WarehouseEntity wh = WarehouseEntity.builder()
                        .tenantId(tenant2)
                        .code("T2-WH-00" + i)
                        .name("Tenant 2 Warehouse " + i)
                        .status("ACTIVE")
                        .isPrimary(i == 1)
                        .capacityCubicMeters(new BigDecimal("200.00"))
                        .currentOccupancyCubicMeters(BigDecimal.ZERO)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .isDeleted(false)
                        .rowVersion(0)
                        .build();
                warehouseRepository.save(wh);
            }

            // When & Then
            Page<WarehouseEntity> tenant1Warehouses = warehouseRepository.findByTenantId(
                    tenant1, PageRequest.of(0, 10));
            Page<WarehouseEntity> tenant2Warehouses = warehouseRepository.findByTenantId(
                    tenant2, PageRequest.of(0, 10));

            assertEquals(3, tenant1Warehouses.getTotalElements(), "Tenant 1 should have 3 warehouses");
            assertEquals(2, tenant2Warehouses.getTotalElements(), "Tenant 2 should have 2 warehouses");

            // Verify no cross-contamination
            assertTrue(tenant1Warehouses.getContent().stream()
                            .allMatch(w -> w.getTenantId().equals(tenant1)),
                    "All tenant 1 warehouses should belong to tenant 1");
            assertTrue(tenant2Warehouses.getContent().stream()
                            .allMatch(w -> w.getTenantId().equals(tenant2)),
                    "All tenant 2 warehouses should belong to tenant 2");
        }
    }

    // Helper method to create warehouse entity
    private WarehouseEntity createWarehouse(String code, String name) {
        return WarehouseEntity.builder()
                .tenantId(tenantId)
                .code(code)
                .name(name)
                .status("ACTIVE")
                .isPrimary(false)
                .capacityCubicMeters(new BigDecimal("500.00"))
                .currentOccupancyCubicMeters(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();
    }
}

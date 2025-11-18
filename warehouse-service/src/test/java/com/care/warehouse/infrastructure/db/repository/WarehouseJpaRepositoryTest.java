package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entity.WarehouseEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository tests for WarehouseJpaRepository.
 * Uses @DataJpaTest for lightweight JPA testing with H2 database.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Warehouse JPA Repository Tests")
class WarehouseJpaRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private WarehouseJpaRepository warehouseRepository;

    private UUID tenantId;
    private UUID anotherTenantId;
    private WarehouseEntity warehouse1;
    private WarehouseEntity warehouse2;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        anotherTenantId = UUID.randomUUID();

        // Create test warehouses
        warehouse1 = WarehouseEntity.builder()
                .tenantId(tenantId)
                .code("WH-001")
                .name("Main Warehouse")
                .status("ACTIVE")
                .isPrimary(true)
                .capacityCubicMeters(new BigDecimal("1000.00"))
                .currentOccupancyCubicMeters(new BigDecimal("250.00"))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        warehouse2 = WarehouseEntity.builder()
                .tenantId(tenantId)
                .code("WH-002")
                .name("Secondary Warehouse")
                .status("INACTIVE")
                .isPrimary(false)
                .capacityCubicMeters(new BigDecimal("500.00"))
                .currentOccupancyCubicMeters(new BigDecimal("100.00"))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        entityManager.persist(warehouse1);
        entityManager.persist(warehouse2);
        entityManager.flush();
    }

    @Nested
    @DisplayName("findByTenantIdAndCode() Tests")
    class FindByTenantIdAndCodeTests {

        @Test
        @DisplayName("Should find warehouse by tenant and code")
        void findByTenantIdAndCode_ShouldReturnWarehouse_WhenExists() {
            Optional<WarehouseEntity> result = warehouseRepository.findByTenantIdAndCode(tenantId, "WH-001");

            assertTrue(result.isPresent(), "Should find warehouse by tenant and code");
            assertEquals("WH-001", result.get().getCode(), "Should return correct warehouse");
            assertEquals("Main Warehouse", result.get().getName());
        }

        @Test
        @DisplayName("Should return empty when code does not exist")
        void findByTenantIdAndCode_ShouldReturnEmpty_WhenCodeNotExists() {
            Optional<WarehouseEntity> result = warehouseRepository.findByTenantIdAndCode(tenantId, "NONEXISTENT");

            assertFalse(result.isPresent(), "Should return empty when code does not exist");
        }

        @Test
        @DisplayName("Should return empty when tenant does not match")
        void findByTenantIdAndCode_ShouldReturnEmpty_WhenTenantNotMatches() {
            Optional<WarehouseEntity> result = warehouseRepository.findByTenantIdAndCode(anotherTenantId, "WH-001");

            assertFalse(result.isPresent(), "Should return empty when tenant does not match");
        }

        @Test
        @DisplayName("Should not find deleted warehouses")
        void findByTenantIdAndCode_ShouldNotFindDeleted() {
            warehouse1.setIsDeleted(true);
            entityManager.persist(warehouse1);
            entityManager.flush();

            Optional<WarehouseEntity> result = warehouseRepository.findByTenantIdAndCode(tenantId, "WH-001");

            assertFalse(result.isPresent(), "Should not find deleted warehouse");
        }
    }

    @Nested
    @DisplayName("findByTenantId() Tests")
    class FindByTenantIdTests {

        @Test
        @DisplayName("Should find all warehouses for tenant with pagination")
        void findByTenantId_ShouldReturnPagedResults() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<WarehouseEntity> result = warehouseRepository.findByTenantId(tenantId, pageable);

            assertEquals(2, result.getTotalElements(), "Should return all warehouses for tenant");
            assertEquals(2, result.getContent().size());
        }

        @Test
        @DisplayName("Should return warehouses ordered by code")
        void findByTenantId_ShouldReturnOrderedByCode() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<WarehouseEntity> result = warehouseRepository.findByTenantId(tenantId, pageable);

            assertEquals("WH-001", result.getContent().get(0).getCode(), "Should be ordered by code ASC");
            assertEquals("WH-002", result.getContent().get(1).getCode());
        }

        @Test
        @DisplayName("Should respect pagination")
        void findByTenantId_ShouldRespectPagination() {
            Pageable pageable = PageRequest.of(0, 1);

            Page<WarehouseEntity> result = warehouseRepository.findByTenantId(tenantId, pageable);

            assertEquals(2, result.getTotalElements(), "Total elements should be 2");
            assertEquals(1, result.getContent().size(), "Page size should be 1");
            assertEquals(2, result.getTotalPages(), "Total pages should be 2");
        }

        @Test
        @DisplayName("Should return empty for non-existent tenant")
        void findByTenantId_ShouldReturnEmpty_WhenNoWarehousesForTenant() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<WarehouseEntity> result = warehouseRepository.findByTenantId(anotherTenantId, pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty for non-existent tenant");
        }

        @Test
        @DisplayName("Should not return deleted warehouses")
        void findByTenantId_ShouldNotReturnDeleted() {
            warehouse1.setIsDeleted(true);
            entityManager.persist(warehouse1);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<WarehouseEntity> result = warehouseRepository.findByTenantId(tenantId, pageable);

            assertEquals(1, result.getTotalElements(), "Should not return deleted warehouse");
        }
    }

    @Nested
    @DisplayName("findActiveByTenantId() Tests")
    class FindActiveByTenantIdTests {

        @Test
        @DisplayName("Should find only active warehouses")
        void findActiveByTenantId_ShouldReturnOnlyActive() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<WarehouseEntity> result = warehouseRepository.findActiveByTenantId(tenantId, pageable);

            assertEquals(1, result.getTotalElements(), "Should return only active warehouses");
            assertEquals("WH-001", result.getContent().get(0).getCode());
            assertEquals("ACTIVE", result.getContent().get(0).getStatus());
        }

        @Test
        @DisplayName("Should return empty when no active warehouses exist")
        void findActiveByTenantId_ShouldReturnEmpty_WhenNoActiveWarehouses() {
            warehouse1.setStatus("INACTIVE");
            entityManager.persist(warehouse1);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<WarehouseEntity> result = warehouseRepository.findActiveByTenantId(tenantId, pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty when no active warehouses");
        }
    }

    @Nested
    @DisplayName("findPrimaryByTenantId() Tests")
    class FindPrimaryByTenantIdTests {

        @Test
        @DisplayName("Should find primary warehouse for tenant")
        void findPrimaryByTenantId_ShouldReturnPrimary() {
            Optional<WarehouseEntity> result = warehouseRepository.findPrimaryByTenantId(tenantId);

            assertTrue(result.isPresent(), "Should find primary warehouse");
            assertTrue(result.get().getIsPrimary(), "Should return warehouse with isPrimary=true");
            assertEquals("WH-001", result.get().getCode());
        }

        @Test
        @DisplayName("Should return empty when no primary warehouse exists")
        void findPrimaryByTenantId_ShouldReturnEmpty_WhenNoPrimary() {
            warehouse1.setIsPrimary(false);
            entityManager.persist(warehouse1);
            entityManager.flush();

            Optional<WarehouseEntity> result = warehouseRepository.findPrimaryByTenantId(tenantId);

            assertFalse(result.isPresent(), "Should return empty when no primary warehouse");
        }

        @Test
        @DisplayName("Should not return deleted primary warehouse")
        void findPrimaryByTenantId_ShouldNotReturnDeleted() {
            warehouse1.setIsDeleted(true);
            entityManager.persist(warehouse1);
            entityManager.flush();

            Optional<WarehouseEntity> result = warehouseRepository.findPrimaryByTenantId(tenantId);

            assertFalse(result.isPresent(), "Should not return deleted primary warehouse");
        }
    }

    @Nested
    @DisplayName("findByIdAndTenantId() Tests")
    class FindByIdAndTenantIdTests {

        @Test
        @DisplayName("Should find warehouse by ID and tenant")
        void findByIdAndTenantId_ShouldReturnWarehouse() {
            Optional<WarehouseEntity> result = warehouseRepository.findByIdAndTenantId(
                    warehouse1.getId(), tenantId);

            assertTrue(result.isPresent(), "Should find warehouse by ID and tenant");
            assertEquals(warehouse1.getId(), result.get().getId());
        }

        @Test
        @DisplayName("Should return empty when tenant does not match")
        void findByIdAndTenantId_ShouldReturnEmpty_WhenTenantNotMatches() {
            Optional<WarehouseEntity> result = warehouseRepository.findByIdAndTenantId(
                    warehouse1.getId(), anotherTenantId);

            assertFalse(result.isPresent(), "Should return empty when tenant does not match");
        }

        @Test
        @DisplayName("Should return empty for non-existent ID")
        void findByIdAndTenantId_ShouldReturnEmpty_WhenIdNotExists() {
            Optional<WarehouseEntity> result = warehouseRepository.findByIdAndTenantId(
                    UUID.randomUUID(), tenantId);

            assertFalse(result.isPresent(), "Should return empty for non-existent ID");
        }

        @Test
        @DisplayName("Should not return deleted warehouse")
        void findByIdAndTenantId_ShouldNotReturnDeleted() {
            UUID warehouseId = warehouse1.getId();
            warehouse1.setIsDeleted(true);
            entityManager.persist(warehouse1);
            entityManager.flush();

            Optional<WarehouseEntity> result = warehouseRepository.findByIdAndTenantId(warehouseId, tenantId);

            assertFalse(result.isPresent(), "Should not return deleted warehouse");
        }
    }

    @Nested
    @DisplayName("Soft Delete Filtering Tests")
    class SoftDeleteFilteringTests {

        @Test
        @DisplayName("All repository methods should exclude deleted records")
        void allMethods_ShouldExcludeDeleted() {
            // Set up deleted warehouse
            WarehouseEntity deletedWarehouse = WarehouseEntity.builder()
                    .tenantId(tenantId)
                    .code("WH-DELETED")
                    .name("Deleted Warehouse")
                    .status("ACTIVE")
                    .isPrimary(false)
                    .capacityCubicMeters(new BigDecimal("100.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(true)
                    .rowVersion(0)
                    .build();
            entityManager.persist(deletedWarehouse);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 100);

            // Verify all methods exclude deleted records
            Page<WarehouseEntity> allWarehouses = warehouseRepository.findByTenantId(tenantId, pageable);
            assertTrue(allWarehouses.getContent().stream().noneMatch(w -> "WH-DELETED".equals(w.getCode())),
                    "findByTenantId should exclude deleted");

            Optional<WarehouseEntity> byCode = warehouseRepository.findByTenantIdAndCode(tenantId, "WH-DELETED");
            assertFalse(byCode.isPresent(), "findByTenantIdAndCode should exclude deleted");

            Optional<WarehouseEntity> byId = warehouseRepository.findByIdAndTenantId(deletedWarehouse.getId(), tenantId);
            assertFalse(byId.isPresent(), "findByIdAndTenantId should exclude deleted");
        }
    }

    @Nested
    @DisplayName("Tenant Isolation Tests")
    class TenantIsolationTests {

        @Test
        @DisplayName("Should maintain strict tenant isolation")
        void shouldMaintainTenantIsolation() {
            // Create warehouse for another tenant
            WarehouseEntity otherTenantWarehouse = WarehouseEntity.builder()
                    .tenantId(anotherTenantId)
                    .code("WH-OTHER")
                    .name("Other Tenant Warehouse")
                    .status("ACTIVE")
                    .isPrimary(true)
                    .capacityCubicMeters(new BigDecimal("200.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();
            entityManager.persist(otherTenantWarehouse);
            entityManager.flush();

            // Verify tenant isolation
            Pageable pageable = PageRequest.of(0, 100);

            Page<WarehouseEntity> tenant1Warehouses = warehouseRepository.findByTenantId(tenantId, pageable);
            Page<WarehouseEntity> tenant2Warehouses = warehouseRepository.findByTenantId(anotherTenantId, pageable);

            assertEquals(2, tenant1Warehouses.getTotalElements(), "Tenant 1 should see only their warehouses");
            assertEquals(1, tenant2Warehouses.getTotalElements(), "Tenant 2 should see only their warehouses");

            assertTrue(tenant1Warehouses.getContent().stream().noneMatch(w -> "WH-OTHER".equals(w.getCode())),
                    "Tenant 1 should not see other tenant's warehouse");
            assertTrue(tenant2Warehouses.getContent().stream().allMatch(w -> "WH-OTHER".equals(w.getCode())),
                    "Tenant 2 should only see their warehouse");
        }
    }
}

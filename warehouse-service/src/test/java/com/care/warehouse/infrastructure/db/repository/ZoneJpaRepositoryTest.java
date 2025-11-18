package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entity.ZoneEntity;
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
 * Repository tests for ZoneJpaRepository.
 * Uses @DataJpaTest for lightweight JPA testing with H2 database.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Zone JPA Repository Tests")
class ZoneJpaRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ZoneJpaRepository zoneRepository;

    private UUID tenantId;
    private UUID warehouseId;
    private UUID anotherWarehouseId;
    private ZoneEntity zone1;
    private ZoneEntity zone2;
    private ZoneEntity zone3;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        anotherWarehouseId = UUID.randomUUID();

        // Create test zones
        zone1 = ZoneEntity.builder()
                .tenantId(tenantId)
                .warehouseId(warehouseId)
                .code("RECV-01")
                .name("Receiving Zone 1")
                .zoneType("RECEIVING")
                .status("ACTIVE")
                .capacityCubicMeters(new BigDecimal("500.00"))
                .currentOccupancyCubicMeters(new BigDecimal("100.00"))
                .temperatureControlled(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        zone2 = ZoneEntity.builder()
                .tenantId(tenantId)
                .warehouseId(warehouseId)
                .code("STOR-01")
                .name("Storage Zone 1")
                .zoneType("STORAGE")
                .status("ACTIVE")
                .capacityCubicMeters(new BigDecimal("1000.00"))
                .currentOccupancyCubicMeters(new BigDecimal("500.00"))
                .temperatureControlled(true)
                .temperatureMin(new BigDecimal("2.00"))
                .temperatureMax(new BigDecimal("8.00"))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        zone3 = ZoneEntity.builder()
                .tenantId(tenantId)
                .warehouseId(warehouseId)
                .code("SHIP-01")
                .name("Shipping Zone 1")
                .zoneType("SHIPPING")
                .status("INACTIVE")
                .capacityCubicMeters(new BigDecimal("300.00"))
                .currentOccupancyCubicMeters(BigDecimal.ZERO)
                .temperatureControlled(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        entityManager.persist(zone1);
        entityManager.persist(zone2);
        entityManager.persist(zone3);
        entityManager.flush();
    }

    @Nested
    @DisplayName("findByWarehouseIdAndCode() Tests")
    class FindByWarehouseIdAndCodeTests {

        @Test
        @DisplayName("Should find zone by warehouse and code")
        void findByWarehouseIdAndCode_ShouldReturnZone_WhenExists() {
            Optional<ZoneEntity> result = zoneRepository.findByWarehouseIdAndCode(warehouseId, "RECV-01");

            assertTrue(result.isPresent(), "Should find zone by warehouse and code");
            assertEquals("RECV-01", result.get().getCode(), "Should return correct zone");
            assertEquals("Receiving Zone 1", result.get().getName());
        }

        @Test
        @DisplayName("Should return empty when code does not exist")
        void findByWarehouseIdAndCode_ShouldReturnEmpty_WhenCodeNotExists() {
            Optional<ZoneEntity> result = zoneRepository.findByWarehouseIdAndCode(warehouseId, "NONEXISTENT");

            assertFalse(result.isPresent(), "Should return empty when code does not exist");
        }

        @Test
        @DisplayName("Should return empty when warehouse does not match")
        void findByWarehouseIdAndCode_ShouldReturnEmpty_WhenWarehouseNotMatches() {
            Optional<ZoneEntity> result = zoneRepository.findByWarehouseIdAndCode(anotherWarehouseId, "RECV-01");

            assertFalse(result.isPresent(), "Should return empty when warehouse does not match");
        }

        @Test
        @DisplayName("Should not find deleted zones")
        void findByWarehouseIdAndCode_ShouldNotFindDeleted() {
            zone1.setIsDeleted(true);
            entityManager.persist(zone1);
            entityManager.flush();

            Optional<ZoneEntity> result = zoneRepository.findByWarehouseIdAndCode(warehouseId, "RECV-01");

            assertFalse(result.isPresent(), "Should not find deleted zone");
        }
    }

    @Nested
    @DisplayName("findByWarehouseId() Tests")
    class FindByWarehouseIdTests {

        @Test
        @DisplayName("Should find all zones in warehouse with pagination")
        void findByWarehouseId_ShouldReturnPagedResults() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<ZoneEntity> result = zoneRepository.findByWarehouseId(warehouseId, pageable);

            assertEquals(3, result.getTotalElements(), "Should return all zones in warehouse");
            assertEquals(3, result.getContent().size());
        }

        @Test
        @DisplayName("Should return zones ordered by code")
        void findByWarehouseId_ShouldReturnOrderedByCode() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<ZoneEntity> result = zoneRepository.findByWarehouseId(warehouseId, pageable);

            assertEquals("RECV-01", result.getContent().get(0).getCode(), "Should be ordered by code ASC");
            assertEquals("SHIP-01", result.getContent().get(1).getCode());
            assertEquals("STOR-01", result.getContent().get(2).getCode());
        }

        @Test
        @DisplayName("Should respect pagination")
        void findByWarehouseId_ShouldRespectPagination() {
            Pageable pageable = PageRequest.of(0, 2);

            Page<ZoneEntity> result = zoneRepository.findByWarehouseId(warehouseId, pageable);

            assertEquals(3, result.getTotalElements(), "Total elements should be 3");
            assertEquals(2, result.getContent().size(), "Page size should be 2");
            assertEquals(2, result.getTotalPages(), "Total pages should be 2");
        }

        @Test
        @DisplayName("Should return empty for non-existent warehouse")
        void findByWarehouseId_ShouldReturnEmpty_WhenNoZonesForWarehouse() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<ZoneEntity> result = zoneRepository.findByWarehouseId(anotherWarehouseId, pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty for non-existent warehouse");
        }

        @Test
        @DisplayName("Should not return deleted zones")
        void findByWarehouseId_ShouldNotReturnDeleted() {
            zone1.setIsDeleted(true);
            entityManager.persist(zone1);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<ZoneEntity> result = zoneRepository.findByWarehouseId(warehouseId, pageable);

            assertEquals(2, result.getTotalElements(), "Should not return deleted zone");
        }
    }

    @Nested
    @DisplayName("findActiveByWarehouseId() Tests")
    class FindActiveByWarehouseIdTests {

        @Test
        @DisplayName("Should find only active zones")
        void findActiveByWarehouseId_ShouldReturnOnlyActive() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<ZoneEntity> result = zoneRepository.findActiveByWarehouseId(warehouseId, pageable);

            assertEquals(2, result.getTotalElements(), "Should return only active zones");
            assertTrue(result.getContent().stream().allMatch(z -> "ACTIVE".equals(z.getStatus())),
                    "All returned zones should be active");
        }

        @Test
        @DisplayName("Should return empty when no active zones exist")
        void findActiveByWarehouseId_ShouldReturnEmpty_WhenNoActiveZones() {
            zone1.setStatus("INACTIVE");
            zone2.setStatus("MAINTENANCE");
            entityManager.persist(zone1);
            entityManager.persist(zone2);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<ZoneEntity> result = zoneRepository.findActiveByWarehouseId(warehouseId, pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty when no active zones");
        }
    }

    @Nested
    @DisplayName("findByWarehouseIdAndZoneType() Tests")
    class FindByWarehouseIdAndZoneTypeTests {

        @Test
        @DisplayName("Should find zones by type")
        void findByWarehouseIdAndZoneType_ShouldReturnZonesOfType() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<ZoneEntity> result = zoneRepository.findByWarehouseIdAndZoneType(warehouseId, "STORAGE", pageable);

            assertEquals(1, result.getTotalElements(), "Should return only storage zones");
            assertEquals("STORAGE", result.getContent().get(0).getZoneType());
        }

        @Test
        @DisplayName("Should return empty when no zones of type exist")
        void findByWarehouseIdAndZoneType_ShouldReturnEmpty_WhenNoZonesOfType() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<ZoneEntity> result = zoneRepository.findByWarehouseIdAndZoneType(warehouseId, "PICKING", pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty when no zones of type");
        }
    }

    @Nested
    @DisplayName("findByIdAndTenantId() Tests")
    class FindByIdAndTenantIdTests {

        @Test
        @DisplayName("Should find zone by ID and tenant")
        void findByIdAndTenantId_ShouldReturnZone() {
            Optional<ZoneEntity> result = zoneRepository.findByIdAndTenantId(zone1.getId(), tenantId);

            assertTrue(result.isPresent(), "Should find zone by ID and tenant");
            assertEquals(zone1.getId(), result.get().getId());
        }

        @Test
        @DisplayName("Should return empty when tenant does not match")
        void findByIdAndTenantId_ShouldReturnEmpty_WhenTenantNotMatches() {
            UUID anotherTenantId = UUID.randomUUID();

            Optional<ZoneEntity> result = zoneRepository.findByIdAndTenantId(zone1.getId(), anotherTenantId);

            assertFalse(result.isPresent(), "Should return empty when tenant does not match");
        }

        @Test
        @DisplayName("Should not return deleted zone")
        void findByIdAndTenantId_ShouldNotReturnDeleted() {
            UUID zoneId = zone1.getId();
            zone1.setIsDeleted(true);
            entityManager.persist(zone1);
            entityManager.flush();

            Optional<ZoneEntity> result = zoneRepository.findByIdAndTenantId(zoneId, tenantId);

            assertFalse(result.isPresent(), "Should not return deleted zone");
        }
    }

    @Nested
    @DisplayName("findTemperatureControlledZones() Tests")
    class FindTemperatureControlledZonesTests {

        @Test
        @DisplayName("Should find temperature controlled zones")
        void findTemperatureControlledZones_ShouldReturnControlledZones() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<ZoneEntity> result = zoneRepository.findTemperatureControlledZones(warehouseId, pageable);

            assertEquals(1, result.getTotalElements(), "Should return only temperature controlled zones");
            assertTrue(result.getContent().get(0).getTemperatureControlled(),
                    "Returned zone should be temperature controlled");
            assertEquals("STOR-01", result.getContent().get(0).getCode());
        }

        @Test
        @DisplayName("Should return empty when no temperature controlled zones exist")
        void findTemperatureControlledZones_ShouldReturnEmpty_WhenNoControlledZones() {
            zone2.setTemperatureControlled(false);
            entityManager.persist(zone2);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<ZoneEntity> result = zoneRepository.findTemperatureControlledZones(warehouseId, pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty when no temperature controlled zones");
        }

        @Test
        @DisplayName("Should not return deleted temperature controlled zones")
        void findTemperatureControlledZones_ShouldNotReturnDeleted() {
            zone2.setIsDeleted(true);
            entityManager.persist(zone2);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<ZoneEntity> result = zoneRepository.findTemperatureControlledZones(warehouseId, pageable);

            assertEquals(0, result.getTotalElements(), "Should not return deleted temperature controlled zones");
        }
    }

    @Nested
    @DisplayName("Warehouse Isolation Tests")
    class WarehouseIsolationTests {

        @Test
        @DisplayName("Should maintain strict warehouse isolation")
        void shouldMaintainWarehouseIsolation() {
            // Create zone in another warehouse
            ZoneEntity otherWarehouseZone = ZoneEntity.builder()
                    .tenantId(tenantId)
                    .warehouseId(anotherWarehouseId)
                    .code("OTHER-01")
                    .name("Other Warehouse Zone")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("200.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .temperatureControlled(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();
            entityManager.persist(otherWarehouseZone);
            entityManager.flush();

            // Verify warehouse isolation
            Pageable pageable = PageRequest.of(0, 100);

            Page<ZoneEntity> warehouse1Zones = zoneRepository.findByWarehouseId(warehouseId, pageable);
            Page<ZoneEntity> warehouse2Zones = zoneRepository.findByWarehouseId(anotherWarehouseId, pageable);

            assertEquals(3, warehouse1Zones.getTotalElements(), "Warehouse 1 should see only their zones");
            assertEquals(1, warehouse2Zones.getTotalElements(), "Warehouse 2 should see only their zones");

            assertTrue(warehouse1Zones.getContent().stream().noneMatch(z -> "OTHER-01".equals(z.getCode())),
                    "Warehouse 1 should not see other warehouse's zone");
        }
    }
}

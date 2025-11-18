package com.care.warehouse.integration;

import com.care.warehouse.infrastructure.db.entity.ZoneEntity;
import com.care.warehouse.infrastructure.db.repository.ZoneJpaRepository;
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
 * Integration tests for Zone management.
 * Tests zone operations within warehouse context.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Zone Integration Tests")
class ZoneIntegrationTest {

    @Autowired
    private ZoneJpaRepository zoneRepository;

    private UUID tenantId;
    private UUID warehouseId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        zoneRepository.deleteAll();
    }

    @Nested
    @DisplayName("Zone Creation within Warehouse Tests")
    class ZoneCreationTests {

        @Test
        @DisplayName("Should create zone within warehouse")
        void shouldCreateZoneWithinWarehouse() {
            // Given
            ZoneEntity zone = createZone("STOR-01", "Storage Zone 1", "STORAGE");

            // When
            ZoneEntity saved = zoneRepository.save(zone);

            // Then
            assertNotNull(saved.getId(), "Zone ID should be generated");
            assertEquals(warehouseId, saved.getWarehouseId(), "Zone should belong to warehouse");
            assertEquals("STOR-01", saved.getCode());
            assertEquals("STORAGE", saved.getZoneType());
        }

        @Test
        @DisplayName("Should create multiple zones in same warehouse")
        void shouldCreateMultipleZonesInWarehouse() {
            // Given & When
            zoneRepository.save(createZone("RECV-01", "Receiving Zone", "RECEIVING"));
            zoneRepository.save(createZone("STOR-01", "Storage Zone", "STORAGE"));
            zoneRepository.save(createZone("SHIP-01", "Shipping Zone", "SHIPPING"));

            // Then
            Page<ZoneEntity> zones = zoneRepository.findByWarehouseId(warehouseId, PageRequest.of(0, 10));
            assertEquals(3, zones.getTotalElements(), "Should have 3 zones in warehouse");
        }

        @Test
        @DisplayName("Should allow same zone code in different warehouses")
        void shouldAllowSameCodeInDifferentWarehouses() {
            // Given
            UUID warehouse1 = UUID.randomUUID();
            UUID warehouse2 = UUID.randomUUID();

            ZoneEntity zone1 = ZoneEntity.builder()
                    .tenantId(tenantId)
                    .warehouseId(warehouse1)
                    .code("STOR-01")
                    .name("Storage 1")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("100.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .temperatureControlled(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();

            ZoneEntity zone2 = ZoneEntity.builder()
                    .tenantId(tenantId)
                    .warehouseId(warehouse2)
                    .code("STOR-01")
                    .name("Storage 2")
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

            // When
            ZoneEntity saved1 = zoneRepository.save(zone1);
            ZoneEntity saved2 = zoneRepository.save(zone2);

            // Then
            assertNotEquals(saved1.getId(), saved2.getId());
            assertEquals("STOR-01", saved1.getCode());
            assertEquals("STOR-01", saved2.getCode());
        }
    }

    @Nested
    @DisplayName("Zone Capacity Cascading Tests")
    class ZoneCapacityCascadingTests {

        @Test
        @DisplayName("Should track zone capacity independently")
        void shouldTrackZoneCapacityIndependently() {
            // Given
            ZoneEntity zone1 = createZone("STOR-01", "Storage 1", "STORAGE");
            zone1.setCapacityCubicMeters(new BigDecimal("500.00"));
            zone1.setCurrentOccupancyCubicMeters(new BigDecimal("100.00"));

            ZoneEntity zone2 = createZone("STOR-02", "Storage 2", "STORAGE");
            zone2.setCapacityCubicMeters(new BigDecimal("300.00"));
            zone2.setCurrentOccupancyCubicMeters(new BigDecimal("200.00"));

            zoneRepository.save(zone1);
            zoneRepository.save(zone2);

            // When - update zone1 occupancy
            Optional<ZoneEntity> retrieved = zoneRepository.findByWarehouseIdAndCode(warehouseId, "STOR-01");
            assertTrue(retrieved.isPresent());
            retrieved.get().setCurrentOccupancyCubicMeters(new BigDecimal("400.00"));
            zoneRepository.save(retrieved.get());

            // Then - zone2 should be unaffected
            Optional<ZoneEntity> zone2Retrieved = zoneRepository.findByWarehouseIdAndCode(warehouseId, "STOR-02");
            assertTrue(zone2Retrieved.isPresent());
            assertEquals(new BigDecimal("200.00"), zone2Retrieved.get().getCurrentOccupancyCubicMeters(),
                    "Zone 2 occupancy should be unchanged");
        }

        @Test
        @DisplayName("Should calculate total warehouse capacity from zones")
        void shouldCalculateTotalWarehouseCapacity() {
            // Given - create zones with different capacities
            ZoneEntity zone1 = createZone("STOR-01", "Storage 1", "STORAGE");
            zone1.setCapacityCubicMeters(new BigDecimal("500.00"));

            ZoneEntity zone2 = createZone("STOR-02", "Storage 2", "STORAGE");
            zone2.setCapacityCubicMeters(new BigDecimal("300.00"));

            ZoneEntity zone3 = createZone("RECV-01", "Receiving", "RECEIVING");
            zone3.setCapacityCubicMeters(new BigDecimal("200.00"));

            zoneRepository.save(zone1);
            zoneRepository.save(zone2);
            zoneRepository.save(zone3);

            // When
            Page<ZoneEntity> allZones = zoneRepository.findByWarehouseId(warehouseId, PageRequest.of(0, 100));

            // Then - calculate total capacity
            BigDecimal totalCapacity = allZones.getContent().stream()
                    .map(ZoneEntity::getCapacityCubicMeters)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            assertEquals(new BigDecimal("1000.00"), totalCapacity, "Total capacity should be 1000");
        }
    }

    @Nested
    @DisplayName("Temperature Controlled Zone Tests")
    class TemperatureControlledZoneTests {

        @Test
        @DisplayName("Should find temperature controlled zones")
        void shouldFindTemperatureControlledZones() {
            // Given
            ZoneEntity coldZone = createZone("COLD-01", "Cold Storage", "STORAGE");
            coldZone.setTemperatureControlled(true);
            coldZone.setTemperatureMin(new BigDecimal("2.00"));
            coldZone.setTemperatureMax(new BigDecimal("8.00"));
            zoneRepository.save(coldZone);

            ZoneEntity freezerZone = createZone("FREEZE-01", "Freezer", "STORAGE");
            freezerZone.setTemperatureControlled(true);
            freezerZone.setTemperatureMin(new BigDecimal("-25.00"));
            freezerZone.setTemperatureMax(new BigDecimal("-18.00"));
            zoneRepository.save(freezerZone);

            ZoneEntity normalZone = createZone("STOR-01", "Normal Storage", "STORAGE");
            normalZone.setTemperatureControlled(false);
            zoneRepository.save(normalZone);

            // When
            Page<ZoneEntity> tempControlled = zoneRepository.findTemperatureControlledZones(
                    warehouseId, PageRequest.of(0, 10));

            // Then
            assertEquals(2, tempControlled.getTotalElements(), "Should find 2 temperature controlled zones");
            assertTrue(tempControlled.getContent().stream()
                            .allMatch(ZoneEntity::getTemperatureControlled),
                    "All returned zones should be temperature controlled");
        }

        @Test
        @DisplayName("Should store temperature ranges correctly")
        void shouldStoreTemperatureRanges() {
            // Given
            ZoneEntity zone = createZone("COLD-01", "Cold Storage", "STORAGE");
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(new BigDecimal("-5.50"));
            zone.setTemperatureMax(new BigDecimal("4.75"));

            // When
            ZoneEntity saved = zoneRepository.save(zone);

            // Then
            Optional<ZoneEntity> retrieved = zoneRepository.findById(saved.getId());
            assertTrue(retrieved.isPresent());
            assertEquals(new BigDecimal("-5.50"), retrieved.get().getTemperatureMin());
            assertEquals(new BigDecimal("4.75"), retrieved.get().getTemperatureMax());
        }
    }

    @Nested
    @DisplayName("Zone Type Filtering Tests")
    class ZoneTypeFilteringTests {

        @Test
        @DisplayName("Should filter zones by type")
        void shouldFilterZonesByType() {
            // Given - create zones of different types
            zoneRepository.save(createZone("RECV-01", "Receiving 1", "RECEIVING"));
            zoneRepository.save(createZone("RECV-02", "Receiving 2", "RECEIVING"));
            zoneRepository.save(createZone("STOR-01", "Storage 1", "STORAGE"));
            zoneRepository.save(createZone("SHIP-01", "Shipping 1", "SHIPPING"));

            // When
            Page<ZoneEntity> receivingZones = zoneRepository.findByWarehouseIdAndZoneType(
                    warehouseId, "RECEIVING", PageRequest.of(0, 10));
            Page<ZoneEntity> storageZones = zoneRepository.findByWarehouseIdAndZoneType(
                    warehouseId, "STORAGE", PageRequest.of(0, 10));

            // Then
            assertEquals(2, receivingZones.getTotalElements(), "Should have 2 receiving zones");
            assertEquals(1, storageZones.getTotalElements(), "Should have 1 storage zone");
        }
    }

    @Nested
    @DisplayName("Zone Soft Delete Tests")
    class ZoneSoftDeleteTests {

        @Test
        @DisplayName("Should soft delete zone")
        void shouldSoftDeleteZone() {
            // Given
            ZoneEntity zone = createZone("STOR-01", "Storage", "STORAGE");
            ZoneEntity saved = zoneRepository.save(zone);
            UUID zoneId = saved.getId();

            // When - soft delete
            saved.setIsDeleted(true);
            zoneRepository.save(saved);

            // Then - should not be found by normal queries
            Optional<ZoneEntity> byCode = zoneRepository.findByWarehouseIdAndCode(warehouseId, "STOR-01");
            assertFalse(byCode.isPresent(), "Soft deleted zone should not be found");

            Page<ZoneEntity> allZones = zoneRepository.findByWarehouseId(warehouseId, PageRequest.of(0, 10));
            assertEquals(0, allZones.getTotalElements(), "Soft deleted zones should not appear in list");

            // But should still exist in database
            Optional<ZoneEntity> byId = zoneRepository.findById(zoneId);
            assertTrue(byId.isPresent(), "Soft deleted zone should still exist");
            assertTrue(byId.get().getIsDeleted());
        }
    }

    // Helper method
    private ZoneEntity createZone(String code, String name, String zoneType) {
        return ZoneEntity.builder()
                .tenantId(tenantId)
                .warehouseId(warehouseId)
                .code(code)
                .name(name)
                .zoneType(zoneType)
                .status("ACTIVE")
                .capacityCubicMeters(new BigDecimal("100.00"))
                .currentOccupancyCubicMeters(BigDecimal.ZERO)
                .temperatureControlled(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();
    }
}

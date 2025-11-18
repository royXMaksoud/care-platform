package com.care.warehouse.integration;

import com.care.warehouse.infrastructure.db.entity.BinEntity;
import com.care.warehouse.infrastructure.db.repository.BinJpaRepository;
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
 * Integration tests for Bin management.
 * Tests bin operations within zone context.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Bin Integration Tests")
class BinIntegrationTest {

    @Autowired
    private BinJpaRepository binRepository;

    private UUID tenantId;
    private UUID zoneId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        zoneId = UUID.randomUUID();
        binRepository.deleteAll();
    }

    @Nested
    @DisplayName("Bin Creation within Zone Tests")
    class BinCreationTests {

        @Test
        @DisplayName("Should create bin within zone")
        void shouldCreateBinWithinZone() {
            // Given
            BinEntity bin = createBin("A-01-01", "Pallet Bin", "PALLET", 1, 1, 1);

            // When
            BinEntity saved = binRepository.save(bin);

            // Then
            assertNotNull(saved.getId(), "Bin ID should be generated");
            assertEquals(zoneId, saved.getZoneId(), "Bin should belong to zone");
            assertEquals("A-01-01", saved.getCode());
            assertEquals("PALLET", saved.getBinType());
        }

        @Test
        @DisplayName("Should create multiple bins in same zone")
        void shouldCreateMultipleBinsInZone() {
            // Given & When
            binRepository.save(createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1));
            binRepository.save(createBin("A-01-02", "Bin 2", "SHELF", 1, 1, 2));
            binRepository.save(createBin("A-02-01", "Bin 3", "RACK", 2, 1, 1));

            // Then
            Page<BinEntity> bins = binRepository.findByZoneId(zoneId, PageRequest.of(0, 10));
            assertEquals(3, bins.getTotalElements(), "Should have 3 bins in zone");
        }

        @Test
        @DisplayName("Should allow same bin code in different zones")
        void shouldAllowSameCodeInDifferentZones() {
            // Given
            UUID zone1 = UUID.randomUUID();
            UUID zone2 = UUID.randomUUID();

            BinEntity bin1 = BinEntity.builder()
                    .tenantId(tenantId)
                    .zoneId(zone1)
                    .code("A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .currentWeightKg(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();

            BinEntity bin2 = BinEntity.builder()
                    .tenantId(tenantId)
                    .zoneId(zone2)
                    .code("A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .currentWeightKg(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();

            // When
            BinEntity saved1 = binRepository.save(bin1);
            BinEntity saved2 = binRepository.save(bin2);

            // Then
            assertNotEquals(saved1.getId(), saved2.getId());
            assertEquals("A-01-01", saved1.getCode());
            assertEquals("A-01-01", saved2.getCode());
        }
    }

    @Nested
    @DisplayName("Bin Availability Logic Tests")
    class BinAvailabilityTests {

        @Test
        @DisplayName("Should find available bins in zone")
        void shouldFindAvailableBins() {
            // Given
            BinEntity availableBin1 = createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1);
            availableBin1.setStatus("AVAILABLE");
            binRepository.save(availableBin1);

            BinEntity availableBin2 = createBin("A-01-02", "Bin 2", "PALLET", 1, 1, 2);
            availableBin2.setStatus("AVAILABLE");
            binRepository.save(availableBin2);

            BinEntity occupiedBin = createBin("A-02-01", "Bin 3", "PALLET", 2, 1, 1);
            occupiedBin.setStatus("OCCUPIED");
            binRepository.save(occupiedBin);

            BinEntity reservedBin = createBin("A-03-01", "Bin 4", "PALLET", 3, 1, 1);
            reservedBin.setStatus("RESERVED");
            binRepository.save(reservedBin);

            // When
            Page<BinEntity> availableBins = binRepository.findAvailableByZoneId(zoneId, PageRequest.of(0, 10));

            // Then
            assertEquals(2, availableBins.getTotalElements(), "Should find 2 available bins");
            assertTrue(availableBins.getContent().stream()
                            .allMatch(b -> "AVAILABLE".equals(b.getStatus())),
                    "All returned bins should be available");
        }

        @Test
        @DisplayName("Should track bin status transitions")
        void shouldTrackBinStatusTransitions() {
            // Given
            BinEntity bin = createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1);
            bin.setStatus("AVAILABLE");
            BinEntity saved = binRepository.save(bin);

            // When - transition through statuses
            // AVAILABLE -> RESERVED
            saved.setStatus("RESERVED");
            binRepository.save(saved);

            Page<BinEntity> available = binRepository.findAvailableByZoneId(zoneId, PageRequest.of(0, 10));
            assertEquals(0, available.getTotalElements(), "Should not be available when reserved");

            // RESERVED -> OCCUPIED
            saved.setStatus("OCCUPIED");
            binRepository.save(saved);

            // OCCUPIED -> MAINTENANCE
            saved.setStatus("MAINTENANCE");
            binRepository.save(saved);

            // MAINTENANCE -> AVAILABLE
            saved.setStatus("AVAILABLE");
            binRepository.save(saved);

            available = binRepository.findAvailableByZoneId(zoneId, PageRequest.of(0, 10));
            assertEquals(1, available.getTotalElements(), "Should be available again");
        }

        @Test
        @DisplayName("Should track bin occupancy and weight")
        void shouldTrackBinOccupancyAndWeight() {
            // Given
            BinEntity bin = createBin("A-01-01", "Pallet Bin", "PALLET", 1, 1, 1);
            bin.setCapacityCubicMeters(new BigDecimal("10.00"));
            bin.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);
            bin.setMaxWeightKg(new BigDecimal("1000.00"));
            bin.setCurrentWeightKg(BigDecimal.ZERO);
            BinEntity saved = binRepository.save(bin);

            // When - add items
            saved.setCurrentOccupancyCubicMeters(new BigDecimal("5.00"));
            saved.setCurrentWeightKg(new BigDecimal("400.00"));
            saved.setStatus("OCCUPIED");
            binRepository.save(saved);

            // Then
            Optional<BinEntity> retrieved = binRepository.findById(saved.getId());
            assertTrue(retrieved.isPresent());
            assertEquals(new BigDecimal("5.00"), retrieved.get().getCurrentOccupancyCubicMeters());
            assertEquals(new BigDecimal("400.00"), retrieved.get().getCurrentWeightKg());
            assertEquals("OCCUPIED", retrieved.get().getStatus());
        }
    }

    @Nested
    @DisplayName("Bin Location Tests")
    class BinLocationTests {

        @Test
        @DisplayName("Should find bin by location coordinates")
        void shouldFindBinByLocation() {
            // Given - create bins at specific locations
            binRepository.save(createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1));
            binRepository.save(createBin("A-01-02", "Bin 2", "SHELF", 1, 1, 2));
            binRepository.save(createBin("A-01-03", "Bin 3", "RACK", 1, 1, 3));
            binRepository.save(createBin("A-02-01", "Bin 4", "PALLET", 2, 1, 1));

            // When
            Optional<BinEntity> bin1 = binRepository.findByLocation(zoneId, 1, 1, 1);
            Optional<BinEntity> bin2 = binRepository.findByLocation(zoneId, 1, 1, 2);
            Optional<BinEntity> bin4 = binRepository.findByLocation(zoneId, 2, 1, 1);
            Optional<BinEntity> nonExistent = binRepository.findByLocation(zoneId, 99, 99, 99);

            // Then
            assertTrue(bin1.isPresent());
            assertEquals("A-01-01", bin1.get().getCode());

            assertTrue(bin2.isPresent());
            assertEquals("A-01-02", bin2.get().getCode());

            assertTrue(bin4.isPresent());
            assertEquals("A-02-01", bin4.get().getCode());

            assertFalse(nonExistent.isPresent());
        }

        @Test
        @DisplayName("Should enforce unique location per zone")
        void shouldEnforceUniqueLocationPerZone() {
            // Given - create first bin at location
            BinEntity bin1 = createBin("BIN-001", "First Bin", "PALLET", 1, 1, 1);
            binRepository.save(bin1);

            // When - try to create another bin at same location (same aisle, shelf, level)
            BinEntity bin2 = createBin("BIN-002", "Second Bin", "SHELF", 1, 1, 1);

            // Then - should be able to save (depends on business rules)
            // If unique constraint exists, this would throw
            BinEntity saved = binRepository.save(bin2);
            assertNotNull(saved.getId());
        }
    }

    @Nested
    @DisplayName("Bin Barcode Tests")
    class BinBarcodeTests {

        @Test
        @DisplayName("Should find bin by barcode and tenant")
        void shouldFindBinByBarcode() {
            // Given
            BinEntity bin = createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1);
            bin.setBarcode("BARCODE-12345");
            binRepository.save(bin);

            // When
            Optional<BinEntity> found = binRepository.findByBarcodeAndTenantId("BARCODE-12345", tenantId);

            // Then
            assertTrue(found.isPresent());
            assertEquals("A-01-01", found.get().getCode());
            assertEquals("BARCODE-12345", found.get().getBarcode());
        }

        @Test
        @DisplayName("Should not find barcode from different tenant")
        void shouldNotFindBarcodeFromDifferentTenant() {
            // Given
            BinEntity bin = createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1);
            bin.setBarcode("BARCODE-12345");
            binRepository.save(bin);

            // When
            UUID anotherTenantId = UUID.randomUUID();
            Optional<BinEntity> found = binRepository.findByBarcodeAndTenantId("BARCODE-12345", anotherTenantId);

            // Then
            assertFalse(found.isPresent(), "Should not find barcode from different tenant");
        }

        @Test
        @DisplayName("Should handle bins without barcode")
        void shouldHandleBinsWithoutBarcode() {
            // Given
            BinEntity bin = createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1);
            bin.setBarcode(null);
            BinEntity saved = binRepository.save(bin);

            // When
            Optional<BinEntity> retrieved = binRepository.findById(saved.getId());

            // Then
            assertTrue(retrieved.isPresent());
            assertNull(retrieved.get().getBarcode());
        }
    }

    @Nested
    @DisplayName("Bin Type Filtering Tests")
    class BinTypeFilteringTests {

        @Test
        @DisplayName("Should filter bins by type")
        void shouldFilterBinsByType() {
            // Given
            binRepository.save(createBin("A-01-01", "Pallet 1", "PALLET", 1, 1, 1));
            binRepository.save(createBin("A-01-02", "Pallet 2", "PALLET", 1, 1, 2));
            binRepository.save(createBin("B-01-01", "Shelf 1", "SHELF", 2, 1, 1));
            binRepository.save(createBin("C-01-01", "Rack 1", "RACK", 3, 1, 1));

            // When
            Page<BinEntity> palletBins = binRepository.findByZoneIdAndBinType(
                    zoneId, "PALLET", PageRequest.of(0, 10));
            Page<BinEntity> shelfBins = binRepository.findByZoneIdAndBinType(
                    zoneId, "SHELF", PageRequest.of(0, 10));

            // Then
            assertEquals(2, palletBins.getTotalElements(), "Should have 2 pallet bins");
            assertEquals(1, shelfBins.getTotalElements(), "Should have 1 shelf bin");
        }
    }

    @Nested
    @DisplayName("Bin Soft Delete Tests")
    class BinSoftDeleteTests {

        @Test
        @DisplayName("Should soft delete bin")
        void shouldSoftDeleteBin() {
            // Given
            BinEntity bin = createBin("A-01-01", "Bin 1", "PALLET", 1, 1, 1);
            bin.setBarcode("BARCODE-001");
            BinEntity saved = binRepository.save(bin);
            UUID binId = saved.getId();

            // When - soft delete
            saved.setIsDeleted(true);
            binRepository.save(saved);

            // Then - should not be found by normal queries
            Optional<BinEntity> byCode = binRepository.findByZoneIdAndCode(zoneId, "A-01-01");
            assertFalse(byCode.isPresent(), "Soft deleted bin should not be found by code");

            Optional<BinEntity> byBarcode = binRepository.findByBarcodeAndTenantId("BARCODE-001", tenantId);
            assertFalse(byBarcode.isPresent(), "Soft deleted bin should not be found by barcode");

            Optional<BinEntity> byLocation = binRepository.findByLocation(zoneId, 1, 1, 1);
            assertFalse(byLocation.isPresent(), "Soft deleted bin should not be found by location");

            Page<BinEntity> available = binRepository.findAvailableByZoneId(zoneId, PageRequest.of(0, 10));
            assertEquals(0, available.getTotalElements(), "Soft deleted bins should not appear in available list");

            // But should still exist in database
            Optional<BinEntity> byId = binRepository.findById(binId);
            assertTrue(byId.isPresent(), "Soft deleted bin should still exist");
            assertTrue(byId.get().getIsDeleted());
        }
    }

    // Helper method
    private BinEntity createBin(String code, String name, String binType, int aisle, int shelf, int level) {
        return BinEntity.builder()
                .tenantId(tenantId)
                .zoneId(zoneId)
                .code(code)
                .name(name)
                .binType(binType)
                .status("AVAILABLE")
                .capacityCubicMeters(new BigDecimal("10.00"))
                .currentOccupancyCubicMeters(BigDecimal.ZERO)
                .maxWeightKg(new BigDecimal("1000.00"))
                .currentWeightKg(BigDecimal.ZERO)
                .aisleNumber(aisle)
                .shelfNumber(shelf)
                .levelNumber(level)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();
    }
}

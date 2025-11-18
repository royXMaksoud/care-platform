package com.care.warehouse.infrastructure.db.repository;

import com.care.warehouse.infrastructure.db.entity.BinEntity;
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
 * Repository tests for BinJpaRepository.
 * Uses @DataJpaTest for lightweight JPA testing with H2 database.
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Bin JPA Repository Tests")
class BinJpaRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BinJpaRepository binRepository;

    private UUID tenantId;
    private UUID zoneId;
    private UUID anotherZoneId;
    private BinEntity bin1;
    private BinEntity bin2;
    private BinEntity bin3;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        zoneId = UUID.randomUUID();
        anotherZoneId = UUID.randomUUID();

        // Create test bins
        bin1 = BinEntity.builder()
                .tenantId(tenantId)
                .zoneId(zoneId)
                .code("A-01-01")
                .name("Pallet Bin A-01-01")
                .binType("PALLET")
                .status("AVAILABLE")
                .maxWeightKg(new BigDecimal("1000.00"))
                .currentWeightKg(BigDecimal.ZERO)
                .capacityCubicMeters(new BigDecimal("10.00"))
                .currentOccupancyCubicMeters(BigDecimal.ZERO)
                .aisleNumber(1)
                .shelfNumber(1)
                .levelNumber(1)
                .barcode("BIN-001")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        bin2 = BinEntity.builder()
                .tenantId(tenantId)
                .zoneId(zoneId)
                .code("A-01-02")
                .name("Shelf Bin A-01-02")
                .binType("SHELF")
                .status("OCCUPIED")
                .maxWeightKg(new BigDecimal("500.00"))
                .currentWeightKg(new BigDecimal("200.00"))
                .capacityCubicMeters(new BigDecimal("5.00"))
                .currentOccupancyCubicMeters(new BigDecimal("3.00"))
                .aisleNumber(1)
                .shelfNumber(1)
                .levelNumber(2)
                .barcode("BIN-002")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        bin3 = BinEntity.builder()
                .tenantId(tenantId)
                .zoneId(zoneId)
                .code("A-02-01")
                .name("Rack Bin A-02-01")
                .binType("RACK")
                .status("AVAILABLE")
                .maxWeightKg(new BigDecimal("2000.00"))
                .currentWeightKg(BigDecimal.ZERO)
                .capacityCubicMeters(new BigDecimal("15.00"))
                .currentOccupancyCubicMeters(BigDecimal.ZERO)
                .aisleNumber(2)
                .shelfNumber(1)
                .levelNumber(1)
                .barcode("BIN-003")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .rowVersion(0)
                .build();

        entityManager.persist(bin1);
        entityManager.persist(bin2);
        entityManager.persist(bin3);
        entityManager.flush();
    }

    @Nested
    @DisplayName("findByZoneIdAndCode() Tests")
    class FindByZoneIdAndCodeTests {

        @Test
        @DisplayName("Should find bin by zone and code")
        void findByZoneIdAndCode_ShouldReturnBin_WhenExists() {
            Optional<BinEntity> result = binRepository.findByZoneIdAndCode(zoneId, "A-01-01");

            assertTrue(result.isPresent(), "Should find bin by zone and code");
            assertEquals("A-01-01", result.get().getCode(), "Should return correct bin");
            assertEquals("Pallet Bin A-01-01", result.get().getName());
        }

        @Test
        @DisplayName("Should return empty when code does not exist")
        void findByZoneIdAndCode_ShouldReturnEmpty_WhenCodeNotExists() {
            Optional<BinEntity> result = binRepository.findByZoneIdAndCode(zoneId, "NONEXISTENT");

            assertFalse(result.isPresent(), "Should return empty when code does not exist");
        }

        @Test
        @DisplayName("Should return empty when zone does not match")
        void findByZoneIdAndCode_ShouldReturnEmpty_WhenZoneNotMatches() {
            Optional<BinEntity> result = binRepository.findByZoneIdAndCode(anotherZoneId, "A-01-01");

            assertFalse(result.isPresent(), "Should return empty when zone does not match");
        }

        @Test
        @DisplayName("Should not find deleted bins")
        void findByZoneIdAndCode_ShouldNotFindDeleted() {
            bin1.setIsDeleted(true);
            entityManager.persist(bin1);
            entityManager.flush();

            Optional<BinEntity> result = binRepository.findByZoneIdAndCode(zoneId, "A-01-01");

            assertFalse(result.isPresent(), "Should not find deleted bin");
        }
    }

    @Nested
    @DisplayName("findByZoneId() Tests")
    class FindByZoneIdTests {

        @Test
        @DisplayName("Should find all bins in zone with pagination")
        void findByZoneId_ShouldReturnPagedResults() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<BinEntity> result = binRepository.findByZoneId(zoneId, pageable);

            assertEquals(3, result.getTotalElements(), "Should return all bins in zone");
            assertEquals(3, result.getContent().size());
        }

        @Test
        @DisplayName("Should return bins ordered by code")
        void findByZoneId_ShouldReturnOrderedByCode() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<BinEntity> result = binRepository.findByZoneId(zoneId, pageable);

            assertEquals("A-01-01", result.getContent().get(0).getCode(), "Should be ordered by code ASC");
            assertEquals("A-01-02", result.getContent().get(1).getCode());
            assertEquals("A-02-01", result.getContent().get(2).getCode());
        }

        @Test
        @DisplayName("Should respect pagination")
        void findByZoneId_ShouldRespectPagination() {
            Pageable pageable = PageRequest.of(0, 2);

            Page<BinEntity> result = binRepository.findByZoneId(zoneId, pageable);

            assertEquals(3, result.getTotalElements(), "Total elements should be 3");
            assertEquals(2, result.getContent().size(), "Page size should be 2");
            assertEquals(2, result.getTotalPages(), "Total pages should be 2");
        }

        @Test
        @DisplayName("Should return empty for non-existent zone")
        void findByZoneId_ShouldReturnEmpty_WhenNoBinsForZone() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<BinEntity> result = binRepository.findByZoneId(anotherZoneId, pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty for non-existent zone");
        }
    }

    @Nested
    @DisplayName("findAvailableByZoneId() Tests")
    class FindAvailableByZoneIdTests {

        @Test
        @DisplayName("Should find only available bins")
        void findAvailableByZoneId_ShouldReturnOnlyAvailable() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<BinEntity> result = binRepository.findAvailableByZoneId(zoneId, pageable);

            assertEquals(2, result.getTotalElements(), "Should return only available bins");
            assertTrue(result.getContent().stream().allMatch(b -> "AVAILABLE".equals(b.getStatus())),
                    "All returned bins should be available");
        }

        @Test
        @DisplayName("Should return empty when no available bins exist")
        void findAvailableByZoneId_ShouldReturnEmpty_WhenNoAvailableBins() {
            bin1.setStatus("OCCUPIED");
            bin3.setStatus("RESERVED");
            entityManager.persist(bin1);
            entityManager.persist(bin3);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<BinEntity> result = binRepository.findAvailableByZoneId(zoneId, pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty when no available bins");
        }

        @Test
        @DisplayName("Should not return deleted available bins")
        void findAvailableByZoneId_ShouldNotReturnDeleted() {
            bin1.setIsDeleted(true);
            entityManager.persist(bin1);
            entityManager.flush();

            Pageable pageable = PageRequest.of(0, 10);
            Page<BinEntity> result = binRepository.findAvailableByZoneId(zoneId, pageable);

            assertEquals(1, result.getTotalElements(), "Should not return deleted available bin");
        }
    }

    @Nested
    @DisplayName("findByBarcodeAndTenantId() Tests")
    class FindByBarcodeAndTenantIdTests {

        @Test
        @DisplayName("Should find bin by barcode and tenant")
        void findByBarcodeAndTenantId_ShouldReturnBin() {
            Optional<BinEntity> result = binRepository.findByBarcodeAndTenantId("BIN-001", tenantId);

            assertTrue(result.isPresent(), "Should find bin by barcode");
            assertEquals("BIN-001", result.get().getBarcode());
            assertEquals("A-01-01", result.get().getCode());
        }

        @Test
        @DisplayName("Should return empty when barcode not found")
        void findByBarcodeAndTenantId_ShouldReturnEmpty_WhenBarcodeNotFound() {
            Optional<BinEntity> result = binRepository.findByBarcodeAndTenantId("NONEXISTENT", tenantId);

            assertFalse(result.isPresent(), "Should return empty when barcode not found");
        }

        @Test
        @DisplayName("Should return empty when tenant does not match")
        void findByBarcodeAndTenantId_ShouldReturnEmpty_WhenTenantNotMatches() {
            UUID anotherTenantId = UUID.randomUUID();

            Optional<BinEntity> result = binRepository.findByBarcodeAndTenantId("BIN-001", anotherTenantId);

            assertFalse(result.isPresent(), "Should return empty when tenant does not match");
        }

        @Test
        @DisplayName("Should not find deleted bin by barcode")
        void findByBarcodeAndTenantId_ShouldNotFindDeleted() {
            bin1.setIsDeleted(true);
            entityManager.persist(bin1);
            entityManager.flush();

            Optional<BinEntity> result = binRepository.findByBarcodeAndTenantId("BIN-001", tenantId);

            assertFalse(result.isPresent(), "Should not find deleted bin by barcode");
        }
    }

    @Nested
    @DisplayName("findByLocation() Tests")
    class FindByLocationTests {

        @Test
        @DisplayName("Should find bin by location coordinates")
        void findByLocation_ShouldReturnBin() {
            Optional<BinEntity> result = binRepository.findByLocation(zoneId, 1, 1, 1);

            assertTrue(result.isPresent(), "Should find bin by location");
            assertEquals("A-01-01", result.get().getCode());
        }

        @Test
        @DisplayName("Should return empty when location not found")
        void findByLocation_ShouldReturnEmpty_WhenLocationNotFound() {
            Optional<BinEntity> result = binRepository.findByLocation(zoneId, 99, 99, 99);

            assertFalse(result.isPresent(), "Should return empty when location not found");
        }

        @Test
        @DisplayName("Should return empty when zone does not match")
        void findByLocation_ShouldReturnEmpty_WhenZoneNotMatches() {
            Optional<BinEntity> result = binRepository.findByLocation(anotherZoneId, 1, 1, 1);

            assertFalse(result.isPresent(), "Should return empty when zone does not match");
        }

        @Test
        @DisplayName("Should not find deleted bin by location")
        void findByLocation_ShouldNotFindDeleted() {
            bin1.setIsDeleted(true);
            entityManager.persist(bin1);
            entityManager.flush();

            Optional<BinEntity> result = binRepository.findByLocation(zoneId, 1, 1, 1);

            assertFalse(result.isPresent(), "Should not find deleted bin by location");
        }

        @Test
        @DisplayName("Should find correct bin when multiple bins exist at different locations")
        void findByLocation_ShouldFindCorrectBin() {
            Optional<BinEntity> result1 = binRepository.findByLocation(zoneId, 1, 1, 1);
            Optional<BinEntity> result2 = binRepository.findByLocation(zoneId, 1, 1, 2);
            Optional<BinEntity> result3 = binRepository.findByLocation(zoneId, 2, 1, 1);

            assertTrue(result1.isPresent() && "A-01-01".equals(result1.get().getCode()));
            assertTrue(result2.isPresent() && "A-01-02".equals(result2.get().getCode()));
            assertTrue(result3.isPresent() && "A-02-01".equals(result3.get().getCode()));
        }
    }

    @Nested
    @DisplayName("findByZoneIdAndBinType() Tests")
    class FindByZoneIdAndBinTypeTests {

        @Test
        @DisplayName("Should find bins by type")
        void findByZoneIdAndBinType_ShouldReturnBinsOfType() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<BinEntity> result = binRepository.findByZoneIdAndBinType(zoneId, "PALLET", pageable);

            assertEquals(1, result.getTotalElements(), "Should return only pallet bins");
            assertEquals("PALLET", result.getContent().get(0).getBinType());
        }

        @Test
        @DisplayName("Should return empty when no bins of type exist")
        void findByZoneIdAndBinType_ShouldReturnEmpty_WhenNoBinsOfType() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<BinEntity> result = binRepository.findByZoneIdAndBinType(zoneId, "DRAWER", pageable);

            assertEquals(0, result.getTotalElements(), "Should return empty when no bins of type");
        }
    }

    @Nested
    @DisplayName("findByIdAndTenantId() Tests")
    class FindByIdAndTenantIdTests {

        @Test
        @DisplayName("Should find bin by ID and tenant")
        void findByIdAndTenantId_ShouldReturnBin() {
            Optional<BinEntity> result = binRepository.findByIdAndTenantId(bin1.getId(), tenantId);

            assertTrue(result.isPresent(), "Should find bin by ID and tenant");
            assertEquals(bin1.getId(), result.get().getId());
        }

        @Test
        @DisplayName("Should return empty when tenant does not match")
        void findByIdAndTenantId_ShouldReturnEmpty_WhenTenantNotMatches() {
            UUID anotherTenantId = UUID.randomUUID();

            Optional<BinEntity> result = binRepository.findByIdAndTenantId(bin1.getId(), anotherTenantId);

            assertFalse(result.isPresent(), "Should return empty when tenant does not match");
        }

        @Test
        @DisplayName("Should not return deleted bin")
        void findByIdAndTenantId_ShouldNotReturnDeleted() {
            UUID binId = bin1.getId();
            bin1.setIsDeleted(true);
            entityManager.persist(bin1);
            entityManager.flush();

            Optional<BinEntity> result = binRepository.findByIdAndTenantId(binId, tenantId);

            assertFalse(result.isPresent(), "Should not return deleted bin");
        }
    }

    @Nested
    @DisplayName("Zone Isolation Tests")
    class ZoneIsolationTests {

        @Test
        @DisplayName("Should maintain strict zone isolation")
        void shouldMaintainZoneIsolation() {
            // Create bin in another zone
            BinEntity otherZoneBin = BinEntity.builder()
                    .tenantId(tenantId)
                    .zoneId(anotherZoneId)
                    .code("OTHER-01")
                    .name("Other Zone Bin")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .maxWeightKg(new BigDecimal("1000.00"))
                    .currentWeightKg(BigDecimal.ZERO)
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .aisleNumber(1)
                    .shelfNumber(1)
                    .levelNumber(1)
                    .barcode("BIN-OTHER")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .rowVersion(0)
                    .build();
            entityManager.persist(otherZoneBin);
            entityManager.flush();

            // Verify zone isolation
            Pageable pageable = PageRequest.of(0, 100);

            Page<BinEntity> zone1Bins = binRepository.findByZoneId(zoneId, pageable);
            Page<BinEntity> zone2Bins = binRepository.findByZoneId(anotherZoneId, pageable);

            assertEquals(3, zone1Bins.getTotalElements(), "Zone 1 should see only their bins");
            assertEquals(1, zone2Bins.getTotalElements(), "Zone 2 should see only their bins");

            assertTrue(zone1Bins.getContent().stream().noneMatch(b -> "OTHER-01".equals(b.getCode())),
                    "Zone 1 should not see other zone's bin");
        }
    }
}

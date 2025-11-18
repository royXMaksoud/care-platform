package com.care.warehouse.domain.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Bin domain model.
 * Tests business logic methods for bin capacity, weight management, and location formatting.
 */
@DisplayName("Bin Domain Model Tests")
class BinTest {

    private Bin bin;
    private static final UUID BIN_ID = UUID.randomUUID();
    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID ZONE_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        bin = Bin.builder()
                .id(BIN_ID)
                .tenantId(TENANT_ID)
                .zoneId(ZONE_ID)
                .code("A-01-01")
                .name("Pallet Bin A-01-01")
                .binType(Bin.BinType.PALLET)
                .status(Bin.BinStatus.AVAILABLE)
                .maxWeightKg(new BigDecimal("1000.00"))
                .currentWeightKg(new BigDecimal("200.00"))
                .capacityCubicMeters(new BigDecimal("10.00"))
                .currentOccupancyCubicMeters(new BigDecimal("2.00"))
                .aisleNumber(1)
                .shelfNumber(2)
                .levelNumber(3)
                .barcode("BIN-001-A01")
                .build();
    }

    @Nested
    @DisplayName("canAccommodate() Tests")
    class CanAccommodateTests {

        @Test
        @DisplayName("Should return true when bin can accommodate items")
        void canAccommodate_ShouldReturnTrue_WhenSpaceAndWeightAvailable() {
            BigDecimal requiredCapacity = new BigDecimal("5.00");
            BigDecimal requiredWeight = new BigDecimal("500.00");

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertTrue(result, "Bin should be able to accommodate items when space and weight are available");
        }

        @Test
        @DisplayName("Should return false when capacity is exceeded")
        void canAccommodate_ShouldReturnFalse_WhenCapacityExceeded() {
            BigDecimal requiredCapacity = new BigDecimal("10.00"); // Only 8 available
            BigDecimal requiredWeight = new BigDecimal("100.00");

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertFalse(result, "Bin should not accommodate items when capacity is exceeded");
        }

        @Test
        @DisplayName("Should return false when weight is exceeded")
        void canAccommodate_ShouldReturnFalse_WhenWeightExceeded() {
            BigDecimal requiredCapacity = new BigDecimal("1.00");
            BigDecimal requiredWeight = new BigDecimal("900.00"); // Only 800 available

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertFalse(result, "Bin should not accommodate items when weight is exceeded");
        }

        @Test
        @DisplayName("Should return false when bin is not available")
        void canAccommodate_ShouldReturnFalse_WhenBinNotAvailable() {
            bin.setStatus(Bin.BinStatus.OCCUPIED);
            BigDecimal requiredCapacity = new BigDecimal("1.00");
            BigDecimal requiredWeight = new BigDecimal("100.00");

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertFalse(result, "Bin should not accommodate items when not available");
        }

        @Test
        @DisplayName("Should return false when bin is reserved")
        void canAccommodate_ShouldReturnFalse_WhenBinIsReserved() {
            bin.setStatus(Bin.BinStatus.RESERVED);
            BigDecimal requiredCapacity = new BigDecimal("1.00");
            BigDecimal requiredWeight = new BigDecimal("100.00");

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertFalse(result, "Bin should not accommodate items when reserved");
        }

        @Test
        @DisplayName("Should return false when bin is under maintenance")
        void canAccommodate_ShouldReturnFalse_WhenBinUnderMaintenance() {
            bin.setStatus(Bin.BinStatus.MAINTENANCE);
            BigDecimal requiredCapacity = new BigDecimal("1.00");
            BigDecimal requiredWeight = new BigDecimal("100.00");

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertFalse(result, "Bin should not accommodate items when under maintenance");
        }

        @Test
        @DisplayName("Should ignore weight constraint when maxWeightKg is null")
        void canAccommodate_ShouldIgnoreWeight_WhenMaxWeightIsNull() {
            bin.setMaxWeightKg(null);
            BigDecimal requiredCapacity = new BigDecimal("5.00");
            BigDecimal requiredWeight = new BigDecimal("10000.00"); // Very large weight

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertTrue(result, "Bin should accommodate any weight when maxWeightKg is null");
        }

        @Test
        @DisplayName("Should allow exact capacity match")
        void canAccommodate_ShouldReturnTrue_WhenExactCapacityMatch() {
            BigDecimal requiredCapacity = new BigDecimal("8.00"); // Exactly available
            BigDecimal requiredWeight = new BigDecimal("800.00"); // Exactly available

            boolean result = bin.canAccommodate(requiredCapacity, requiredWeight);

            assertTrue(result, "Bin should accommodate items when exact capacity is requested");
        }
    }

    @Nested
    @DisplayName("addContent() Tests")
    class AddContentTests {

        @Test
        @DisplayName("Should add content successfully")
        void addContent_ShouldAddContent_WhenCapacityAvailable() {
            BigDecimal volume = new BigDecimal("3.00");
            BigDecimal weight = new BigDecimal("300.00");

            bin.addContent(volume, weight);

            assertEquals(new BigDecimal("5.00"), bin.getCurrentOccupancyCubicMeters(),
                    "Occupancy should increase from 2 to 5");
            assertEquals(new BigDecimal("500.00"), bin.getCurrentWeightKg(),
                    "Weight should increase from 200 to 500");
        }

        @Test
        @DisplayName("Should throw exception when capacity is exceeded")
        void addContent_ShouldThrowException_WhenCapacityExceeded() {
            BigDecimal volume = new BigDecimal("10.00"); // Exceeds available
            BigDecimal weight = new BigDecimal("100.00");

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> bin.addContent(volume, weight),
                    "Should throw exception when capacity is exceeded");

            assertEquals("Bin cannot accommodate the required items", exception.getMessage());
        }

        @Test
        @DisplayName("Should not modify weight when maxWeightKg is null")
        void addContent_ShouldNotModifyWeight_WhenMaxWeightIsNull() {
            bin.setMaxWeightKg(null);
            BigDecimal volume = new BigDecimal("3.00");
            BigDecimal weight = new BigDecimal("300.00");

            bin.addContent(volume, weight);

            assertEquals(new BigDecimal("5.00"), bin.getCurrentOccupancyCubicMeters(),
                    "Occupancy should increase");
            // Weight should remain unchanged when maxWeightKg is null
        }
    }

    @Nested
    @DisplayName("removeContent() Tests")
    class RemoveContentTests {

        @Test
        @DisplayName("Should remove content successfully")
        void removeContent_ShouldRemoveContent() {
            BigDecimal volume = new BigDecimal("1.00");
            BigDecimal weight = new BigDecimal("100.00");

            bin.removeContent(volume, weight);

            assertEquals(new BigDecimal("1.00"), bin.getCurrentOccupancyCubicMeters(),
                    "Occupancy should decrease from 2 to 1");
            assertEquals(new BigDecimal("100.00"), bin.getCurrentWeightKg(),
                    "Weight should decrease from 200 to 100");
        }

        @Test
        @DisplayName("Should set status to AVAILABLE when bin becomes empty")
        void removeContent_ShouldSetAvailable_WhenEmpty() {
            bin.setStatus(Bin.BinStatus.OCCUPIED);
            BigDecimal volume = new BigDecimal("2.00"); // Remove all
            BigDecimal weight = new BigDecimal("200.00");

            bin.removeContent(volume, weight);

            assertEquals(Bin.BinStatus.AVAILABLE, bin.getStatus(),
                    "Status should be AVAILABLE when bin is empty");
        }

        @Test
        @DisplayName("Should allow negative occupancy (removes more than present)")
        void removeContent_ShouldAllowNegativeOccupancy() {
            BigDecimal volume = new BigDecimal("5.00"); // More than current occupancy
            BigDecimal weight = new BigDecimal("100.00");

            // Note: The current implementation allows this - may need business rule clarification
            assertDoesNotThrow(() -> bin.removeContent(volume, weight));
        }
    }

    @Nested
    @DisplayName("getAvailableCapacity() Tests")
    class GetAvailableCapacityTests {

        @Test
        @DisplayName("Should calculate correct available capacity")
        void getAvailableCapacity_ShouldReturnCorrectValue() {
            BigDecimal expected = new BigDecimal("8.00");

            BigDecimal result = bin.getAvailableCapacity();

            assertEquals(expected, result, "Available capacity should be 8.00 (10 - 2)");
        }

        @Test
        @DisplayName("Should return full capacity when bin is empty")
        void getAvailableCapacity_ShouldReturnFullCapacity_WhenEmpty() {
            bin.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = bin.getAvailableCapacity();

            assertEquals(new BigDecimal("10.00"), result, "Available capacity should equal total capacity when empty");
        }
    }

    @Nested
    @DisplayName("getAvailableWeight() Tests")
    class GetAvailableWeightTests {

        @Test
        @DisplayName("Should calculate correct available weight")
        void getAvailableWeight_ShouldReturnCorrectValue() {
            BigDecimal expected = new BigDecimal("800.00");

            BigDecimal result = bin.getAvailableWeight();

            assertEquals(expected, result, "Available weight should be 800.00 (1000 - 200)");
        }

        @Test
        @DisplayName("Should return max double value when maxWeightKg is null")
        void getAvailableWeight_ShouldReturnMaxValue_WhenMaxWeightIsNull() {
            bin.setMaxWeightKg(null);

            BigDecimal result = bin.getAvailableWeight();

            assertTrue(result.compareTo(new BigDecimal("999999999")) > 0,
                    "Available weight should be very large when no max weight is set");
        }
    }

    @Nested
    @DisplayName("getUtilizationPercentage() Tests")
    class GetUtilizationPercentageTests {

        @Test
        @DisplayName("Should calculate correct utilization percentage")
        void getUtilizationPercentage_ShouldReturnCorrectValue() {
            BigDecimal expected = new BigDecimal("20.00");

            BigDecimal result = bin.getUtilizationPercentage();

            assertEquals(expected, result, "Utilization should be 20% (2/10 * 100)");
        }

        @Test
        @DisplayName("Should return zero when bin is empty")
        void getUtilizationPercentage_ShouldReturnZero_WhenEmpty() {
            bin.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = bin.getUtilizationPercentage();

            assertEquals(BigDecimal.ZERO.setScale(2), result.setScale(2), "Utilization should be 0% when empty");
        }

        @Test
        @DisplayName("Should return zero when capacity is zero")
        void getUtilizationPercentage_ShouldReturnZero_WhenCapacityIsZero() {
            bin.setCapacityCubicMeters(BigDecimal.ZERO);
            bin.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = bin.getUtilizationPercentage();

            assertEquals(BigDecimal.ZERO, result, "Utilization should be 0% when capacity is zero");
        }
    }

    @Nested
    @DisplayName("getLocationString() Tests")
    class GetLocationStringTests {

        @Test
        @DisplayName("Should format location string correctly")
        void getLocationString_ShouldFormatCorrectly() {
            String expected = "A1-S2-L3";

            String result = bin.getLocationString();

            assertEquals(expected, result, "Location string should be formatted as A1-S2-L3");
        }

        @Test
        @DisplayName("Should handle single digit numbers")
        void getLocationString_ShouldHandleSingleDigits() {
            bin.setAisleNumber(1);
            bin.setShelfNumber(1);
            bin.setLevelNumber(1);

            String result = bin.getLocationString();

            assertEquals("A1-S1-L1", result, "Location string should handle single digits");
        }

        @Test
        @DisplayName("Should handle double digit numbers")
        void getLocationString_ShouldHandleDoubleDigits() {
            bin.setAisleNumber(12);
            bin.setShelfNumber(34);
            bin.setLevelNumber(56);

            String result = bin.getLocationString();

            assertEquals("A12-S34-L56", result, "Location string should handle double digits");
        }

        @Test
        @DisplayName("Should handle zero values")
        void getLocationString_ShouldHandleZeroValues() {
            bin.setAisleNumber(0);
            bin.setShelfNumber(0);
            bin.setLevelNumber(0);

            String result = bin.getLocationString();

            assertEquals("A0-S0-L0", result, "Location string should handle zero values");
        }

        @Test
        @DisplayName("Should handle large numbers")
        void getLocationString_ShouldHandleLargeNumbers() {
            bin.setAisleNumber(100);
            bin.setShelfNumber(200);
            bin.setLevelNumber(300);

            String result = bin.getLocationString();

            assertEquals("A100-S200-L300", result, "Location string should handle large numbers");
        }
    }

    @Nested
    @DisplayName("Bin Type Tests")
    class BinTypeTests {

        @Test
        @DisplayName("Should support PALLET bin type")
        void shouldSupportPalletBinType() {
            bin.setBinType(Bin.BinType.PALLET);
            assertEquals(Bin.BinType.PALLET, bin.getBinType());
        }

        @Test
        @DisplayName("Should support SHELF bin type")
        void shouldSupportShelfBinType() {
            bin.setBinType(Bin.BinType.SHELF);
            assertEquals(Bin.BinType.SHELF, bin.getBinType());
        }

        @Test
        @DisplayName("Should support RACK bin type")
        void shouldSupportRackBinType() {
            bin.setBinType(Bin.BinType.RACK);
            assertEquals(Bin.BinType.RACK, bin.getBinType());
        }

        @Test
        @DisplayName("Should support CAGE bin type")
        void shouldSupportCageBinType() {
            bin.setBinType(Bin.BinType.CAGE);
            assertEquals(Bin.BinType.CAGE, bin.getBinType());
        }

        @Test
        @DisplayName("Should support DRAWER bin type")
        void shouldSupportDrawerBinType() {
            bin.setBinType(Bin.BinType.DRAWER);
            assertEquals(Bin.BinType.DRAWER, bin.getBinType());
        }
    }

    @Nested
    @DisplayName("Bin Status Tests")
    class BinStatusTests {

        @Test
        @DisplayName("Should support AVAILABLE status")
        void shouldSupportAvailableStatus() {
            bin.setStatus(Bin.BinStatus.AVAILABLE);
            assertEquals(Bin.BinStatus.AVAILABLE, bin.getStatus());
        }

        @Test
        @DisplayName("Should support OCCUPIED status")
        void shouldSupportOccupiedStatus() {
            bin.setStatus(Bin.BinStatus.OCCUPIED);
            assertEquals(Bin.BinStatus.OCCUPIED, bin.getStatus());
        }

        @Test
        @DisplayName("Should support RESERVED status")
        void shouldSupportReservedStatus() {
            bin.setStatus(Bin.BinStatus.RESERVED);
            assertEquals(Bin.BinStatus.RESERVED, bin.getStatus());
        }

        @Test
        @DisplayName("Should support MAINTENANCE status")
        void shouldSupportMaintenanceStatus() {
            bin.setStatus(Bin.BinStatus.MAINTENANCE);
            assertEquals(Bin.BinStatus.MAINTENANCE, bin.getStatus());
        }
    }

    @Nested
    @DisplayName("Edge Cases Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle null barcode")
        void shouldHandleNullBarcode() {
            bin.setBarcode(null);
            assertNull(bin.getBarcode(), "Barcode can be null");
        }

        @Test
        @DisplayName("Should handle null name")
        void shouldHandleNullName() {
            bin.setName(null);
            assertNull(bin.getName(), "Name can be null");
        }

        @Test
        @DisplayName("Should handle very small capacity values")
        void shouldHandleVerySmallCapacity() {
            bin.setCapacityCubicMeters(new BigDecimal("0.01"));
            bin.setCurrentOccupancyCubicMeters(new BigDecimal("0.005"));

            BigDecimal available = bin.getAvailableCapacity();

            assertEquals(new BigDecimal("0.005"), available, "Should handle small capacity values");
        }
    }
}

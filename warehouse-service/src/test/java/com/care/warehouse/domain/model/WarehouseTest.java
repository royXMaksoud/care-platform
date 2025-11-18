package com.care.warehouse.domain.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Warehouse domain model.
 * Tests business logic methods for capacity management and operational status.
 */
@DisplayName("Warehouse Domain Model Tests")
class WarehouseTest {

    private Warehouse warehouse;
    private static final UUID WAREHOUSE_ID = UUID.randomUUID();
    private static final UUID TENANT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        warehouse = Warehouse.builder()
                .id(WAREHOUSE_ID)
                .tenantId(TENANT_ID)
                .code("WH-001")
                .name("Main Warehouse")
                .description("Primary distribution center")
                .status(Warehouse.WarehouseStatus.ACTIVE)
                .isPrimary(true)
                .capacityCubicMeters(new BigDecimal("1000.00"))
                .currentOccupancyCubicMeters(new BigDecimal("250.00"))
                .build();
    }

    @Nested
    @DisplayName("hasCapacity() Tests")
    class HasCapacityTests {

        @Test
        @DisplayName("Should return true when required space is less than available capacity")
        void hasCapacity_ShouldReturnTrue_WhenSpaceIsAvailable() {
            BigDecimal requiredSpace = new BigDecimal("500.00");

            boolean result = warehouse.hasCapacity(requiredSpace);

            assertTrue(result, "Warehouse should have capacity for 500 cubic meters when 750 is available");
        }

        @Test
        @DisplayName("Should return true when required space equals available capacity")
        void hasCapacity_ShouldReturnTrue_WhenSpaceEqualsAvailable() {
            BigDecimal requiredSpace = new BigDecimal("750.00");

            boolean result = warehouse.hasCapacity(requiredSpace);

            assertTrue(result, "Warehouse should have capacity when required equals available");
        }

        @Test
        @DisplayName("Should return false when required space exceeds available capacity")
        void hasCapacity_ShouldReturnFalse_WhenSpaceExceedsAvailable() {
            BigDecimal requiredSpace = new BigDecimal("800.00");

            boolean result = warehouse.hasCapacity(requiredSpace);

            assertFalse(result, "Warehouse should not have capacity for 800 cubic meters when only 750 is available");
        }

        @Test
        @DisplayName("Should return true for zero required space")
        void hasCapacity_ShouldReturnTrue_WhenRequiredSpaceIsZero() {
            BigDecimal requiredSpace = BigDecimal.ZERO;

            boolean result = warehouse.hasCapacity(requiredSpace);

            assertTrue(result, "Warehouse should have capacity for zero space requirement");
        }
    }

    @Nested
    @DisplayName("getAvailableCapacity() Tests")
    class GetAvailableCapacityTests {

        @Test
        @DisplayName("Should calculate correct available capacity")
        void getAvailableCapacity_ShouldReturnCorrectValue() {
            BigDecimal expected = new BigDecimal("750.00");

            BigDecimal result = warehouse.getAvailableCapacity();

            assertEquals(expected, result, "Available capacity should be 750.00 (1000 - 250)");
        }

        @Test
        @DisplayName("Should return full capacity when warehouse is empty")
        void getAvailableCapacity_ShouldReturnFullCapacity_WhenEmpty() {
            warehouse.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = warehouse.getAvailableCapacity();

            assertEquals(new BigDecimal("1000.00"), result, "Available capacity should equal total capacity when empty");
        }

        @Test
        @DisplayName("Should return zero when warehouse is full")
        void getAvailableCapacity_ShouldReturnZero_WhenFull() {
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("1000.00"));

            BigDecimal result = warehouse.getAvailableCapacity();

            assertEquals(BigDecimal.ZERO.setScale(2), result.setScale(2), "Available capacity should be zero when full");
        }
    }

    @Nested
    @DisplayName("getUtilizationPercentage() Tests")
    class GetUtilizationPercentageTests {

        @Test
        @DisplayName("Should calculate correct utilization percentage")
        void getUtilizationPercentage_ShouldReturnCorrectValue() {
            BigDecimal expected = new BigDecimal("25.00");

            BigDecimal result = warehouse.getUtilizationPercentage();

            assertEquals(expected, result, "Utilization should be 25% (250/1000 * 100)");
        }

        @Test
        @DisplayName("Should return zero when warehouse is empty")
        void getUtilizationPercentage_ShouldReturnZero_WhenEmpty() {
            warehouse.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = warehouse.getUtilizationPercentage();

            assertEquals(BigDecimal.ZERO.setScale(2), result.setScale(2), "Utilization should be 0% when empty");
        }

        @Test
        @DisplayName("Should return 100 when warehouse is full")
        void getUtilizationPercentage_ShouldReturn100_WhenFull() {
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("1000.00"));

            BigDecimal result = warehouse.getUtilizationPercentage();

            assertEquals(new BigDecimal("100.00"), result, "Utilization should be 100% when full");
        }

        @Test
        @DisplayName("Should return zero when capacity is zero")
        void getUtilizationPercentage_ShouldReturnZero_WhenCapacityIsZero() {
            warehouse.setCapacityCubicMeters(BigDecimal.ZERO);
            warehouse.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = warehouse.getUtilizationPercentage();

            assertEquals(BigDecimal.ZERO, result, "Utilization should be 0% when capacity is zero");
        }

        @Test
        @DisplayName("Should handle fractional percentages with rounding")
        void getUtilizationPercentage_ShouldRoundCorrectly() {
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("333.33"));

            BigDecimal result = warehouse.getUtilizationPercentage();

            assertEquals(new BigDecimal("33.33"), result, "Utilization should be correctly rounded to 33.33%");
        }
    }

    @Nested
    @DisplayName("updateOccupancy() Tests")
    class UpdateOccupancyTests {

        @Test
        @DisplayName("Should increase occupancy when adding items")
        void updateOccupancy_ShouldIncreaseOccupancy_WhenAddingItems() {
            BigDecimal change = new BigDecimal("100.00");

            warehouse.updateOccupancy(change);

            assertEquals(new BigDecimal("350.00"), warehouse.getCurrentOccupancyCubicMeters(),
                    "Occupancy should increase from 250 to 350");
        }

        @Test
        @DisplayName("Should decrease occupancy when removing items")
        void updateOccupancy_ShouldDecreaseOccupancy_WhenRemovingItems() {
            BigDecimal change = new BigDecimal("-100.00");

            warehouse.updateOccupancy(change);

            assertEquals(new BigDecimal("150.00"), warehouse.getCurrentOccupancyCubicMeters(),
                    "Occupancy should decrease from 250 to 150");
        }

        @Test
        @DisplayName("Should throw exception when occupancy would become negative")
        void updateOccupancy_ShouldThrowException_WhenOccupancyWouldBeNegative() {
            BigDecimal change = new BigDecimal("-300.00");

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> warehouse.updateOccupancy(change),
                    "Should throw exception when occupancy would become negative");

            assertEquals("Occupancy cannot be negative", exception.getMessage());
        }

        @Test
        @DisplayName("Should throw exception when occupancy would exceed capacity")
        void updateOccupancy_ShouldThrowException_WhenExceedingCapacity() {
            BigDecimal change = new BigDecimal("800.00");

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> warehouse.updateOccupancy(change),
                    "Should throw exception when exceeding capacity");

            assertEquals("Occupancy exceeds warehouse capacity", exception.getMessage());
        }

        @Test
        @DisplayName("Should allow occupancy to reach exactly capacity")
        void updateOccupancy_ShouldAllowExactCapacity() {
            BigDecimal change = new BigDecimal("750.00");

            assertDoesNotThrow(() -> warehouse.updateOccupancy(change),
                    "Should allow occupancy to reach exactly capacity");

            assertEquals(new BigDecimal("1000.00"), warehouse.getCurrentOccupancyCubicMeters());
        }

        @Test
        @DisplayName("Should allow occupancy to reach exactly zero")
        void updateOccupancy_ShouldAllowExactZero() {
            BigDecimal change = new BigDecimal("-250.00");

            assertDoesNotThrow(() -> warehouse.updateOccupancy(change),
                    "Should allow occupancy to reach exactly zero");

            assertEquals(BigDecimal.ZERO.setScale(2), warehouse.getCurrentOccupancyCubicMeters().setScale(2));
        }
    }

    @Nested
    @DisplayName("isOperational() Tests")
    class IsOperationalTests {

        @Test
        @DisplayName("Should return true when status is ACTIVE")
        void isOperational_ShouldReturnTrue_WhenActive() {
            warehouse.setStatus(Warehouse.WarehouseStatus.ACTIVE);

            boolean result = warehouse.isOperational();

            assertTrue(result, "Warehouse should be operational when ACTIVE");
        }

        @Test
        @DisplayName("Should return false when status is INACTIVE")
        void isOperational_ShouldReturnFalse_WhenInactive() {
            warehouse.setStatus(Warehouse.WarehouseStatus.INACTIVE);

            boolean result = warehouse.isOperational();

            assertFalse(result, "Warehouse should not be operational when INACTIVE");
        }

        @Test
        @DisplayName("Should return false when status is MAINTENANCE")
        void isOperational_ShouldReturnFalse_WhenMaintenance() {
            warehouse.setStatus(Warehouse.WarehouseStatus.MAINTENANCE);

            boolean result = warehouse.isOperational();

            assertFalse(result, "Warehouse should not be operational when under MAINTENANCE");
        }
    }

    @Nested
    @DisplayName("isNearCapacity() Tests")
    class IsNearCapacityTests {

        @Test
        @DisplayName("Should return false when utilization is below 80%")
        void isNearCapacity_ShouldReturnFalse_WhenBelowThreshold() {
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("700.00")); // 70%

            boolean result = warehouse.isNearCapacity();

            assertFalse(result, "Warehouse should not be near capacity at 70% utilization");
        }

        @Test
        @DisplayName("Should return true when utilization is exactly 80%")
        void isNearCapacity_ShouldReturnTrue_WhenAtThreshold() {
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("800.00")); // 80%

            boolean result = warehouse.isNearCapacity();

            assertTrue(result, "Warehouse should be near capacity at exactly 80% utilization");
        }

        @Test
        @DisplayName("Should return true when utilization is above 80%")
        void isNearCapacity_ShouldReturnTrue_WhenAboveThreshold() {
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("900.00")); // 90%

            boolean result = warehouse.isNearCapacity();

            assertTrue(result, "Warehouse should be near capacity at 90% utilization");
        }

        @Test
        @DisplayName("Should return false when warehouse is empty")
        void isNearCapacity_ShouldReturnFalse_WhenEmpty() {
            warehouse.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            boolean result = warehouse.isNearCapacity();

            assertFalse(result, "Empty warehouse should not be near capacity");
        }

        @Test
        @DisplayName("Should return true when warehouse is full")
        void isNearCapacity_ShouldReturnTrue_WhenFull() {
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("1000.00")); // 100%

            boolean result = warehouse.isNearCapacity();

            assertTrue(result, "Full warehouse should be near capacity");
        }
    }

    @Nested
    @DisplayName("Edge Cases Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle very small capacity values")
        void shouldHandleVerySmallCapacity() {
            warehouse.setCapacityCubicMeters(new BigDecimal("0.01"));
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("0.005"));

            assertTrue(warehouse.hasCapacity(new BigDecimal("0.005")), "Should handle small capacity values");
        }

        @Test
        @DisplayName("Should handle very large capacity values")
        void shouldHandleVeryLargeCapacity() {
            warehouse.setCapacityCubicMeters(new BigDecimal("999999999.99"));
            warehouse.setCurrentOccupancyCubicMeters(new BigDecimal("500000000.00"));

            BigDecimal available = warehouse.getAvailableCapacity();

            assertEquals(new BigDecimal("499999999.99"), available, "Should handle large capacity values");
        }
    }
}

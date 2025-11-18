package com.care.warehouse.domain.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Zone domain model.
 * Tests business logic methods for zone capacity and temperature management.
 */
@DisplayName("Zone Domain Model Tests")
class ZoneTest {

    private Zone zone;
    private static final UUID ZONE_ID = UUID.randomUUID();
    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID WAREHOUSE_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        zone = Zone.builder()
                .id(ZONE_ID)
                .tenantId(TENANT_ID)
                .warehouseId(WAREHOUSE_ID)
                .code("STOR-01")
                .name("Storage Zone 1")
                .zoneType(Zone.ZoneType.STORAGE)
                .status(Zone.ZoneStatus.ACTIVE)
                .capacityCubicMeters(new BigDecimal("500.00"))
                .currentOccupancyCubicMeters(new BigDecimal("200.00"))
                .temperatureControlled(true)
                .temperatureMin(new BigDecimal("2.00"))
                .temperatureMax(new BigDecimal("8.00"))
                .build();
    }

    @Nested
    @DisplayName("hasCapacity() Tests")
    class HasCapacityTests {

        @Test
        @DisplayName("Should return true when required space is less than available capacity")
        void hasCapacity_ShouldReturnTrue_WhenSpaceIsAvailable() {
            BigDecimal requiredSpace = new BigDecimal("200.00");

            boolean result = zone.hasCapacity(requiredSpace);

            assertTrue(result, "Zone should have capacity for 200 cubic meters when 300 is available");
        }

        @Test
        @DisplayName("Should return true when required space equals available capacity")
        void hasCapacity_ShouldReturnTrue_WhenSpaceEqualsAvailable() {
            BigDecimal requiredSpace = new BigDecimal("300.00");

            boolean result = zone.hasCapacity(requiredSpace);

            assertTrue(result, "Zone should have capacity when required equals available");
        }

        @Test
        @DisplayName("Should return false when required space exceeds available capacity")
        void hasCapacity_ShouldReturnFalse_WhenSpaceExceedsAvailable() {
            BigDecimal requiredSpace = new BigDecimal("350.00");

            boolean result = zone.hasCapacity(requiredSpace);

            assertFalse(result, "Zone should not have capacity for 350 cubic meters when only 300 is available");
        }
    }

    @Nested
    @DisplayName("getAvailableCapacity() Tests")
    class GetAvailableCapacityTests {

        @Test
        @DisplayName("Should calculate correct available capacity")
        void getAvailableCapacity_ShouldReturnCorrectValue() {
            BigDecimal expected = new BigDecimal("300.00");

            BigDecimal result = zone.getAvailableCapacity();

            assertEquals(expected, result, "Available capacity should be 300.00 (500 - 200)");
        }

        @Test
        @DisplayName("Should return full capacity when zone is empty")
        void getAvailableCapacity_ShouldReturnFullCapacity_WhenEmpty() {
            zone.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = zone.getAvailableCapacity();

            assertEquals(new BigDecimal("500.00"), result, "Available capacity should equal total capacity when empty");
        }
    }

    @Nested
    @DisplayName("getUtilizationPercentage() Tests")
    class GetUtilizationPercentageTests {

        @Test
        @DisplayName("Should calculate correct utilization percentage")
        void getUtilizationPercentage_ShouldReturnCorrectValue() {
            BigDecimal expected = new BigDecimal("40.00");

            BigDecimal result = zone.getUtilizationPercentage();

            assertEquals(expected, result, "Utilization should be 40% (200/500 * 100)");
        }

        @Test
        @DisplayName("Should return zero when zone is empty")
        void getUtilizationPercentage_ShouldReturnZero_WhenEmpty() {
            zone.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = zone.getUtilizationPercentage();

            assertEquals(BigDecimal.ZERO.setScale(2), result.setScale(2), "Utilization should be 0% when empty");
        }

        @Test
        @DisplayName("Should return zero when capacity is zero")
        void getUtilizationPercentage_ShouldReturnZero_WhenCapacityIsZero() {
            zone.setCapacityCubicMeters(BigDecimal.ZERO);
            zone.setCurrentOccupancyCubicMeters(BigDecimal.ZERO);

            BigDecimal result = zone.getUtilizationPercentage();

            assertEquals(BigDecimal.ZERO, result, "Utilization should be 0% when capacity is zero");
        }

        @Test
        @DisplayName("Should handle fractional percentages with rounding")
        void getUtilizationPercentage_ShouldRoundCorrectly() {
            zone.setCurrentOccupancyCubicMeters(new BigDecimal("166.67"));

            BigDecimal result = zone.getUtilizationPercentage();

            assertEquals(new BigDecimal("33.33"), result, "Utilization should be correctly rounded to 33.33%");
        }
    }

    @Nested
    @DisplayName("isReady() Tests")
    class IsReadyTests {

        @Test
        @DisplayName("Should return true when status is ACTIVE")
        void isReady_ShouldReturnTrue_WhenActive() {
            zone.setStatus(Zone.ZoneStatus.ACTIVE);

            boolean result = zone.isReady();

            assertTrue(result, "Zone should be ready when ACTIVE");
        }

        @Test
        @DisplayName("Should return false when status is INACTIVE")
        void isReady_ShouldReturnFalse_WhenInactive() {
            zone.setStatus(Zone.ZoneStatus.INACTIVE);

            boolean result = zone.isReady();

            assertFalse(result, "Zone should not be ready when INACTIVE");
        }

        @Test
        @DisplayName("Should return false when status is MAINTENANCE")
        void isReady_ShouldReturnFalse_WhenMaintenance() {
            zone.setStatus(Zone.ZoneStatus.MAINTENANCE);

            boolean result = zone.isReady();

            assertFalse(result, "Zone should not be ready when under MAINTENANCE");
        }
    }

    @Nested
    @DisplayName("updateOccupancy() Tests")
    class UpdateOccupancyTests {

        @Test
        @DisplayName("Should increase occupancy when adding items")
        void updateOccupancy_ShouldIncreaseOccupancy_WhenAddingItems() {
            BigDecimal change = new BigDecimal("50.00");

            zone.updateOccupancy(change);

            assertEquals(new BigDecimal("250.00"), zone.getCurrentOccupancyCubicMeters(),
                    "Occupancy should increase from 200 to 250");
        }

        @Test
        @DisplayName("Should decrease occupancy when removing items")
        void updateOccupancy_ShouldDecreaseOccupancy_WhenRemovingItems() {
            BigDecimal change = new BigDecimal("-50.00");

            zone.updateOccupancy(change);

            assertEquals(new BigDecimal("150.00"), zone.getCurrentOccupancyCubicMeters(),
                    "Occupancy should decrease from 200 to 150");
        }

        @Test
        @DisplayName("Should throw exception when occupancy would become negative")
        void updateOccupancy_ShouldThrowException_WhenOccupancyWouldBeNegative() {
            BigDecimal change = new BigDecimal("-300.00");

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> zone.updateOccupancy(change),
                    "Should throw exception when occupancy would become negative");

            assertEquals("Zone occupancy cannot be negative", exception.getMessage());
        }

        @Test
        @DisplayName("Should throw exception when occupancy would exceed capacity")
        void updateOccupancy_ShouldThrowException_WhenExceedingCapacity() {
            BigDecimal change = new BigDecimal("400.00");

            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> zone.updateOccupancy(change),
                    "Should throw exception when exceeding capacity");

            assertEquals("Zone occupancy exceeds capacity", exception.getMessage());
        }
    }

    @Nested
    @DisplayName("isTemperatureConfigurationValid() Tests")
    class IsTemperatureConfigurationValidTests {

        @Test
        @DisplayName("Should return true when temperature controlled is false")
        void isTemperatureConfigurationValid_ShouldReturnTrue_WhenNotTemperatureControlled() {
            zone.setTemperatureControlled(false);

            boolean result = zone.isTemperatureConfigurationValid();

            assertTrue(result, "Non-temperature-controlled zone should always have valid configuration");
        }

        @Test
        @DisplayName("Should return true when min is less than max")
        void isTemperatureConfigurationValid_ShouldReturnTrue_WhenMinLessThanMax() {
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(new BigDecimal("2.00"));
            zone.setTemperatureMax(new BigDecimal("8.00"));

            boolean result = zone.isTemperatureConfigurationValid();

            assertTrue(result, "Configuration should be valid when min < max");
        }

        @Test
        @DisplayName("Should return false when min equals max")
        void isTemperatureConfigurationValid_ShouldReturnFalse_WhenMinEqualsMax() {
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(new BigDecimal("5.00"));
            zone.setTemperatureMax(new BigDecimal("5.00"));

            boolean result = zone.isTemperatureConfigurationValid();

            assertFalse(result, "Configuration should be invalid when min equals max");
        }

        @Test
        @DisplayName("Should return false when min is greater than max")
        void isTemperatureConfigurationValid_ShouldReturnFalse_WhenMinGreaterThanMax() {
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(new BigDecimal("10.00"));
            zone.setTemperatureMax(new BigDecimal("5.00"));

            boolean result = zone.isTemperatureConfigurationValid();

            assertFalse(result, "Configuration should be invalid when min > max");
        }

        @Test
        @DisplayName("Should return false when min is null for temperature controlled zone")
        void isTemperatureConfigurationValid_ShouldReturnFalse_WhenMinIsNull() {
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(null);
            zone.setTemperatureMax(new BigDecimal("8.00"));

            boolean result = zone.isTemperatureConfigurationValid();

            assertFalse(result, "Configuration should be invalid when min is null");
        }

        @Test
        @DisplayName("Should return false when max is null for temperature controlled zone")
        void isTemperatureConfigurationValid_ShouldReturnFalse_WhenMaxIsNull() {
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(new BigDecimal("2.00"));
            zone.setTemperatureMax(null);

            boolean result = zone.isTemperatureConfigurationValid();

            assertFalse(result, "Configuration should be invalid when max is null");
        }

        @Test
        @DisplayName("Should handle negative temperature values")
        void isTemperatureConfigurationValid_ShouldHandleNegativeTemperatures() {
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(new BigDecimal("-25.00"));
            zone.setTemperatureMax(new BigDecimal("-18.00"));

            boolean result = zone.isTemperatureConfigurationValid();

            assertTrue(result, "Configuration should be valid for freezer temperatures");
        }

        @Test
        @DisplayName("Should handle temperature range crossing zero")
        void isTemperatureConfigurationValid_ShouldHandleRangeCrossingZero() {
            zone.setTemperatureControlled(true);
            zone.setTemperatureMin(new BigDecimal("-5.00"));
            zone.setTemperatureMax(new BigDecimal("5.00"));

            boolean result = zone.isTemperatureConfigurationValid();

            assertTrue(result, "Configuration should be valid when range crosses zero");
        }
    }

    @Nested
    @DisplayName("Zone Type Tests")
    class ZoneTypeTests {

        @Test
        @DisplayName("Should support RECEIVING zone type")
        void shouldSupportReceivingZoneType() {
            zone.setZoneType(Zone.ZoneType.RECEIVING);
            assertEquals(Zone.ZoneType.RECEIVING, zone.getZoneType());
        }

        @Test
        @DisplayName("Should support STORAGE zone type")
        void shouldSupportStorageZoneType() {
            zone.setZoneType(Zone.ZoneType.STORAGE);
            assertEquals(Zone.ZoneType.STORAGE, zone.getZoneType());
        }

        @Test
        @DisplayName("Should support PICKING zone type")
        void shouldSupportPickingZoneType() {
            zone.setZoneType(Zone.ZoneType.PICKING);
            assertEquals(Zone.ZoneType.PICKING, zone.getZoneType());
        }

        @Test
        @DisplayName("Should support PACKING zone type")
        void shouldSupportPackingZoneType() {
            zone.setZoneType(Zone.ZoneType.PACKING);
            assertEquals(Zone.ZoneType.PACKING, zone.getZoneType());
        }

        @Test
        @DisplayName("Should support SHIPPING zone type")
        void shouldSupportShippingZoneType() {
            zone.setZoneType(Zone.ZoneType.SHIPPING);
            assertEquals(Zone.ZoneType.SHIPPING, zone.getZoneType());
        }
    }
}

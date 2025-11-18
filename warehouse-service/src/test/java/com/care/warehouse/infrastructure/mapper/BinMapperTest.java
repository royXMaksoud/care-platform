package com.care.warehouse.infrastructure.mapper;

import com.care.warehouse.domain.model.Bin;
import com.care.warehouse.infrastructure.db.entity.BinEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BinMapper.
 * Tests MapStruct mappings between entity and domain model.
 */
@DisplayName("Bin Mapper Tests")
class BinMapperTest {

    private final BinMapper mapper = Mappers.getMapper(BinMapper.class);

    @Nested
    @DisplayName("entityToDomain() Tests")
    class EntityToDomainTests {

        @Test
        @DisplayName("Should map all fields from entity to domain")
        void entityToDomain_ShouldMapAllFields() {
            // Given
            UUID id = UUID.randomUUID();
            UUID tenantId = UUID.randomUUID();
            UUID zoneId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            BinEntity entity = BinEntity.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .zoneId(zoneId)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .maxWeightKg(new BigDecimal("1000.00"))
                    .currentWeightKg(new BigDecimal("200.00"))
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("2.00"))
                    .aisleNumber(1)
                    .shelfNumber(2)
                    .levelNumber(3)
                    .barcode("BIN-001")
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            Bin domain = mapper.entityToDomain(entity);

            // Then
            assertNotNull(domain, "Domain should not be null");
            assertEquals(id, domain.getId(), "ID should match");
            assertEquals(tenantId, domain.getTenantId(), "Tenant ID should match");
            assertEquals(zoneId, domain.getZoneId(), "Zone ID should match");
            assertEquals("A-01-01", domain.getCode(), "Code should match");
            assertEquals("Pallet Bin A-01-01", domain.getName(), "Name should match");
            assertEquals(new BigDecimal("1000.00"), domain.getMaxWeightKg(), "Max weight should match");
            assertEquals(new BigDecimal("200.00"), domain.getCurrentWeightKg(), "Current weight should match");
            assertEquals(new BigDecimal("10.00"), domain.getCapacityCubicMeters(), "Capacity should match");
            assertEquals(new BigDecimal("2.00"), domain.getCurrentOccupancyCubicMeters(), "Current occupancy should match");
            assertEquals(1, domain.getAisleNumber(), "Aisle number should match");
            assertEquals(2, domain.getShelfNumber(), "Shelf number should match");
            assertEquals(3, domain.getLevelNumber(), "Level number should match");
            assertEquals("BIN-001", domain.getBarcode(), "Barcode should match");
            assertEquals(now, domain.getCreatedAt(), "CreatedAt should match");
            assertEquals(now, domain.getUpdatedAt(), "UpdatedAt should match");
            assertEquals(false, domain.getIsDeleted(), "IsDeleted should match");
            assertEquals(1, domain.getRowVersion(), "RowVersion should match");
        }

        @Test
        @DisplayName("Should handle null entity")
        void entityToDomain_ShouldHandleNull() {
            Bin domain = mapper.entityToDomain(null);
            assertNull(domain, "Should return null for null entity");
        }

        @Test
        @DisplayName("Should handle entity with null optional fields")
        void entityToDomain_ShouldHandleNullOptionalFields() {
            // Given
            BinEntity entity = BinEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantId(UUID.randomUUID())
                    .zoneId(UUID.randomUUID())
                    .code("A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .currentWeightKg(BigDecimal.ZERO)
                    .name(null)
                    .maxWeightKg(null)
                    .aisleNumber(null)
                    .shelfNumber(null)
                    .levelNumber(null)
                    .barcode(null)
                    .build();

            // When
            Bin domain = mapper.entityToDomain(entity);

            // Then
            assertNotNull(domain, "Domain should not be null");
            assertNull(domain.getName(), "Name can be null");
            assertNull(domain.getMaxWeightKg(), "Max weight can be null");
            assertNull(domain.getAisleNumber(), "Aisle number can be null");
            assertNull(domain.getShelfNumber(), "Shelf number can be null");
            assertNull(domain.getLevelNumber(), "Level number can be null");
            assertNull(domain.getBarcode(), "Barcode can be null");
        }

        @Test
        @DisplayName("Should handle entity with zero values")
        void entityToDomain_ShouldHandleZeroValues() {
            // Given
            BinEntity entity = BinEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantId(UUID.randomUUID())
                    .zoneId(UUID.randomUUID())
                    .code("A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .maxWeightKg(BigDecimal.ZERO)
                    .currentWeightKg(BigDecimal.ZERO)
                    .capacityCubicMeters(BigDecimal.ZERO)
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .aisleNumber(0)
                    .shelfNumber(0)
                    .levelNumber(0)
                    .rowVersion(0)
                    .build();

            // When
            Bin domain = mapper.entityToDomain(entity);

            // Then
            assertEquals(BigDecimal.ZERO, domain.getMaxWeightKg(), "Should handle zero max weight");
            assertEquals(BigDecimal.ZERO, domain.getCurrentWeightKg(), "Should handle zero current weight");
            assertEquals(BigDecimal.ZERO, domain.getCapacityCubicMeters(), "Should handle zero capacity");
            assertEquals(BigDecimal.ZERO, domain.getCurrentOccupancyCubicMeters(), "Should handle zero occupancy");
            assertEquals(0, domain.getAisleNumber(), "Should handle zero aisle number");
            assertEquals(0, domain.getShelfNumber(), "Should handle zero shelf number");
            assertEquals(0, domain.getLevelNumber(), "Should handle zero level number");
        }
    }

    @Nested
    @DisplayName("domainToEntity() Tests")
    class DomainToEntityTests {

        @Test
        @DisplayName("Should map all fields from domain to entity")
        void domainToEntity_ShouldMapAllFields() {
            // Given
            UUID id = UUID.randomUUID();
            UUID tenantId = UUID.randomUUID();
            UUID zoneId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Bin domain = Bin.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .zoneId(zoneId)
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
                    .barcode("BIN-001")
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            BinEntity entity = mapper.domainToEntity(domain);

            // Then
            assertNotNull(entity, "Entity should not be null");
            assertEquals(id, entity.getId(), "ID should match");
            assertEquals(tenantId, entity.getTenantId(), "Tenant ID should match");
            assertEquals(zoneId, entity.getZoneId(), "Zone ID should match");
            assertEquals("A-01-01", entity.getCode(), "Code should match");
            assertEquals("Pallet Bin A-01-01", entity.getName(), "Name should match");
            assertEquals(new BigDecimal("1000.00"), entity.getMaxWeightKg(), "Max weight should match");
            assertEquals(new BigDecimal("200.00"), entity.getCurrentWeightKg(), "Current weight should match");
            assertEquals(new BigDecimal("10.00"), entity.getCapacityCubicMeters(), "Capacity should match");
            assertEquals(new BigDecimal("2.00"), entity.getCurrentOccupancyCubicMeters(), "Current occupancy should match");
            assertEquals(1, entity.getAisleNumber(), "Aisle number should match");
            assertEquals(2, entity.getShelfNumber(), "Shelf number should match");
            assertEquals(3, entity.getLevelNumber(), "Level number should match");
            assertEquals("BIN-001", entity.getBarcode(), "Barcode should match");
        }

        @Test
        @DisplayName("Should handle null domain")
        void domainToEntity_ShouldHandleNull() {
            BinEntity entity = mapper.domainToEntity(null);
            assertNull(entity, "Should return null for null domain");
        }
    }

    @Nested
    @DisplayName("Round-trip Mapping Tests")
    class RoundTripMappingTests {

        @Test
        @DisplayName("Should preserve data through entity -> domain -> entity")
        void shouldPreserveDataThroughRoundTrip() {
            // Given
            UUID id = UUID.randomUUID();
            UUID tenantId = UUID.randomUUID();
            UUID zoneId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            BinEntity original = BinEntity.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .zoneId(zoneId)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .maxWeightKg(new BigDecimal("1000.00"))
                    .currentWeightKg(new BigDecimal("200.00"))
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("2.00"))
                    .aisleNumber(1)
                    .shelfNumber(2)
                    .levelNumber(3)
                    .barcode("BIN-001")
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            Bin domain = mapper.entityToDomain(original);
            BinEntity result = mapper.domainToEntity(domain);

            // Then
            assertEquals(original.getId(), result.getId(), "ID should be preserved");
            assertEquals(original.getTenantId(), result.getTenantId(), "Tenant ID should be preserved");
            assertEquals(original.getZoneId(), result.getZoneId(), "Zone ID should be preserved");
            assertEquals(original.getCode(), result.getCode(), "Code should be preserved");
            assertEquals(original.getName(), result.getName(), "Name should be preserved");
            assertEquals(original.getMaxWeightKg(), result.getMaxWeightKg(), "Max weight should be preserved");
            assertEquals(original.getCurrentWeightKg(), result.getCurrentWeightKg(), "Current weight should be preserved");
            assertEquals(original.getCapacityCubicMeters(), result.getCapacityCubicMeters(), "Capacity should be preserved");
            assertEquals(original.getCurrentOccupancyCubicMeters(), result.getCurrentOccupancyCubicMeters(), "Occupancy should be preserved");
            assertEquals(original.getAisleNumber(), result.getAisleNumber(), "Aisle should be preserved");
            assertEquals(original.getShelfNumber(), result.getShelfNumber(), "Shelf should be preserved");
            assertEquals(original.getLevelNumber(), result.getLevelNumber(), "Level should be preserved");
            assertEquals(original.getBarcode(), result.getBarcode(), "Barcode should be preserved");
        }
    }
}

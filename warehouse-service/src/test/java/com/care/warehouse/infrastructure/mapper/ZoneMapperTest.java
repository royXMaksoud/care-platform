package com.care.warehouse.infrastructure.mapper;

import com.care.warehouse.domain.model.Zone;
import com.care.warehouse.infrastructure.db.entity.ZoneEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ZoneMapper.
 * Tests MapStruct mappings between entity and domain model.
 */
@DisplayName("Zone Mapper Tests")
class ZoneMapperTest {

    private final ZoneMapper mapper = Mappers.getMapper(ZoneMapper.class);

    @Nested
    @DisplayName("entityToDomain() Tests")
    class EntityToDomainTests {

        @Test
        @DisplayName("Should map all fields from entity to domain")
        void entityToDomain_ShouldMapAllFields() {
            // Given
            UUID id = UUID.randomUUID();
            UUID tenantId = UUID.randomUUID();
            UUID warehouseId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            ZoneEntity entity = ZoneEntity.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .warehouseId(warehouseId)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("500.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("200.00"))
                    .temperatureControlled(true)
                    .temperatureMin(new BigDecimal("2.00"))
                    .temperatureMax(new BigDecimal("8.00"))
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            Zone domain = mapper.entityToDomain(entity);

            // Then
            assertNotNull(domain, "Domain should not be null");
            assertEquals(id, domain.getId(), "ID should match");
            assertEquals(tenantId, domain.getTenantId(), "Tenant ID should match");
            assertEquals(warehouseId, domain.getWarehouseId(), "Warehouse ID should match");
            assertEquals("STOR-01", domain.getCode(), "Code should match");
            assertEquals("Storage Zone 1", domain.getName(), "Name should match");
            assertEquals(new BigDecimal("500.00"), domain.getCapacityCubicMeters(), "Capacity should match");
            assertEquals(new BigDecimal("200.00"), domain.getCurrentOccupancyCubicMeters(), "Current occupancy should match");
            assertEquals(true, domain.getTemperatureControlled(), "Temperature controlled should match");
            assertEquals(new BigDecimal("2.00"), domain.getTemperatureMin(), "Temperature min should match");
            assertEquals(new BigDecimal("8.00"), domain.getTemperatureMax(), "Temperature max should match");
            assertEquals(now, domain.getCreatedAt(), "CreatedAt should match");
            assertEquals(now, domain.getUpdatedAt(), "UpdatedAt should match");
            assertEquals(false, domain.getIsDeleted(), "IsDeleted should match");
            assertEquals(1, domain.getRowVersion(), "RowVersion should match");
        }

        @Test
        @DisplayName("Should handle null entity")
        void entityToDomain_ShouldHandleNull() {
            Zone domain = mapper.entityToDomain(null);
            assertNull(domain, "Should return null for null entity");
        }

        @Test
        @DisplayName("Should handle entity with null temperature fields")
        void entityToDomain_ShouldHandleNullTemperatureFields() {
            // Given
            ZoneEntity entity = ZoneEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantId(UUID.randomUUID())
                    .warehouseId(UUID.randomUUID())
                    .code("STOR-01")
                    .name("Storage Zone")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("100.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .temperatureControlled(false)
                    .temperatureMin(null)
                    .temperatureMax(null)
                    .build();

            // When
            Zone domain = mapper.entityToDomain(entity);

            // Then
            assertNotNull(domain, "Domain should not be null");
            assertFalse(domain.getTemperatureControlled(), "Temperature controlled should be false");
            assertNull(domain.getTemperatureMin(), "Temperature min can be null");
            assertNull(domain.getTemperatureMax(), "Temperature max can be null");
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
            UUID warehouseId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Zone domain = Zone.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .warehouseId(warehouseId)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .zoneType(Zone.ZoneType.STORAGE)
                    .status(Zone.ZoneStatus.ACTIVE)
                    .capacityCubicMeters(new BigDecimal("500.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("200.00"))
                    .temperatureControlled(true)
                    .temperatureMin(new BigDecimal("2.00"))
                    .temperatureMax(new BigDecimal("8.00"))
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            ZoneEntity entity = mapper.domainToEntity(domain);

            // Then
            assertNotNull(entity, "Entity should not be null");
            assertEquals(id, entity.getId(), "ID should match");
            assertEquals(tenantId, entity.getTenantId(), "Tenant ID should match");
            assertEquals(warehouseId, entity.getWarehouseId(), "Warehouse ID should match");
            assertEquals("STOR-01", entity.getCode(), "Code should match");
            assertEquals("Storage Zone 1", entity.getName(), "Name should match");
            assertEquals(new BigDecimal("500.00"), entity.getCapacityCubicMeters(), "Capacity should match");
            assertEquals(new BigDecimal("200.00"), entity.getCurrentOccupancyCubicMeters(), "Current occupancy should match");
            assertEquals(true, entity.getTemperatureControlled(), "Temperature controlled should match");
            assertEquals(new BigDecimal("2.00"), entity.getTemperatureMin(), "Temperature min should match");
            assertEquals(new BigDecimal("8.00"), entity.getTemperatureMax(), "Temperature max should match");
        }

        @Test
        @DisplayName("Should handle null domain")
        void domainToEntity_ShouldHandleNull() {
            ZoneEntity entity = mapper.domainToEntity(null);
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
            UUID warehouseId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            ZoneEntity original = ZoneEntity.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .warehouseId(warehouseId)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("500.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("200.00"))
                    .temperatureControlled(true)
                    .temperatureMin(new BigDecimal("2.00"))
                    .temperatureMax(new BigDecimal("8.00"))
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            Zone domain = mapper.entityToDomain(original);
            ZoneEntity result = mapper.domainToEntity(domain);

            // Then
            assertEquals(original.getId(), result.getId(), "ID should be preserved");
            assertEquals(original.getTenantId(), result.getTenantId(), "Tenant ID should be preserved");
            assertEquals(original.getWarehouseId(), result.getWarehouseId(), "Warehouse ID should be preserved");
            assertEquals(original.getCode(), result.getCode(), "Code should be preserved");
            assertEquals(original.getName(), result.getName(), "Name should be preserved");
            assertEquals(original.getCapacityCubicMeters(), result.getCapacityCubicMeters(), "Capacity should be preserved");
            assertEquals(original.getTemperatureControlled(), result.getTemperatureControlled(), "Temperature controlled should be preserved");
            assertEquals(original.getTemperatureMin(), result.getTemperatureMin(), "Temperature min should be preserved");
            assertEquals(original.getTemperatureMax(), result.getTemperatureMax(), "Temperature max should be preserved");
        }
    }
}

package com.care.warehouse.infrastructure.mapper;

import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.infrastructure.db.entity.WarehouseEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for WarehouseMapper.
 * Tests MapStruct mappings between entity and domain model.
 */
@DisplayName("Warehouse Mapper Tests")
class WarehouseMapperTest {

    private final WarehouseMapper mapper = Mappers.getMapper(WarehouseMapper.class);

    @Nested
    @DisplayName("entityToDomain() Tests")
    class EntityToDomainTests {

        @Test
        @DisplayName("Should map all fields from entity to domain")
        void entityToDomain_ShouldMapAllFields() {
            // Given
            UUID id = UUID.randomUUID();
            UUID tenantId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            WarehouseEntity entity = WarehouseEntity.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .code("WH-001")
                    .name("Main Warehouse")
                    .status("ACTIVE")
                    .isPrimary(true)
                    .capacityCubicMeters(new BigDecimal("1000.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("250.00"))
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            Warehouse domain = mapper.entityToDomain(entity);

            // Then
            assertNotNull(domain, "Domain should not be null");
            assertEquals(id, domain.getId(), "ID should match");
            assertEquals(tenantId, domain.getTenantId(), "Tenant ID should match");
            assertEquals("WH-001", domain.getCode(), "Code should match");
            assertEquals("Main Warehouse", domain.getName(), "Name should match");
            assertEquals(true, domain.getIsPrimary(), "IsPrimary should match");
            assertEquals(new BigDecimal("1000.00"), domain.getCapacityCubicMeters(), "Capacity should match");
            assertEquals(new BigDecimal("250.00"), domain.getCurrentOccupancyCubicMeters(), "Current occupancy should match");
            assertEquals(now, domain.getCreatedAt(), "CreatedAt should match");
            assertEquals(now, domain.getUpdatedAt(), "UpdatedAt should match");
            assertEquals(false, domain.getIsDeleted(), "IsDeleted should match");
            assertEquals(1, domain.getRowVersion(), "RowVersion should match");
        }

        @Test
        @DisplayName("Should handle null entity")
        void entityToDomain_ShouldHandleNull() {
            Warehouse domain = mapper.entityToDomain(null);
            assertNull(domain, "Should return null for null entity");
        }

        @Test
        @DisplayName("Should handle entity with null optional fields")
        void entityToDomain_ShouldHandleNullOptionalFields() {
            // Given
            WarehouseEntity entity = WarehouseEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantId(UUID.randomUUID())
                    .code("WH-001")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("100.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .build();
            // name, description, isPrimary are null

            // When
            Warehouse domain = mapper.entityToDomain(entity);

            // Then
            assertNotNull(domain, "Domain should not be null");
            assertNull(domain.getName(), "Name can be null");
            assertNull(domain.getDescription(), "Description can be null");
        }

        @Test
        @DisplayName("Should handle entity with zero values")
        void entityToDomain_ShouldHandleZeroValues() {
            // Given
            WarehouseEntity entity = WarehouseEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantId(UUID.randomUUID())
                    .code("WH-001")
                    .status("ACTIVE")
                    .capacityCubicMeters(BigDecimal.ZERO)
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .rowVersion(0)
                    .build();

            // When
            Warehouse domain = mapper.entityToDomain(entity);

            // Then
            assertEquals(BigDecimal.ZERO, domain.getCapacityCubicMeters(), "Should handle zero capacity");
            assertEquals(BigDecimal.ZERO, domain.getCurrentOccupancyCubicMeters(), "Should handle zero occupancy");
            assertEquals(0, domain.getRowVersion(), "Should handle zero row version");
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
            LocalDateTime now = LocalDateTime.now();

            Warehouse domain = Warehouse.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .code("WH-001")
                    .name("Main Warehouse")
                    .description("Primary distribution center")
                    .status(Warehouse.WarehouseStatus.ACTIVE)
                    .isPrimary(true)
                    .capacityCubicMeters(new BigDecimal("1000.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("250.00"))
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            WarehouseEntity entity = mapper.domainToEntity(domain);

            // Then
            assertNotNull(entity, "Entity should not be null");
            assertEquals(id, entity.getId(), "ID should match");
            assertEquals(tenantId, entity.getTenantId(), "Tenant ID should match");
            assertEquals("WH-001", entity.getCode(), "Code should match");
            assertEquals("Main Warehouse", entity.getName(), "Name should match");
            assertEquals(true, entity.getIsPrimary(), "IsPrimary should match");
            assertEquals(new BigDecimal("1000.00"), entity.getCapacityCubicMeters(), "Capacity should match");
            assertEquals(new BigDecimal("250.00"), entity.getCurrentOccupancyCubicMeters(), "Current occupancy should match");
            assertEquals(now, entity.getCreatedAt(), "CreatedAt should match");
            assertEquals(now, entity.getUpdatedAt(), "UpdatedAt should match");
            assertEquals(false, entity.getIsDeleted(), "IsDeleted should match");
            assertEquals(1, entity.getRowVersion(), "RowVersion should match");
        }

        @Test
        @DisplayName("Should handle null domain")
        void domainToEntity_ShouldHandleNull() {
            WarehouseEntity entity = mapper.domainToEntity(null);
            assertNull(entity, "Should return null for null domain");
        }

        @Test
        @DisplayName("Should handle domain with null optional fields")
        void domainToEntity_ShouldHandleNullOptionalFields() {
            // Given
            Warehouse domain = Warehouse.builder()
                    .id(UUID.randomUUID())
                    .tenantId(UUID.randomUUID())
                    .code("WH-001")
                    .status(Warehouse.WarehouseStatus.ACTIVE)
                    .capacityCubicMeters(new BigDecimal("100.00"))
                    .currentOccupancyCubicMeters(BigDecimal.ZERO)
                    .build();
            // name, description, isPrimary, metadata are null

            // When
            WarehouseEntity entity = mapper.domainToEntity(domain);

            // Then
            assertNotNull(entity, "Entity should not be null");
            assertNull(entity.getName(), "Name can be null");
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
            LocalDateTime now = LocalDateTime.now();

            WarehouseEntity original = WarehouseEntity.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .code("WH-001")
                    .name("Main Warehouse")
                    .status("ACTIVE")
                    .isPrimary(true)
                    .capacityCubicMeters(new BigDecimal("1000.00"))
                    .currentOccupancyCubicMeters(new BigDecimal("250.00"))
                    .createdAt(now)
                    .updatedAt(now)
                    .isDeleted(false)
                    .rowVersion(1)
                    .build();

            // When
            Warehouse domain = mapper.entityToDomain(original);
            WarehouseEntity result = mapper.domainToEntity(domain);

            // Then
            assertEquals(original.getId(), result.getId(), "ID should be preserved");
            assertEquals(original.getTenantId(), result.getTenantId(), "Tenant ID should be preserved");
            assertEquals(original.getCode(), result.getCode(), "Code should be preserved");
            assertEquals(original.getName(), result.getName(), "Name should be preserved");
            assertEquals(original.getIsPrimary(), result.getIsPrimary(), "IsPrimary should be preserved");
            assertEquals(original.getCapacityCubicMeters(), result.getCapacityCubicMeters(), "Capacity should be preserved");
            assertEquals(original.getCurrentOccupancyCubicMeters(), result.getCurrentOccupancyCubicMeters(), "Occupancy should be preserved");
        }
    }
}

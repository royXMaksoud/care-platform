package com.care.warehouse.application.warehouse.service;

import com.care.warehouse.application.common.context.TenantContext;
import com.care.warehouse.application.warehouse.command.CreateWarehouseCommand;
import com.care.warehouse.application.warehouse.mapper.WarehouseAppMapper;
import com.care.warehouse.application.warehouse.validation.CreateWarehouseValidator;
import com.care.warehouse.application.warehouse.validation.UpdateWarehouseValidator;
import com.care.warehouse.domain.enums.WarehouseType;
import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.ports.iot.IoTEventGateway;
import com.care.warehouse.domain.ports.out.WarehouseRepositoryPort;
import com.care.warehouse.domain.ports.out.WarehouseSearchPort;
import com.care.warehouse.domain.ports.traceability.TraceabilityLedgerPort;
import com.sharedlib.core.context.CurrentUserContext;
import com.sharedlib.core.exception.NotFoundException;
import com.sharedlib.core.i18n.MessageResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for WarehouseServiceImpl.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WarehouseServiceImplTest {

    @Mock
    private WarehouseRepositoryPort crudPort;

    @Mock
    private WarehouseSearchPort searchPort;

    @Mock
    private WarehouseAppMapper mapper;

    @Mock
    private CreateWarehouseValidator createValidator;

    @Mock
    private UpdateWarehouseValidator updateValidator;

    @Mock
    private MessageResolver messageResolver;

    @Mock
    private IoTEventGateway iotEventGateway;

    @Mock
    private TraceabilityLedgerPort traceabilityLedgerPort;

    @InjectMocks
    private WarehouseServiceImpl service;

    private UUID tenantId;
    private UUID userId;
    private Warehouse warehouse;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        TenantContext.set(tenantId);

        warehouse = Warehouse.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .code("WH-001")
                .warehouseType(WarehouseType.MAIN)
                .nameTranslations(java.util.Map.of("en", "Test Warehouse"))
                .isActive(true)
                .isDeleted(false)
                .build();

        when(messageResolver.getMessage(anyString(), any())).thenReturn("Error message");
        doNothing().when(iotEventGateway).notifyWarehouseCreated(any(), any());
        doNothing().when(iotEventGateway).notifyWarehouseUpdated(any(), any());
        when(traceabilityLedgerPort.recordWarehouseCreated(any(), any())).thenReturn(null);
        when(traceabilityLedgerPort.recordWarehouseUpdated(any(), any(), any())).thenReturn(null);
    }

    @Test
    void testCreateWarehouse_Success() {
        // Given: Valid create command
        CreateWarehouseCommand command = CreateWarehouseCommand.builder()
                .code("WH-001")
                .warehouseType(WarehouseType.MAIN)
                .nameTranslations(java.util.Map.of("en", "Test Warehouse"))
                .build();

        // Create a new warehouse without ID for fromCreate (new entity)
        Warehouse newWarehouse = Warehouse.builder()
                .tenantId(tenantId)
                .code("WH-001")
                .warehouseType(WarehouseType.MAIN)
                .nameTranslations(java.util.Map.of("en", "Test Warehouse"))
                .isActive(true)
                .isDeleted(false)
                .build();
        
        when(mapper.fromCreate(any())).thenReturn(newWarehouse);
        when(crudPort.save(any(Warehouse.class))).thenAnswer(invocation -> {
            Warehouse saved = invocation.getArgument(0);
            // Simulate the save operation setting the ID
            if (saved.getId() == null) {
                saved.setId(warehouse.getId());
            }
            return saved;
        });
        when(mapper.toResponse(any(Warehouse.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(createValidator).validate(any());

        // When: Create warehouse is called
        Warehouse result = service.createWarehouse(command);

        // Then: Warehouse is created successfully
        assertNotNull(result);
        assertEquals(warehouse.getId(), result.getId());
        verify(crudPort, times(1)).save(any());
        verify(createValidator, times(1)).validate(any());
    }

    @Test
    void testGetWarehouseById_Success() {
        // Given: Warehouse exists
        UUID warehouseId = warehouse.getId();
        // Mock the base class getById() method by mocking crudPort.load()
        when(crudPort.load(warehouseId)).thenReturn(Optional.of(warehouse));
        when(mapper.toResponse(any(Warehouse.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(messageResolver.getMessage(anyString(), any())).thenReturn("Error message");
        // Mock CurrentUserContext if needed
        // Note: getWarehouseById calls getById() which should return the warehouse

        // When: Get warehouse by ID is called
        Optional<Warehouse> result = service.getWarehouseById(warehouseId);

        // Then: Warehouse is returned
        assertTrue(result.isPresent());
        assertEquals(warehouseId, result.get().getId());
    }

    @Test
    void testGetWarehouseById_NotFound() {
        // Given: Warehouse does not exist
        UUID warehouseId = UUID.randomUUID();
        when(crudPort.load(warehouseId)).thenReturn(Optional.empty());

        // When: Get warehouse by ID is called
        // Then: NotFoundException is thrown
        assertThrows(NotFoundException.class, () -> service.getWarehouseById(warehouseId));
    }

    @Test
    void testGetWarehouseById_WrongTenant() {
        // Given: Warehouse exists but belongs to different tenant
        UUID warehouseId = warehouse.getId();
        Warehouse otherTenantWarehouse = Warehouse.builder()
                .id(warehouseId)
                .tenantId(UUID.randomUUID()) // Different tenant
                .build();
        when(crudPort.load(warehouseId)).thenReturn(Optional.of(otherTenantWarehouse));

        // When: Get warehouse by ID is called
        // Then: NotFoundException is thrown
        assertThrows(NotFoundException.class, () -> service.getWarehouseById(warehouseId));
    }
}


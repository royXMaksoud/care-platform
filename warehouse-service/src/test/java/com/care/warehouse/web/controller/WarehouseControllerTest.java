package com.care.warehouse.web.controller;

import com.care.warehouse.application.warehouse.command.CreateWarehouseCommand;
import com.care.warehouse.domain.enums.WarehouseType;
import com.care.warehouse.domain.model.Warehouse;
import com.care.warehouse.domain.ports.in.*;
import com.care.warehouse.web.dto.warehouse.CreateWarehouseRequest;
import com.care.warehouse.web.dto.warehouse.WarehouseResponse;
import com.care.warehouse.web.mapper.WarehouseWebMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for WarehouseController.
 */
@SpringBootTest(classes = com.care.warehouse.TestApplication.class, webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class WarehouseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CreateWarehouseUseCase createWarehouseUseCase;

    @MockBean
    private UpdateWarehouseUseCase updateWarehouseUseCase;

    @MockBean
    private GetWarehouseByIdUseCase getWarehouseByIdUseCase;

    @MockBean
    private ListWarehousesUseCase listWarehousesUseCase;

    @MockBean
    private WarehouseWebMapper mapper;

    @Test
    void testCreateWarehouse_Success() throws Exception {
        // Given: Valid create request
        UUID warehouseId = UUID.randomUUID();
        CreateWarehouseRequest request = new CreateWarehouseRequest();
        request.setCode("WH-001");
        request.setWarehouseType(WarehouseType.MAIN);

        Warehouse warehouse = Warehouse.builder()
                .id(warehouseId)
                .code("WH-001")
                .warehouseType(WarehouseType.MAIN)
                .build();

        WarehouseResponse response = WarehouseResponse.builder()
                .id(warehouseId)
                .code("WH-001")
                .warehouseType(WarehouseType.MAIN)
                .build();

        when(mapper.toCreateCommand(any())).thenReturn(CreateWarehouseCommand.builder().build());
        when(createWarehouseUseCase.createWarehouse(any())).thenReturn(warehouse);
        when(mapper.toResponse(any())).thenReturn(response);

        // When: POST /api/warehouse/v1/warehouses is called
        // Then: 201 Created is returned
        mockMvc.perform(post("/api/warehouse/v1/warehouses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(warehouseId.toString()))
                .andExpect(jsonPath("$.code").value("WH-001"));
    }

    @Test
    void testCreateWarehouse_ValidationFailure() throws Exception {
        // Given: Invalid create request (missing required fields)
        CreateWarehouseRequest request = new CreateWarehouseRequest();
        // code and warehouseType are missing

        // When: POST /api/warehouse/v1/warehouses is called
        // Then: 400 Bad Request is returned
        mockMvc.perform(post("/api/warehouse/v1/warehouses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(result -> {
                    // Debug: print the actual response
                    System.out.println("Status: " + result.getResponse().getStatus());
                    System.out.println("Response: " + result.getResponse().getContentAsString());
                    if (result.getResolvedException() != null) {
                        System.out.println("Exception: " + result.getResolvedException().getClass().getName());
                        result.getResolvedException().printStackTrace();
                    }
                })
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetWarehouseById_Success() throws Exception {
        // Given: Warehouse exists
        UUID warehouseId = UUID.randomUUID();
        Warehouse warehouse = Warehouse.builder()
                .id(warehouseId)
                .code("WH-001")
                .warehouseType(WarehouseType.MAIN)
                .build();

        WarehouseResponse response = WarehouseResponse.builder()
                .id(warehouseId)
                .code("WH-001")
                .warehouseType(WarehouseType.MAIN)
                .build();

        when(getWarehouseByIdUseCase.getWarehouseById(warehouseId))
                .thenReturn(java.util.Optional.of(warehouse));
        when(mapper.toResponse(any())).thenReturn(response);

        // When: GET /api/warehouse/v1/warehouses/{id} is called
        // Then: 200 OK is returned
        mockMvc.perform(get("/api/warehouse/v1/warehouses/" + warehouseId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(warehouseId.toString()))
                .andExpect(jsonPath("$.code").value("WH-001"));
    }

    @Test
    void testGetWarehouseById_NotFound() throws Exception {
        // Given: Warehouse does not exist
        UUID warehouseId = UUID.randomUUID();
        when(getWarehouseByIdUseCase.getWarehouseById(warehouseId))
                .thenReturn(java.util.Optional.empty());

        // When: GET /api/warehouse/v1/warehouses/{id} is called
        // Then: 404 Not Found is returned
        mockMvc.perform(get("/api/warehouse/v1/warehouses/" + warehouseId))
                .andExpect(status().isNotFound());
    }
}


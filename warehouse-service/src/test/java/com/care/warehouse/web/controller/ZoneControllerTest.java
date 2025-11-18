package com.care.warehouse.web.controller;

import com.care.warehouse.domain.model.Zone;
import com.care.warehouse.domain.port.ZoneCrudPort;
import com.care.warehouse.web.dto.ZoneRequest;
import com.care.warehouse.web.dto.ZoneResponse;
import com.care.warehouse.web.mapper.ZoneWebMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ZoneController.
 * Uses @WebMvcTest for controller layer testing with MockMvc.
 */
@WebMvcTest(ZoneController.class)
@ActiveProfiles("test")
@DisplayName("Zone Controller Tests")
class ZoneControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ZoneCrudPort zoneCrudPort;

    @MockBean
    private ZoneWebMapper zoneWebMapper;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID WAREHOUSE_ID = UUID.randomUUID();
    private static final UUID ZONE_ID = UUID.randomUUID();

    @Nested
    @DisplayName("GET /api/v1/zones Tests")
    class GetAllZonesTests {

        @Test
        @DisplayName("Should return all zones")
        @WithMockUser
        void getAllZones_ShouldReturnZones() throws Exception {
            // Given
            Zone zone1 = Zone.builder()
                    .id(ZONE_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .zoneType(Zone.ZoneType.STORAGE)
                    .status(Zone.ZoneStatus.ACTIVE)
                    .build();

            ZoneResponse response1 = ZoneResponse.builder()
                    .id(ZONE_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .build();

            when(zoneCrudPort.findAll(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(Arrays.asList(zone1)));
            when(zoneWebMapper.toResponse(any(Zone.class))).thenReturn(response1);

            // When & Then
            mockMvc.perform(get("/api/v1/zones")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(ZONE_ID.toString()))
                    .andExpect(jsonPath("$.content[0].code").value("STOR-01"));
        }

        @Test
        @DisplayName("Should filter zones by warehouse ID")
        @WithMockUser
        void getAllZones_ShouldFilterByWarehouseId() throws Exception {
            // Given
            Zone zone = Zone.builder()
                    .id(ZONE_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .build();

            when(zoneCrudPort.findAll(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(Arrays.asList(zone)));

            // When & Then
            mockMvc.perform(get("/api/v1/zones")
                            .param("warehouseId", WAREHOUSE_ID.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(zoneCrudPort).findAll(any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/zones/{id} Tests")
    class GetZoneByIdTests {

        @Test
        @DisplayName("Should return zone when found")
        @WithMockUser
        void getZone_ShouldReturnZone_WhenFound() throws Exception {
            // Given
            Zone zone = Zone.builder()
                    .id(ZONE_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .build();

            ZoneResponse response = ZoneResponse.builder()
                    .id(ZONE_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .build();

            when(zoneCrudPort.findById(ZONE_ID)).thenReturn(Optional.of(zone));
            when(zoneWebMapper.toResponse(zone)).thenReturn(response);

            // When & Then
            mockMvc.perform(get("/api/v1/zones/{id}", ZONE_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(ZONE_ID.toString()))
                    .andExpect(jsonPath("$.code").value("STOR-01"));
        }

        @Test
        @DisplayName("Should return 404 when zone not found")
        @WithMockUser
        void getZone_ShouldReturn404_WhenNotFound() throws Exception {
            // Given
            when(zoneCrudPort.findById(any(UUID.class))).thenReturn(Optional.empty());

            // When & Then
            mockMvc.perform(get("/api/v1/zones/{id}", UUID.randomUUID())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/zones Tests")
    class CreateZoneTests {

        @Test
        @DisplayName("Should create zone successfully")
        @WithMockUser
        void createZone_ShouldReturnCreated() throws Exception {
            // Given
            ZoneRequest request = ZoneRequest.builder()
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("500.00"))
                    .temperatureControlled(false)
                    .build();

            Zone zone = Zone.builder()
                    .id(ZONE_ID)
                    .tenantId(TENANT_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .build();

            ZoneResponse response = ZoneResponse.builder()
                    .id(ZONE_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .name("Storage Zone 1")
                    .build();

            when(zoneWebMapper.toDomain(any(ZoneRequest.class), any(UUID.class))).thenReturn(zone);
            when(zoneCrudPort.create(any(Zone.class))).thenReturn(zone);
            when(zoneWebMapper.toResponse(any(Zone.class))).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/api/v1/zones")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(ZONE_ID.toString()))
                    .andExpect(jsonPath("$.code").value("STOR-01"));
        }

        @Test
        @DisplayName("Should return 400 for invalid request")
        @WithMockUser
        void createZone_ShouldReturn400_WhenInvalidRequest() throws Exception {
            // Given - missing required fields
            ZoneRequest request = ZoneRequest.builder()
                    .warehouseId(WAREHOUSE_ID)
                    // Missing code, name, zoneType, capacity
                    .build();

            // When & Then
            mockMvc.perform(post("/api/v1/zones")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/zones/{id} Tests")
    class UpdateZoneTests {

        @Test
        @DisplayName("Should update zone successfully")
        @WithMockUser
        void updateZone_ShouldReturnUpdated() throws Exception {
            // Given
            ZoneRequest request = ZoneRequest.builder()
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01-UPDATED")
                    .name("Updated Storage Zone")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("600.00"))
                    .temperatureControlled(false)
                    .build();

            Zone existingZone = Zone.builder()
                    .id(ZONE_ID)
                    .tenantId(TENANT_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .build();

            Zone updatedZone = Zone.builder()
                    .id(ZONE_ID)
                    .tenantId(TENANT_ID)
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01-UPDATED")
                    .build();

            ZoneResponse response = ZoneResponse.builder()
                    .id(ZONE_ID)
                    .code("STOR-01-UPDATED")
                    .name("Updated Storage Zone")
                    .build();

            when(zoneCrudPort.findById(ZONE_ID)).thenReturn(Optional.of(existingZone));
            when(zoneCrudPort.update(any(Zone.class))).thenReturn(updatedZone);
            when(zoneWebMapper.toResponse(any(Zone.class))).thenReturn(response);

            // When & Then
            mockMvc.perform(put("/api/v1/zones/{id}", ZONE_ID)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("STOR-01-UPDATED"));
        }

        @Test
        @DisplayName("Should return 404 when zone not found for update")
        @WithMockUser
        void updateZone_ShouldReturn404_WhenNotFound() throws Exception {
            // Given
            ZoneRequest request = ZoneRequest.builder()
                    .warehouseId(WAREHOUSE_ID)
                    .code("STOR-01")
                    .name("Storage Zone")
                    .zoneType("STORAGE")
                    .status("ACTIVE")
                    .capacityCubicMeters(new BigDecimal("500.00"))
                    .temperatureControlled(false)
                    .build();

            when(zoneCrudPort.findById(any(UUID.class))).thenReturn(Optional.empty());

            // When & Then
            mockMvc.perform(put("/api/v1/zones/{id}", UUID.randomUUID())
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/zones/{id} Tests")
    class DeleteZoneTests {

        @Test
        @DisplayName("Should delete zone successfully")
        @WithMockUser
        void deleteZone_ShouldReturnNoContent() throws Exception {
            // Given
            Zone zone = Zone.builder().id(ZONE_ID).build();
            when(zoneCrudPort.findById(ZONE_ID)).thenReturn(Optional.of(zone));
            doNothing().when(zoneCrudPort).delete(ZONE_ID);

            // When & Then
            mockMvc.perform(delete("/api/v1/zones/{id}", ZONE_ID)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(zoneCrudPort).delete(ZONE_ID);
        }

        @Test
        @DisplayName("Should return 404 when zone not found for deletion")
        @WithMockUser
        void deleteZone_ShouldReturn404_WhenNotFound() throws Exception {
            // Given
            when(zoneCrudPort.findById(any(UUID.class))).thenReturn(Optional.empty());

            // When & Then
            mockMvc.perform(delete("/api/v1/zones/{id}", UUID.randomUUID())
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }
}

package com.care.warehouse.web.controller;

import com.care.warehouse.domain.model.Bin;
import com.care.warehouse.domain.port.BinCrudPort;
import com.care.warehouse.web.dto.BinRequest;
import com.care.warehouse.web.dto.BinResponse;
import com.care.warehouse.web.mapper.BinWebMapper;
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
 * Unit tests for BinController.
 * Uses @WebMvcTest for controller layer testing with MockMvc.
 */
@WebMvcTest(BinController.class)
@ActiveProfiles("test")
@DisplayName("Bin Controller Tests")
class BinControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BinCrudPort binCrudPort;

    @MockBean
    private BinWebMapper binWebMapper;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID ZONE_ID = UUID.randomUUID();
    private static final UUID BIN_ID = UUID.randomUUID();

    @Nested
    @DisplayName("GET /api/v1/bins Tests")
    class GetAllBinsTests {

        @Test
        @DisplayName("Should return all bins")
        @WithMockUser
        void getAllBins_ShouldReturnBins() throws Exception {
            // Given
            Bin bin1 = Bin.builder()
                    .id(BIN_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .binType(Bin.BinType.PALLET)
                    .status(Bin.BinStatus.AVAILABLE)
                    .build();

            BinResponse response1 = BinResponse.builder()
                    .id(BIN_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .build();

            when(binCrudPort.findAll(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(Arrays.asList(bin1)));
            when(binWebMapper.toResponse(any(Bin.class))).thenReturn(response1);

            // When & Then
            mockMvc.perform(get("/api/v1/bins")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(BIN_ID.toString()))
                    .andExpect(jsonPath("$.content[0].code").value("A-01-01"));
        }

        @Test
        @DisplayName("Should filter bins by zone ID")
        @WithMockUser
        void getAllBins_ShouldFilterByZoneId() throws Exception {
            // Given
            Bin bin = Bin.builder()
                    .id(BIN_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .build();

            when(binCrudPort.findAll(any(Pageable.class)))
                    .thenReturn(new PageImpl<>(Arrays.asList(bin)));

            // When & Then
            mockMvc.perform(get("/api/v1/bins")
                            .param("zoneId", ZONE_ID.toString())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());

            verify(binCrudPort).findAll(any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/bins/{id} Tests")
    class GetBinByIdTests {

        @Test
        @DisplayName("Should return bin when found")
        @WithMockUser
        void getBin_ShouldReturnBin_WhenFound() throws Exception {
            // Given
            Bin bin = Bin.builder()
                    .id(BIN_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .build();

            BinResponse response = BinResponse.builder()
                    .id(BIN_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .build();

            when(binCrudPort.findById(BIN_ID)).thenReturn(Optional.of(bin));
            when(binWebMapper.toResponse(bin)).thenReturn(response);

            // When & Then
            mockMvc.perform(get("/api/v1/bins/{id}", BIN_ID)
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(BIN_ID.toString()))
                    .andExpect(jsonPath("$.code").value("A-01-01"));
        }

        @Test
        @DisplayName("Should return 404 when bin not found")
        @WithMockUser
        void getBin_ShouldReturn404_WhenNotFound() throws Exception {
            // Given
            when(binCrudPort.findById(any(UUID.class))).thenReturn(Optional.empty());

            // When & Then
            mockMvc.perform(get("/api/v1/bins/{id}", UUID.randomUUID())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/bins Tests")
    class CreateBinTests {

        @Test
        @DisplayName("Should create bin successfully")
        @WithMockUser
        void createBin_ShouldReturnCreated() throws Exception {
            // Given
            BinRequest request = BinRequest.builder()
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .maxWeightKg(new BigDecimal("1000.00"))
                    .aisleNumber(1)
                    .shelfNumber(1)
                    .levelNumber(1)
                    .barcode("BIN-001")
                    .build();

            Bin bin = Bin.builder()
                    .id(BIN_ID)
                    .tenantId(TENANT_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .build();

            BinResponse response = BinResponse.builder()
                    .id(BIN_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .name("Pallet Bin A-01-01")
                    .build();

            when(binWebMapper.toDomain(any(BinRequest.class), any(UUID.class))).thenReturn(bin);
            when(binCrudPort.create(any(Bin.class))).thenReturn(bin);
            when(binWebMapper.toResponse(any(Bin.class))).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/api/v1/bins")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(BIN_ID.toString()))
                    .andExpect(jsonPath("$.code").value("A-01-01"));
        }

        @Test
        @DisplayName("Should return 400 for invalid request")
        @WithMockUser
        void createBin_ShouldReturn400_WhenInvalidRequest() throws Exception {
            // Given - missing required fields
            BinRequest request = BinRequest.builder()
                    .zoneId(ZONE_ID)
                    // Missing code, binType, capacity
                    .build();

            // When & Then
            mockMvc.perform(post("/api/v1/bins")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/bins/{id} Tests")
    class UpdateBinTests {

        @Test
        @DisplayName("Should update bin successfully")
        @WithMockUser
        void updateBin_ShouldReturnUpdated() throws Exception {
            // Given
            BinRequest request = BinRequest.builder()
                    .zoneId(ZONE_ID)
                    .code("A-01-01-UPDATED")
                    .name("Updated Bin")
                    .binType("SHELF")
                    .status("OCCUPIED")
                    .capacityCubicMeters(new BigDecimal("15.00"))
                    .maxWeightKg(new BigDecimal("500.00"))
                    .aisleNumber(1)
                    .shelfNumber(1)
                    .levelNumber(1)
                    .barcode("BIN-001-UPD")
                    .build();

            Bin existingBin = Bin.builder()
                    .id(BIN_ID)
                    .tenantId(TENANT_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .build();

            Bin updatedBin = Bin.builder()
                    .id(BIN_ID)
                    .tenantId(TENANT_ID)
                    .zoneId(ZONE_ID)
                    .code("A-01-01-UPDATED")
                    .build();

            BinResponse response = BinResponse.builder()
                    .id(BIN_ID)
                    .code("A-01-01-UPDATED")
                    .name("Updated Bin")
                    .build();

            when(binCrudPort.findById(BIN_ID)).thenReturn(Optional.of(existingBin));
            when(binCrudPort.update(any(Bin.class))).thenReturn(updatedBin);
            when(binWebMapper.toResponse(any(Bin.class))).thenReturn(response);

            // When & Then
            mockMvc.perform(put("/api/v1/bins/{id}", BIN_ID)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("A-01-01-UPDATED"));
        }

        @Test
        @DisplayName("Should return 404 when bin not found for update")
        @WithMockUser
        void updateBin_ShouldReturn404_WhenNotFound() throws Exception {
            // Given
            BinRequest request = BinRequest.builder()
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .name("Bin")
                    .binType("PALLET")
                    .status("AVAILABLE")
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .build();

            when(binCrudPort.findById(any(UUID.class))).thenReturn(Optional.empty());

            // When & Then
            mockMvc.perform(put("/api/v1/bins/{id}", UUID.randomUUID())
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/bins/{id} Tests")
    class DeleteBinTests {

        @Test
        @DisplayName("Should delete bin successfully")
        @WithMockUser
        void deleteBin_ShouldReturnNoContent() throws Exception {
            // Given
            Bin bin = Bin.builder().id(BIN_ID).build();
            when(binCrudPort.findById(BIN_ID)).thenReturn(Optional.of(bin));
            doNothing().when(binCrudPort).delete(BIN_ID);

            // When & Then
            mockMvc.perform(delete("/api/v1/bins/{id}", BIN_ID)
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNoContent());

            verify(binCrudPort).delete(BIN_ID);
        }

        @Test
        @DisplayName("Should return 404 when bin not found for deletion")
        @WithMockUser
        void deleteBin_ShouldReturn404_WhenNotFound() throws Exception {
            // Given
            when(binCrudPort.findById(any(UUID.class))).thenReturn(Optional.empty());

            // When & Then
            mockMvc.perform(delete("/api/v1/bins/{id}", UUID.randomUUID())
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Validation Tests")
    class ValidationTests {

        @Test
        @DisplayName("Should validate bin code length")
        @WithMockUser
        void createBin_ShouldValidateCodeLength() throws Exception {
            // Given - code too short
            BinRequest request = BinRequest.builder()
                    .zoneId(ZONE_ID)
                    .code("A") // Too short, min is 2
                    .binType("PALLET")
                    .capacityCubicMeters(new BigDecimal("10.00"))
                    .build();

            // When & Then
            mockMvc.perform(post("/api/v1/bins")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should validate capacity is positive")
        @WithMockUser
        void createBin_ShouldValidateCapacityPositive() throws Exception {
            // Given - negative capacity
            BinRequest request = BinRequest.builder()
                    .zoneId(ZONE_ID)
                    .code("A-01-01")
                    .binType("PALLET")
                    .capacityCubicMeters(new BigDecimal("-10.00"))
                    .build();

            // When & Then
            mockMvc.perform(post("/api/v1/bins")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .header("X-Tenant-ID", TENANT_ID.toString()))
                    .andExpect(status().isBadRequest());
        }
    }
}
